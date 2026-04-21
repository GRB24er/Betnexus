import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Transaction } from "@/models/Transaction";
import { User } from "@/models/User";
import { requireAdmin } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    await connectDB();

    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20")));
    const search = url.searchParams.get("search") || "";
    const type = url.searchParams.get("type") || "";
    const status = url.searchParams.get("status") || "";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {};
    if (type && type !== "all") filter.type = type;
    if (status && status !== "all") filter.status = status;

    // If search, find users first
    if (search) {
      const users = await User.find({
        $or: [
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }).select("_id").limit(50);

      const userIds = users.map((u) => u._id);
      filter.$or = [
        { userId: { $in: userIds } },
        { reference: { $regex: search, $options: "i" } },
      ];
    }

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .populate("userId", "firstName lastName email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Transaction.countDocuments(filter),
    ]);

    // Get summary stats
    const [depositStats, withdrawalStats] = await Promise.all([
      Transaction.aggregate([
        { $match: { type: "deposit", status: "success" } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
      Transaction.aggregate([
        { $match: { type: "withdrawal", status: "success" } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
    ]);

    const pendingWithdrawals = await Transaction.countDocuments({
      type: "withdrawal",
      status: "pending",
    });

    return NextResponse.json({
      transactions,
      total,
      page,
      pages: Math.ceil(total / limit),
      stats: {
        totalDeposits: depositStats[0]?.total || 0,
        depositCount: depositStats[0]?.count || 0,
        totalWithdrawals: withdrawalStats[0]?.total || 0,
        withdrawalCount: withdrawalStats[0]?.count || 0,
        pendingWithdrawals,
      },
    });
  } catch (error) {
    console.error("[admin/transactions]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
