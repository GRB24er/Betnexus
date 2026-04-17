"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Wallet,
  History,
  Settings,
  Shield,
  LogOut,
  ChevronRight,
  ArrowDownCircle,
  ArrowUpCircle,
  Trophy,
  TrendingUp,
  Copy,
  Edit3,
  Loader2,
} from "lucide-react";
import { useSession, sessionStore } from "@/store/session";
import { api } from "@/lib/api";

const menuItems = [
  { href: "/deposit", label: "Deposit Funds", icon: ArrowDownCircle, color: "text-[#00d46e]", desc: "Add money to your account" },
  { href: "/withdraw", label: "Withdraw Funds", icon: ArrowUpCircle, color: "text-[#3b82f6]", desc: "Cash out your winnings" },
  { href: "/account/history", label: "Bet History", icon: History, color: "text-[#8b5cf6]", desc: "View all past bets and transactions" },
  { href: "/account/settings", label: "Account Settings", icon: Settings, color: "text-[#ffc107]", desc: "Manage your profile and preferences" },
  { href: "/responsible-gaming", label: "Responsible Gaming", icon: Shield, color: "text-[#06b6d4]", desc: "Set limits and self-exclusion" },
];

type RecentBet = {
  _id: string;
  selections: { match: string; selection: string; odds: number }[];
  stake: number;
  status: string;
  payout: number;
};

export default function AccountPage() {
  const router = useRouter();
  const { user, loading } = useSession();
  const [recentBets, setRecentBets] = useState<RecentBet[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    api
      .get<{ bets: RecentBet[] }>("/api/bets/history?limit=4")
      .then((res) => setRecentBets(res.bets))
      .catch(() => {});
  }, [user]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#00d46e]" />
      </div>
    );
  }

  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  const winRate =
    user.totalWagered > 0
      ? ((user.totalWon / user.totalWagered) * 100).toFixed(1)
      : "0.0";

  const handleLogout = async () => {
    await sessionStore.logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-[#8b5cf6]/10 via-[#161925] to-[#3b82f6]/10 border-b border-[#2a3050]">
        <div className="px-4 lg:px-6 py-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-[#00d46e] to-[#00b85c] rounded-full flex items-center justify-center text-white text-xl font-bold">
              {initials}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white">
                  {user.firstName} {user.lastName}
                </h1>
                {user.kycVerified && (
                  <span className="text-[9px] font-bold bg-[#ffc107]/20 text-[#ffc107] px-1.5 py-0.5 rounded">
                    VIP
                  </span>
                )}
              </div>
              <p className="text-xs text-[#5a6485]">{user.email}</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-[10px] text-[#5a6485] font-mono">
                  ID: {user._id.slice(-8).toUpperCase()}
                </span>
                <button
                  className="text-[#5a6485] hover:text-white"
                  onClick={() => navigator.clipboard.writeText(user._id)}
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>
            <Link href="/account/settings" className="p-2 text-[#5a6485] hover:text-white transition-colors">
              <Edit3 className="w-5 h-5" />
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <div className="bg-[#1c2033]/80 border border-[#2a3050] rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="w-3.5 h-3.5 text-[#00d46e]" />
                <span className="text-[10px] text-[#5a6485]">Balance</span>
              </div>
              <p className="text-lg font-bold text-[#00d46e]">
                {user.currency} {user.balance.toFixed(2)}
              </p>
            </div>
            <div className="bg-[#1c2033]/80 border border-[#2a3050] rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="w-3.5 h-3.5 text-[#ffc107]" />
                <span className="text-[10px] text-[#5a6485]">Total Won</span>
              </div>
              <p className="text-lg font-bold text-[#ffc107]">
                {user.currency} {user.totalWon.toFixed(2)}
              </p>
            </div>
            <div className="bg-[#1c2033]/80 border border-[#2a3050] rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-[#3b82f6]" />
                <span className="text-[10px] text-[#5a6485]">Win Rate</span>
              </div>
              <p className="text-lg font-bold text-[#3b82f6]">{winRate}%</p>
            </div>
            <div className="bg-[#1c2033]/80 border border-[#2a3050] rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <History className="w-3.5 h-3.5 text-[#8b5cf6]" />
                <span className="text-[10px] text-[#5a6485]">Deposited</span>
              </div>
              <p className="text-lg font-bold text-[#8b5cf6]">
                {user.currency} {user.totalDeposited.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-6 py-6 max-w-3xl">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <Link href="/deposit" className="gradient-green text-white font-semibold text-sm py-3 rounded-xl text-center hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
            <ArrowDownCircle className="w-4 h-4" /> Deposit
          </Link>
          <Link href="/withdraw" className="bg-[#1c2033] border border-[#2a3050] text-white font-semibold text-sm py-3 rounded-xl text-center hover:bg-[#232840] transition-colors flex items-center justify-center gap-2">
            <ArrowUpCircle className="w-4 h-4" /> Withdraw
          </Link>
        </div>

        {/* Menu Items */}
        <div className="space-y-2 mb-8">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-4 bg-[#1c2033] border border-[#2a3050] rounded-xl px-4 py-3.5 hover:border-[#3b82f6]/30 transition-all group"
            >
              <div className={`w-10 h-10 bg-[#0f1118] rounded-lg flex items-center justify-center ${item.color}`}>
                <item.icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white group-hover:text-[#00d46e] transition-colors">{item.label}</p>
                <p className="text-[11px] text-[#5a6485]">{item.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-[#5a6485] group-hover:text-white transition-colors" />
            </Link>
          ))}
        </div>

        {/* Recent Bets */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-white">Recent Bets</h2>
            <Link href="/account/history" className="text-xs text-[#00d46e] hover:underline">View All</Link>
          </div>
          <div className="space-y-2">
            {recentBets.length === 0 && (
              <p className="text-xs text-[#5a6485] py-4 text-center">
                No bets yet. Place your first bet!
              </p>
            )}
            {recentBets.map((bet) => {
              const sel = bet.selections[0];
              return (
                <div key={bet._id} className="bg-[#1c2033] border border-[#2a3050] rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    bet.status === "won" ? "bg-[#00d46e]" : bet.status === "lost" ? "bg-[#ff4757]" : "bg-[#ffc107] live-pulse"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{sel?.match}</p>
                    <p className="text-[11px] text-[#5a6485]">
                      {sel?.selection} @ {sel?.odds.toFixed(2)}
                      {bet.selections.length > 1 && ` +${bet.selections.length - 1} more`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#5a6485]">
                      {user.currency} {bet.stake.toFixed(2)}
                    </p>
                    <p className={`text-xs font-bold ${
                      bet.status === "won" || bet.status === "cashed_out"
                        ? "text-[#00d46e]"
                        : bet.status === "lost"
                        ? "text-[#ff4757]"
                        : "text-[#ffc107]"
                    }`}>
                      {bet.status === "won" || bet.status === "cashed_out"
                        ? `+${user.currency} ${bet.payout.toFixed(2)}`
                        : bet.status === "lost"
                        ? "Lost"
                        : "Pending"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sign Out */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 text-[#ff4757] hover:text-[#ff6b6b] text-sm font-medium transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
