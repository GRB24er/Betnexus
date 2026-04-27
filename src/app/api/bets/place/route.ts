import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { Bet } from "@/models/Bet";
import { Transaction } from "@/models/Transaction";
import { User } from "@/models/User";
import { badRequest, getCurrentUser, serverError, unauthorized } from "@/lib/auth";
import { generateReference } from "@/lib/reference";
import { rateLimit, BET_RATE_LIMIT } from "@/lib/rateLimit";
import { logAudit } from "@/lib/audit";
import { validateBetSelection } from "@/lib/oddsapi";
import { calcPayout, totalOddsOf } from "@/lib/money";

export const runtime = "nodejs";

const selectionSchema = z.object({
  matchId: z.string().min(1),
  match: z.string().min(1),
  market: z.string().min(1),
  selection: z.string().min(1),
  odds: z.number().min(1.01).max(1000),
  sport: z.string().optional(),
  league: z.string().optional(),
  startTime: z.string().optional(),
});

const placeSchema = z.object({
  selections: z.array(selectionSchema).min(1).max(20),
  stake: z.number().positive().min(1).max(100_000),
  type: z.enum(["single", "accumulator", "system"]).default("accumulator"),
});

const MAX_PAYOUT = 1_000_000;
// Per-user, per-match liability cap: total pending stake on a single event.
// Stops a single user from over-exposing the book on one match.
const MAX_STAKE_PER_MATCH_PER_USER = 50_000;

export async function POST(req: NextRequest) {
  try {
    const limited = await rateLimit(req, BET_RATE_LIMIT);
    if (limited) return limited;

    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const body = await req.json();
    const parsed = placeSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid bet payload", parsed.error.issues);
    }

    const { selections, stake, type } = parsed.data;

    if (type === "single" && selections.length !== 1) {
      return badRequest("Single bets must have exactly one selection");
    }

    // Reject duplicate selections within the same slip.
    const slipKeys = new Set<string>();
    for (const s of selections) {
      const k = `${s.matchId}|${s.market}|${s.selection}`;
      if (slipKeys.has(k)) {
        return badRequest("Duplicate selection in slip");
      }
      slipKeys.add(k);
    }
    // Accumulators: reject multiple selections from the same match —
    // they'd be perfectly correlated.
    if (type === "accumulator") {
      const matchIdSet = new Set<string>();
      for (const s of selections) {
        if (matchIdSet.has(s.matchId)) {
          return badRequest("Accumulators cannot include multiple selections from the same match");
        }
        matchIdSet.add(s.matchId);
      }
    }

    // ── Server-side odds validation ────────────────────────────────────────
    // Without this, a client could submit any `odds` value up to the Zod max
    // (1000) and the server would multiply through to payout.
    for (const s of selections) {
      const v = validateBetSelection(s.matchId, s.market, s.selection, s.odds);
      if (!v.ok) {
        return badRequest(
          `Selection rejected (${s.match} — ${s.market}: ${s.selection}): ${v.reason}`,
          v.expectedOdds !== undefined ? { expectedOdds: v.expectedOdds } : undefined
        );
      }
    }

    await connectDB();

    // ── Per-user, per-match liability cap ───────────────────────────────────
    const matchIds = [...new Set(selections.map((s) => s.matchId))];
    const existing = await Bet.aggregate<{ _id: string; total: number }>([
      { $match: { userId: user._id, status: "pending" } },
      { $unwind: "$selections" },
      { $match: { "selections.matchId": { $in: matchIds } } },
      { $group: { _id: "$selections.matchId", total: { $sum: "$stake" } } },
    ]);
    const exposureByMatch = new Map(existing.map((row) => [row._id, row.total]));
    for (const mid of matchIds) {
      const current = exposureByMatch.get(mid) ?? 0;
      if (current + stake > MAX_STAKE_PER_MATCH_PER_USER) {
        return badRequest(
          `Per-match stake limit (${MAX_STAKE_PER_MATCH_PER_USER}) would be exceeded`,
          { matchId: mid, currentStake: current, limit: MAX_STAKE_PER_MATCH_PER_USER }
        );
      }
    }

    // ── Atomic balance deduction ────────────────────────────────────────────
    const fresh = await User.findOneAndUpdate(
      { _id: user._id, balance: { $gte: stake }, status: "active" },
      { $inc: { balance: -stake, totalWagered: stake } },
      { returnDocument: "after" }
    );

    if (!fresh) {
      const check = await User.findById(user._id);
      if (!check) return unauthorized();
      if (check.status !== "active") {
        return NextResponse.json(
          { error: `Account is ${check.status}` },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { error: "Insufficient balance", balance: check.balance },
        { status: 400 }
      );
    }

    const balanceBefore = fresh.balance + stake;
    const totalOdds = totalOddsOf(selections.map((s) => s.odds));
    const potentialWin = calcPayout(stake, totalOdds, MAX_PAYOUT);

    const reference = generateReference("BET");
    const bet = await Bet.create({
      userId: fresh._id,
      reference,
      type,
      selections: selections.map((s) => ({
        ...s,
        startTime: s.startTime ? new Date(s.startTime) : undefined,
        result: "pending",
      })),
      stake,
      totalOdds,
      potentialWin,
      status: "pending",
      currency: fresh.currency,
    });

    await Transaction.create({
      userId: fresh._id,
      type: "bet",
      status: "success",
      amount: stake,
      currency: fresh.currency,
      method: "internal",
      reference: `TXN-${reference}`,
      balanceBefore,
      balanceAfter: fresh.balance,
      metadata: { betId: bet._id.toString(), betRef: reference },
    });

    void logAudit({
      userId: fresh._id,
      action: "bet.place",
      resource: "bet",
      resourceId: bet._id.toString(),
      details: { stake, totalOdds, selections: selections.length, type },
      req,
    });

    return NextResponse.json({
      bet,
      balance: fresh.balance,
    });
  } catch (err) {
    console.error("[bets/place]", err);
    return serverError("Failed to place bet");
  }
}
