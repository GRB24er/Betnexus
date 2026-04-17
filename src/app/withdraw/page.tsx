"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Wallet,
  ArrowLeft,
  Smartphone,
  Bitcoin,
  Shield,
  CheckCircle,
  AlertCircle,
  Clock,
  Loader2,
} from "lucide-react";
import { useSession, sessionStore } from "@/store/session";
import { api } from "@/lib/api";

const withdrawMethods = [
  {
    id: "mtn_momo",
    name: "MTN Mobile Money",
    icon: "📱",
    bgColor: "bg-yellow-500/10",
    minWithdraw: 5,
    maxWithdraw: 10000,
    fee: "Free",
    time: "Instant - 24hrs",
    currency: "GHS",
  },
  {
    id: "telecel_cash",
    name: "Telecel Cash",
    icon: "📲",
    bgColor: "bg-red-500/10",
    minWithdraw: 5,
    maxWithdraw: 10000,
    fee: "Free",
    time: "Instant - 24hrs",
    currency: "GHS",
  },
  {
    id: "btc",
    name: "Bitcoin (BTC)",
    icon: "₿",
    bgColor: "bg-orange-500/10",
    minWithdraw: 0.001,
    maxWithdraw: 5,
    fee: "Network fee",
    time: "10-60 min",
    currency: "BTC",
  },
  {
    id: "usdt_trc20",
    name: "Tether (USDT TRC-20)",
    icon: "💲",
    bgColor: "bg-green-500/10",
    minWithdraw: 10,
    maxWithdraw: 50000,
    fee: "1 USDT",
    time: "5-30 min",
    currency: "USDT",
  },
];

export default function WithdrawPage() {
  const router = useRouter();
  const { user, loading } = useSession();
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [destination, setDestination] = useState("");
  const [accountName, setAccountName] = useState("");
  const [step, setStep] = useState<"form" | "confirm" | "processing" | "success" | "failed">("form");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txRef, setTxRef] = useState<string | null>(null);

  const method = withdrawMethods.find((m) => m.id === selectedMethod);
  const isMobile = selectedMethod === "mtn_momo" || selectedMethod === "telecel_cash";
  const isCrypto = selectedMethod === "btc" || selectedMethod === "usdt_trc20";

  if (!loading && !user) {
    router.push("/login");
    return null;
  }

  const handleSubmit = () => {
    if (!selectedMethod || !amount || !destination) return;
    setError(null);
    setStep("confirm");
  };

  const handleConfirm = async () => {
    if (!selectedMethod) return;
    setSubmitting(true);
    setError(null);
    setStep("processing");
    try {
      const res = await api.post<{
        reference: string;
        balance: number;
      }>("/api/withdraw", {
        amount: parseFloat(amount),
        method: selectedMethod,
        accountNumber: isMobile ? destination : undefined,
        accountName: isMobile ? accountName : undefined,
        cryptoAddress: isCrypto ? destination : undefined,
      });
      setTxRef(res.reference);
      sessionStore.setBalance(res.balance);
      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Withdrawal failed");
      setStep("failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-r from-[#3b82f6]/10 via-[#161925] to-[#3b82f6]/10 border-b border-[#3b82f6]/20">
        <div className="px-4 lg:px-6 py-5">
          <div className="flex items-center gap-3">
            <Link href="/account" className="p-2 text-[#5a6485] hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="w-10 h-10 bg-[#3b82f6]/20 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5 text-[#3b82f6]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Withdraw Funds</h1>
              <p className="text-xs text-[#8b95b8]">
                Available balance:{" "}
                <span className="text-[#00d46e] font-bold">
                  {user ? `${user.currency} ${user.balance.toFixed(2)}` : "—"}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-6 py-6 max-w-2xl mx-auto">
        {step === "form" && (
          <div>
            {error && (
              <div className="mb-4 bg-[#ff4757]/10 border border-[#ff4757]/30 rounded-xl px-3 py-2 text-xs text-[#ff4757]">
                {error}
              </div>
            )}

            {/* Withdrawal Method */}
            <div className="mb-6">
              <label className="text-xs font-medium text-[#8b95b8] mb-3 block">
                Withdrawal Method
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {withdrawMethods.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMethod(m.id)}
                    className={`bg-[#1c2033] border rounded-xl p-4 text-left transition-all ${
                      selectedMethod === m.id
                        ? "border-[#00d46e]/50 bg-[#00d46e]/5"
                        : "border-[#2a3050] hover:border-[#3b82f6]/30"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-9 h-9 ${m.bgColor} rounded-lg flex items-center justify-center`}>
                        <span className="text-lg">{m.icon}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{m.name}</p>
                        <p className="text-[10px] text-[#5a6485]">{m.time}</p>
                      </div>
                    </div>
                    <div className="flex gap-3 text-[10px] text-[#5a6485]">
                      <span>Min: {m.minWithdraw} {m.currency}</span>
                      <span>Fee: {m.fee}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {selectedMethod && (
              <>
                {/* Amount */}
                <div className="mb-5">
                  <label className="text-xs font-medium text-[#8b95b8] mb-2 block">
                    Amount ({method?.currency})
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-[#0f1118] border border-[#2a3050] rounded-xl px-4 py-3.5 text-lg font-bold text-white placeholder-[#2a3050] focus:outline-none focus:border-[#00d46e]/50"
                  />
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[10px] text-[#5a6485]">Min: {method?.minWithdraw} {method?.currency}</span>
                    <button
                      onClick={() => user && setAmount(user.balance.toString())}
                      className="text-[10px] text-[#3b82f6] hover:underline"
                    >
                      Withdraw All
                    </button>
                  </div>
                </div>

                {/* Destination */}
                <div className="mb-4">
                  <label className="text-xs font-medium text-[#8b95b8] mb-2 block">
                    {isMobile ? "Phone Number" : "Wallet Address"}
                  </label>
                  <input
                    type={isMobile ? "tel" : "text"}
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder={isMobile ? "024 XXX XXXX" : "Enter wallet address"}
                    className="w-full bg-[#0f1118] border border-[#2a3050] rounded-xl px-4 py-3 text-sm text-white placeholder-[#5a6485] focus:outline-none focus:border-[#00d46e]/50"
                  />
                </div>

                {isMobile && (
                  <div className="mb-6">
                    <label className="text-xs font-medium text-[#8b95b8] mb-2 block">
                      Account Name
                    </label>
                    <input
                      type="text"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      placeholder="Name on account"
                      className="w-full bg-[#0f1118] border border-[#2a3050] rounded-xl px-4 py-3 text-sm text-white placeholder-[#5a6485] focus:outline-none focus:border-[#00d46e]/50"
                    />
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={!amount || !destination || parseFloat(amount) <= 0}
                  className="w-full gradient-blue text-white font-bold text-sm py-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Request Withdrawal
                </button>
              </>
            )}

            <div className="mt-6 flex items-start gap-3 bg-[#1c2033] border border-[#2a3050] rounded-lg p-4">
              <AlertCircle className="w-4 h-4 text-[#ffc107] shrink-0 mt-0.5" />
              <div className="text-[11px] text-[#5a6485] space-y-1">
                <p>Withdrawals are processed within 24 hours for mobile money and 1 hour for crypto.</p>
                <p>KYC verification is required before withdrawing.</p>
              </div>
            </div>
          </div>
        )}

        {step === "confirm" && method && (
          <div>
            <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl overflow-hidden mb-6">
              <div className="px-5 py-4 border-b border-[#2a3050]">
                <h3 className="text-sm font-bold text-white">Confirm Withdrawal</h3>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex justify-between">
                  <span className="text-xs text-[#5a6485]">Method</span>
                  <span className="text-sm font-medium text-white">{method.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-[#5a6485]">Amount</span>
                  <span className="text-lg font-bold text-white">{amount} {method.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-[#5a6485]">Destination</span>
                  <span className="text-sm font-mono text-white truncate max-w-[200px]">{destination}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-[#5a6485]">Fee</span>
                  <span className="text-sm text-[#00d46e]">{method.fee}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-[#2a3050]">
                  <span className="text-xs font-semibold text-white">You will receive</span>
                  <span className="text-lg font-bold text-[#00d46e]">{amount} {method.currency}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep("form")} className="flex-1 bg-[#1c2033] border border-[#2a3050] text-[#8b95b8] font-medium text-sm py-3 rounded-xl hover:text-white transition-colors">
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className="flex-1 gradient-green text-white font-bold text-sm py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm Withdrawal
              </button>
            </div>
          </div>
        )}

        {step === "processing" && (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-[#3b82f6] mx-auto mb-6" />
            <h3 className="text-lg font-bold text-white mb-2">Processing Withdrawal</h3>
            <p className="text-sm text-[#8b95b8]">Please wait...</p>
          </div>
        )}

        {step === "failed" && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-[#ff4757]/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-[#ff4757]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Withdrawal Failed</h3>
            <p className="text-sm text-[#8b95b8] mb-6">
              {error || "Something went wrong. Please try again."}
            </p>
            <button
              onClick={() => {
                setStep("form");
                setError(null);
              }}
              className="gradient-green text-white font-semibold text-sm px-6 py-3 rounded-xl hover:opacity-90 transition-opacity"
            >
              Try Again
            </button>
          </div>
        )}

        {step === "success" && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-[#00d46e]/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-[#00d46e]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Withdrawal Requested!</h3>
            <p className="text-sm text-[#8b95b8] mb-1">
              {amount} {method?.currency} will be sent to your {method?.name} account.
            </p>
            {txRef && (
              <p className="text-[11px] text-[#5a6485] font-mono mb-2">Ref: {txRef}</p>
            )}
            <div className="flex items-center justify-center gap-1.5 text-xs text-[#5a6485] mb-8">
              <Clock className="w-3 h-3" />
              <span>Estimated time: {method?.time}</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/account/history" className="bg-[#1c2033] border border-[#2a3050] text-[#8b95b8] font-medium text-sm px-6 py-3 rounded-xl hover:text-white transition-colors text-center">
                View History
              </Link>
              <Link href="/" className="gradient-green text-white font-semibold text-sm px-6 py-3 rounded-xl hover:opacity-90 transition-opacity text-center">
                Back to Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
