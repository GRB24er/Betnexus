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
} from "lucide-react";
import { api } from "@/lib/api";
import { sessionStore, useSession } from "@/store/session";

const paymentMethods = [
  {
    id: "mtn_momo",
    name: "MTN Mobile Money",
    shortName: "MTN MoMo",
    icon: "📱",
    color: "from-yellow-500 to-yellow-600",
    borderColor: "border-yellow-500/30",
    bgColor: "bg-yellow-500/10",
    textColor: "text-yellow-500",
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
    color: "from-red-500 to-red-600",
    borderColor: "border-red-500/30",
    bgColor: "bg-red-500/10",
    textColor: "text-red-500",
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
    color: "from-orange-500 to-amber-600",
    borderColor: "border-orange-500/30",
    bgColor: "bg-orange-500/10",
    textColor: "text-orange-500",
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
    color: "from-green-500 to-emerald-600",
    borderColor: "border-green-500/30",
    bgColor: "bg-green-500/10",
    textColor: "text-green-500",
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
    "method" | "amount" | "confirm" | "processing" | "success" | "failed"
  >("method");
  const [promoCode, setPromoCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  const method = paymentMethods.find((m) => m.id === selectedMethod);
  const isMobileMoney =
    selectedMethod === "mtn_momo" || selectedMethod === "telecel_cash";
  const isCrypto = selectedMethod === "btc" || selectedMethod === "usdt_trc20";

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
    if (isCrypto && !cryptoAddress) return;
    setStep("confirm");
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
        authorization_url: string;
      }>("/api/paystack/initialize", {
        amount: parseFloat(amount),
        method: selectedMethod,
        accountNumber: isMobileMoney ? phone : undefined,
        cryptoAddress: isCrypto ? cryptoAddress : undefined,
      });
      setReference(res.reference);
      window.location.href = res.authorization_url;
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
                Secure payments powered by Paystack
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

        {/* Step 1: Select Payment Method */}
        {step === "method" && (
          <div>
            <h2 className="text-base font-bold text-white mb-1">
              Choose Payment Method
            </h2>
            <p className="text-xs text-[#5a6485] mb-5">
              All transactions are secured and encrypted via Paystack
            </p>

            {/* Mobile Money Section */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Smartphone className="w-4 h-4 text-[#ffc107]" />
                <h3 className="text-sm font-semibold text-white">
                  Mobile Money
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {paymentMethods
                  .filter((m) => m.id === "mtn-momo" || m.id === "telecel")
                  .map((m) => (
                    <button
                      key={m.id}
                      onClick={() => handleSelectMethod(m.id)}
                      className={`bg-[#1c2033] border border-[#2a3050] rounded-xl p-4 text-left hover:border-[#00d46e]/30 transition-all group`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className={`w-10 h-10 ${m.bgColor} rounded-lg flex items-center justify-center`}
                        >
                          <span className="text-xl">{m.icon}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white group-hover:text-[#00d46e] transition-colors">
                            {m.name}
                          </p>
                          <p className="text-[11px] text-[#5a6485]">
                            {m.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] text-[#5a6485]">
                        <span>Fee: {m.fee}</span>
                        <span>Time: {m.time}</span>
                        <span>
                          Min: {m.currency} {m.minDeposit}
                        </span>
                      </div>
                    </button>
                  ))}
              </div>
            </div>

            {/* Crypto Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Bitcoin className="w-4 h-4 text-[#ff6b35]" />
                <h3 className="text-sm font-semibold text-white">
                  Cryptocurrency
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {paymentMethods
                  .filter((m) => m.id === "btc" || m.id === "usdt")
                  .map((m) => (
                    <button
                      key={m.id}
                      onClick={() => handleSelectMethod(m.id)}
                      className={`bg-[#1c2033] border border-[#2a3050] rounded-xl p-4 text-left hover:border-[#00d46e]/30 transition-all group`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className={`w-10 h-10 ${m.bgColor} rounded-lg flex items-center justify-center`}
                        >
                          <span className="text-xl">{m.icon}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white group-hover:text-[#00d46e] transition-colors">
                            {m.name}
                          </p>
                          <p className="text-[11px] text-[#5a6485]">
                            {m.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] text-[#5a6485]">
                        <span>Fee: {m.fee}</span>
                        <span>Time: {m.time}</span>
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
                  Secured by Paystack
                </p>
                <p className="text-[11px] text-[#5a6485]">
                  All payments are processed through Paystack&apos;s PCI-DSS Level 1
                  compliant infrastructure. Your financial data is encrypted
                  end-to-end.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Enter Amount */}
        {step === "amount" && method && (
          <div>
            <button
              onClick={() => setStep("method")}
              className="flex items-center gap-1 text-xs text-[#5a6485] hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" /> Back to methods
            </button>

            <div className="flex items-center gap-3 mb-6 bg-[#1c2033] border border-[#2a3050] rounded-lg p-3">
              <div className={`w-8 h-8 ${method.bgColor} rounded-lg flex items-center justify-center`}>
                <span className="text-lg">{method.icon}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{method.name}</p>
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

            {/* Crypto Address Input */}
            {isCrypto && (
              <div className="mb-5">
                <label className="text-xs font-medium text-[#8b95b8] mb-2 block">
                  Your {method.shortName} Wallet Address (for refunds)
                </label>
                <input
                  type="text"
                  value={cryptoAddress}
                  onChange={(e) => setCryptoAddress(e.target.value)}
                  placeholder={
                    selectedMethod === "btc"
                      ? "bc1q..."
                      : "TRC-20 address (T...)"
                  }
                  className="w-full bg-[#0f1118] border border-[#2a3050] rounded-xl px-4 py-3 text-xs font-mono text-white placeholder-[#5a6485] focus:outline-none focus:border-[#00d46e]/50 focus:ring-1 focus:ring-[#00d46e]/20 transition-all"
                />
              </div>
            )}

            {/* Crypto Info */}
            {isCrypto && (
              <div className="mb-5 bg-[#1c2033] border border-[#2a3050] rounded-xl p-4">
                <p className="text-xs font-semibold text-white mb-2">
                  How it works
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] bg-[#00d46e] text-white rounded-full w-4 h-4 flex items-center justify-center shrink-0 mt-0.5">1</span>
                    <p className="text-[11px] text-[#8b95b8]">Confirm the amount and proceed</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] bg-[#00d46e] text-white rounded-full w-4 h-4 flex items-center justify-center shrink-0 mt-0.5">2</span>
                    <p className="text-[11px] text-[#8b95b8]">You&apos;ll receive a unique wallet address</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] bg-[#00d46e] text-white rounded-full w-4 h-4 flex items-center justify-center shrink-0 mt-0.5">3</span>
                    <p className="text-[11px] text-[#8b95b8]">Send the exact amount to the address</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] bg-[#00d46e] text-white rounded-full w-4 h-4 flex items-center justify-center shrink-0 mt-0.5">4</span>
                    <p className="text-[11px] text-[#8b95b8]">Funds credited after network confirmation</p>
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
                (isCrypto && !cryptoAddress)
              }
              className="w-full gradient-green text-white font-bold text-sm py-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 3: Confirm */}
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
                    <span className="text-sm">{method.icon}</span>
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
                  <span className="text-sm text-[#00d46e] font-medium">{method.fee}</span>
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
                    ${parseFloat(amount || "0").toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 mb-5 text-[11px] text-[#5a6485]">
              <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                By proceeding, you confirm this deposit and agree to the{" "}
                <Link href="/help" className="text-[#3b82f6] hover:underline">Terms of Service</Link>.
                Payments processed by Paystack.
              </span>
            </div>

            <button
              onClick={handleConfirmPayment}
              className="w-full gradient-green text-white font-bold text-sm py-3.5 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              {isMobileMoney
                ? `Pay GHS ${amount} via ${method.shortName}`
                : `Deposit ${amount} ${method.currency}`}
            </button>
          </div>
        )}

        {/* Processing */}
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
            {isCrypto && (
              <p className="text-sm text-[#8b95b8] mb-4">
                Waiting for network confirmation...<br />
                This may take a few minutes.
              </p>
            )}
            <div className="bg-[#1c2033] border border-[#2a3050] rounded-lg p-4 max-w-xs mx-auto">
              <p className="text-[11px] text-[#5a6485]">Transaction Reference</p>
              <p className="text-xs font-mono text-white mt-1 break-all">
                {reference || "—"}
              </p>
            </div>
          </div>
        )}

        {/* Failed */}
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

        {/* Success */}
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
