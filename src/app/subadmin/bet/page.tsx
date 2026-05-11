"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Receipt,
  Zap,
  ChevronRight,
  Wallet,
  CreditCard,
} from "lucide-react";
import { useSession } from "@/store/session";

export default function SubadminBetPage() {
  const router = useRouter();
  const { user, loading } = useSession();

  useEffect(() => {
    if (!loading && user) {
      // Redirect to sports betting after a short pause so user sees the splash
      const t = setTimeout(() => router.push("/sports"), 800);
      return () => clearTimeout(t);
    }
  }, [loading, user, router]);

  return (
    <div className="px-3 sm:px-4 lg:px-8 py-10 max-w-md mx-auto text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#8b5cf6]/15 flex items-center justify-center mx-auto mb-4">
        <Receipt className="w-8 h-8 text-[#8b5cf6]" />
      </div>
      <h2 className="text-lg font-bold text-white mb-1">
        Opening the betting interface…
      </h2>
      <p className="text-xs text-[#8b95b8] mb-6">
        Sub-admins can place bets just like any user.
      </p>

      {user && (
        <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-4 mb-4 text-left">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#5a6485] flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5" /> Betting balance
            </span>
            <span className="text-sm font-bold text-[#00d46e]">
              GHS {user.balance.toFixed(2)}
            </span>
          </div>
          <Link
            href="/subadmin/credit"
            className="text-[11px] text-[#3b82f6] flex items-center gap-1 hover:underline"
          >
            <CreditCard className="w-3 h-3" /> Top up your account
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Link
          href="/sports"
          className="gradient-green text-white font-bold text-sm px-6 py-3 rounded-xl flex items-center justify-center gap-2"
        >
          <Zap className="w-4 h-4" /> Go to Sports
        </Link>
        <Link
          href="/live"
          className="bg-[#1c2033] border border-[#2a3050] text-[#8b95b8] text-sm px-6 py-3 rounded-xl flex items-center justify-center gap-2 hover:text-white"
        >
          Live Matches <ChevronRight className="w-4 h-4" />
        </Link>
        <Link
          href="/casino"
          className="bg-[#1c2033] border border-[#2a3050] text-[#8b95b8] text-sm px-6 py-3 rounded-xl flex items-center justify-center gap-2 hover:text-white"
        >
          Casino <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {loading && (
        <div className="mt-6 flex justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-[#5a6485]" />
        </div>
      )}
    </div>
  );
}
