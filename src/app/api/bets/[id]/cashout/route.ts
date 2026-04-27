import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Bet } from "@/models/Bet";
import { Transaction } from "@/models/Transaction";
import { User } from "@/models/User";
import { getCurrentUser, serverError, unauthorized } from "@/lib/auth";
import { generateReference } from "@/lib/reference";
import { logAudit } from "@/lib/audit";
import { roundMoney } from "@/lib/money";

export const runtime = "nodejs";

const CASHOUT_FACTOR = 0.7;

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { id } = await ctx.params;

    await connectDB();

    // Read potentialWin first so we can include the cashout amount in the
    // same atomic update — keeps the bet's `cashedOutAmount` and `status`
    // consistent even if a process crash happens before user credit.
    const candidate = await Bet.findOne({
      _id: id,
      userId: user._id,
      status: "pending",
    });
    if (!candidate) {
      const existing = await Bet.findOne({ _id: id, userId: user._id });
      if (!existing) {
        return NextResponse.json({ error: "Bet not found" }, { status: 404 });
      }
      return NextResponse.json(
        { error: `Cannot cash out a ${existing.status} bet` },
        { status: 400 }
      );
    }

    const cashoutAmount = roundMoney(candidate.potentialWin * CASHOUT_FACTOR);

    // Atomic transition: lock the bet AND record the payout in one write.
    // The matched filter (status: "pending") prevents double-cashout under
    // concurrent requests.
    const bet = await Bet.findOneAndUpdate(
      { _id: id, userId: user._id, status: "pending" },
      {
        $set: {
          status: "cashed_out",
          cashedOutAt: new Date(),
          settledAt: new Date(),
          cashedOutAmount: cashoutAmount,
          payout: cashoutAmount,
        },
      },
      { returnDocument: "after" }
    );

    if (!bet) {
      return NextResponse.json(
        { error: "Bet was already cashed out" },
        { status: 409 }
      );
    }

    // Credit user balance atomically. If this fails the bet is already locked
    // with cashedOutAmount set, so a reconciliation job (or admin) can credit
    // the user without ambiguity about what's owed.
    const fresh = await User.findByIdAndUpdate(
      user._id,
      { $inc: { balance: cashoutAmount, totalWon: cashoutAmount } },
      { returnDocument: "after" }
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
      balanceBefore: roundMoney(fresh.balance - cashoutAmount),
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
