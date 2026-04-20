"use client";

import { useEffect, useState } from "react";
import {
  Users,
  DollarSign,
  Receipt,
  TrendingUp,
  ArrowUpCircle,
  ArrowDownCircle,
  ShieldCheck,
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
};

export default function AdminDashboard() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [period, setPeriod] = useState("today");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get<RevenueData>(`/api/admin/revenue?period=${period}`)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  const o = data?.overview;

  return (
    <div className="px-4 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-xs text-[#5a6485]">Platform overview & analytics</p>
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
          {/* Main Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
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

          {/* Financial */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-6">
            <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <ArrowDownCircle className="w-4 h-4 text-[#00d46e]" />
                <h3 className="text-sm font-semibold text-white">Deposits</h3>
              </div>
              <p className="text-2xl font-bold text-[#00d46e]">GHS {o.totalDeposits.toFixed(2)}</p>
              <p className="text-xs text-[#5a6485] mt-1">{o.depositCount} transactions</p>
            </div>
            <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <ArrowUpCircle className="w-4 h-4 text-[#3b82f6]" />
                <h3 className="text-sm font-semibold text-white">Withdrawals</h3>
              </div>
              <p className="text-2xl font-bold text-[#3b82f6]">GHS {o.totalWithdrawals.toFixed(2)}</p>
              <p className="text-xs text-[#5a6485] mt-1">{o.withdrawalCount} transactions</p>
            </div>
            <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="w-4 h-4 text-[#ffc107]" />
                <h3 className="text-sm font-semibold text-white">Betting Volume</h3>
              </div>
              <p className="text-2xl font-bold text-[#ffc107]">GHS {o.totalStaked.toFixed(2)}</p>
              <p className="text-xs text-[#5a6485] mt-1">Avg stake: GHS {o.avgStake.toFixed(2)}</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl px-4 py-3">
              <p className="text-[10px] text-[#5a6485]">Total Staked</p>
              <p className="text-sm font-bold text-white">GHS {o.totalStaked.toFixed(2)}</p>
            </div>
            <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl px-4 py-3">
              <p className="text-[10px] text-[#5a6485]">Total Payouts</p>
              <p className="text-sm font-bold text-white">GHS {o.totalPayout.toFixed(2)}</p>
            </div>
            <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl px-4 py-3">
              <p className="text-[10px] text-[#5a6485]">Pending Bets</p>
              <p className="text-sm font-bold text-[#ffc107]">{o.pendingBets}</p>
            </div>
            <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl px-4 py-3">
              <p className="text-[10px] text-[#5a6485]">Avg Stake</p>
              <p className="text-sm font-bold text-white">GHS {o.avgStake.toFixed(2)}</p>
            </div>
          </div>
        </>
      ) : (
        <p className="text-sm text-[#5a6485] text-center py-20">Failed to load data</p>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  color: string;
  bg: string;
}) {
  return (
    <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl px-4 py-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
      <p className="text-[10px] text-[#5a6485] mb-0.5">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-[10px] text-[#5a6485] mt-0.5">{sub}</p>
    </div>
  );
}
