"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2,
  CreditCard,
  Wallet,
  Check,
  ArrowLeft,
  Coins,
} from "lucide-react";
import { api } from "@/lib/api";
import { useSession, sessionStore } from "@/store/session";

export default function SubadminCreditPage() {
  const { user } = useSession();
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState<"commission" | "external">("commission");
  const [available, setAvailable] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ newBalance: number; reference: string } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ stats: { availableForPayout: number } }>(
        "/api/subadmin/dashboard"
      )
      .then((res) => setAvailable(res.stats.availableForPayout))
      .catch(() => {});
  }, []);

  const submit = async () => {
    setError(null);
    const a = parseFloat(amount);
    if (!a || a <= 0) return setError("Enter a valid amount");
    if (source === "commission" && a > available) {
      return setError(
        `Exceeds available commission (GHS ${available.toFixed(2)})`
      );
    }
    setSubmitting(true);
    try {
      const res = await api.post<{ newBalance: number; reference: string }>(
        "/api/subadmin/credit",
        { amount: a, source }
      );
      setDone(res);
      sessionStore.setBalance(res.newBalance);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="px-3 sm:px-4 lg:px-8 py-12 max-w-md mx-auto text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#00d46e]/15 flex items-center justify-center mx-auto mb-5">
          <Check className="w-8 h-8 text-[#00d46e]" />
        </div>
        <h2 className="text-lg font-bold text-white mb-2">
          Account credited
        </h2>
        <p className="text-xs text-[#8b95b8] mb-1">Reference {done.reference}</p>
        <p className="text-sm text-[#5a6485] mb-6">
          New balance:{" "}
          <span className="text-[#00d46e] font-bold">
            GHS {done.newBalance.toFixed(2)}
          </span>
        </p>
        <div className="flex flex-col gap-2">
          <Link
            href="/subadmin/bet"
            className="gradient-green text-white text-sm font-bold px-6 py-3 rounded-xl"
          >
            Place a Bet
          </Link>
          <Link
            href="/subadmin"
            className="bg-[#1c2033] border border-[#2a3050] text-[#8b95b8] text-sm px-6 py-3 rounded-xl"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-4 lg:px-8 py-4 sm:py-6 max-w-md mx-auto">
      <Link
        href="/subadmin"
        className="flex items-center gap-1 text-xs text-[#5a6485] hover:text-white mb-4"
      >
        <ArrowLeft className="w-3 h-3" /> Dashboard
      </Link>

      <h1 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
        <CreditCard className="w-5 h-5 text-[#3b82f6]" />
        Credit My Account
      </h1>
      <p className="text-[11px] text-[#5a6485] mb-5">
        Move funds into your betting wallet to place bets.
      </p>

      <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-4 mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-[#5a6485] flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5" /> Current Balance
          </span>
          <span className="text-sm font-bold text-[#00d46e]">
            GHS {user?.balance.toFixed(2) || "0.00"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#5a6485] flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5" /> Available Commission
          </span>
          <span className="text-sm font-bold text-[#ffc107]">
            GHS {available.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-4 mb-3 space-y-3">
        <div>
          <label className="text-[10px] text-[#5a6485] uppercase mb-1 block">
            Source
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setSource("commission")}
              className={`text-xs px-3 py-2.5 rounded-lg border font-medium ${
                source === "commission"
                  ? "bg-[#00d46e]/10 border-[#00d46e] text-[#00d46e]"
                  : "bg-[#0f1118] border-[#2a3050] text-[#8b95b8]"
              }`}
            >
              From Commission
            </button>
            <button
              onClick={() => setSource("external")}
              className={`text-xs px-3 py-2.5 rounded-lg border font-medium ${
                source === "external"
                  ? "bg-[#3b82f6]/10 border-[#3b82f6] text-[#3b82f6]"
                  : "bg-[#0f1118] border-[#2a3050] text-[#8b95b8]"
              }`}
            >
              External Top-up
            </button>
          </div>
          <p className="text-[10px] text-[#5a6485] mt-1.5">
            {source === "commission"
              ? "Deducts from your available commission."
              : "Recorded as external deposit; admin reviews."}
          </p>
        </div>

        <div>
          <label className="text-[10px] text-[#5a6485] uppercase mb-1 block">
            Amount (GHS)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-[#0f1118] border border-[#2a3050] rounded-lg px-3 py-3 text-base text-white focus:outline-none focus:border-[#00d46e]/50"
          />
        </div>
      </div>

      {error && (
        <div className="bg-[#ff4757]/10 border border-[#ff4757]/30 rounded-lg px-4 py-2 mb-3 text-xs text-[#ff4757]">
          {error}
        </div>
      )}

      <button
        onClick={submit}
        disabled={submitting || !amount || parseFloat(amount) <= 0}
        className="w-full gradient-green text-white font-bold text-sm py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {submitting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <CreditCard className="w-4 h-4" />
        )}
        Credit My Account
      </button>
    </div>
  );
}
