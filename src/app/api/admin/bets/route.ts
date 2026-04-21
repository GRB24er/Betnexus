import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Bet } from "@/models/Bet";
import { Transaction } from "@/models/Transaction";
import { User } from "@/models/User";
import { requireAdmin } from "@/lib/adminAuth";
import { logAudit } from "@/lib/audit";
import { generateReference } from "@/lib/reference";
import { sendBetResult } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") || 1));
  const limit = Math.min(
    100,
    Number(req.nextUrl.searchParams.get("limit") || 20)
  );
  const status = req.nextUrl.searchParams.get("status");
  const userId = req.nextUrl.searchParams.get("userId");

  await connectDB();

  const query: Record<string, unknown> = {};
  if (status) query.status = status;
  if (userId) query.userId = userId;

  const [bets, total] = await Promise.all([
    Bet.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("userId", "firstName lastName email")
      .lean(),
    Bet.countDocuments(query),
  ]);

  return NextResponse.json({
    bets,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { betId, action, result } = await req.json();
  if (!betId || !action) {
    return NextResponse.json(
      { error: "betId and action required" },
      { status: 400 }
    );
  }

  await connectDB();

  // Only allow settling/voiding pending bets
  const bet = await Bet.findOne({ _id: betId, status: "pending" });
  if (!bet) {
    const existing = await Bet.findById(betId);
    if (!existing) {
      return NextResponse.json({ error: "Bet not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: `Bet is already ${existing.status}` },
      { status: 400 }
    );
  }

  if (action === "void") {
    // Refund the stake back to the user
    bet.status = "void";
    bet.settledAt = new Date();
    bet.payout = bet.stake;
    await bet.save();

    const user = await User.findByIdAndUpdate(
      bet.userId,
      { $inc: { balance: bet.stake, totalWagered: -bet.stake } },
      { new: true }
    );

    if (user) {
      await Transaction.create({
        userId: bet.userId,
        type: "refund",
        status: "success",
        amount: bet.stake,
        currency: bet.currency,
        method: "internal",
        reference: generateReference("REF"),
        balanceBefore: user.balance - bet.stake,
        balanceAfter: user.balance,
        metadata: { betId: bet._id.toString(), reason: "void" },
      });
    }
  } else if (action === "settle" && result) {
    const isWon = result === "won";
    bet.status = isWon ? "won" : "lost";
    bet.settledAt = new Date();

    if (isWon) {
      bet.payout = bet.potentialWin;
      await bet.save();

      const user = await User.findByIdAndUpdate(
        bet.userId,
        { $inc: { balance: bet.potentialWin, totalWon: bet.potentialWin } },
        { new: true }
      );

      if (user) {
        await Transaction.create({
          userId: bet.userId,
          type: "win",
          status: "success",
          amount: bet.potentialWin,
          currency: bet.currency,
          method: "internal",
          reference: generateReference("WIN"),
          balanceBefore: user.balance - bet.potentialWin,
          balanceAfter: user.balance,
          metadata: { betId: bet._id.toString() },
        });

        // Notify user of win
        sendBetResult(
          user.email,
          user.firstName,
          "won",
          bet.selections[0]?.match ?? "your bet",
          bet.stake,
          bet.potentialWin,
          bet.currency
        ).catch(() => {});
      }
    } else {
      await bet.save();

      // Notify user of loss
      const user = await User.findById(bet.userId);
      if (user) {
        sendBetResult(
          user.email,
          user.firstName,
          "lost",
          bet.selections[0]?.match ?? "your bet",
          bet.stake,
          0,
          bet.currency
        ).catch(() => {});
      }
    }
  } else {
    return NextResponse.json(
      { error: "Invalid action or missing result" },
      { status: 400 }
    );
  }

  await logAudit({
    userId: bet.userId,
    action: "bet.settle",
    resource: "Bet",
    resourceId: bet._id.toString(),
    details: { action, result },
    adminId: auth.user._id,
    req,
  });

  return NextResponse.json({ bet });
}
