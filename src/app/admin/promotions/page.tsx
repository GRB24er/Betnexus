"use client";

import { useEffect, useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

type Promo = {
  _id: string;
  code: string;
  name: string;
  type: string;
  status: string;
  bonusPercent?: number;
  bonusAmount?: number;
  maxRedemptions: number;
  currentRedemptions: number;
  startsAt: string;
  expiresAt: string;
};

export default function AdminPromosPage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    code: "",
    name: "",
    description: "",
    type: "deposit_match",
    bonusPercent: 100,
    minDeposit: 10,
    maxBonus: 500,
    wagerMultiplier: 5,
    maxRedemptions: 1000,
    perUserLimit: 1,
    startsAt: new Date().toISOString().slice(0, 16),
    expiresAt: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 16),
  });

  const fetch = () => {
    setLoading(true);
    api.get<{ promos: Promo[] }>("/api/admin/promos")
      .then((r) => setPromos(r.promos))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(fetch, []);

  const handleCreate = async () => {
    await api.post("/api/admin/promos", {
      ...form,
      bonusPercent: Number(form.bonusPercent),
      minDeposit: Number(form.minDeposit),
      maxBonus: Number(form.maxBonus),
      wagerMultiplier: Number(form.wagerMultiplier),
      maxRedemptions: Number(form.maxRedemptions),
      perUserLimit: Number(form.perUserLimit),
    });
    setShowCreate(false);
    fetch();
  };

  return (
    <div className="px-4 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-white">Promotions</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="gradient-green text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> Create Promo
        </button>
      </div>

      {showCreate && (
        <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-5 mb-6">
          <h3 className="text-sm font-bold text-white mb-4">New Promotion</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {[
              { key: "code", label: "Promo Code", placeholder: "WELCOME100" },
              { key: "name", label: "Name", placeholder: "Welcome Bonus" },
              { key: "description", label: "Description", placeholder: "100% deposit match" },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="text-[11px] text-[#8b95b8] mb-1 block">{label}</label>
                <input
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder}
                  className="w-full bg-[#0f1118] border border-[#2a3050] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>
            ))}
            <div>
              <label className="text-[11px] text-[#8b95b8] mb-1 block">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full bg-[#0f1118] border border-[#2a3050] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="welcome_bonus">Welcome Bonus</option>
                <option value="deposit_match">Deposit Match</option>
                <option value="free_bet">Free Bet</option>
                <option value="cashback">Cashback</option>
              </select>
            </div>
            {[
              { key: "bonusPercent", label: "Bonus %" },
              { key: "minDeposit", label: "Min Deposit" },
              { key: "maxBonus", label: "Max Bonus" },
              { key: "wagerMultiplier", label: "Wager Multiplier" },
              { key: "maxRedemptions", label: "Max Redemptions" },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="text-[11px] text-[#8b95b8] mb-1 block">{label}</label>
                <input
                  type="number"
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="w-full bg-[#0f1118] border border-[#2a3050] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>
            ))}
            <div>
              <label className="text-[11px] text-[#8b95b8] mb-1 block">Starts At</label>
              <input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} className="w-full bg-[#0f1118] border border-[#2a3050] rounded-lg px-3 py-2 text-xs text-white focus:outline-none" />
            </div>
            <div>
              <label className="text-[11px] text-[#8b95b8] mb-1 block">Expires At</label>
              <input type="datetime-local" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className="w-full bg-[#0f1118] border border-[#2a3050] rounded-lg px-3 py-2 text-xs text-white focus:outline-none" />
            </div>
          </div>
          <button onClick={handleCreate} className="gradient-green text-white text-xs font-semibold px-6 py-2 rounded-lg">
            Create Promotion
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#00d46e]" /></div>
      ) : (
        <div className="space-y-2">
          {promos.map((p) => (
            <div key={p._id} className="bg-[#1c2033] border border-[#2a3050] rounded-xl px-4 py-3 flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-[#ffc107] font-mono">{p.code}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    p.status === "active" ? "bg-[#00d46e]/20 text-[#00d46e]" :
                    p.status === "paused" ? "bg-[#ffc107]/20 text-[#ffc107]" :
                    "bg-[#ff4757]/20 text-[#ff4757]"
                  }`}>{p.status.toUpperCase()}</span>
                </div>
                <p className="text-xs text-white">{p.name}</p>
                <p className="text-[10px] text-[#5a6485]">
                  {p.bonusPercent ? `${p.bonusPercent}% match` : `GHS ${p.bonusAmount}`} |
                  {p.currentRedemptions}/{p.maxRedemptions || "∞"} redeemed |
                  Expires {new Date(p.expiresAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
          {promos.length === 0 && (
            <p className="text-sm text-[#5a6485] text-center py-16">No promotions yet</p>
          )}
        </div>
      )}
    </div>
  );
}
