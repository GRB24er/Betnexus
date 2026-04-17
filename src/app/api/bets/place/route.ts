import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { Bet } from "@/models/Bet";
import { Transaction } from "@/models/Transaction";
import { User } from "@/models/User";
import { badRequest, getCurrentUser, serverError, unauthorized } from "@/lib/auth";
import { generateReference } from "@/lib/reference";

export const runtime = "nodejs";

const selectionSchema = z.object({
  matchId: z.string(),
  match: z.string(),
  market: z.string(),
  selection: z.string(),
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

export async function POST(req: NextRequest) {
  try {
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

    await connectDB();

    const fresh = await User.findById(user._id);
    if (!fresh) return unauthorized();

    if (fresh.balance < stake) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }

    const totalOdds = selections.reduce((acc, s) => acc * s.odds, 1);
    const potentialWin = Math.min(stake * totalOdds, MAX_PAYOUT);

    const before = fresh.balance;
    fresh.balance = before - stake;
    fresh.totalWagered += stake;
    await fresh.save();

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
      balanceBefore: before,
      balanceAfter: fresh.balance,
      metadata: { betId: bet._id.toString(), betRef: reference },
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
