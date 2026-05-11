import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Transaction } from "@/models/Transaction";
import { Bet } from "@/models/Bet";
import { PayoutRequest } from "@/models/PayoutRequest";
import { requireSubadminOrAdmin } from "@/lib/subadminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireSubadminOrAdmin();
  if (auth.error) return auth.error;
  const sa = auth.user;

  await connectDB();

  const referredUsers = await User.find({ referredBy: sa._id.toString() })
    .select("firstName lastName email phone totalDeposited totalWagered status createdAt lastLoginAt balance")
    .sort({ createdAt: -1 })
    .lean();

  const referredIds = referredUsers.map((u) => u._id);

  const [depAgg, stakeAgg, recentDeposits, payouts] = await Promise.all([
    Transaction.aggregate([
      {
        $match: {
          userId: { $in: referredIds },
          type: "deposit",
          status: "success",
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    Bet.aggregate([
      { $match: { userId: { $in: referredIds } } },
      { $group: { _id: null, total: { $sum: "$stake" }, count: { $sum: 1 } } },
    ]).catch(() => []),
    Transaction.find({
      userId: { $in: referredIds },
      type: "deposit",
      status: "success",
    })
      .populate("userId", "firstName lastName email")
      .sort({ createdAt: -1 })
      .limit(15)
      .lean(),
    PayoutRequest.find({ subadminId: sa._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
  ]);

  const totalDeposits = depAgg[0]?.total || 0;
  const totalStakes = stakeAgg[0]?.total || 0;
  const commissionFromDeposits = totalDeposits * (sa.commissionRate / 100);
  const commissionFromStakes = totalStakes * (sa.commissionRate / 100);
  const totalCommission = commissionFromDeposits + commissionFromStakes;
  const availableForPayout = Math.max(
    0,
    totalCommission - (sa.commissionPaidOut || 0)
  );

  return NextResponse.json({
    subadmin: {
      id: sa._id.toString(),
      firstName: sa.firstName,
      lastName: sa.lastName,
      email: sa.email,
      referralCode: sa.referralCode,
      commissionRate: sa.commissionRate,
      payoutDay: sa.payoutDay,
      nextPayoutDate: sa.nextPayoutDate,
      balance: sa.balance,
    },
    stats: {
      referredCount: referredUsers.length,
      totalDeposits,
      depositTransactions: depAgg[0]?.count || 0,
      totalStakes,
      betCount: stakeAgg[0]?.count || 0,
      commissionFromDeposits,
      commissionFromStakes,
      totalCommission,
      commissionPaidOut: sa.commissionPaidOut,
      availableForPayout,
    },
    referredUsers,
    recentDeposits,
    payouts,
  });
}
