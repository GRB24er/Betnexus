"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2,
  Banknote,
  Bitcoin,
  Smartphone,
  Landmark,
  ChevronRight,
  Check,
  ArrowLeft,
} from "lucide-react";
import { api } from "@/lib/api";

type Method = "crypto" | "mtn_momo" | "telecel_cash" | "bank_transfer";

export default function SubadminPayoutPage() {
  const [available, setAvailable] = useState<number>(0);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [method, setMethod] = useState<Method>("mtn_momo");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  // crypto
  const [cryptoAddress, setCryptoAddress] = useState("");
  const [cryptoNetwork, setCryptoNetwork] = useState("BTC");
  // momo
  const [momoNumber, setMomoNumber] = useState("");
  const [momoName, setMomoName] = useState("");
  // bank
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [swiftCode, setSwiftCode] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");

  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ stats: { availableForPayout: number } }>(
        "/api/subadmin/dashboard"
      )
      .then((res) => setAvailable(res.stats.availableForPayout))
      .catch(() => {})
      .finally(() => setLoadingMeta(false));
  }, []);

  const submit = async () => {
    setError(null);
    const a = parseFloat(amount);
    if (!a || a <= 0) {
      setError("Enter a valid amount");
      return;
    }
    if (a > available) {
      setError(`Amount exceeds available (GHS ${available.toFixed(2)})`);
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post<{ payout: { _id: string } }>(
        "/api/subadmin/payout",
        {
          amount: a,
          method,
          cryptoAddress: method === "crypto" ? cryptoAddress : undefined,
          cryptoNetwork: method === "crypto" ? cryptoNetwork : undefined,
          momoNumber:
            method === "mtn_momo" || method === "telecel_cash"
              ? momoNumber
              : undefined,
          momoName:
            method === "mtn_momo" || method === "telecel_cash"
              ? momoName
              : undefined,
          momoNetwork:
            method === "mtn_momo"
              ? "MTN"
              : method === "telecel_cash"
                ? "Telecel"
                : undefined,
          bankName: method === "bank_transfer" ? bankName : undefined,
          accountName: method === "bank_transfer" ? accountName : undefined,
          accountNumber:
            method === "bank_transfer" ? accountNumber : undefined,
          swiftCode:
            method === "bank_transfer" ? swiftCode || undefined : undefined,
          routingNumber:
            method === "bank_transfer"
              ? routingNumber || undefined
              : undefined,
          note: note || undefined,
        }
      );
      setSubmittedRef(res.payout._id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedRef) {
    return (
      <div className="px-3 sm:px-4 lg:px-8 py-12 max-w-md mx-auto text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#00d46e]/15 flex items-center justify-center mx-auto mb-5">
          <Check className="w-8 h-8 text-[#00d46e]" />
        </div>
        <h2 className="text-lg font-bold text-white mb-2">
          Payout Request Submitted
        </h2>
        <p className="text-sm text-[#8b95b8] mb-6">
          Your request has been sent to the administrator. You will be notified
          when processed.
        </p>
        <Link
          href="/subadmin"
          className="inline-block gradient-green text-white text-sm font-bold px-6 py-3 rounded-lg"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-4 lg:px-8 py-4 sm:py-6 max-w-2xl mx-auto">
      <Link
        href="/subadmin"
        className="flex items-center gap-1 text-xs text-[#5a6485] hover:text-white mb-4"
      >
        <ArrowLeft className="w-3 h-3" /> Dashboard
      </Link>

      <h1 className="text-lg sm:text-xl font-bold text-white mb-1 flex items-center gap-2">
        <Banknote className="w-5 h-5 text-[#00d46e]" />
        Request Commission Payout
      </h1>
      <p className="text-[11px] text-[#5a6485] mb-5">
        Available for payout:{" "}
        <span className="text-[#00d46e] font-bold">
          {loadingMeta ? "…" : `GHS ${available.toFixed(2)}`}
        </span>
      </p>

      <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-4 mb-3">
        <p className="text-xs font-bold text-white uppercase tracking-wider mb-3">
          Payout Method
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <MethodTile
            id="mtn_momo"
            label="MTN MoMo"
            color="#FFCB05"
            icon={<Smartphone className="w-4 h-4" />}
            active={method === "mtn_momo"}
            onClick={() => setMethod("mtn_momo")}
          />
          <MethodTile
            id="telecel_cash"
            label="Telecel Cash"
            color="#E30613"
            icon={<Smartphone className="w-4 h-4" />}
            active={method === "telecel_cash"}
            onClick={() => setMethod("telecel_cash")}
          />
          <MethodTile
            id="crypto"
            label="Crypto"
            color="#F7931A"
            icon={<Bitcoin className="w-4 h-4" />}
            active={method === "crypto"}
            onClick={() => setMethod("crypto")}
          />
          <MethodTile
            id="bank_transfer"
            label="Bank"
            color="#3b82f6"
            icon={<Landmark className="w-4 h-4" />}
            active={method === "bank_transfer"}
            onClick={() => setMethod("bank_transfer")}
          />
        </div>
      </div>

      <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-4 mb-3 space-y-3">
        <Field
          label="Amount (GHS)"
          type="number"
          value={amount}
          onChange={setAmount}
          placeholder="0.00"
        />

        {method === "crypto" && (
          <>
            <Field
              label="Wallet Address"
              value={cryptoAddress}
              onChange={setCryptoAddress}
            />
            <div>
              <label className="text-[10px] text-[#5a6485] uppercase mb-1 block">
                Network
              </label>
              <select
                value={cryptoNetwork}
                onChange={(e) => setCryptoNetwork(e.target.value)}
                className="w-full bg-[#0f1118] border border-[#2a3050] rounded-lg px-3 py-2.5 text-sm text-white"
              >
                <option value="BTC">BTC (Bitcoin)</option>
                <option value="TRC-20">USDT (TRC-20)</option>
                <option value="ERC-20">ETH / USDT (ERC-20)</option>
                <option value="BEP-20">BNB / BUSD (BEP-20)</option>
              </select>
            </div>
          </>
        )}

        {(method === "mtn_momo" || method === "telecel_cash") && (
          <>
            <Field
              label={`${method === "mtn_momo" ? "MTN" : "Telecel"} Number`}
              value={momoNumber}
              onChange={setMomoNumber}
              placeholder="024 XXX XXXX"
            />
            <Field
              label="Account Name"
              value={momoName}
              onChange={setMomoName}
            />
          </>
        )}

        {method === "bank_transfer" && (
          <>
            <Field label="Bank Name" value={bankName} onChange={setBankName} />
            <Field
              label="Account Name"
              value={accountName}
              onChange={setAccountName}
            />
            <Field
              label="Account Number"
              value={accountNumber}
              onChange={setAccountNumber}
            />
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="SWIFT (optional)"
                value={swiftCode}
                onChange={setSwiftCode}
              />
              <Field
                label="Routing (optional)"
                value={routingNumber}
                onChange={setRoutingNumber}
              />
            </div>
          </>
        )}

        <div>
          <label className="text-[10px] text-[#5a6485] uppercase mb-1 block">
            Note (optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="w-full bg-[#0f1118] border border-[#2a3050] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00d46e]/50"
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
          <ChevronRight className="w-4 h-4" />
        )}
        Submit Payout Request
      </button>
    </div>
  );
}

function MethodTile({
  id,
  label,
  color,
  icon,
  active,
  onClick,
}: {
  id: string;
  label: string;
  color: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  void id;
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg border text-xs transition-all ${
        active
          ? "bg-[#00d46e]/10 border-[#00d46e]"
          : "bg-[#0f1118] border-[#2a3050] hover:border-[#3a4060]"
      }`}
      style={active ? undefined : { color }}
    >
      {icon}
      <span
        className={`font-bold ${active ? "text-[#00d46e]" : "text-white"}`}
      >
        {label}
      </span>
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="text-[10px] text-[#5a6485] uppercase mb-1 block">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#0f1118] border border-[#2a3050] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00d46e]/50"
      />
    </div>
  );
}
