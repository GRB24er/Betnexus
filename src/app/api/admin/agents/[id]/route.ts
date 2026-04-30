import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Bet } from "@/models/Bet";
import { requireAdmin } from "@/lib/adminAuth";
import { getSubAdminCommissionedEarnings } from "@/lib/earnings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/agents/[id]
 *
 * Super-admin detail view of one sub-admin: full earnings breakdown
 * (sub-admin's 60% AND the platform's 40%), plus their referred users
 * and recent bets.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  await connectDB();

  const agent = await User.findOne({ _id: id, role: "subadmin" })
    .select(
      "firstName lastName email phone referralCode status createdAt lastLoginAt"
    )
    .lean<{
      _id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      referralCode: string;
      status: string;
      createdAt: Date;
      lastLoginAt?: Date;
    } | null>();

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const [earnings, referredUsers] = await Promise.all([
    getSubAdminCommissionedEarnings(id),
    User.find({ referredBy: id })
      .select(
        "firstName lastName email country balance totalDeposited totalWagered totalWon kycStatus status createdAt"
      )
      .sort({ createdAt: -1 })
      .limit(100)
      .lean(),
  ]);

  // Recent bets across all referred users.
  const userIds = referredUsers.map((u) => u._id);
  const recentBets =
    userIds.length === 0
      ? []
      : await Bet.find({ userId: { $in: userIds } })
          .sort({ createdAt: -1 })
          .limit(20)
          .populate("userId", "firstName lastName email")
          .lean();

  return NextResponse.json({
    agent,
    earnings,
    referredUsers,
    recentBets,
  });
}
