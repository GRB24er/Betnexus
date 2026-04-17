import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Bet } from "@/models/Bet";
import { Transaction } from "@/models/Transaction";
import { User } from "@/models/User";
import { getCurrentUser, serverError, unauthorized } from "@/lib/auth";
import { generateReference } from "@/lib/reference";

export const runtime = "nodejs";

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { id } = await ctx.params;

    await connectDB();
    const bet = await Bet.findOne({ _id: id, userId: user._id });
    if (!bet) {
      return NextResponse.json({ error: "Bet not found" }, { status: 404 });
    }
    if (bet.status !== "pending") {
      return NextResponse.json(
        { error: `Cannot cash out ${bet.status} bet` },
        { status: 400 }
      );
    }

    // Simplified cashout: 70% of potential win
    const cashoutAmount = Math.round(bet.potentialWin * 0.7 * 100) / 100;

    const fresh = await User.findById(user._id);
    if (!fresh) return unauthorized();

    const before = fresh.balance;
    fresh.balance = before + cashoutAmount;
    fresh.totalWon += cashoutAmount;
    await fresh.save();

    bet.status = "cashed_out";
    bet.cashedOutAt = new Date();
    bet.cashedOutAmount = cashoutAmount;
    bet.payout = cashoutAmount;
    bet.settledAt = new Date();
    await bet.save();

    await Transaction.create({
      userId: fresh._id,
      type: "win",
      status: "success",
      amount: cashoutAmount,
      currency: fresh.currency,
      method: "internal",
      reference: generateReference("CSH"),
      balanceBefore: before,
      balanceAfter: fresh.balance,
      metadata: { betId: bet._id.toString(), reason: "cashout" },
    });

    return NextResponse.json({
      bet,
      balance: fresh.balance,
      cashoutAmount,
    });
  } catch (err) {
    console.error("[bets/cashout]", err);
    return serverError("Cashout failed");
  }
}
