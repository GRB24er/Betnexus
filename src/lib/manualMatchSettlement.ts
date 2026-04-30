import { Types } from "mongoose";
import { Bet, IBetSelection } from "@/models/Bet";
import { Transaction } from "@/models/Transaction";
import { User } from "@/models/User";
import { ManualMatch, IManualMatch } from "@/models/ManualMatch";
import { generateReference } from "@/lib/reference";
import { sendBetResult } from "@/lib/email";

/**
 * Walk every pending bet that references the given manual match, grade the
 * selection(s), and — once a bet has no remaining pending legs — finalize it:
 * credit the user (or void/refund) atomically and create the bookkeeping
 * Transaction record.
 *
 * Idempotent: if called twice in a row only newly-resolvable bets are touched.
 */

const MAX_PAYOUT = 1_000_000;

export type SettlementSummary = {
  betsTouched: number;
  betsWon: number;
  betsLost: number;
  betsVoided: number;
  totalPaidOut: number;
  totalRefunded: number;
};

export async function propagateManualMatchSettlement(
  match: IManualMatch & { _id: Types.ObjectId }
): Promise<SettlementSummary> {
  const matchId = match._id.toString();
  const summary: SettlementSummary = {
    betsTouched: 0,
    betsWon: 0,
    betsLost: 0,
    betsVoided: 0,
    totalPaidOut: 0,
    totalRefunded: 0,
  };

  // Build a quick-lookup table: market name + outcome label → result
  const lookup = new Map<string, "won" | "lost" | "void">();
  for (const market of match.markets) {
    for (const outcome of market.outcomes) {
      if (outcome.result === "won" || outcome.result === "lost" || outcome.result === "void") {
        lookup.set(`${market.name}::${outcome.label}`, outcome.result);
      }
    }
  }

  // Only pending bets can change. Cashed-out / already-settled bets are immutable.
  const bets = await Bet.find({
    status: "pending",
    "selections.matchId": matchId,
  });

  for (const bet of bets) {
    let touched = false;

    for (const sel of bet.selections) {
      if (sel.matchId !== matchId) continue;
      if (sel.result && sel.result !== "pending") continue;
      const key = `${sel.market}::${sel.selection}`;
      const graded = lookup.get(key);
      if (!graded) {
        // Settler chose a different outcome OR the bet's market/selection
        // text doesn't exactly match — leave as pending; the staff member
        // can manually settle this individual bet from /admin/bets.
        continue;
      }
      sel.result = graded;
      touched = true;
    }

    if (!touched) continue;
    summary.betsTouched += 1;

    // Has the bet fully resolved?
    const stillPending = bet.selections.some(
      (s) => !s.result || s.result === "pending"
    );
    if (stillPending) {
      await bet.save();
      continue;
    }

    // Resolve the bet outcome.
    const decision = decideBet(bet.selections);

    bet.settledAt = new Date();
    if (decision.kind === "won") {
      const payout = Math.min(bet.stake * decision.effectiveOdds, MAX_PAYOUT);
      bet.status = "won";
      bet.payout = round(payout);
      await bet.save();

      const fresh = await User.findByIdAndUpdate(
        bet.userId,
        { $inc: { balance: payout, totalWon: payout } },
        { new: true }
      );
      if (fresh) {
        await Transaction.create({
          userId: bet.userId,
          type: "win",
          status: "success",
          amount: round(payout),
          currency: bet.currency,
          method: "internal",
          reference: generateReference("WIN"),
          balanceBefore: round(fresh.balance - payout),
          balanceAfter: round(fresh.balance),
          metadata: { betId: bet._id.toString(), source: "manualMatch", matchId },
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

      summary.betsWon += 1;
      summary.totalPaidOut += payout;
    } else if (decision.kind === "lost") {
      bet.status = "lost";
      bet.payout = 0;
      await bet.save();

      const fresh = await User.findById(bet.userId).select("email firstName");
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

      summary.betsLost += 1;
    } else {
      // Fully void — refund the stake.
      bet.status = "void";
      bet.payout = bet.stake;
      await bet.save();

      const fresh = await User.findByIdAndUpdate(
        bet.userId,
        { $inc: { balance: bet.stake, totalWagered: -bet.stake } },
        { new: true }
      );
      if (fresh) {
        await Transaction.create({
          userId: bet.userId,
          type: "refund",
          status: "success",
          amount: bet.stake,
          currency: bet.currency,
          method: "internal",
          reference: generateReference("REF"),
          balanceBefore: round(fresh.balance - bet.stake),
          balanceAfter: round(fresh.balance),
          metadata: {
            betId: bet._id.toString(),
            source: "manualMatch",
            reason: "match_voided",
            matchId,
          },
        });
      }

      summary.betsVoided += 1;
      summary.totalRefunded += bet.stake;
    }
  }

  summary.totalPaidOut = round(summary.totalPaidOut);
  summary.totalRefunded = round(summary.totalRefunded);
  return summary;
}

/**
 * Cancel a manual match: void every selection on it that isn't already
 * resolved and refund any bet that becomes fully void as a result.
 */
export async function cancelManualMatchAndRefund(
  match: IManualMatch & { _id: Types.ObjectId }
): Promise<SettlementSummary> {
  // Mark every market outcome as void so the propagation step grades them.
  for (const market of match.markets) {
    for (const outcome of market.outcomes) {
      if (outcome.result === "pending") outcome.result = "void";
    }
  }
  await ManualMatch.updateOne(
    { _id: match._id },
    {
      $set: {
        markets: match.markets,
        status: "cancelled",
        cancelledAt: new Date(),
      },
    }
  );

  return propagateManualMatchSettlement(match);
}

type Decision =
  | { kind: "won"; effectiveOdds: number }
  | { kind: "lost" }
  | { kind: "void" };

function decideBet(selections: IBetSelection[]): Decision {
  if (selections.some((s) => s.result === "lost")) return { kind: "lost" };
  if (selections.every((s) => s.result === "void")) return { kind: "void" };

  // Mix of "won" and "void" → void selections become odds=1, others contribute.
  const effectiveOdds = selections.reduce((acc, s) => {
    if (s.result === "void") return acc; // odds 1
    return acc * s.odds;
  }, 1);
  return { kind: "won", effectiveOdds };
}

function round(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
