import { Bet } from "@/models/Bet";
import { User } from "@/models/User";
import Settings from "@/models/Settings";
import { Types } from "mongoose";

/**
 * Earnings & commission calculations for the sub-admin / agent system.
 *
 * Revenue model: GGR (Gross Gaming Revenue) = settled-bet stakes − payouts
 *   - Bets in status "won" / "cashed_out" reduce GGR by (payout − stake)
 *   - Bets in status "lost" increase GGR by stake
 *   - Bets in status "void" don't count (stake refunded)
 *   - Pending bets don't count (not yet settled)
 *
 * Commission split (configurable in Settings):
 *   subAdmin = GGR × subAdminCommissionPercent / 100
 *   superAdmin = GGR − subAdmin
 */

export type EarningsBucket = {
  ggr: number;
  betsCount: number;
  totalStaked: number;
  totalPayout: number;
};

export type EarningsBreakdown = {
  total: EarningsBucket;
  today: EarningsBucket;
  thisWeek: EarningsBucket;
  thisMonth: EarningsBucket;
};

export type CommissionedEarnings = EarningsBreakdown & {
  commissionPercent: number;
  /** What the sub-admin is owed at the configured percent. */
  subAdminPayout: { total: number; today: number; thisWeek: number; thisMonth: number };
  /** What stays with the platform / super admin (the remainder). */
  superAdminPayout: { total: number; today: number; thisWeek: number; thisMonth: number };
};

const EMPTY: EarningsBucket = {
  ggr: 0,
  betsCount: 0,
  totalStaked: 0,
  totalPayout: 0,
};

function startOfDay(d = new Date()): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfWeek(d = new Date()): Date {
  const x = startOfDay(d);
  const day = x.getDay(); // 0=Sun..6=Sat
  const diff = (day + 6) % 7; // make Monday the start
  x.setDate(x.getDate() - diff);
  return x;
}

function startOfMonth(d = new Date()): Date {
  const x = startOfDay(d);
  x.setDate(1);
  return x;
}

/**
 * Aggregate GGR for a fixed set of user IDs across the standard time buckets.
 * Uses one Mongo aggregation pipeline so the dashboard is fast.
 */
export async function computeEarningsForUsers(
  userIds: Types.ObjectId[]
): Promise<EarningsBreakdown> {
  if (userIds.length === 0) {
    return { total: EMPTY, today: EMPTY, thisWeek: EMPTY, thisMonth: EMPTY };
  }

  const today = startOfDay();
  const week = startOfWeek();
  const month = startOfMonth();

  // Only settled bets count.
  const match = {
    userId: { $in: userIds },
    status: { $in: ["won", "lost", "cashed_out"] as const },
    settledAt: { $ne: null },
  };

  const pipeline = [
    { $match: match },
    {
      $project: {
        stake: 1,
        payout: { $ifNull: ["$payout", 0] },
        settledAt: 1,
        // GGR per bet: stake when lost; -(payout-stake) when won/cashed
        ggrDelta: {
          $cond: [
            { $eq: ["$status", "lost"] },
            "$stake",
            { $subtract: ["$stake", { $ifNull: ["$payout", 0] }] },
          ],
        },
        isToday: { $gte: ["$settledAt", today] },
        isWeek: { $gte: ["$settledAt", week] },
        isMonth: { $gte: ["$settledAt", month] },
      },
    },
    {
      $group: {
        _id: null,
        ggr: { $sum: "$ggrDelta" },
        betsCount: { $sum: 1 },
        totalStaked: { $sum: "$stake" },
        totalPayout: { $sum: "$payout" },
        ggrToday: {
          $sum: { $cond: ["$isToday", "$ggrDelta", 0] },
        },
        countToday: { $sum: { $cond: ["$isToday", 1, 0] } },
        stakedToday: { $sum: { $cond: ["$isToday", "$stake", 0] } },
        payoutToday: { $sum: { $cond: ["$isToday", "$payout", 0] } },
        ggrWeek: { $sum: { $cond: ["$isWeek", "$ggrDelta", 0] } },
        countWeek: { $sum: { $cond: ["$isWeek", 1, 0] } },
        stakedWeek: { $sum: { $cond: ["$isWeek", "$stake", 0] } },
        payoutWeek: { $sum: { $cond: ["$isWeek", "$payout", 0] } },
        ggrMonth: { $sum: { $cond: ["$isMonth", "$ggrDelta", 0] } },
        countMonth: { $sum: { $cond: ["$isMonth", 1, 0] } },
        stakedMonth: { $sum: { $cond: ["$isMonth", "$stake", 0] } },
        payoutMonth: { $sum: { $cond: ["$isMonth", "$payout", 0] } },
      },
    },
  ];

  const [agg] = await Bet.aggregate(pipeline);
  if (!agg) {
    return { total: EMPTY, today: EMPTY, thisWeek: EMPTY, thisMonth: EMPTY };
  }

  return {
    total: {
      ggr: round(agg.ggr),
      betsCount: agg.betsCount,
      totalStaked: round(agg.totalStaked),
      totalPayout: round(agg.totalPayout),
    },
    today: {
      ggr: round(agg.ggrToday),
      betsCount: agg.countToday,
      totalStaked: round(agg.stakedToday),
      totalPayout: round(agg.payoutToday),
    },
    thisWeek: {
      ggr: round(agg.ggrWeek),
      betsCount: agg.countWeek,
      totalStaked: round(agg.stakedWeek),
      totalPayout: round(agg.payoutWeek),
    },
    thisMonth: {
      ggr: round(agg.ggrMonth),
      betsCount: agg.countMonth,
      totalStaked: round(agg.stakedMonth),
      totalPayout: round(agg.payoutMonth),
    },
  };
}

export async function getCommissionPercent(): Promise<number> {
  const settings = await Settings.findOne({ key: "platform" });
  const pct = settings?.subAdminCommissionPercent;
  if (typeof pct === "number" && pct >= 0 && pct <= 100) return pct;
  return 60; // sensible default
}

/**
 * Convenience: compute earnings for the users a given sub-admin referred,
 * split into what the sub-admin is owed and what stays with the super admin.
 */
export async function getSubAdminCommissionedEarnings(
  subAdminId: Types.ObjectId | string
): Promise<CommissionedEarnings & { referredUsersCount: number }> {
  const id = typeof subAdminId === "string" ? subAdminId : subAdminId.toString();

  const [referred, percent] = await Promise.all([
    User.find({ referredBy: id }).select("_id").lean<{ _id: Types.ObjectId }[]>(),
    getCommissionPercent(),
  ]);

  const userIds = referred.map((u) => u._id);
  const earnings = await computeEarningsForUsers(userIds);

  const subAdminCut = (n: number) => round((n * percent) / 100);
  const superAdminCut = (n: number) => round(n - subAdminCut(n));

  return {
    ...earnings,
    commissionPercent: percent,
    referredUsersCount: userIds.length,
    subAdminPayout: {
      total: subAdminCut(earnings.total.ggr),
      today: subAdminCut(earnings.today.ggr),
      thisWeek: subAdminCut(earnings.thisWeek.ggr),
      thisMonth: subAdminCut(earnings.thisMonth.ggr),
    },
    superAdminPayout: {
      total: superAdminCut(earnings.total.ggr),
      today: superAdminCut(earnings.today.ggr),
      thisWeek: superAdminCut(earnings.thisWeek.ggr),
      thisMonth: superAdminCut(earnings.thisMonth.ggr),
    },
  };
}

function round(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
