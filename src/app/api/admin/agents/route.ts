import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { requireAdmin } from "@/lib/adminAuth";
import {
  computeEarningsForUsers,
  getCommissionPercent,
} from "@/lib/earnings";
import { Types } from "mongoose";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/agents
 *
 * Super-admin only. Lists all sub-admins with their referred-user count, GGR,
 * and the 60/40 split so the super admin knows exactly how much each agent
 * is owed and how much the platform has retained from each agent's pool.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") || 1));
  const limit = Math.min(
    100,
    Number(req.nextUrl.searchParams.get("limit") || 50)
  );

  await connectDB();

  const [agents, total, percent] = await Promise.all([
    User.find({ role: "subadmin" })
      .select("firstName lastName email referralCode createdAt status")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<
        {
          _id: Types.ObjectId;
          firstName: string;
          lastName: string;
          email: string;
          referralCode: string;
          createdAt: Date;
          status: string;
        }[]
      >(),
    User.countDocuments({ role: "subadmin" }),
    getCommissionPercent(),
  ]);

  // For each agent, find their referred users + earnings. Done in parallel.
  const enriched = await Promise.all(
    agents.map(async (a) => {
      const referred = await User.find({ referredBy: a._id.toString() })
        .select("_id")
        .lean<{ _id: Types.ObjectId }[]>();
      const userIds = referred.map((u) => u._id);
      const earnings = await computeEarningsForUsers(userIds);

      const subAdminCut = round((earnings.total.ggr * percent) / 100);
      const superAdminCut = round(earnings.total.ggr - subAdminCut);

      return {
        _id: a._id,
        firstName: a.firstName,
        lastName: a.lastName,
        email: a.email,
        referralCode: a.referralCode,
        status: a.status,
        createdAt: a.createdAt,
        referredUsersCount: userIds.length,
        ggr: {
          total: earnings.total.ggr,
          today: earnings.today.ggr,
          thisWeek: earnings.thisWeek.ggr,
          thisMonth: earnings.thisMonth.ggr,
        },
        subAdminPayout: subAdminCut,
        superAdminPayout: superAdminCut,
      };
    })
  );

  // Roll-up totals so the super admin sees their own slice across all agents.
  const platformRetained = enriched.reduce((s, x) => s + x.superAdminPayout, 0);
  const agentsOwed = enriched.reduce((s, x) => s + x.subAdminPayout, 0);

  return NextResponse.json({
    agents: enriched,
    total,
    page,
    pages: Math.ceil(total / limit),
    commissionPercent: percent,
    summary: {
      totalAgents: total,
      totalReferredUsers: enriched.reduce(
        (s, x) => s + x.referredUsersCount,
        0
      ),
      totalGgr: round(enriched.reduce((s, x) => s + x.ggr.total, 0)),
      agentsOwed: round(agentsOwed),
      platformRetained: round(platformRetained),
    },
  });
}

function round(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
