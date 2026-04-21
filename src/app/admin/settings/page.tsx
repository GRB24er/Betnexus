"use client";

import { useState, useEffect } from "react";
import { Save, AlertTriangle, Shield, DollarSign, Percent, Globe, Loader2, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";

type SettingsSection = {
  title: string;
  icon: React.ReactNode;
  fields: { key: string; label: string; type: string; hint?: string }[];
};

export default function AdminSettingsPage() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [settings, setSettings] = useState<Record<string, string>>({
    platformName: "BetNexus",
    currency: "GHS",
    minDeposit: "1",
    maxDeposit: "50000",
    minBet: "0.50",
    maxBet: "10000",
    minWithdrawal: "10",
    maxWithdrawal: "50000",
    houseEdge: "5",
    maxAccaLegs: "20",
    maxPayout: "100000",
    withdrawalProcessingDays: "1",
    kycRequired: "true",
    kycThreshold: "1000",
    referralBonus: "5",
    welcomeBonus: "100",
    maintenanceMode: "false",
  });

  const fetchSettings = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get<{ settings: Record<string, unknown> }>("/api/admin/settings");
      const s = res.settings;
      setSettings({
        platformName: String(s.platformName || "BetNexus"),
        currency: String(s.currency || "GHS"),
        minDeposit: String(s.minDeposit ?? "1"),
        maxDeposit: String(s.maxDeposit ?? "50000"),
        minBet: String(s.minBet ?? "0.50"),
        maxBet: String(s.maxBet ?? "10000"),
        minWithdrawal: String(s.minWithdrawal ?? "10"),
        maxWithdrawal: String(s.maxWithdrawal ?? "50000"),
        houseEdge: String(s.houseEdge ?? "5"),
        maxAccaLegs: String(s.maxAccaLegs ?? "20"),
        maxPayout: String(s.maxPayout ?? "100000"),
        withdrawalProcessingDays: String(s.withdrawalProcessingDays ?? "1"),
        kycRequired: String(s.kycRequired ?? "true"),
        kycThreshold: String(s.kycThreshold ?? "1000"),
        referralBonus: String(s.referralBonus ?? "5"),
        welcomeBonus: String(s.welcomeBonus ?? "100"),
        maintenanceMode: String(s.maintenanceMode ?? "false"),
      });
    } catch {
      setError("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSettings(); }, []);

  const sections: SettingsSection[] = [
    {
      title: "Platform",
      icon: <Globe className="w-4 h-4" />,
      fields: [
        { key: "platformName", label: "Platform Name", type: "text" },
        { key: "currency", label: "Currency", type: "text", hint: "e.g. GHS, NGN, USD" },
        { key: "maintenanceMode", label: "Maintenance Mode", type: "select" },
      ],
    },
    {
      title: "Deposit & Withdrawal Limits",
      icon: <DollarSign className="w-4 h-4" />,
      fields: [
        { key: "minDeposit", label: "Min Deposit", type: "number" },
        { key: "maxDeposit", label: "Max Deposit", type: "number" },
        { key: "minWithdrawal", label: "Min Withdrawal", type: "number" },
        { key: "maxWithdrawal", label: "Max Withdrawal", type: "number" },
        { key: "withdrawalProcessingDays", label: "Processing Days", type: "number", hint: "Business days to process" },
      ],
    },
    {
      title: "Betting Limits",
      icon: <Percent className="w-4 h-4" />,
      fields: [
        { key: "minBet", label: "Min Bet Stake", type: "number" },
        { key: "maxBet", label: "Max Bet Stake", type: "number" },
        { key: "maxPayout", label: "Max Payout", type: "number" },
        { key: "maxAccaLegs", label: "Max Acca Legs", type: "number" },
        { key: "houseEdge", label: "House Edge %", type: "number" },
      ],
    },
    {
      title: "Compliance & Bonuses",
      icon: <Shield className="w-4 h-4" />,
      fields: [
        { key: "kycRequired", label: "KYC Required", type: "select" },
        { key: "kycThreshold", label: "KYC Threshold (GHS)", type: "number", hint: "Require KYC above this withdrawal amount" },
        { key: "referralBonus", label: "Referral Bonus (GHS)", type: "number" },
        { key: "welcomeBonus", label: "Welcome Bonus %", type: "number" },
      ],
    },
  ];

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      // Convert numeric and boolean fields
      const payload: Record<string, unknown> = {};
      const numericFields = [
        "minDeposit", "maxDeposit", "minBet", "maxBet",
        "minWithdrawal", "maxWithdrawal", "maxPayout", "maxAccaLegs",
        "houseEdge", "withdrawalProcessingDays", "kycThreshold",
        "referralBonus", "welcomeBonus",
      ];
      const boolFields = ["kycRequired", "maintenanceMode"];

      for (const [key, value] of Object.entries(settings)) {
        if (numericFields.includes(key)) {
          payload[key] = Number(value);
        } else if (boolFields.includes(key)) {
          payload[key] = value === "true";
        } else {
          payload[key] = value;
        }
      }

      await api.post("/api/admin/settings", payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-[#00d46e]" />
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-4 lg:px-8 py-4 sm:py-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white">Platform Settings</h1>
          <p className="text-[10px] sm:text-xs text-[#5a6485]">Configure betting limits, compliance, and platform behavior</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchSettings}
            className="flex items-center gap-1.5 bg-[#1c2033] border border-[#2a3050] text-[#8b95b8] text-xs px-3 py-2 rounded-lg hover:border-[#00d46e]/30 transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Reload
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 gradient-green text-white text-xs font-semibold px-5 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saved ? "Saved!" : saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-[#ff4757]/10 border border-[#ff4757]/30 rounded-xl px-4 py-3 mb-4">
          <p className="text-xs text-[#ff4757]">{error}</p>
        </div>
      )}

      {/* Warning Banner */}
      <div className="bg-[#ffc107]/10 border border-[#ffc107]/30 rounded-xl px-3 sm:px-4 py-3 mb-6 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-[#ffc107] mt-0.5 shrink-0" />
        <div>
          <p className="text-xs font-medium text-[#ffc107]">Changes take effect immediately</p>
          <p className="text-[10px] text-[#ffc107]/70">
            Modifying betting limits or compliance settings will affect all new transactions. Existing bets are not affected.
          </p>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="space-y-4 sm:space-y-6">
        {sections.map((section) => (
          <div key={section.title} className="bg-[#1c2033] border border-[#2a3050] rounded-xl overflow-hidden">
            <div className="px-3 sm:px-4 py-3 border-b border-[#2a3050] flex items-center gap-2">
              <span className="text-[#00d46e]">{section.icon}</span>
              <h2 className="text-sm font-bold text-white">{section.title}</h2>
            </div>
            <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {section.fields.map((field) => (
                <div key={field.key}>
                  <label className="text-[10px] text-[#5a6485] uppercase mb-1 block">
                    {field.label}
                  </label>
                  {field.type === "select" ? (
                    <select
                      value={settings[field.key]}
                      onChange={(e) => updateSetting(field.key, e.target.value)}
                      className="w-full bg-[#0f1118] border border-[#2a3050] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00d46e]/50"
                    >
                      <option value="true">Enabled</option>
                      <option value="false">Disabled</option>
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      value={settings[field.key]}
                      onChange={(e) => updateSetting(field.key, e.target.value)}
                      className="w-full bg-[#0f1118] border border-[#2a3050] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00d46e]/50"
                    />
                  )}
                  {field.hint && (
                    <p className="text-[10px] text-[#5a6485] mt-1">{field.hint}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
