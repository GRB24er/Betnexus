"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Users, DollarSign, TrendingUp, ExternalLink } from "lucide-react";
import { api } from "@/lib/api";

type Agent = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  referralCode: string;
  status: string;
  createdAt: string;
  referredUsersCount: number;
  deposits: { total: number; today: number; thisWeek: number; thisMonth: number };
  depositsCount: number;
  subAdminPayout: number;
  superAdminPayout: number;
};

type Summary = {
  totalAgents: number;
  totalReferredUsers: number;
  totalDeposits: number;
  agentsOwed: number;
  platformRetained: number;
};

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [percent, setPercent] = useState(60);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{
        agents: Agent[];
        summary: Summary;
        commissionPercent: number;
      }>("/api/admin/agents")
      .then((r) => {
        if (cancelled) return;
        setAgents(r.agents);
        setSummary(r.summary);
        setPercent(r.commissionPercent);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="px-4 lg:px-8 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Agents (Sub-admins)</h1>
        <p className="text-xs text-[#5a6485]">
          Commission split: <strong className="text-white">{percent}%</strong> agent /{" "}
          <strong className="text-white">{100 - percent}%</strong> platform — based on{" "}
          <strong className="text-white">total deposits</strong> made by each agent&apos;s referred users.
        </p>
      </div>

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          <SummaryCard label="Active Agents" value={String(summary.totalAgents)} icon={Users} accent="#3b82f6" />
          <SummaryCard
            label="Their Users"
            value={String(summary.totalReferredUsers)}
            icon={Users}
            accent="#00d46e"
          />
          <SummaryCard
            label="Total Deposits"
            value={summary.totalDeposits.toFixed(2)}
            icon={TrendingUp}
            accent="#f59e0b"
          />
          <SummaryCard
            label="Owed to Agents"
            value={summary.agentsOwed.toFixed(2)}
            icon={DollarSign}
            accent="#8b5cf6"
          />
          <SummaryCard
            label="Platform Kept"
            value={summary.platformRetained.toFixed(2)}
            icon={DollarSign}
            accent="#00d46e"
          />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-[#00d46e]" />
        </div>
      ) : agents.length === 0 ? (
        <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-8 text-center">
          <p className="text-sm text-[#8b95b8]">
            No sub-admins yet. Promote a user from{" "}
            <Link href="/admin/users" className="text-[#00d46e] underline">
              Users
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-[#1c2033] border border-[#2a3050] rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-[#161925] text-[11px] text-[#5a6485] uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3">Agent</th>
                <th className="text-left px-4 py-3">Code</th>
                <th className="text-right px-4 py-3">Users</th>
                <th className="text-right px-4 py-3">Deposits (Today)</th>
                <th className="text-right px-4 py-3">Deposits (Month)</th>
                <th className="text-right px-4 py-3">Deposits (Total)</th>
                <th className="text-right px-4 py-3 text-[#3b82f6]">Owed (Agent)</th>
                <th className="text-right px-4 py-3 text-[#00d46e]">Kept (You)</th>
                <th className="text-right px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a3050]">
              {agents.map((a) => (
                <tr key={a._id} className="text-white hover:bg-[#232840]">
                  <td className="px-4 py-3">
                    <p className="font-medium">
                      {a.firstName} {a.lastName}
                    </p>
                    <p className="text-[11px] text-[#5a6485]">{a.email}</p>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <code className="bg-[#0f1118] px-2 py-1 rounded text-[#00d46e]">
                      {a.referralCode}
                    </code>
                  </td>
                  <td className="px-4 py-3 text-right">{a.referredUsersCount}</td>
                  <td className="px-4 py-3 text-right">{a.deposits.today.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">{a.deposits.thisMonth.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{a.deposits.total.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-[#3b82f6] font-semibold">
                    {a.subAdminPayout.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right text-[#00d46e] font-semibold">
                    {a.superAdminPayout.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/agents/${a._id}`}
                      className="inline-flex items-center gap-1 text-xs text-[#3b82f6] hover:underline"
                    >
                      View <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  accent: string;
}) {
  return (
    <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-medium uppercase tracking-wide text-[#5a6485]">
          {label}
        </span>
        <Icon className="w-4 h-4" style={{ color: accent }} />
      </div>
      <p className="text-lg font-bold text-white">{value}</p>
    </div>
  );
}
