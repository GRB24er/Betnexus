"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

type AgentDetail = {
  agent: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    referralCode: string;
    status: string;
    createdAt: string;
    lastLoginAt?: string;
  };
  earnings: {
    commissionPercent: number;
    referredUsersCount: number;
    total: { deposits: number; depositsCount: number };
    today: { deposits: number };
    thisWeek: { deposits: number };
    thisMonth: { deposits: number };
    subAdminPayout: { total: number; today: number; thisWeek: number; thisMonth: number };
    superAdminPayout: { total: number; today: number; thisWeek: number; thisMonth: number };
  };
  referredUsers: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    balance: number;
    totalDeposited: number;
    totalWagered: number;
    totalWon: number;
    kycStatus: string;
    status: string;
    createdAt: string;
  }>;
  recentBets: Array<{
    _id: string;
    reference: string;
    stake: number;
    status: string;
    payout?: number;
    currency: string;
    createdAt: string;
    userId: { firstName: string; lastName: string; email: string } | null;
  }>;
};

export default function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<AgentDetail | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<AgentDetail>(`/api/admin/agents/${id}`)
      .then((d) => {
        if (cancelled) return;
        setData(d);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#00d46e]" />
      </div>
    );
  }

  const { agent, earnings, referredUsers, recentBets } = data;

  return (
    <div className="px-4 lg:px-8 py-6">
      <Link
        href="/admin/agents"
        className="inline-flex items-center gap-2 text-xs text-[#8b95b8] hover:text-white mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> All agents
      </Link>

      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">
          {agent.firstName} {agent.lastName}
        </h1>
        <p className="text-xs text-[#5a6485]">
          {agent.email} · Code: <code className="text-[#00d46e]">{agent.referralCode}</code> · Joined{" "}
          {new Date(agent.createdAt).toLocaleDateString()}
        </p>
      </div>

      <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-5 mb-4">
        <h3 className="text-[11px] uppercase tracking-wide text-[#8b95b8] mb-3">
          Deposits from referred users (commission base)
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <PayoutRow label="Today" value={earnings.today.deposits} />
          <PayoutRow label="This Week" value={earnings.thisWeek.deposits} />
          <PayoutRow label="This Month" value={earnings.thisMonth.deposits} />
          <PayoutRow label="All Time" value={earnings.total.deposits} bold />
        </div>
        <p className="text-[10px] text-[#5a6485] mt-3">
          {earnings.total.depositsCount} successful deposits in total.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-[#1c2033] border border-[#3b82f6]/30 rounded-xl p-5">
          <h3 className="text-[11px] uppercase tracking-wide text-[#3b82f6] mb-3">
            Owed to Agent ({earnings.commissionPercent}% of deposits)
          </h3>
          <PayoutRow label="Today" value={earnings.subAdminPayout.today} />
          <PayoutRow label="This Week" value={earnings.subAdminPayout.thisWeek} />
          <PayoutRow label="This Month" value={earnings.subAdminPayout.thisMonth} />
          <PayoutRow label="All Time" value={earnings.subAdminPayout.total} bold />
        </div>

        <div className="bg-[#1c2033] border border-[#00d46e]/30 rounded-xl p-5">
          <h3 className="text-[11px] uppercase tracking-wide text-[#00d46e] mb-3">
            Platform Retained ({100 - earnings.commissionPercent}% of deposits)
          </h3>
          <PayoutRow label="Today" value={earnings.superAdminPayout.today} />
          <PayoutRow label="This Week" value={earnings.superAdminPayout.thisWeek} />
          <PayoutRow label="This Month" value={earnings.superAdminPayout.thisMonth} />
          <PayoutRow label="All Time" value={earnings.superAdminPayout.total} bold />
        </div>
      </div>

      <h2 className="text-sm font-semibold text-white mb-2">
        Referred Users ({earnings.referredUsersCount})
      </h2>
      <div className="overflow-x-auto bg-[#1c2033] border border-[#2a3050] rounded-xl mb-6">
        <table className="w-full text-sm">
          <thead className="bg-[#161925] text-[11px] text-[#5a6485] uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3">User</th>
              <th className="text-right px-4 py-3">Balance</th>
              <th className="text-right px-4 py-3">Deposited</th>
              <th className="text-right px-4 py-3">Wagered</th>
              <th className="text-right px-4 py-3">Won</th>
              <th className="text-left px-4 py-3">KYC</th>
              <th className="text-left px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2a3050]">
            {referredUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-[#5a6485]">
                  No referred users yet.
                </td>
              </tr>
            ) : (
              referredUsers.map((u) => (
                <tr key={u._id} className="text-white">
                  <td className="px-4 py-3">
                    <p className="font-medium">
                      {u.firstName} {u.lastName}
                    </p>
                    <p className="text-[11px] text-[#5a6485]">{u.email}</p>
                  </td>
                  <td className="px-4 py-3 text-right">{u.balance.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">{u.totalDeposited.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">{u.totalWagered.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">{u.totalWon.toFixed(2)}</td>
                  <td className="px-4 py-3 text-xs text-[#8b95b8]">{u.kycStatus}</td>
                  <td className="px-4 py-3 text-xs text-[#8b95b8]">{u.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h2 className="text-sm font-semibold text-white mb-2">Recent Bets</h2>
      <div className="space-y-2">
        {recentBets.length === 0 ? (
          <p className="text-sm text-[#5a6485]">No bets yet.</p>
        ) : (
          recentBets.map((b) => (
            <div
              key={b._id}
              className="bg-[#1c2033] border border-[#2a3050] rounded-lg px-4 py-2 flex items-center justify-between text-sm"
            >
              <div>
                <p className="text-white text-xs">
                  {b.userId
                    ? `${b.userId.firstName} ${b.userId.lastName}`
                    : "Unknown"}{" "}
                  · {b.reference}
                </p>
                <p className="text-[10px] text-[#5a6485]">
                  {new Date(b.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-white text-xs">
                  Stake {b.currency} {b.stake.toFixed(2)}
                </p>
                <p className="text-[10px] text-[#8b95b8]">{b.status}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function PayoutRow({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-[#8b95b8]">{label}</span>
      <span className={`text-white ${bold ? "font-bold text-base" : ""}`}>
        {value.toFixed(2)}
      </span>
    </div>
  );
}
