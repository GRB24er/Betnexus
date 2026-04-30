import { Transaction } from "@/models/Transaction";
import { User } from "@/models/User";
import Settings from "@/models/Settings";
import { Types } from "mongoose";

/**
 * Earnings & commission calculations for the sub-admin / agent system.
 *
 * Revenue model: TOTAL DEPOSITS from a sub-admin's referred users.
 *   - Source: Transaction { type: "deposit", status: "success" }
 *   - Bucketed by createdAt (today / week / month / all time)
 *   - Withdrawals, bets, refunds, and bonuses are NOT subtracted
 *
 * Commission split (configurable in Settings):
 *   subAdmin    = totalDeposits × subAdminCommissionPercent / 100
 *   superAdmin  = totalDeposits − subAdmin
 */

export type DepositsBucket = {
  deposits: number;
  depositsCount: number;
};

export type EarningsBreakdown = {
  total: DepositsBucket;
  today: DepositsBucket;
  thisWeek: DepositsBucket;
  thisMonth: DepositsBucket;
};

export type CommissionedEarnings = EarningsBreakdown & {
  commissionPercent: number;
  /** What the sub-admin is owed at the configured percent. */
  subAdminPayout: { total: number; today: number; thisWeek: number; thisMonth: number };
  /** What stays with the platform / super admin (the remainder). */
  superAdminPayout: { total: number; today: number; thisWeek: number; thisMonth: number };
};

const EMPTY: DepositsBucket = {
  deposits: 0,
  depositsCount: 0,
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
 * Aggregate successful deposits for a fixed set of user IDs across the
 * standard time buckets, in a single Mongo pipeline.
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

  const match = {
    userId: { $in: userIds },
    type: "deposit",
    status: "success",
  };

  const pipeline = [
    { $match: match },
    {
      $project: {
        amount: 1,
        createdAt: 1,
        isToday: { $gte: ["$createdAt", today] },
        isWeek: { $gte: ["$createdAt", week] },
        isMonth: { $gte: ["$createdAt", month] },
      },
    },
    {
      $group: {
        _id: null,
        deposits: { $sum: "$amount" },
        depositsCount: { $sum: 1 },
        depositsToday: { $sum: { $cond: ["$isToday", "$amount", 0] } },
        countToday: { $sum: { $cond: ["$isToday", 1, 0] } },
        depositsWeek: { $sum: { $cond: ["$isWeek", "$amount", 0] } },
        countWeek: { $sum: { $cond: ["$isWeek", 1, 0] } },
        depositsMonth: { $sum: { $cond: ["$isMonth", "$amount", 0] } },
        countMonth: { $sum: { $cond: ["$isMonth", 1, 0] } },
      },
    },
  ];

  const [agg] = await Transaction.aggregate(pipeline);
  if (!agg) {
    return { total: EMPTY, today: EMPTY, thisWeek: EMPTY, thisMonth: EMPTY };
  }

  return {
    total: { deposits: round(agg.deposits), depositsCount: agg.depositsCount },
    today: { deposits: round(agg.depositsToday), depositsCount: agg.countToday },
    thisWeek: { deposits: round(agg.depositsWeek), depositsCount: agg.countWeek },
    thisMonth: { deposits: round(agg.depositsMonth), depositsCount: agg.countMonth },
  };
}

export async function getCommissionPercent(): Promise<number> {
  const settings = await Settings.findOne({ key: "platform" });
  const pct = settings?.subAdminCommissionPercent;
  if (typeof pct === "number" && pct >= 0 && pct <= 100) return pct;
  return 60; // sensible default
}

/**
 * Convenience: compute deposits-based earnings for the users a given sub-admin
 * referred, split into what the sub-admin is owed and what stays with the
 * super admin.
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
      total: subAdminCut(earnings.total.deposits),
      today: subAdminCut(earnings.today.deposits),
      thisWeek: subAdminCut(earnings.thisWeek.deposits),
      thisMonth: subAdminCut(earnings.thisMonth.deposits),
    },
    superAdminPayout: {
      total: superAdminCut(earnings.total.deposits),
      today: superAdminCut(earnings.today.deposits),
      thisWeek: superAdminCut(earnings.thisWeek.deposits),
      thisMonth: superAdminCut(earnings.thisMonth.deposits),
    },
  };
}

function round(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
