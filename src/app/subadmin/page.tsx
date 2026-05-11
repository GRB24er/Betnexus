"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2,
  Users,
  ArrowDownCircle,
  Receipt,
  Percent,
  Calendar,
  Wallet,
  Copy,
  Check,
  RefreshCw,
  TrendingUp,
  Banknote,
  CreditCard,
  ChevronRight,
} from "lucide-react";
import { api } from "@/lib/api";

type Dashboard = {
  subadmin: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    referralCode: string;
    commissionRate: number;
    payoutDay: number;
    nextPayoutDate?: string;
    balance: number;
  };
  stats: {
    referredCount: number;
    totalDeposits: number;
    totalStakes: number;
    commissionFromDeposits: number;
    commissionFromStakes: number;
    totalCommission: number;
    commissionPaidOut: number;
    availableForPayout: number;
  };
  referredUsers: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    totalDeposited: number;
    totalWagered: number;
    status: string;
    createdAt: string;
    lastLoginAt?: string;
  }>;
  recentDeposits: Array<{
    _id: string;
    userId?: { firstName?: string; lastName?: string; email?: string };
    amount: number;
    createdAt: string;
  }>;
  payouts: Array<{
    _id: string;
    amount: number;
    method: string;
    status: string;
    createdAt: string;
  }>;
};

export default function SubadminDashboard() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get<Dashboard>("/api/subadmin/dashboard");
      setData(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const referralLink =
    typeof window !== "undefined" && data
      ? `${window.location.origin}/register?ref=${data.subadmin.referralCode}`
      : "";

  const copy = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading || !data) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#00d46e]" />
      </div>
    );
  }

  const s = data.stats;

  return (
    <div className="px-3 sm:px-4 lg:px-8 py-4 sm:py-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white">
            Sub-Admin Dashboard
          </h1>
          <p className="text-[11px] text-[#5a6485]">
            Hi {data.subadmin.firstName} · Commission rate {data.subadmin.commissionRate}%
          </p>
        </div>
        <button
          onClick={fetchData}
          className="p-2 text-[#8b95b8] hover:text-[#00d46e]"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Referral link card */}
      <div className="bg-gradient-to-r from-[#00d46e]/15 via-[#06b6d4]/10 to-[#8b5cf6]/10 border border-[#00d46e]/30 rounded-2xl p-4 sm:p-5 mb-5">
        <p className="text-[11px] text-[#8b95b8] uppercase tracking-wider mb-2">
          Your Personal Referral Link
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs font-mono text-white truncate bg-[#0f1118] border border-[#2a3050] rounded-lg px-3 py-2.5">
            {referralLink}
          </code>
          <button
            onClick={copy}
            className={`shrink-0 px-3 py-2.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
              copied
                ? "bg-[#00d46e]/20 text-[#00d46e]"
                : "bg-[#00d46e] text-white"
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3 h-3" /> Copied
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" /> Copy
              </>
            )}
          </button>
        </div>
        <p className="text-[10px] text-[#5a6485] mt-2">
          Share with friends — every deposit and stake earns you{" "}
          {data.subadmin.commissionRate}% commission.
        </p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-5">
        <StatCard
          icon={<Users className="w-4 h-4 text-[#3b82f6]" />}
          label="Referred Users"
          value={s.referredCount.toLocaleString()}
        />
        <StatCard
          icon={<ArrowDownCircle className="w-4 h-4 text-[#00d46e]" />}
          label="Total Deposits"
          value={`GHS ${s.totalDeposits.toFixed(2)}`}
        />
        <StatCard
          icon={<Receipt className="w-4 h-4 text-[#8b5cf6]" />}
          label="Total Stakes"
          value={`GHS ${s.totalStakes.toFixed(2)}`}
        />
        <StatCard
          icon={<TrendingUp className="w-4 h-4 text-[#ffc107]" />}
          label="Commission Earned"
          value={`GHS ${s.totalCommission.toFixed(2)}`}
          highlight
        />
      </div>

      {/* Commission breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-5">
        <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Percent className="w-4 h-4 text-[#06b6d4]" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Commission Split
            </h3>
          </div>
          <Row
            label="From deposits"
            value={`GHS ${s.commissionFromDeposits.toFixed(2)}`}
          />
          <Row
            label="From stakes"
            value={`GHS ${s.commissionFromStakes.toFixed(2)}`}
          />
          <Row label="Paid out" value={`GHS ${s.commissionPaidOut.toFixed(2)}`} />
          <div className="border-t border-[#2a3050] mt-2 pt-2">
            <Row
              label="Available now"
              value={`GHS ${s.availableForPayout.toFixed(2)}`}
              green
            />
          </div>
        </div>
        <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-[#ffc107]" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Next Payout
            </h3>
          </div>
          <p className="text-2xl font-bold text-white mb-1">
            {data.subadmin.nextPayoutDate
              ? new Date(data.subadmin.nextPayoutDate).toLocaleDateString(
                  "en-GB",
                  { day: "2-digit", month: "long", year: "numeric" }
                )
              : `Day ${data.subadmin.payoutDay} of each month`}
          </p>
          <p className="text-[11px] text-[#5a6485]">
            Set by your administrator
          </p>
          <Link
            href="/subadmin/payout"
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold gradient-green text-white px-3 py-2 rounded-lg"
          >
            <Banknote className="w-3.5 h-3.5" /> Request Payout Now
          </Link>
        </div>
        <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Wallet className="w-4 h-4 text-[#00d46e]" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Your Betting Wallet
            </h3>
          </div>
          <p className="text-2xl font-bold text-[#00d46e] mb-1">
            GHS {data.subadmin.balance.toFixed(2)}
          </p>
          <p className="text-[11px] text-[#5a6485]">
            Use to place bets like any user
          </p>
          <div className="flex gap-2 mt-3">
            <Link
              href="/subadmin/credit"
              className="flex-1 text-xs font-bold bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/30 px-3 py-2 rounded-lg flex items-center justify-center gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5" /> Credit
            </Link>
            <Link
              href="/subadmin/bet"
              className="flex-1 text-xs font-bold bg-[#8b5cf6]/10 text-[#8b5cf6] border border-[#8b5cf6]/30 px-3 py-2 rounded-lg flex items-center justify-center gap-1.5"
            >
              <Receipt className="w-3.5 h-3.5" /> Bet
            </Link>
          </div>
        </div>
      </div>

      {/* Referred users + recent deposits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#3b82f6]" /> Referred Users (
            {data.referredUsers.length})
          </h3>
          {data.referredUsers.length === 0 ? (
            <p className="text-xs text-[#5a6485] text-center py-6">
              Share your link to start earning
            </p>
          ) : (
            <div className="space-y-1.5 max-h-[380px] overflow-y-auto">
              {data.referredUsers.slice(0, 20).map((u) => (
                <div
                  key={u._id}
                  className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-[#0f1118]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-white truncate">
                      {u.firstName} {u.lastName}
                    </p>
                    <p className="text-[10px] text-[#5a6485] truncate">
                      {u.email}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-[#00d46e]">
                      GHS {u.totalDeposited.toFixed(2)}
                    </p>
                    <p className="text-[9px] text-[#5a6485]">deposited</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
            <ArrowDownCircle className="w-4 h-4 text-[#00d46e]" /> Recent Deposits
          </h3>
          {data.recentDeposits.length === 0 ? (
            <p className="text-xs text-[#5a6485] text-center py-6">
              No deposits yet
            </p>
          ) : (
            <div className="space-y-1.5 max-h-[380px] overflow-y-auto">
              {data.recentDeposits.map((d) => (
                <div
                  key={d._id}
                  className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-[#0f1118]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-white truncate">
                      {d.userId?.firstName} {d.userId?.lastName}
                    </p>
                    <p className="text-[10px] text-[#5a6485]">
                      {new Date(d.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-xs font-bold text-[#00d46e]">
                    +GHS {d.amount.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Payout history */}
      <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-4 mt-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Banknote className="w-4 h-4 text-[#ffc107]" /> My Payouts
          </h3>
          <Link
            href="/subadmin/payout"
            className="text-[10px] text-[#3b82f6] flex items-center gap-1"
          >
            Request new <ChevronRight className="w-2.5 h-2.5" />
          </Link>
        </div>
        {data.payouts.length === 0 ? (
          <p className="text-xs text-[#5a6485] text-center py-6">
            No payout requests yet
          </p>
        ) : (
          <div className="space-y-1.5">
            {data.payouts.map((p) => (
              <div
                key={p._id}
                className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-[#0f1118]"
              >
                <div>
                  <p className="text-xs font-medium text-white">
                    GHS {p.amount.toFixed(2)} via {p.method.replace("_", " ")}
                  </p>
                  <p className="text-[10px] text-[#5a6485]">
                    {new Date(p.createdAt).toLocaleString()}
                  </p>
                </div>
                <StatusPill status={p.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`bg-[#1c2033] border rounded-xl p-3 sm:p-4 ${
        highlight ? "border-[#ffc107]/30" : "border-[#2a3050]"
      }`}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon}
        <span className="text-[10px] text-[#5a6485] uppercase">{label}</span>
      </div>
      <p
        className={`text-base sm:text-lg font-bold ${
          highlight ? "text-[#ffc107]" : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  green,
}: {
  label: string;
  value: string;
  green?: boolean;
}) {
  return (
    <div className="flex justify-between text-xs py-1">
      <span className="text-[#5a6485]">{label}</span>
      <span className={`font-bold ${green ? "text-[#00d46e]" : "text-white"}`}>
        {value}
      </span>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-[#ffc107]/15 text-[#ffc107]",
    approved: "bg-[#3b82f6]/15 text-[#3b82f6]",
    paid: "bg-[#00d46e]/15 text-[#00d46e]",
    rejected: "bg-[#ff4757]/15 text-[#ff4757]",
  };
  return (
    <span
      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
        map[status] || "bg-[#2a3050] text-[#5a6485]"
      }`}
    >
      {status.toUpperCase()}
    </span>
  );
}
