import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Bet } from "@/models/Bet";
import { Transaction } from "@/models/Transaction";
import { requireAdmin } from "@/lib/adminAuth";
import { cacheGet, cacheSet } from "@/lib/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const period = req.nextUrl.searchParams.get("period") || "today";
  const cacheKey = `admin:revenue:${period}`;

  const cached = await cacheGet<Record<string, unknown>>(cacheKey);
  if (cached) return NextResponse.json(cached);

  await connectDB();

  const now = new Date();
  let startDate: Date;
  switch (period) {
    case "week":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "year":
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  const dateFilter = { createdAt: { $gte: startDate } };

  const [
    totalUsers,
    newUsers,
    totalBets,
    pendingBets,
    deposits,
    withdrawals,
    betStats,
    recentTransactions,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments(dateFilter),
    Bet.countDocuments(dateFilter),
    Bet.countDocuments({ status: "pending" }),
    Transaction.aggregate([
      { $match: { ...dateFilter, type: "deposit", status: "success" } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    Transaction.aggregate([
      { $match: { ...dateFilter, type: "withdrawal", status: { $in: ["success", "processing"] } } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    Bet.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalStaked: { $sum: "$stake" },
          totalPayout: { $sum: "$payout" },
          avgStake: { $avg: "$stake" },
        },
      },
    ]),
    Transaction.find({ status: "success" })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("userId", "firstName lastName email")
      .lean(),
  ]);

  const totalDeposits = deposits[0]?.total || 0;
  const totalWithdrawals = withdrawals[0]?.total || 0;
  const totalStaked = betStats[0]?.totalStaked || 0;
  const totalPayout = betStats[0]?.totalPayout || 0;
  const ggr = totalStaked - totalPayout;

  const data = {
    period,
    overview: {
      totalUsers,
      newUsers,
      totalBets,
      pendingBets,
      totalDeposits,
      depositCount: deposits[0]?.count || 0,
      totalWithdrawals,
      withdrawalCount: withdrawals[0]?.count || 0,
      totalStaked,
      totalPayout,
      ggr,
      netRevenue: totalDeposits - totalWithdrawals,
      avgStake: betStats[0]?.avgStake || 0,
    },
    recentTransactions,
  };

  await cacheSet(cacheKey, data, 60);
  return NextResponse.json(data);
}
