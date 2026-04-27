import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Bet, IBetSelection } from "@/models/Bet";
import { Transaction } from "@/models/Transaction";
import { User } from "@/models/User";
import { requireAdmin } from "@/lib/adminAuth";
import { logAudit } from "@/lib/audit";
import { generateReference } from "@/lib/reference";
import { fetchScores, OddsAPIScore, SUPPORTED_SPORTS } from "@/lib/oddsapi";
import { sendBetResult } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/bets/settle-pending
 *
 * Conservative auto-settle: walks pending bets and settles only those whose
 * EVERY selection is a Match Result (1X2) market AND every match has a
 * confirmed final score. Anything else is left for manual settlement —
 * better to leave a bet pending than to mis-settle real money.
 *
 * Designed to be called from a scheduler (cron, Vercel Cron, etc.) every
 * ~15 minutes. Admin auth required.
 *
 * ?dryRun=true returns the proposed settlements without writing.
 */

const MONEYLINE_KEYWORDS = [
  "match result",
  "match winner",
  "1x2",
  "h2h",
  "moneyline",
  "winner",
  "result",
];
function isMoneyline(market: string): boolean {
  const lc = market.toLowerCase();
  return MONEYLINE_KEYWORDS.some((k) => lc.includes(k));
}

interface ScoreLookup {
  completed: boolean;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
}

function buildScoreIndex(scores: OddsAPIScore[]): Map<string, ScoreLookup> {
  const out = new Map<string, ScoreLookup>();
  for (const s of scores) {
    if (!s.completed || !s.scores || s.scores.length < 2) continue;
    const home = s.scores.find((x) => x.name === s.home_team);
    const away = s.scores.find((x) => x.name === s.away_team);
    if (!home || !away) continue;
    const hScore = parseInt(home.score, 10);
    const aScore = parseInt(away.score, 10);
    if (Number.isNaN(hScore) || Number.isNaN(aScore)) continue;
    out.set(s.id, {
      completed: true,
      homeTeam: s.home_team,
      awayTeam: s.away_team,
      homeScore: hScore,
      awayScore: aScore,
    });
  }
  return out;
}

/** Determine the outcome of a 1X2 selection given final score. */
function settleMoneyline(
  selection: IBetSelection,
  score: ScoreLookup
): "won" | "lost" {
  const sel = selection.selection.trim().toLowerCase();
  let actualWinner: "home" | "away" | "draw";
  if (score.homeScore > score.awayScore) actualWinner = "home";
  else if (score.awayScore > score.homeScore) actualWinner = "away";
  else actualWinner = "draw";

  let pickedWinner: "home" | "away" | "draw" | null = null;
  if (sel === "draw" || sel === "x") pickedWinner = "draw";
  else if (sel === "home" || sel === "1" || sel === score.homeTeam.toLowerCase()) pickedWinner = "home";
  else if (sel === "away" || sel === "2" || sel === score.awayTeam.toLowerCase()) pickedWinner = "away";
  else if (score.homeTeam.toLowerCase().includes(sel) || sel.includes(score.homeTeam.toLowerCase())) pickedWinner = "home";
  else if (score.awayTeam.toLowerCase().includes(sel) || sel.includes(score.awayTeam.toLowerCase())) pickedWinner = "away";

  if (pickedWinner === null) return "lost"; // unrecognised — be conservative
  return pickedWinner === actualWinner ? "won" : "lost";
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const dryRun = req.nextUrl.searchParams.get("dryRun") === "true";

  await connectDB();

  const pending = await Bet.find({ status: "pending" }).limit(500);
  const eligible = pending.filter((b) => b.selections.every((s) => isMoneyline(s.market)));

  if (eligible.length === 0) {
    return NextResponse.json({ settled: 0, skipped: pending.length, message: "No eligible pending bets" });
  }

  const sportToBets = new Map<string, typeof eligible>();
  for (const bet of eligible) {
    const sport = bet.selections[0].sport ?? null;
    if (!sport) continue;
    const sportMeta = SUPPORTED_SPORTS.find((s) => s.sport === sport);
    if (!sportMeta) continue;
    const list = sportToBets.get(sportMeta.key) ?? [];
    list.push(bet);
    sportToBets.set(sportMeta.key, list);
  }

  const scoreIndex = new Map<string, ScoreLookup>();
  for (const sportKey of sportToBets.keys()) {
    const raw = await fetchScores(sportKey, 3);
    for (const [k, v] of buildScoreIndex(raw)) scoreIndex.set(k, v);
  }

  type Settlement = {
    betId: string;
    reference: string;
    result: "won" | "lost";
    payout: number;
  };
  const settled: Settlement[] = [];
  const skipped: { betId: string; reason: string }[] = [];

  for (const bet of eligible) {
    const allScored = bet.selections.every((s) => scoreIndex.has(s.matchId));
    if (!allScored) {
      skipped.push({ betId: bet._id.toString(), reason: "not all matches finished" });
      continue;
    }

    let allWon = true;
    const updatedSelections = bet.selections.map((s) => {
      const score = scoreIndex.get(s.matchId)!;
      const result = settleMoneyline(s, score);
      if (result === "lost") allWon = false;
      return { ...s, result };
    });

    const result: "won" | "lost" = allWon ? "won" : "lost";
    const payout = allWon ? bet.potentialWin : 0;

    if (dryRun) {
      settled.push({
        betId: bet._id.toString(),
        reference: bet.reference,
        result,
        payout,
      });
      continue;
    }

    const updatedBet = await Bet.findOneAndUpdate(
      { _id: bet._id, status: "pending" },
      {
        $set: {
          status: result,
          settledAt: new Date(),
          payout,
          selections: updatedSelections,
        },
      },
      { returnDocument: "after" }
    );
    if (!updatedBet) {
      skipped.push({ betId: bet._id.toString(), reason: "bet status changed during settle" });
      continue;
    }

    if (allWon && payout > 0) {
      const fresh = await User.findByIdAndUpdate(
        bet.userId,
        { $inc: { balance: payout, totalWon: payout } },
        { returnDocument: "after" }
      );
      if (fresh) {
        await Transaction.create({
          userId: bet.userId,
          type: "win",
          status: "success",
          amount: payout,
          currency: bet.currency,
          method: "internal",
          reference: generateReference("WIN"),
          balanceBefore: fresh.balance - payout,
          balanceAfter: fresh.balance,
          metadata: { betId: bet._id.toString(), source: "auto-settle" },
        });
        sendBetResult(
          fresh.email,
          fresh.firstName,
          "won",
          bet.selections[0]?.match ?? "your bet",
          bet.stake,
          payout,
          bet.currency
        ).catch(() => {});
      }
    } else {
      const fresh = await User.findById(bet.userId);
      if (fresh) {
        sendBetResult(
          fresh.email,
          fresh.firstName,
          "lost",
          bet.selections[0]?.match ?? "your bet",
          bet.stake,
          0,
          bet.currency
        ).catch(() => {});
      }
    }

    void logAudit({
      userId: bet.userId,
      action: "bet.settle",
      resource: "Bet",
      resourceId: bet._id.toString(),
      details: { result, payout, source: "auto-settle" },
      adminId: auth.user._id,
      req,
    });

    settled.push({
      betId: bet._id.toString(),
      reference: bet.reference,
      result,
      payout,
    });
  }

  return NextResponse.json({
    dryRun,
    settled: settled.length,
    skipped: skipped.length,
    settlements: settled,
    skippedDetails: skipped,
  });
}
