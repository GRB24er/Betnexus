"use client";

import { useEffect, useState } from "react";
import {
  Users,
  TrendingUp,
  Calendar,
  DollarSign,
  Copy,
  Check,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";

type Stats = {
  referredUsersCount: number;
  commissionPercent: number;
  referralCode: string;
  earnings: { total: number; today: number; thisWeek: number; thisMonth: number };
  activity: {
    total: { betsCount: number; totalStaked: number };
    today: { betsCount: number; totalStaked: number };
    thisWeek: { betsCount: number; totalStaked: number };
    thisMonth: { betsCount: number; totalStaked: number };
  };
  currency: string;
};

export default function SubAdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get<Stats>("/api/subadmin/stats")
      .then((s) => {
        if (cancelled) return;
        setStats(s);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!stats) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#00d46e]" />
      </div>
    );
  }

  const referralLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/register?ref=${stats.referralCode}`
      : `/register?ref=${stats.referralCode}`;

  const onCopy = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const fmt = (n: number) =>
    `${stats.currency} ${n.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  return (
    <div className="px-4 lg:px-8 py-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Agent Dashboard</h1>
        <p className="text-xs text-[#5a6485]">
          Your earnings — {stats.commissionPercent}% commission on the GGR of your referred users.
        </p>
      </div>

      {/* Referral link card */}
      <div className="bg-gradient-to-br from-[#00d46e]/10 to-[#3b82f6]/10 border border-[#2a3050] rounded-xl p-5 mb-6">
        <p className="text-[11px] text-[#8b95b8] uppercase tracking-wide mb-2">
          Your referral link
        </p>
        <div className="flex items-center gap-2 bg-[#0f1118] border border-[#2a3050] rounded-lg px-3 py-2.5">
          <code className="flex-1 text-xs text-white truncate">{referralLink}</code>
          <button
            onClick={onCopy}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-[#00d46e]/20 text-[#00d46e] text-xs font-semibold hover:bg-[#00d46e]/30 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <p className="text-[10px] text-[#5a6485] mt-2">
          Share this link. Anyone signing up through it is tagged as your user, and you earn{" "}
          {stats.commissionPercent}% of the platform&apos;s revenue from their bets.
        </p>
      </div>

      {/* Earnings cards */}
      <h2 className="text-sm font-semibold text-white mb-3">My Earnings</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Today" value={fmt(stats.earnings.today)} icon={Calendar} accent="#00d46e" />
        <StatCard label="This Week" value={fmt(stats.earnings.thisWeek)} icon={TrendingUp} accent="#3b82f6" />
        <StatCard label="This Month" value={fmt(stats.earnings.thisMonth)} icon={DollarSign} accent="#f59e0b" />
        <StatCard label="All Time" value={fmt(stats.earnings.total)} icon={DollarSign} accent="#8b5cf6" />
      </div>

      {/* Activity */}
      <h2 className="text-sm font-semibold text-white mb-3">My Users&apos; Activity</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Referred Users"
          value={String(stats.referredUsersCount)}
          icon={Users}
          accent="#00d46e"
        />
        <StatCard
          label="Bets Today"
          value={String(stats.activity.today.betsCount)}
          icon={Receipt}
          accent="#3b82f6"
        />
        <StatCard
          label="Wagered (Month)"
          value={fmt(stats.activity.thisMonth.totalStaked)}
          icon={TrendingUp}
          accent="#f59e0b"
        />
        <StatCard
          label="Wagered (Total)"
          value={fmt(stats.activity.total.totalStaked)}
          icon={TrendingUp}
          accent="#8b5cf6"
        />
      </div>
    </div>
  );
}

function Receipt(props: React.SVGProps<SVGSVGElement>) {
  // tiny inline icon to avoid pulling another lucide import here
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2H4z" />
      <path d="M8 7h8M8 11h8M8 15h6" />
    </svg>
  );
}

function StatCard({
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
