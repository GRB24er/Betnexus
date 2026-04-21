"use client";

import { useState } from "react";
import { Save, AlertTriangle, Shield, DollarSign, Percent, Globe } from "lucide-react";

type SettingsSection = {
  title: string;
  icon: React.ReactNode;
  fields: { key: string; label: string; type: string; value: string; hint?: string }[];
};

export default function AdminSettingsPage() {
  const [saved, setSaved] = useState(false);
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

  const sections: SettingsSection[] = [
    {
      title: "Platform",
      icon: <Globe className="w-4 h-4" />,
      fields: [
        { key: "platformName", label: "Platform Name", type: "text", value: settings.platformName },
        { key: "currency", label: "Currency", type: "text", value: settings.currency, hint: "e.g. GHS, NGN, USD" },
        { key: "maintenanceMode", label: "Maintenance Mode", type: "select", value: settings.maintenanceMode },
      ],
    },
    {
      title: "Deposit & Withdrawal Limits",
      icon: <DollarSign className="w-4 h-4" />,
      fields: [
        { key: "minDeposit", label: "Min Deposit", type: "number", value: settings.minDeposit },
        { key: "maxDeposit", label: "Max Deposit", type: "number", value: settings.maxDeposit },
        { key: "minWithdrawal", label: "Min Withdrawal", type: "number", value: settings.minWithdrawal },
        { key: "maxWithdrawal", label: "Max Withdrawal", type: "number", value: settings.maxWithdrawal },
        { key: "withdrawalProcessingDays", label: "Processing Days", type: "number", value: settings.withdrawalProcessingDays, hint: "Business days to process" },
      ],
    },
    {
      title: "Betting Limits",
      icon: <Percent className="w-4 h-4" />,
      fields: [
        { key: "minBet", label: "Min Bet Stake", type: "number", value: settings.minBet },
        { key: "maxBet", label: "Max Bet Stake", type: "number", value: settings.maxBet },
        { key: "maxPayout", label: "Max Payout", type: "number", value: settings.maxPayout },
        { key: "maxAccaLegs", label: "Max Acca Legs", type: "number", value: settings.maxAccaLegs },
        { key: "houseEdge", label: "House Edge %", type: "number", value: settings.houseEdge },
      ],
    },
    {
      title: "Compliance & Bonuses",
      icon: <Shield className="w-4 h-4" />,
      fields: [
        { key: "kycRequired", label: "KYC Required", type: "select", value: settings.kycRequired },
        { key: "kycThreshold", label: "KYC Threshold (GHS)", type: "number", value: settings.kycThreshold, hint: "Require KYC above this withdrawal amount" },
        { key: "referralBonus", label: "Referral Bonus (GHS)", type: "number", value: settings.referralBonus },
        { key: "welcomeBonus", label: "Welcome Bonus %", type: "number", value: settings.welcomeBonus },
      ],
    },
  ];

  const handleSave = () => {
    // In production, this would POST to /api/admin/settings
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="px-4 lg:px-8 py-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Platform Settings</h1>
          <p className="text-xs text-[#5a6485]">Configure betting limits, compliance, and platform behavior</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 gradient-green text-white text-xs font-semibold px-5 py-2 rounded-lg hover:opacity-90 transition-opacity"
        >
          <Save className="w-3.5 h-3.5" />
          {saved ? "Saved!" : "Save Changes"}
        </button>
      </div>

      {/* Warning Banner */}
      <div className="bg-[#ffc107]/10 border border-[#ffc107]/30 rounded-xl px-4 py-3 mb-6 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-[#ffc107] mt-0.5 shrink-0" />
        <div>
          <p className="text-xs font-medium text-[#ffc107]">Changes take effect immediately</p>
          <p className="text-[10px] text-[#ffc107]/70">
            Modifying betting limits or compliance settings will affect all new transactions. Existing bets are not affected.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.title} className="bg-[#1c2033] border border-[#2a3050] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#2a3050] flex items-center gap-2">
              <span className="text-[#00d46e]">{section.icon}</span>
              <h2 className="text-sm font-bold text-white">{section.title}</h2>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {section.fields.map((field) => (
                <div key={field.key}>
                  <label className="text-[10px] text-[#5a6485] uppercase mb-1 block">
                    {field.label}
                  </label>
                  {field.type === "select" ? (
                    <select
                      value={field.value}
                      onChange={(e) => updateSetting(field.key, e.target.value)}
                      className="w-full bg-[#0f1118] border border-[#2a3050] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00d46e]/50"
                    >
                      <option value="true">Enabled</option>
                      <option value="false">Disabled</option>
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      value={field.value}
                      onChange={(e) => updateSetting(field.key, e.target.value)}
                      className="w-full bg-[#0f1118] border border-[#2a3050] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00d46e]/50"
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
