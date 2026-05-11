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
  Banknote,
  Landmark,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";
import { sessionStore, useSession } from "@/store/session";

type Provider = {
  id: string;
  label: string;
  walletAddress?: string;
  walletNetwork?: string;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  momoNumber?: string;
  momoName?: string;
  instructions?: string;
  minAmount?: number;
  maxAmount?: number;
  feePercent?: number;
};

const PROVIDER_META: Record<
  string,
  { icon: React.ReactNode; color: string; bg: string; border: string }
> = {
  korapay: {
    icon: <Banknote className="w-5 h-5" />,
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.12)",
    border: "rgba(59,130,246,0.3)",
  },
  paystack: {
    icon: <Banknote className="w-5 h-5" />,
    color: "#0BA4DB",
    bg: "rgba(11,164,219,0.12)",
    border: "rgba(11,164,219,0.3)",
  },
  mtn_momo: {
    icon: <Smartphone className="w-5 h-5" />,
    color: "#FFCB05",
    bg: "rgba(255,203,5,0.12)",
    border: "rgba(255,203,5,0.3)",
  },
  telecel_cash: {
    icon: <Smartphone className="w-5 h-5" />,
    color: "#E30613",
    bg: "rgba(227,6,19,0.12)",
    border: "rgba(227,6,19,0.3)",
  },
  btc: {
    icon: <Bitcoin className="w-5 h-5" />,
    color: "#F7931A",
    bg: "rgba(247,147,26,0.12)",
    border: "rgba(247,147,26,0.3)",
  },
  usdt_trc20: {
    icon: <Wallet className="w-5 h-5" />,
    color: "#26A17B",
    bg: "rgba(38,161,123,0.12)",
    border: "rgba(38,161,123,0.3)",
  },
  eth: {
    icon: <Wallet className="w-5 h-5" />,
    color: "#627EEA",
    bg: "rgba(98,126,234,0.12)",
    border: "rgba(98,126,234,0.3)",
  },
  bank_transfer: {
    icon: <Landmark className="w-5 h-5" />,
    color: "#8b95b8",
    bg: "rgba(139,149,184,0.1)",
    border: "rgba(139,149,184,0.3)",
  },
};

const quickAmounts = [10, 20, 50, 100, 200, 500];

type DepositResult = {
  reference: string;
  providerId: string;
  providerLabel: string;
  walletAddress?: string;
  walletNetwork?: string;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  momoNumber?: string;
  momoName?: string;
  instructions?: string;
  manualVerification?: boolean;
};

export default function DepositPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useSession();

  const [methods, setMethods] = useState<Provider[]>([]);
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const [methodsLoading, setMethodsLoading] = useState(true);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [payerNumber, setPayerNumber] = useState("");
  const [payerAccount, setPayerAccount] = useState("");
  const [payerWallet, setPayerWallet] = useState("");
  const [note, setNote] = useState("");
  const [step, setStep] = useState<
    "method" | "amount" | "confirm" | "processing" | "success" | "failed" | "pending"
  >("method");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DepositResult | null>(null);
  const [copied, setCopied] = useState(false);

  const selected = methods.find((m) => m.id === selectedId);

  useEffect(() => {
    api
      .get<{ activeProvider: string; providers: Provider[] }>(
        "/api/payment-methods"
      )
      .then((res) => {
        setMethods(res.providers);
        setActiveProvider(res.activeProvider);
        if (res.providers.length > 0) {
          const def =
            res.providers.find((p) => p.id === res.activeProvider) ||
            res.providers[0];
          setSelectedId(def.id);
        }
      })
      .catch(() => {})
      .finally(() => setMethodsLoading(false));
  }, []);

  // Verify return-from-Paystack
  useEffect(() => {
    const ref = searchParams.get("reference") || searchParams.get("trxref");
    if (!ref || !user) return;
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
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Verification failed");
        setStep("failed");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  const isMomo = selectedId === "mtn_momo" || selectedId === "telecel_cash";
  const isCrypto =
    selectedId === "btc" || selectedId === "usdt_trc20" || selectedId === "eth";
  const isBank = selectedId === "bank_transfer";
  const isPaystack = selectedId === "paystack" || selectedId === "korapay";

  const handleProceed = () => {
    setError(null);
    if (!amount || parseFloat(amount) <= 0) return;
    setStep("confirm");
  };

  const handleConfirm = async () => {
    if (!selectedId) return;
    if (!user) {
      router.push("/login");
      return;
    }
    setError(null);
    setStep("processing");

    try {
      // Use legacy Paystack init for the paystack provider only
      if (isPaystack && selectedId === "paystack") {
        const res = await api.post<{ authorization_url?: string }>(
          "/api/paystack/initialize",
          {
            amount: parseFloat(amount),
            method: "card",
          }
        );
        if (res.authorization_url) {
          window.location.href = res.authorization_url;
          return;
        }
      }

      const res = await api.post<DepositResult>("/api/deposit/initialize", {
        amount: parseFloat(amount),
        providerId: selectedId,
        payerNumber: isMomo ? payerNumber : undefined,
        payerAccount: isBank ? payerAccount : undefined,
        payerWallet: isCrypto ? payerWallet : undefined,
        note,
      });
      setResult(res);
      setStep("pending");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
      setStep("failed");
    }
  };

  const copyValue = async (v?: string) => {
    if (!v) return;
    await navigator.clipboard.writeText(v);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-r from-[#00d46e]/10 via-[#161925] to-[#00d46e]/10 border-b border-[#00d46e]/20">
        <div className="px-4 lg:px-6 py-5">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 text-[#5a6485] hover:text-white transition-colors"
            >
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

        {methodsLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#00d46e]" />
          </div>
        ) : step === "method" ? (
          <div>
            <h2 className="text-base font-bold text-white mb-1">
              Choose Payment Method
            </h2>
            <p className="text-xs text-[#5a6485] mb-5">
              {methods.length === 0
                ? "No payment methods available right now."
                : "Select your preferred deposit method"}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {methods.map((m) => {
                const meta = PROVIDER_META[m.id] || PROVIDER_META.bank_transfer;
                const isPrimary = m.id === activeProvider;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelectedId(m.id);
                      setStep("amount");
                    }}
                    className="bg-[#1c2033] border rounded-xl p-4 text-left transition-all group hover:scale-[1.02] relative"
                    style={{ borderColor: meta.border }}
                  >
                    {isPrimary && (
                      <span
                        className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded"
                        style={{
                          background: meta.bg,
                          color: meta.color,
                        }}
                      >
                        RECOMMENDED
                      </span>
                    )}
                    <div className="flex items-center gap-3 mb-2.5">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center border"
                        style={{ background: meta.bg, borderColor: meta.border }}
                      >
                        <span style={{ color: meta.color }}>{meta.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-bold truncate"
                          style={{ color: meta.color }}
                        >
                          {m.label}
                        </p>
                        <p className="text-[11px] text-[#5a6485] truncate">
                          {m.instructions || "Deposit funds securely"}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#5a6485]" />
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-[#5a6485]">
                      <span>
                        Min: {m.minAmount || 1}
                      </span>
                      <span>Max: {m.maxAmount?.toLocaleString() || "—"}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex items-start gap-3 bg-[#1c2033] border border-[#2a3050] rounded-lg p-4">
              <Shield className="w-5 h-5 text-[#00d46e] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-white mb-0.5">
                  Secure Payments
                </p>
                <p className="text-[11px] text-[#5a6485]">
                  All deposits are logged and reviewed. Crypto/MoMo deposits are
                  verified by an administrator before funds credit.
                </p>
              </div>
            </div>
          </div>
        ) : step === "amount" && selected ? (
          <AmountStep
            selected={selected}
            amount={amount}
            setAmount={setAmount}
            payerNumber={payerNumber}
            setPayerNumber={setPayerNumber}
            payerAccount={payerAccount}
            setPayerAccount={setPayerAccount}
            payerWallet={payerWallet}
            setPayerWallet={setPayerWallet}
            note={note}
            setNote={setNote}
            error={error}
            onBack={() => setStep("method")}
            onProceed={handleProceed}
            isMomo={isMomo}
            isCrypto={isCrypto}
            isBank={isBank}
          />
        ) : step === "confirm" && selected ? (
          <ConfirmStep
            selected={selected}
            amount={amount}
            onBack={() => setStep("amount")}
            onConfirm={handleConfirm}
          />
        ) : step === "processing" ? (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-[#00d46e] mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">
              Processing…
            </h3>
            <p className="text-sm text-[#8b95b8]">Please wait.</p>
          </div>
        ) : step === "pending" && result ? (
          <PendingStep
            result={result}
            amount={amount}
            copied={copied}
            onCopy={copyValue}
          />
        ) : step === "success" ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-[#00d46e]/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-[#00d46e]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Deposit Successful!
            </h3>
            <Link
              href="/sports"
              className="inline-block gradient-green text-white font-semibold text-sm px-6 py-3 rounded-xl mt-4"
            >
              <Zap className="w-4 h-4 inline mr-1" /> Start Betting
            </Link>
          </div>
        ) : step === "failed" ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-[#ff4757]/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-[#ff4757]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Payment Failed
            </h3>
            <p className="text-sm text-[#8b95b8] mb-6">
              {error || "Something went wrong."}
            </p>
            <button
              onClick={() => {
                setStep("method");
                setError(null);
              }}
              className="gradient-green text-white font-semibold text-sm px-6 py-3 rounded-xl"
            >
              Try Again
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function AmountStep({
  selected,
  amount,
  setAmount,
  payerNumber,
  setPayerNumber,
  payerAccount,
  setPayerAccount,
  payerWallet,
  setPayerWallet,
  note,
  setNote,
  error,
  onBack,
  onProceed,
  isMomo,
  isCrypto,
  isBank,
}: {
  selected: Provider;
  amount: string;
  setAmount: (v: string) => void;
  payerNumber: string;
  setPayerNumber: (v: string) => void;
  payerAccount: string;
  setPayerAccount: (v: string) => void;
  payerWallet: string;
  setPayerWallet: (v: string) => void;
  note: string;
  setNote: (v: string) => void;
  error: string | null;
  onBack: () => void;
  onProceed: () => void;
  isMomo: boolean;
  isCrypto: boolean;
  isBank: boolean;
}) {
  const meta = PROVIDER_META[selected.id] || PROVIDER_META.bank_transfer;
  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-xs text-[#5a6485] hover:text-white mb-4"
      >
        <ArrowLeft className="w-3 h-3" /> Back to methods
      </button>

      <div
        className="flex items-center gap-3 mb-6 border rounded-lg p-3"
        style={{ background: meta.bg, borderColor: meta.border }}
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: meta.bg, color: meta.color }}
        >
          {meta.icon}
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: meta.color }}>
            {selected.label}
          </p>
          {selected.instructions && (
            <p className="text-[11px] text-[#5a6485]">{selected.instructions}</p>
          )}
        </div>
      </div>

      <div className="mb-5">
        <label className="text-xs font-medium text-[#8b95b8] mb-2 block">
          Deposit Amount (GHS)
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="w-full bg-[#0f1118] border border-[#2a3050] rounded-xl px-4 py-4 text-2xl font-bold text-white focus:outline-none focus:border-[#00d46e]/50"
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-[11px] text-[#5a6485]">
            Min: GHS {selected.minAmount || 1}
          </span>
          <span className="text-[11px] text-[#5a6485]">
            Max: GHS {selected.maxAmount?.toLocaleString() || "—"}
          </span>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-1.5 sm:gap-2">
        {quickAmounts.map((a) => (
          <button
            key={a}
            onClick={() => setAmount(a.toString())}
            className={`py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              amount === a.toString()
                ? "bg-[#00d46e]/20 text-[#00d46e] border border-[#00d46e]/30"
                : "bg-[#1c2033] text-[#8b95b8] border border-[#2a3050]"
            }`}
          >
            GHS {a}
          </button>
        ))}
      </div>

      {isMomo && (
        <div className="mb-5">
          <label className="text-xs font-medium text-[#8b95b8] mb-2 block">
            Your Phone Number
          </label>
          <input
            type="tel"
            value={payerNumber}
            onChange={(e) => setPayerNumber(e.target.value)}
            placeholder="024 XXX XXXX"
            className="w-full bg-[#0f1118] border border-[#2a3050] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00d46e]/50"
          />
        </div>
      )}

      {isCrypto && (
        <div className="mb-5">
          <label className="text-xs font-medium text-[#8b95b8] mb-2 block">
            Your sending wallet address (optional)
          </label>
          <input
            type="text"
            value={payerWallet}
            onChange={(e) => setPayerWallet(e.target.value)}
            placeholder="Used to verify your transfer"
            className="w-full bg-[#0f1118] border border-[#2a3050] rounded-xl px-4 py-3 text-xs font-mono text-white focus:outline-none focus:border-[#00d46e]/50"
          />
        </div>
      )}

      {isBank && (
        <div className="mb-5">
          <label className="text-xs font-medium text-[#8b95b8] mb-2 block">
            Your account number (for matching)
          </label>
          <input
            type="text"
            value={payerAccount}
            onChange={(e) => setPayerAccount(e.target.value)}
            className="w-full bg-[#0f1118] border border-[#2a3050] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00d46e]/50"
          />
        </div>
      )}

      <div className="mb-5">
        <label className="text-xs font-medium text-[#8b95b8] mb-2 block">
          Note / Transaction reference (optional)
        </label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full bg-[#0f1118] border border-[#2a3050] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00d46e]/50"
        />
      </div>

      {error && (
        <div className="bg-[#ff4757]/10 border border-[#ff4757]/30 rounded-xl px-3 py-2 text-xs text-[#ff4757] mb-3">
          {error}
        </div>
      )}

      <button
        onClick={onProceed}
        disabled={!amount || parseFloat(amount) <= 0 || (isMomo && !payerNumber)}
        className="w-full gradient-green text-white font-bold text-sm py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-40"
      >
        Continue <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function ConfirmStep({
  selected,
  amount,
  onBack,
  onConfirm,
}: {
  selected: Provider;
  amount: string;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const meta = PROVIDER_META[selected.id] || PROVIDER_META.bank_transfer;
  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-xs text-[#5a6485] hover:text-white mb-4"
      >
        <ArrowLeft className="w-3 h-3" /> Back
      </button>
      <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-[#2a3050]">
          <h3 className="text-sm font-bold text-white">Confirm Deposit</h3>
        </div>
        <div className="p-5 space-y-4">
          <Row label="Method" value={selected.label} color={meta.color} />
          <Row label="Amount" value={`GHS ${amount}`} />
          {selected.minAmount && (
            <Row label="Minimum" value={`GHS ${selected.minAmount}`} />
          )}
        </div>
      </div>
      <button
        onClick={onConfirm}
        className="w-full font-bold text-sm py-3.5 rounded-xl text-white flex items-center justify-center gap-2"
        style={{ background: meta.color }}
      >
        <Lock className="w-4 h-4" /> Confirm Deposit
      </button>
    </div>
  );
}

function PendingStep({
  result,
  amount,
  copied,
  onCopy,
}: {
  result: DepositResult;
  amount: string;
  copied: boolean;
  onCopy: (v?: string) => void;
}) {
  const meta = PROVIDER_META[result.providerId] || PROVIDER_META.bank_transfer;

  return (
    <div>
      <div className="text-center mb-6">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border-2"
          style={{ background: meta.bg, borderColor: meta.border }}
        >
          <span style={{ color: meta.color }}>{meta.icon}</span>
        </div>
        <h3 className="text-lg font-bold text-white mb-1">
          Send your payment
        </h3>
        <p className="text-sm text-[#8b95b8]">
          Send <span className="font-bold text-white">GHS {amount}</span> via{" "}
          {result.providerLabel}.
        </p>
      </div>

      <div
        className="border rounded-xl overflow-hidden mb-4"
        style={{ background: meta.bg, borderColor: meta.border }}
      >
        <div
          className="px-4 py-3 border-b"
          style={{ borderColor: meta.border }}
        >
          <p
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: meta.color }}
          >
            Payment Details
          </p>
        </div>
        <div className="p-4 space-y-2.5">
          {result.walletAddress && (
            <CopyRow
              label={`${result.walletNetwork || "Wallet"} Address`}
              value={result.walletAddress}
              onCopy={onCopy}
              mono
            />
          )}
          {result.momoNumber && (
            <CopyRow
              label="MoMo Number"
              value={result.momoNumber}
              onCopy={onCopy}
            />
          )}
          {result.momoName && (
            <Row label="MoMo Name" value={result.momoName} />
          )}
          {result.bankName && (
            <Row label="Bank" value={result.bankName} />
          )}
          {result.accountName && (
            <Row label="Account Name" value={result.accountName} />
          )}
          {result.accountNumber && (
            <CopyRow
              label="Account #"
              value={result.accountNumber}
              onCopy={onCopy}
            />
          )}
          {result.instructions && (
            <p className="text-[11px] text-[#8b95b8] pt-2 border-t border-[#2a3050]/50">
              {result.instructions}
            </p>
          )}
        </div>
      </div>

      <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-[#5a6485] uppercase mb-0.5">
              Reference
            </p>
            <p className="text-xs font-mono text-white">{result.reference}</p>
          </div>
          <div className="flex items-center gap-1.5 bg-[#ffc107]/10 px-2.5 py-1 rounded-full">
            <Clock className="w-3 h-3 text-[#ffc107]" />
            <span className="text-[10px] font-bold text-[#ffc107]">
              PENDING
            </span>
          </div>
        </div>
      </div>

      {copied && (
        <p className="text-[10px] text-[#00d46e] text-center mb-3 font-medium">
          Copied to clipboard!
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/sports"
          className="flex-1 gradient-green text-white font-semibold text-sm py-3 rounded-xl flex items-center justify-center gap-2"
        >
          <Zap className="w-4 h-4" /> Continue Betting
        </Link>
        <Link
          href="/account/history"
          className="flex-1 bg-[#1c2033] border border-[#2a3050] text-[#8b95b8] font-medium text-sm py-3 rounded-xl text-center flex items-center justify-center gap-2"
        >
          <ExternalLink className="w-4 h-4" /> View History
        </Link>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-[#5a6485]">{label}</span>
      <span
        className="text-sm font-semibold"
        style={{ color: color || "#fff" }}
      >
        {value}
      </span>
    </div>
  );
}

function CopyRow({
  label,
  value,
  onCopy,
  mono,
}: {
  label: string;
  value: string;
  onCopy: (v: string) => void;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-xs text-[#5a6485] shrink-0">{label}</span>
      <div className="flex items-center gap-1.5 max-w-[70%]">
        <code
          className={`text-xs ${mono ? "font-mono" : ""} text-white break-all text-right`}
        >
          {value}
        </code>
        <button
          onClick={() => onCopy(value)}
          className="shrink-0 p-1 text-[#8b95b8] hover:text-white"
        >
          <Copy className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
