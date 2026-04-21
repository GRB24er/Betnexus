import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Bet } from "@/models/Bet";
import { Transaction } from "@/models/Transaction";
import { User } from "@/models/User";
import { getCurrentUser, serverError, unauthorized } from "@/lib/auth";
import { generateReference } from "@/lib/reference";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { id } = await ctx.params;

    await connectDB();

    // Simplified cashout: 70% of potential win
    // Atomic: only transition if still pending — prevents double cashout
    const bet = await Bet.findOneAndUpdate(
      { _id: id, userId: user._id, status: "pending" },
      {
        $set: {
          status: "cashed_out",
          cashedOutAt: new Date(),
          settledAt: new Date(),
        },
      },
      { new: true }
    );

    if (!bet) {
      const existing = await Bet.findOne({ _id: id, userId: user._id });
      if (!existing) {
        return NextResponse.json({ error: "Bet not found" }, { status: 404 });
      }
      return NextResponse.json(
        { error: `Cannot cash out a ${existing.status} bet` },
        { status: 400 }
      );
    }

    const cashoutAmount = Math.round(bet.potentialWin * 0.7 * 100) / 100;

    // Persist cashout amount after atomic lock
    bet.cashedOutAmount = cashoutAmount;
    bet.payout = cashoutAmount;
    await bet.save();

    // Credit user atomically
    const fresh = await User.findByIdAndUpdate(
      user._id,
      { $inc: { balance: cashoutAmount, totalWon: cashoutAmount } },
      { new: true }
    );

    if (!fresh) return unauthorized();

    await Transaction.create({
      userId: fresh._id,
      type: "win",
      status: "success",
      amount: cashoutAmount,
      currency: fresh.currency,
      method: "internal",
      reference: generateReference("CSH"),
      balanceBefore: fresh.balance - cashoutAmount,
      balanceAfter: fresh.balance,
      metadata: { betId: bet._id.toString(), reason: "cashout" },
    });

    void logAudit({
      userId: user._id,
      action: "bet.cashout",
      resource: "bet",
      resourceId: bet._id.toString(),
      details: { cashoutAmount, potentialWin: bet.potentialWin },
      req,
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
