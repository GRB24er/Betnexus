"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Wallet,
  Smartphone,
  Bitcoin,
  Shield,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Zap,
  Lock,
  Copy,
  Clock,
  ExternalLink,
} from "lucide-react";
import { api } from "@/lib/api";
import { sessionStore, useSession } from "@/store/session";

/* ═══════════════════════════════════════════════════════════════════════════
   Payment Methods — with real brand colors
   ═══════════════════════════════════════════════════════════════════════════ */

const paymentMethods = [
  {
    id: "mtn_momo",
    name: "MTN Mobile Money",
    shortName: "MTN MoMo",
    icon: "📱",
    // MTN brand yellow
    brandColor: "#FFCB05",
    brandBg: "rgba(255, 203, 5, 0.12)",
    brandBorder: "rgba(255, 203, 5, 0.3)",
    brandText: "#FFCB05",
    brandGradient: "linear-gradient(135deg, #FFCB05, #F5A623)",
    description: "Pay with your MTN Mobile Money wallet",
    minDeposit: 1,
    maxDeposit: 50000,
    fee: "Free",
    time: "Instant",
    currency: "GHS",
  },
  {
    id: "telecel_cash",
    name: "Telecel Cash",
    shortName: "Telecel",
    icon: "📲",
    // Telecel brand red
    brandColor: "#E30613",
    brandBg: "rgba(227, 6, 19, 0.12)",
    brandBorder: "rgba(227, 6, 19, 0.3)",
    brandText: "#E30613",
    brandGradient: "linear-gradient(135deg, #E30613, #C70510)",
    description: "Pay with your Telecel Cash wallet",
    minDeposit: 1,
    maxDeposit: 50000,
    fee: "Free",
    time: "Instant",
    currency: "GHS",
  },
  {
    id: "btc",
    name: "Bitcoin",
    shortName: "BTC",
    icon: "₿",
    // Bitcoin brand orange
    brandColor: "#F7931A",
    brandBg: "rgba(247, 147, 26, 0.12)",
    brandBorder: "rgba(247, 147, 26, 0.3)",
    brandText: "#F7931A",
    brandGradient: "linear-gradient(135deg, #F7931A, #E8850F)",
    description: "Deposit using Bitcoin",
    minDeposit: 0.0001,
    maxDeposit: 10,
    fee: "Network fee",
    time: "10-30 min",
    currency: "BTC",
  },
  {
    id: "usdt_trc20",
    name: "Tether (USDT)",
    shortName: "USDT",
    icon: "💲",
    // Tether brand green
    brandColor: "#26A17B",
    brandBg: "rgba(38, 161, 123, 0.12)",
    brandBorder: "rgba(38, 161, 123, 0.3)",
    brandText: "#26A17B",
    brandGradient: "linear-gradient(135deg, #26A17B, #1E8A68)",
    description: "Deposit using USDT (TRC-20)",
    minDeposit: 5,
    maxDeposit: 100000,
    fee: "1 USDT",
    time: "5-15 min",
    currency: "USDT",
  },
];

const quickAmounts = [10, 20, 50, 100, 200, 500];

export default function DepositPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useSession();
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [cryptoAddress, setCryptoAddress] = useState("");
  const [step, setStep] = useState<
    "method" | "amount" | "confirm" | "processing" | "success" | "failed" | "btc_pending"
  >("method");
  const [promoCode, setPromoCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const [btcDepositAddress, setBtcDepositAddress] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const method = paymentMethods.find((m) => m.id === selectedMethod);
  const isMobileMoney =
    selectedMethod === "mtn_momo" || selectedMethod === "telecel_cash";
  const isCrypto = selectedMethod === "btc" || selectedMethod === "usdt_trc20";
  const isBtc = selectedMethod === "btc";

  // Verify return-from-Paystack callback
  useEffect(() => {
    const ref = searchParams.get("reference") || searchParams.get("trxref");
    if (!ref || !user) return;
    setReference(ref);
    setStep("processing");
    (async () => {
      try {
        const res = await api.get<{ status: string; balance?: number }>(
          `/api/paystack/verify?reference=${encodeURIComponent(ref)}`
        );
        if (res.status === "success") {
          if (typeof res.balance === "number") {
            sessionStore.setBalance(res.balance);
          }
          setStep("success");
        } else if (res.status === "failed") {
          setError("Payment failed or was abandoned.");
          setStep("failed");
        } else {
          setStep("processing");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Verification failed");
        setStep("failed");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  const handleSelectMethod = (id: string) => {
    setSelectedMethod(id);
    setStep("amount");
  };

  const handleProceed = () => {
    setError(null);
    if (!amount || parseFloat(amount) <= 0) return;
    if (isMobileMoney && !phone) return;
    // BTC doesn't need a crypto address input — we show our address
    if (selectedMethod === "usdt_trc20" && !cryptoAddress) return;
    setStep("confirm");
  };

  const handleCopyAddress = async () => {
    if (!btcDepositAddress) return;
    try {
      await navigator.clipboard.writeText(btcDepositAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const el = document.createElement("textarea");
      el.value = btcDepositAddress;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedMethod) return;
    if (!user) {
      router.push("/login");
      return;
    }
    setError(null);
    setStep("processing");
    try {
      const res = await api.post<{
        reference: string;
        authorization_url?: string;
        depositAddress?: string;
        manualVerification?: boolean;
      }>("/api/paystack/initialize", {
        amount: parseFloat(amount),
        method: selectedMethod,
        accountNumber: isMobileMoney ? phone : undefined,
        cryptoAddress: isCrypto ? cryptoAddress : undefined,
      });

      setReference(res.reference);

      // BTC manual deposit — show wallet address
      if (res.depositAddress && res.manualVerification) {
        setBtcDepositAddress(res.depositAddress);
        setStep("btc_pending");
        return;
      }

      // Paystack redirect for all other methods
      if (res.authorization_url) {
        window.location.href = res.authorization_url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
      setStep("failed");
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#00d46e]/10 via-[#161925] to-[#00d46e]/10 border-b border-[#00d46e]/20">
        <div className="px-4 lg:px-6 py-5">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 text-[#5a6485] hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="w-10 h-10 bg-[#00d46e]/20 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5 text-[#00d46e]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Deposit Funds</h1>
              <p className="text-xs text-[#8b95b8]">
                Secure &amp; fast payments
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-6 py-6 max-w-2xl mx-auto">
        {!loading && !user && (
          <div className="mb-5 bg-[#ffc107]/10 border border-[#ffc107]/30 rounded-xl px-4 py-3 flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-[#ffc107] shrink-0" />
            <p className="text-xs text-[#ffc107]">
              You need to{" "}
              <Link href="/login" className="underline font-semibold">
                sign in
              </Link>{" "}
              before making a deposit.
            </p>
          </div>
        )}

        {/* Progress Steps */}
        {step !== "btc_pending" && (
          <div className="flex items-center gap-2 mb-8">
            {["Payment Method", "Amount", "Confirm"].map((label, i) => {
              const stepIndex = ["method", "amount", "confirm"].indexOf(step);
              const isActive = i <= stepIndex;
              const isCurrent = i === stepIndex;
              return (
                <div key={label} className="flex items-center gap-2 flex-1">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      isActive
                        ? "bg-[#00d46e] text-white"
                        : "bg-[#2a3050] text-[#5a6485]"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <span
                    className={`text-xs font-medium hidden sm:block ${
                      isCurrent ? "text-white" : "text-[#5a6485]"
                    }`}
                  >
                    {label}
                  </span>
                  {i < 2 && (
                    <div
                      className={`flex-1 h-0.5 rounded ${
                        isActive && i < stepIndex
                          ? "bg-[#00d46e]"
                          : "bg-[#2a3050]"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ═══ Step 1: Select Payment Method ═══ */}
        {step === "method" && (
          <div>
            <h2 className="text-base font-bold text-white mb-1">
              Choose Payment Method
            </h2>
            <p className="text-xs text-[#5a6485] mb-5">
              Select your preferred deposit method
            </p>

            {/* Mobile Money Section */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Smartphone className="w-4 h-4 text-[#FFCB05]" />
                <h3 className="text-sm font-semibold text-white">
                  Mobile Money
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {paymentMethods
                  .filter((m) => m.id === "mtn_momo" || m.id === "telecel_cash")
                  .map((m) => (
                    <button
                      key={m.id}
                      onClick={() => handleSelectMethod(m.id)}
                      className="bg-[#1c2033] border rounded-xl p-4 text-left transition-all group hover:scale-[1.02]"
                      style={{ borderColor: m.brandBorder }}
                    >
                      <div className="flex items-center gap-3 mb-2.5">
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center border"
                          style={{
                            background: m.brandBg,
                            borderColor: m.brandBorder,
                          }}
                        >
                          <span className="text-xl font-bold" style={{ color: m.brandColor }}>
                            {m.id === "mtn_momo" ? "M" : "T"}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold transition-colors" style={{ color: m.brandColor }}>
                            {m.name}
                          </p>
                          <p className="text-[11px] text-[#5a6485]">
                            {m.description}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#5a6485] group-hover:translate-x-0.5 transition-transform" />
                      </div>
                      <div className="flex items-center gap-4 text-[10px] text-[#5a6485]">
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3" style={{ color: m.brandColor }} />
                          {m.time}
                        </span>
                        <span>Fee: {m.fee}</span>
                        <span>
                          Min: {m.currency} {m.minDeposit}
                        </span>
                      </div>
                      {/* Brand accent bar */}
                      <div
                        className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b-xl opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: m.brandGradient }}
                      />
                    </button>
                  ))}
              </div>
            </div>

            {/* Crypto Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Bitcoin className="w-4 h-4 text-[#F7931A]" />
                <h3 className="text-sm font-semibold text-white">
                  Cryptocurrency
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {paymentMethods
                  .filter((m) => m.id === "btc" || m.id === "usdt_trc20")
                  .map((m) => (
                    <button
                      key={m.id}
                      onClick={() => handleSelectMethod(m.id)}
                      className="bg-[#1c2033] border rounded-xl p-4 text-left transition-all group hover:scale-[1.02]"
                      style={{ borderColor: m.brandBorder }}
                    >
                      <div className="flex items-center gap-3 mb-2.5">
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center border"
                          style={{
                            background: m.brandBg,
                            borderColor: m.brandBorder,
                          }}
                        >
                          <span className="text-xl font-bold" style={{ color: m.brandColor }}>
                            {m.icon}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold transition-colors" style={{ color: m.brandColor }}>
                            {m.name}
                          </p>
                          <p className="text-[11px] text-[#5a6485]">
                            {m.description}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#5a6485] group-hover:translate-x-0.5 transition-transform" />
                      </div>
                      <div className="flex items-center gap-4 text-[10px] text-[#5a6485]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" style={{ color: m.brandColor }} />
                          {m.time}
                        </span>
                        <span>Fee: {m.fee}</span>
                        <span>
                          Min: {m.minDeposit} {m.currency}
                        </span>
                      </div>
                    </button>
                  ))}
              </div>
            </div>

            {/* Security Notice */}
            <div className="mt-6 flex items-start gap-3 bg-[#1c2033] border border-[#2a3050] rounded-lg p-4">
              <Shield className="w-5 h-5 text-[#00d46e] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-white mb-0.5">
                  Secure Payments
                </p>
                <p className="text-[11px] text-[#5a6485]">
                  Mobile Money payments are processed through Paystack&apos;s PCI-DSS Level 1
                  compliant infrastructure. Crypto deposits are verified manually for your security.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ═══ Step 2: Enter Amount ═══ */}
        {step === "amount" && method && (
          <div>
            <button
              onClick={() => setStep("method")}
              className="flex items-center gap-1 text-xs text-[#5a6485] hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" /> Back to methods
            </button>

            {/* Selected Method Card */}
            <div
              className="flex items-center gap-3 mb-6 border rounded-lg p-3"
              style={{
                background: method.brandBg,
                borderColor: method.brandBorder,
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center border"
                style={{
                  background: method.brandBg,
                  borderColor: method.brandBorder,
                }}
              >
                <span className="text-lg font-bold" style={{ color: method.brandColor }}>
                  {method.id === "mtn_momo" ? "M" : method.id === "telecel_cash" ? "T" : method.icon}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: method.brandColor }}>
                  {method.name}
                </p>
                <p className="text-[11px] text-[#5a6485]">
                  {method.fee} fee &bull; {method.time}
                </p>
              </div>
            </div>

            {/* Amount Input */}
            <div className="mb-5">
              <label className="text-xs font-medium text-[#8b95b8] mb-2 block">
                Deposit Amount ({method.currency})
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-[#5a6485]">
                  {isCrypto ? "" : "GHS"}
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className={`w-full bg-[#0f1118] border border-[#2a3050] rounded-xl ${
                    isCrypto ? "pl-4" : "pl-14"
                  } pr-4 py-4 text-2xl font-bold text-white placeholder-[#2a3050] focus:outline-none focus:border-[#00d46e]/50 focus:ring-1 focus:ring-[#00d46e]/20 transition-all`}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[11px] text-[#5a6485]">
                  Min: {method.minDeposit} {method.currency}
                </span>
                <span className="text-[11px] text-[#5a6485]">
                  Max: {method.maxDeposit.toLocaleString()} {method.currency}
                </span>
              </div>
            </div>

            {/* Quick Amounts */}
            {!isCrypto && (
              <div className="mb-5">
                <label className="text-xs font-medium text-[#8b95b8] mb-2 block">
                  Quick Select
                </label>
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                  {quickAmounts.map((a) => (
                    <button
                      key={a}
                      onClick={() => setAmount(a.toString())}
                      className={`py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all min-h-[44px] ${
                        amount === a.toString()
                          ? "bg-[#00d46e]/20 text-[#00d46e] border border-[#00d46e]/30"
                          : "bg-[#1c2033] text-[#8b95b8] border border-[#2a3050] hover:text-white"
                      }`}
                    >
                      GHS {a}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Phone Number (Mobile Money) */}
            {isMobileMoney && (
              <div className="mb-5">
                <label className="text-xs font-medium text-[#8b95b8] mb-2 block">
                  {method.shortName} Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="024 XXX XXXX"
                  className="w-full bg-[#0f1118] border border-[#2a3050] rounded-xl px-4 py-3 text-sm text-white placeholder-[#5a6485] focus:outline-none focus:border-[#00d46e]/50 focus:ring-1 focus:ring-[#00d46e]/20 transition-all"
                />
                <p className="text-[10px] text-[#5a6485] mt-1">
                  You will receive a payment prompt on this number
                </p>
              </div>
            )}

            {/* USDT Address Input (only for USDT, not BTC) */}
            {selectedMethod === "usdt_trc20" && (
              <div className="mb-5">
                <label className="text-xs font-medium text-[#8b95b8] mb-2 block">
                  Your USDT Wallet Address (for refunds)
                </label>
                <input
                  type="text"
                  value={cryptoAddress}
                  onChange={(e) => setCryptoAddress(e.target.value)}
                  placeholder="TRC-20 address (T...)"
                  className="w-full bg-[#0f1118] border border-[#2a3050] rounded-xl px-4 py-3 text-xs font-mono text-white placeholder-[#5a6485] focus:outline-none focus:border-[#00d46e]/50 focus:ring-1 focus:ring-[#00d46e]/20 transition-all"
                />
              </div>
            )}

            {/* BTC Info */}
            {isBtc && (
              <div className="mb-5 border rounded-xl p-4" style={{ background: "rgba(247, 147, 26, 0.06)", borderColor: "rgba(247, 147, 26, 0.2)" }}>
                <p className="text-xs font-semibold mb-2" style={{ color: "#F7931A" }}>
                  How Bitcoin Deposit Works
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] text-white rounded-full w-4 h-4 flex items-center justify-center shrink-0 mt-0.5" style={{ background: "#F7931A" }}>1</span>
                    <p className="text-[11px] text-[#8b95b8]">Confirm the amount and proceed</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] text-white rounded-full w-4 h-4 flex items-center justify-center shrink-0 mt-0.5" style={{ background: "#F7931A" }}>2</span>
                    <p className="text-[11px] text-[#8b95b8]">You&apos;ll see our BTC wallet address</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] text-white rounded-full w-4 h-4 flex items-center justify-center shrink-0 mt-0.5" style={{ background: "#F7931A" }}>3</span>
                    <p className="text-[11px] text-[#8b95b8]">Send the exact BTC amount to the address</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] text-white rounded-full w-4 h-4 flex items-center justify-center shrink-0 mt-0.5" style={{ background: "#F7931A" }}>4</span>
                    <p className="text-[11px] text-[#8b95b8]">Funds credited after we confirm the transaction</p>
                  </div>
                </div>
              </div>
            )}

            {/* Promo Code */}
            <div className="mb-6">
              <label className="text-xs font-medium text-[#8b95b8] mb-2 block">
                Promo Code (optional)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="NEXUS500"
                  className="flex-1 bg-[#0f1118] border border-[#2a3050] rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#5a6485] focus:outline-none focus:border-[#00d46e]/50"
                />
                <button className="px-4 py-2.5 bg-[#1c2033] border border-[#2a3050] rounded-lg text-xs font-semibold text-[#8b95b8] hover:text-white transition-colors">
                  Apply
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-[#ff4757]/10 border border-[#ff4757]/30 rounded-xl px-3 py-2 text-xs text-[#ff4757] mb-3">
                {error}
              </div>
            )}

            <button
              onClick={handleProceed}
              disabled={
                !amount ||
                parseFloat(amount) <= 0 ||
                (isMobileMoney && !phone) ||
                (selectedMethod === "usdt_trc20" && !cryptoAddress)
              }
              className="w-full gradient-green text-white font-bold text-sm py-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ═══ Step 3: Confirm ═══ */}
        {step === "confirm" && method && (
          <div>
            <button
              onClick={() => setStep("amount")}
              className="flex items-center gap-1 text-xs text-[#5a6485] hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" /> Back
            </button>

            <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl overflow-hidden mb-6">
              <div className="px-5 py-4 border-b border-[#2a3050]">
                <h3 className="text-sm font-bold text-white">Confirm Deposit</h3>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#5a6485]">Method</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold" style={{ color: method.brandColor }}>
                      {method.id === "mtn_momo" ? "M" : method.id === "telecel_cash" ? "T" : method.icon}
                    </span>
                    <span className="text-sm font-semibold text-white">{method.name}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#5a6485]">Amount</span>
                  <span className="text-lg font-bold text-white">
                    {isCrypto ? "" : "GHS "}{amount} {isCrypto ? method.currency : ""}
                  </span>
                </div>
                {isMobileMoney && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#5a6485]">Phone</span>
                    <span className="text-sm font-medium text-white">{phone}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#5a6485]">Fee</span>
                  <span className="text-sm font-medium" style={{ color: method.brandColor }}>{method.fee}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#5a6485]">Processing Time</span>
                  <span className="text-sm text-[#8b95b8]">{method.time}</span>
                </div>
                {promoCode && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#5a6485]">Promo Code</span>
                    <span className="text-sm font-semibold text-[#ffc107]">{promoCode}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-[#2a3050]">
                  <span className="text-xs font-semibold text-white">You will receive</span>
                  <span className="text-xl font-bold text-[#00d46e]">
                    {isCrypto ? `${amount} ${method.currency}` : `GHS ${parseFloat(amount || "0").toFixed(2)}`}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 mb-5 text-[11px] text-[#5a6485]">
              <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                By proceeding, you confirm this deposit and agree to the{" "}
                <Link href="/help" className="text-[#3b82f6] hover:underline">Terms of Service</Link>.
                {isBtc
                  ? " BTC deposits are verified manually."
                  : " Payments processed by Paystack."}
              </span>
            </div>

            <button
              onClick={handleConfirmPayment}
              className="w-full font-bold text-sm py-3.5 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-white"
              style={{ background: method.brandGradient }}
            >
              <Lock className="w-4 h-4" />
              {isMobileMoney
                ? `Pay GHS ${amount} via ${method.shortName}`
                : isBtc
                ? `Deposit ${amount} BTC`
                : `Deposit ${amount} ${method.currency}`}
            </button>
          </div>
        )}

        {/* ═══ BTC Pending — Show Wallet Address ═══ */}
        {step === "btc_pending" && btcDepositAddress && (
          <div>
            <div className="text-center mb-6">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border-2"
                style={{
                  background: "rgba(247, 147, 26, 0.15)",
                  borderColor: "rgba(247, 147, 26, 0.4)",
                }}
              >
                <Bitcoin className="w-8 h-8" style={{ color: "#F7931A" }} />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Send Bitcoin</h3>
              <p className="text-sm text-[#8b95b8]">
                Send exactly <span className="font-bold text-white">{amount} BTC</span> to the address below
              </p>
            </div>

            {/* Wallet Address Card */}
            <div
              className="border rounded-xl overflow-hidden mb-4"
              style={{
                background: "rgba(247, 147, 26, 0.06)",
                borderColor: "rgba(247, 147, 26, 0.25)",
              }}
            >
              <div className="px-4 py-3 border-b" style={{ borderColor: "rgba(247, 147, 26, 0.15)" }}>
                <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#F7931A" }}>
                  BTC Deposit Address
                </p>
              </div>
              <div className="p-4">
                {/* QR Code placeholder using a styled box */}
                <div className="w-40 h-40 mx-auto mb-4 bg-white rounded-xl flex items-center justify-center p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=bitcoin:${btcDepositAddress}?amount=${amount}`}
                    alt="BTC QR Code"
                    className="w-full h-full rounded"
                    width={150}
                    height={150}
                  />
                </div>

                {/* Address */}
                <div className="bg-[#0f1118] border border-[#2a3050] rounded-lg p-3 flex items-center gap-2">
                  <code className="text-xs font-mono text-white flex-1 break-all leading-relaxed">
                    {btcDepositAddress}
                  </code>
                  <button
                    onClick={handleCopyAddress}
                    className={`shrink-0 p-2 rounded-lg transition-all ${
                      copied
                        ? "bg-[#00d46e]/20 text-[#00d46e]"
                        : "bg-[#1c2033] text-[#8b95b8] hover:text-white"
                    }`}
                  >
                    {copied ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {copied && (
                  <p className="text-[10px] text-[#00d46e] text-center mt-1.5 font-medium">
                    Address copied to clipboard!
                  </p>
                )}
              </div>
            </div>

            {/* Important Notes */}
            <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-4 mb-4 space-y-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-[#ffc107] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-[#ffc107] mb-1">Important</p>
                  <ul className="text-[11px] text-[#8b95b8] space-y-1.5">
                    <li>Send exactly <span className="text-white font-semibold">{amount} BTC</span> to the address above</li>
                    <li>Only send <span className="text-white font-semibold">Bitcoin (BTC)</span> to this address</li>
                    <li>Sending any other cryptocurrency will result in permanent loss</li>
                    <li>Your deposit will be credited after network confirmation</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Transaction Reference */}
            <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-[#5a6485] uppercase tracking-wider mb-0.5">Transaction Reference</p>
                  <p className="text-xs font-mono text-white">{reference}</p>
                </div>
                <div className="flex items-center gap-1.5 bg-[#ffc107]/10 px-2.5 py-1 rounded-full">
                  <Clock className="w-3 h-3 text-[#ffc107]" />
                  <span className="text-[10px] font-bold text-[#ffc107]">PENDING</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/sports"
                className="flex-1 gradient-green text-white font-semibold text-sm py-3 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" /> Continue Betting
              </Link>
              <Link
                href="/account/history"
                className="flex-1 bg-[#1c2033] border border-[#2a3050] text-[#8b95b8] font-medium text-sm py-3 rounded-xl hover:text-white transition-colors text-center flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" /> View History
              </Link>
            </div>
          </div>
        )}

        {/* ═══ Processing ═══ */}
        {step === "processing" && (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-[#2a3050] border-t-[#00d46e] rounded-full animate-spin mx-auto mb-6" />
            <h3 className="text-lg font-bold text-white mb-2">Processing Payment</h3>
            {isMobileMoney && (
              <p className="text-sm text-[#8b95b8] mb-4">
                Check your phone for the {method?.shortName} payment prompt.<br />
                Approve the transaction to complete.
              </p>
            )}
            {isCrypto && !isBtc && (
              <p className="text-sm text-[#8b95b8] mb-4">
                Waiting for network confirmation...<br />
                This may take a few minutes.
              </p>
            )}
            <div className="bg-[#1c2033] border border-[#2a3050] rounded-lg p-4 max-w-xs mx-auto">
              <p className="text-[11px] text-[#5a6485]">Transaction Reference</p>
              <p className="text-xs font-mono text-white mt-1 break-all">
                {reference || "\u2014"}
              </p>
            </div>
          </div>
        )}

        {/* ═══ Failed ═══ */}
        {step === "failed" && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-[#ff4757]/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-[#ff4757]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Payment Failed</h3>
            <p className="text-sm text-[#8b95b8] mb-6">
              {error || "Something went wrong. Please try again."}
            </p>
            <button
              onClick={() => {
                setStep("method");
                setError(null);
                setReference(null);
              }}
              className="gradient-green text-white font-semibold text-sm px-6 py-3 rounded-xl hover:opacity-90 transition-opacity"
            >
              Try Again
            </button>
          </div>
        )}

        {/* ═══ Success ═══ */}
        {step === "success" && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-[#00d46e]/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-[#00d46e]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Deposit Successful!</h3>
            <p className="text-sm text-[#8b95b8] mb-2">
              Your deposit has been credited to your account.
            </p>
            <p className="text-xs text-[#5a6485] mb-8">
              {user && (
                <>
                  New balance:{" "}
                  <span className="text-[#00d46e] font-bold">
                    {user.currency} {user.balance.toFixed(2)}
                  </span>
                </>
              )}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/sports"
                className="gradient-green text-white font-semibold text-sm px-6 py-3 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" /> Start Betting
              </Link>
              <Link
                href="/account"
                className="bg-[#1c2033] border border-[#2a3050] text-[#8b95b8] font-medium text-sm px-6 py-3 rounded-xl hover:text-white transition-colors text-center"
              >
                View Account
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
