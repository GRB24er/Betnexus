"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  DollarSign,
  Receipt,
  TrendingUp,
  ArrowUpCircle,
  ArrowDownCircle,
  ShieldCheck,
  Loader2,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  ChevronRight,
  Activity,
  BarChart3,
  Wallet,
  UserPlus,
  Ban,
  RefreshCw,
} from "lucide-react";
import { api } from "@/lib/api";

type RevenueData = {
  overview: {
    totalUsers: number;
    newUsers: number;
    totalBets: number;
    pendingBets: number;
    totalDeposits: number;
    depositCount: number;
    totalWithdrawals: number;
    withdrawalCount: number;
    totalStaked: number;
    totalPayout: number;
    ggr: number;
    netRevenue: number;
    avgStake: number;
  };
  recentTransactions?: Array<{
    _id: string;
    userId?: { firstName?: string; lastName?: string; email?: string };
    type: string;
    amount: number;
    status: string;
    createdAt: string;
  }>;
};

type PendingCounts = {
  pendingWithdrawals: number;
  pendingKyc: number;
  pendingBets: number;
  suspendedUsers: number;
};

export default function AdminDashboard() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [period, setPeriod] = useState("today");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<PendingCounts>({
    pendingWithdrawals: 0,
    pendingKyc: 0,
    pendingBets: 0,
    suspendedUsers: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (p: string, showLoader = true) => {
    if (showLoader) setLoading(true);
    else setRefreshing(true);
    try {
      const [revenue, withdrawals, bets, users] = await Promise.all([
        api.get<RevenueData>(`/api/admin/revenue?period=${p}`),
        api.get<{ total: number }>("/api/admin/withdrawals?status=pending&limit=1").catch(() => ({ total: 0 })),
        api.get<{ total: number }>("/api/admin/bets?status=pending&limit=1").catch(() => ({ total: 0 })),
        api.get<{ total: number }>("/api/admin/users?status=suspended&limit=1").catch(() => ({ total: 0 })),
      ]);
      setData(revenue);
      setPending({
        pendingWithdrawals: withdrawals.total || 0,
        pendingKyc: 0,
        pendingBets: bets.total || 0,
        suspendedUsers: users.total || 0,
      });
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData(period);
  }, [period]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => fetchData(period, false), 30000);
    return () => clearInterval(interval);
  }, [period]);

  const o = data?.overview;

  return (
    <div className="px-3 sm:px-4 lg:px-8 py-4 sm:py-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-[11px] text-[#5a6485]">Real-time platform overview & analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchData(period, false)}
            disabled={refreshing}
            className="p-2 text-[#8b95b8] hover:text-[#00d46e] transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
          <div className="flex gap-0.5 bg-[#1c2033] rounded-lg p-0.5 border border-[#2a3050]">
            {["today", "week", "month", "year"].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-md text-[11px] sm:text-xs font-medium capitalize transition-all ${
                  period === p ? "bg-[#00d46e] text-white" : "text-[#8b95b8] hover:text-white"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#00d46e]" />
        </div>
      ) : o ? (
        <>
          {/* Pending Actions Banner */}
          {(pending.pendingWithdrawals > 0 || pending.pendingBets > 0) && (
            <div className="bg-[#ffc107]/5 border border-[#ffc107]/20 rounded-xl p-3 sm:p-4 mb-5">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-[#ffc107]" />
                <span className="text-xs font-bold text-[#ffc107]">Requires Your Attention</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {pending.pendingWithdrawals > 0 && (
                  <Link href="/admin/withdrawals" className="flex items-center gap-2 bg-[#1c2033] border border-[#2a3050] rounded-lg px-3 py-2 hover:border-[#ffc107]/30 transition-all">
                    <ArrowUpCircle className="w-3.5 h-3.5 text-[#3b82f6]" />
                    <span className="text-xs text-white font-medium">{pending.pendingWithdrawals} pending withdrawals</span>
                    <ChevronRight className="w-3 h-3 text-[#5a6485]" />
                  </Link>
                )}
                {pending.pendingBets > 0 && (
                  <Link href="/admin/bets" className="flex items-center gap-2 bg-[#1c2033] border border-[#2a3050] rounded-lg px-3 py-2 hover:border-[#ffc107]/30 transition-all">
                    <Receipt className="w-3.5 h-3.5 text-[#8b5cf6]" />
                    <span className="text-xs text-white font-medium">{pending.pendingBets} pending bets</span>
                    <ChevronRight className="w-3 h-3 text-[#5a6485]" />
                  </Link>
                )}
                {pending.suspendedUsers > 0 && (
                  <Link href="/admin/users?status=suspended" className="flex items-center gap-2 bg-[#1c2033] border border-[#2a3050] rounded-lg px-3 py-2 hover:border-[#ffc107]/30 transition-all">
                    <Ban className="w-3.5 h-3.5 text-[#ff4757]" />
                    <span className="text-xs text-white font-medium">{pending.suspendedUsers} suspended users</span>
                    <ChevronRight className="w-3 h-3 text-[#5a6485]" />
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Main Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-5">
            <StatCard
              icon={<Users className="w-4 h-4" />}
              label="Total Users"
              value={o.totalUsers.toLocaleString()}
              sub={`+${o.newUsers} new`}
              color="text-[#3b82f6]"
              bg="bg-[#3b82f6]/10"
            />
            <StatCard
              icon={<Receipt className="w-4 h-4" />}
              label="Total Bets"
              value={o.totalBets.toLocaleString()}
              sub={`${o.pendingBets} pending`}
              color="text-[#8b5cf6]"
              bg="bg-[#8b5cf6]/10"
            />
            <StatCard
              icon={<DollarSign className="w-4 h-4" />}
              label="GGR"
              value={`GHS ${o.ggr.toFixed(2)}`}
              sub="Gross gaming revenue"
              color="text-[#00d46e]"
              bg="bg-[#00d46e]/10"
            />
            <StatCard
              icon={<TrendingUp className="w-4 h-4" />}
              label="Net Revenue"
              value={`GHS ${o.netRevenue.toFixed(2)}`}
              sub="Deposits - Withdrawals"
              color={o.netRevenue >= 0 ? "text-[#00d46e]" : "text-[#ff4757]"}
              bg={o.netRevenue >= 0 ? "bg-[#00d46e]/10" : "bg-[#ff4757]/10"}
            />
          </div>

          {/* Financial Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mb-5">
            <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ArrowDownCircle className="w-4 h-4 text-[#00d46e]" />
                  <h3 className="text-xs sm:text-sm font-semibold text-white">Deposits</h3>
                </div>
                <Link href="/admin/deposits" className="text-[10px] text-[#5a6485] hover:text-[#00d46e] transition-colors">
                  View All
                </Link>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-[#00d46e]">GHS {o.totalDeposits.toFixed(2)}</p>
              <p className="text-[11px] text-[#5a6485] mt-1">{o.depositCount} transactions</p>
            </div>
            <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ArrowUpCircle className="w-4 h-4 text-[#3b82f6]" />
                  <h3 className="text-xs sm:text-sm font-semibold text-white">Withdrawals</h3>
                </div>
                <Link href="/admin/withdrawals" className="text-[10px] text-[#5a6485] hover:text-[#00d46e] transition-colors">
                  View All
                </Link>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-[#3b82f6]">GHS {o.totalWithdrawals.toFixed(2)}</p>
              <p className="text-[11px] text-[#5a6485] mt-1">{o.withdrawalCount} transactions</p>
            </div>
            <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#ffc107]" />
                  <h3 className="text-xs sm:text-sm font-semibold text-white">Betting Volume</h3>
                </div>
                <Link href="/admin/bets" className="text-[10px] text-[#5a6485] hover:text-[#00d46e] transition-colors">
                  View All
                </Link>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-[#ffc107]">GHS {o.totalStaked.toFixed(2)}</p>
              <p className="text-[11px] text-[#5a6485] mt-1">Avg stake: GHS {o.avgStake.toFixed(2)}</p>
            </div>
          </div>

          {/* Quick Actions + Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
            {/* Quick Actions */}
            <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-4 sm:p-5">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#00d46e]" />
                Quick Actions
              </h3>
              <div className="space-y-2">
                <QuickAction href="/admin/users" icon={<UserPlus className="w-4 h-4" />} label="Manage Users" count={o.totalUsers} color="text-[#3b82f6]" />
                <QuickAction href="/admin/bets" icon={<Receipt className="w-4 h-4" />} label="Settle Bets" count={o.pendingBets} color="text-[#8b5cf6]" badge />
                <QuickAction href="/admin/withdrawals" icon={<Wallet className="w-4 h-4" />} label="Process Withdrawals" count={pending.pendingWithdrawals} color="text-[#ffc107]" badge />
                <QuickAction href="/admin/kyc" icon={<ShieldCheck className="w-4 h-4" />} label="Review KYC" count={pending.pendingKyc} color="text-[#06b6d4]" badge />
                <QuickAction href="/admin/revenue" icon={<BarChart3 className="w-4 h-4" />} label="Revenue Reports" color="text-[#00d46e]" />
                <QuickAction href="/admin/settings" icon={<Activity className="w-4 h-4" />} label="Platform Settings" color="text-[#8b95b8]" />
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="lg:col-span-2 bg-[#1c2033] border border-[#2a3050] rounded-xl p-4 sm:p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#8b5cf6]" />
                  Recent Transactions
                </h3>
                <Link href="/admin/deposits" className="text-[11px] text-[#5a6485] hover:text-[#00d46e] transition-colors">
                  View All
                </Link>
              </div>
              <div className="space-y-1.5 overflow-y-auto max-h-[320px]">
                {data?.recentTransactions && data.recentTransactions.length > 0 ? (
                  data.recentTransactions.map((tx) => (
                    <div key={tx._id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#0f1118] transition-all">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        tx.type === "deposit" ? "bg-[#00d46e]/10" : "bg-[#3b82f6]/10"
                      }`}>
                        {tx.type === "deposit" ? (
                          <ArrowDownCircle className="w-4 h-4 text-[#00d46e]" />
                        ) : (
                          <ArrowUpCircle className="w-4 h-4 text-[#3b82f6]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">
                          {tx.userId?.firstName || "Unknown"} {tx.userId?.lastName || ""}
                        </p>
                        <p className="text-[10px] text-[#5a6485] capitalize">{tx.type}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-xs font-bold ${tx.type === "deposit" ? "text-[#00d46e]" : "text-[#3b82f6]"}`}>
                          {tx.type === "deposit" ? "+" : "-"}GHS {tx.amount.toFixed(2)}
                        </p>
                        <StatusBadge status={tx.status} />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#5a6485] text-center py-8">No transactions yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-5">
            <MiniStat label="Total Staked" value={`GHS ${o.totalStaked.toFixed(2)}`} />
            <MiniStat label="Total Payouts" value={`GHS ${o.totalPayout.toFixed(2)}`} />
            <MiniStat label="Pending Bets" value={String(o.pendingBets)} highlight />
            <MiniStat label="Avg Stake" value={`GHS ${o.avgStake.toFixed(2)}`} />
          </div>
        </>
      ) : (
        <p className="text-sm text-[#5a6485] text-center py-20">Failed to load data</p>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, sub, color, bg }: {
  icon: React.ReactNode; label: string; value: string; sub: string; color: string; bg: string;
}) {
  return (
    <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-3 sm:p-4">
      <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center ${color} mb-2`}>
        {icon}
      </div>
      <p className="text-[10px] text-[#5a6485] mb-0.5">{label}</p>
      <p className={`text-base sm:text-lg font-bold ${color} truncate`}>{value}</p>
      <p className="text-[10px] text-[#5a6485] mt-0.5">{sub}</p>
    </div>
  );
}

function QuickAction({ href, icon, label, count, color, badge }: {
  href: string; icon: React.ReactNode; label: string; count?: number; color: string; badge?: boolean;
}) {
  return (
    <Link href={href} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#0f1118] transition-all group">
      <div className={`${color}`}>{icon}</div>
      <span className="flex-1 text-xs font-medium text-[#8b95b8] group-hover:text-white transition-colors">{label}</span>
      {count !== undefined && count > 0 && badge ? (
        <span className="text-[10px] font-bold bg-[#ff4757] text-white px-1.5 py-0.5 rounded-full min-w-[20px] text-center">{count}</span>
      ) : count !== undefined && count > 0 ? (
        <span className="text-[10px] text-[#5a6485]">{count}</span>
      ) : null}
      <ChevronRight className="w-3 h-3 text-[#5a6485] group-hover:text-white transition-colors" />
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { icon: React.ReactNode; cls: string }> = {
    success: { icon: <CheckCircle className="w-2.5 h-2.5" />, cls: "text-[#00d46e] bg-[#00d46e]/10" },
    pending: { icon: <Clock className="w-2.5 h-2.5" />, cls: "text-[#ffc107] bg-[#ffc107]/10" },
    failed: { icon: <XCircle className="w-2.5 h-2.5" />, cls: "text-[#ff4757] bg-[#ff4757]/10" },
  };
  const s = styles[status] || styles.pending;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded ${s.cls}`}>
      {s.icon}
      {status}
    </span>
  );
}

function MiniStat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl px-3 sm:px-4 py-2.5 sm:py-3">
      <p className="text-[10px] text-[#5a6485]">{label}</p>
      <p className={`text-xs sm:text-sm font-bold ${highlight ? "text-[#ffc107]" : "text-white"}`}>{value}</p>
    </div>
  );
}
