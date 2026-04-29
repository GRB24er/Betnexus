"use client";

import { useEffect, useState } from "react";
import {
  DollarSign,
  TrendingUp,
  ArrowDownCircle,
  ArrowUpCircle,
  Receipt,
  Users,
  Loader2,
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
  recentTransactions?: {
    _id: string;
    type: string;
    amount: number;
    status: string;
    createdAt: string;
    userId?: { firstName: string; lastName: string; email: string };
  }[];
};

export default function AdminRevenuePage() {
  const [data, setData] = useState<Record<string, RevenueData | null>>({});
  const [period, setPeriod] = useState("month");

  useEffect(() => {
    if (data[period]) return;
    let cancelled = false;
    api
      .get<RevenueData>(`/api/admin/revenue?period=${period}`)
      .then((res) => {
        if (cancelled) return;
        setData((prev) => ({ ...prev, [period]: res }));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [period, data]);

  const loading = !data[period];

  const o = data[period]?.overview;
  const txns = data[period]?.recentTransactions || [];

  const margin = o && o.totalStaked > 0
    ? ((o.ggr / o.totalStaked) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="px-4 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Revenue & Analytics</h1>
          <p className="text-xs text-[#5a6485]">Financial performance overview</p>
        </div>
        <div className="flex gap-1 bg-[#1c2033] rounded-lg p-0.5 border border-[#2a3050]">
          {["today", "week", "month", "year"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${
                period === p ? "bg-[#00d46e] text-white" : "text-[#8b95b8] hover:text-white"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#00d46e]" />
        </div>
      ) : o ? (
        <>
          {/* Key Revenue Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <MetricCard
              icon={<TrendingUp className="w-4 h-4" />}
              label="Gross Gaming Revenue"
              value={`GHS ${o.ggr.toFixed(2)}`}
              sub={`${margin}% margin`}
              color="text-[#00d46e]"
              bg="bg-[#00d46e]/10"
            />
            <MetricCard
              icon={<DollarSign className="w-4 h-4" />}
              label="Net Revenue"
              value={`GHS ${o.netRevenue.toFixed(2)}`}
              sub="Deposits - Withdrawals"
              color={o.netRevenue >= 0 ? "text-[#3b82f6]" : "text-[#ff4757]"}
              bg={o.netRevenue >= 0 ? "bg-[#3b82f6]/10" : "bg-[#ff4757]/10"}
            />
            <MetricCard
              icon={<ArrowDownCircle className="w-4 h-4" />}
              label="Total Deposits"
              value={`GHS ${o.totalDeposits.toFixed(2)}`}
              sub={`${o.depositCount} transactions`}
              color="text-[#00d46e]"
              bg="bg-[#00d46e]/10"
            />
            <MetricCard
              icon={<ArrowUpCircle className="w-4 h-4" />}
              label="Total Withdrawals"
              value={`GHS ${o.totalWithdrawals.toFixed(2)}`}
              sub={`${o.withdrawalCount} transactions`}
              color="text-[#ff4757]"
              bg="bg-[#ff4757]/10"
            />
          </div>

          {/* Betting Performance */}
          <h2 className="text-sm font-bold text-white mb-3">Betting Performance</h2>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
            <MiniCard label="Total Staked" value={`GHS ${o.totalStaked.toFixed(2)}`} />
            <MiniCard label="Total Payouts" value={`GHS ${o.totalPayout.toFixed(2)}`} />
            <MiniCard label="Total Bets" value={o.totalBets.toLocaleString()} />
            <MiniCard label="Pending Bets" value={String(o.pendingBets)} highlight />
            <MiniCard label="Avg Stake" value={`GHS ${o.avgStake.toFixed(2)}`} />
          </div>

          {/* User Stats */}
          <h2 className="text-sm font-bold text-white mb-3">User Stats</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-[#3b82f6]" />
                <span className="text-xs text-[#5a6485]">Total Users</span>
              </div>
              <p className="text-2xl font-bold text-white">{o.totalUsers.toLocaleString()}</p>
            </div>
            <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-[#00d46e]" />
                <span className="text-xs text-[#5a6485]">New Users ({period})</span>
              </div>
              <p className="text-2xl font-bold text-[#00d46e]">+{o.newUsers}</p>
            </div>
            <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Receipt className="w-4 h-4 text-[#8b5cf6]" />
                <span className="text-xs text-[#5a6485]">Avg Revenue/User</span>
              </div>
              <p className="text-2xl font-bold text-[#8b5cf6]">
                GHS {o.totalUsers > 0 ? (o.ggr / o.totalUsers).toFixed(2) : "0.00"}
              </p>
            </div>
          </div>

          {/* Recent Transactions */}
          {txns.length > 0 && (
            <>
              <h2 className="text-sm font-bold text-white mb-3">Recent Transactions</h2>
              <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="border-b border-[#2a3050]">
                      <tr className="text-[10px] text-[#5a6485] uppercase">
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">User</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a3050]">
                      {txns.map((tx) => (
                        <tr key={tx._id} className="hover:bg-[#232840] transition-colors">
                          <td className="px-4 py-2.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              tx.type === "deposit" ? "bg-[#00d46e]/20 text-[#00d46e]" :
                              tx.type === "withdrawal" ? "bg-[#3b82f6]/20 text-[#3b82f6]" :
                              "bg-[#8b5cf6]/20 text-[#8b5cf6]"
                            }`}>
                              {tx.type.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-[#8b95b8]">
                            {tx.userId ? `${tx.userId.firstName} ${tx.userId.lastName}` : "\u2014"}
                          </td>
                          <td className="px-4 py-2.5 text-sm font-semibold text-white">
                            GHS {tx.amount.toFixed(2)}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              tx.status === "success" ? "bg-[#00d46e]/20 text-[#00d46e]" :
                              tx.status === "pending" ? "bg-[#ffc107]/20 text-[#ffc107]" :
                              "bg-[#ff4757]/20 text-[#ff4757]"
                            }`}>
                              {tx.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-[11px] text-[#5a6485]">
                            {new Date(tx.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      ) : (
        <p className="text-sm text-[#5a6485] text-center py-20">Failed to load revenue data</p>
      )}
    </div>
  );
}

function MetricCard({
  icon, label, value, sub, color, bg,
}: {
  icon: React.ReactNode; label: string; value: string; sub: string; color: string; bg: string;
}) {
  return (
    <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl px-4 py-4">
      <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center ${color} mb-2`}>
        {icon}
      </div>
      <p className="text-[10px] text-[#5a6485] mb-0.5">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-[10px] text-[#5a6485] mt-0.5">{sub}</p>
    </div>
  );
}

function MiniCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl px-4 py-3">
      <p className="text-[10px] text-[#5a6485]">{label}</p>
      <p className={`text-sm font-bold ${highlight ? "text-[#ffc107]" : "text-white"}`}>{value}</p>
    </div>
  );
}
