"use client";

import { useEffect, useState } from "react";
import {
  Save,
  Loader2,
  Wallet,
  Banknote,
  Smartphone,
  Bitcoin,
  RefreshCw,
} from "lucide-react";
import { api } from "@/lib/api";

type Provider = {
  id: string;
  label: string;
  enabled: boolean;
  walletAddress?: string;
  walletNetwork?: string;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  swiftCode?: string;
  routingNumber?: string;
  momoNumber?: string;
  momoName?: string;
  instructions?: string;
  minAmount?: number;
  maxAmount?: number;
  feePercent?: number;
};

type Config = {
  activeProvider: string;
  providers: Provider[];
};

const ICONS: Record<string, React.ReactNode> = {
  korapay: <Banknote className="w-4 h-4 text-[#3b82f6]" />,
  paystack: <Banknote className="w-4 h-4 text-[#0BA4DB]" />,
  mtn_momo: <Smartphone className="w-4 h-4 text-[#FFCB05]" />,
  telecel_cash: <Smartphone className="w-4 h-4 text-[#E30613]" />,
  btc: <Bitcoin className="w-4 h-4 text-[#F7931A]" />,
  usdt_trc20: <Wallet className="w-4 h-4 text-[#26A17B]" />,
  eth: <Wallet className="w-4 h-4 text-[#627EEA]" />,
  bank_transfer: <Banknote className="w-4 h-4 text-[#8b95b8]" />,
};

export default function PaymentConfigPage() {
  const [cfg, setCfg] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const fetchCfg = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ config: Config }>("/api/admin/payment-config");
      setCfg(res.config);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Failed to load config");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCfg();
  }, []);

  const updateProvider = (id: string, patch: Partial<Provider>) => {
    if (!cfg) return;
    setCfg({
      ...cfg,
      providers: cfg.providers.map((p) =>
        p.id === id ? { ...p, ...patch } : p
      ),
    });
  };

  const save = async () => {
    if (!cfg) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await api.patch<{ config: Config }>(
        "/api/admin/payment-config",
        {
          activeProvider: cfg.activeProvider,
          providers: cfg.providers,
        }
      );
      setCfg(res.config);
      setMsg("Saved");
      setTimeout(() => setMsg(null), 2000);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !cfg)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#00d46e]" />
      </div>
    );

  return (
    <div className="px-3 sm:px-4 lg:px-8 py-4 sm:py-6 max-w-[1100px] mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-[#00d46e]" />
            Payment & Deposit Providers
          </h1>
          <p className="text-[11px] text-[#5a6485]">
            Switch deposit providers and configure addresses for users
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchCfg}
            className="p-2 text-[#8b95b8] hover:text-[#00d46e] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 gradient-green text-white text-xs font-bold rounded-lg disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Save
          </button>
        </div>
      </div>

      {msg && (
        <div className="mb-4 px-3 py-2 bg-[#00d46e]/10 border border-[#00d46e]/30 rounded-lg text-xs text-[#00d46e]">
          {msg}
        </div>
      )}

      {/* Primary provider selector */}
      <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-4 mb-5">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
          Primary Provider
        </h3>
        <p className="text-[11px] text-[#5a6485] mb-3">
          The provider shown by default on the user deposit page.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {cfg.providers.map((p) => (
            <button
              key={p.id}
              onClick={() => setCfg({ ...cfg, activeProvider: p.id })}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs transition-all ${
                cfg.activeProvider === p.id
                  ? "bg-[#00d46e]/10 border-[#00d46e] text-[#00d46e]"
                  : "bg-[#0f1118] border-[#2a3050] text-[#8b95b8] hover:text-white"
              }`}
            >
              {ICONS[p.id]}
              <span className="font-medium truncate">{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Per-provider settings */}
      <div className="space-y-3">
        {cfg.providers.map((p) => (
          <div
            key={p.id}
            className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {ICONS[p.id]}
                <h3 className="text-sm font-bold text-white">{p.label}</h3>
                {cfg.activeProvider === p.id && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-[#00d46e]/15 text-[#00d46e] rounded">
                    PRIMARY
                  </span>
                )}
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <span className="text-[10px] text-[#5a6485] uppercase">
                  {p.enabled ? "Enabled" : "Disabled"}
                </span>
                <button
                  onClick={() =>
                    updateProvider(p.id, { enabled: !p.enabled })
                  }
                  className={`w-9 h-5 rounded-full transition-colors relative ${
                    p.enabled ? "bg-[#00d46e]" : "bg-[#2a3050]"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                      p.enabled ? "left-[18px]" : "left-0.5"
                    }`}
                  />
                </button>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(p.id === "btc" ||
                p.id === "usdt_trc20" ||
                p.id === "eth") && (
                <>
                  <Field
                    label="Wallet Address"
                    value={p.walletAddress || ""}
                    onChange={(v) =>
                      updateProvider(p.id, { walletAddress: v })
                    }
                    placeholder="Public deposit address"
                  />
                  <Field
                    label="Network"
                    value={p.walletNetwork || ""}
                    onChange={(v) =>
                      updateProvider(p.id, { walletNetwork: v })
                    }
                    placeholder="BTC / TRC-20 / ERC-20"
                  />
                </>
              )}
              {(p.id === "mtn_momo" || p.id === "telecel_cash") && (
                <>
                  <Field
                    label="MoMo Number"
                    value={p.momoNumber || ""}
                    onChange={(v) => updateProvider(p.id, { momoNumber: v })}
                    placeholder="024 XXX XXXX"
                  />
                  <Field
                    label="Account Name"
                    value={p.momoName || ""}
                    onChange={(v) => updateProvider(p.id, { momoName: v })}
                    placeholder="BetNexus"
                  />
                </>
              )}
              {p.id === "bank_transfer" && (
                <>
                  <Field
                    label="Bank Name"
                    value={p.bankName || ""}
                    onChange={(v) => updateProvider(p.id, { bankName: v })}
                  />
                  <Field
                    label="Account Name"
                    value={p.accountName || ""}
                    onChange={(v) => updateProvider(p.id, { accountName: v })}
                  />
                  <Field
                    label="Account Number"
                    value={p.accountNumber || ""}
                    onChange={(v) =>
                      updateProvider(p.id, { accountNumber: v })
                    }
                  />
                  <Field
                    label="SWIFT / BIC"
                    value={p.swiftCode || ""}
                    onChange={(v) => updateProvider(p.id, { swiftCode: v })}
                  />
                </>
              )}
              <Field
                label="Min Amount"
                type="number"
                value={String(p.minAmount ?? 0)}
                onChange={(v) =>
                  updateProvider(p.id, { minAmount: parseFloat(v) || 0 })
                }
              />
              <Field
                label="Max Amount"
                type="number"
                value={String(p.maxAmount ?? 0)}
                onChange={(v) =>
                  updateProvider(p.id, { maxAmount: parseFloat(v) || 0 })
                }
              />
              <div className="sm:col-span-2">
                <Field
                  label="User Instructions"
                  value={p.instructions || ""}
                  onChange={(v) => updateProvider(p.id, { instructions: v })}
                  placeholder="Shown on the deposit page"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
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
      <label className="block text-[10px] text-[#5a6485] uppercase mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#0f1118] border border-[#2a3050] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00d46e]/50"
      />
    </div>
  );
}
