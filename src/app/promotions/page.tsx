"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Gift, ArrowRight, Clock, Star, Shield, Percent, Loader2, Tag } from "lucide-react";
import { api } from "@/lib/api";

const FALLBACK_PROMOS = [
  { id: "p1", code: "NEXUS500", name: "100% Welcome Bonus Up To $500", description: "Double your first deposit and get started with extra funds. Minimum deposit $20. 6x wagering requirement.", type: "welcome_bonus", badge: "WELCOME", gradient: "from-green-500 to-emerald-700", cta: "Claim Now" },
  { id: "p2", code: "FREEBETNX", name: "Free Bet Friday — $10 Free Bet", description: "Every Friday, active players receive a $10 free bet to use on any match. No deposit required.", type: "free_bet", badge: "WEEKLY", gradient: "from-blue-500 to-indigo-600", cta: "Get Free Bet" },
  { id: "p3", code: "CASHBACK10", name: "Cashback Monday — 10% Back", description: "Get 10% cashback on all losses every Monday. No wagering requirements. Credited by Tuesday noon.", type: "cashback", badge: "WEEKLY", gradient: "from-cyan-500 to-blue-600", cta: "Learn More" },
  { id: "p4", code: "REFER50", name: "Refer a Friend — $50 Bonus", description: "Invite friends and earn $50 for each referral who makes their first deposit.", type: "referral_bonus", badge: "ONGOING", gradient: "from-pink-500 to-rose-600", cta: "Refer Now" },
  { id: "p5", code: "VIP", name: "VIP Loyalty Program", description: "Climb the ranks and unlock exclusive rewards, higher limits, and personal account managers.", type: "loyalty_reward", badge: "EXCLUSIVE", gradient: "from-amber-500 to-yellow-600", cta: "Join VIP" },
  { id: "p6", code: "RELOAD50", name: "Weekend Reload — 50% Bonus", description: "Boost your weekend with a 50% deposit bonus up to $200 every Saturday!", type: "deposit_match", badge: "WEEKEND", gradient: "from-teal-500 to-emerald-600", cta: "Reload Now" },
];

const TYPE_BADGE: Record<string, string> = { welcome_bonus: "WELCOME", deposit_match: "DEPOSIT", free_bet: "FREE BET", cashback: "CASHBACK", referral_bonus: "REFERRAL", loyalty_reward: "VIP" };
const TYPE_GRADIENT: Record<string, string> = { welcome_bonus: "from-green-500 to-emerald-700", deposit_match: "from-teal-500 to-emerald-600", free_bet: "from-blue-500 to-indigo-600", cashback: "from-cyan-500 to-blue-600", referral_bonus: "from-pink-500 to-rose-600", loyalty_reward: "from-amber-500 to-yellow-600" };

type DbPromo = { _id: string; code: string; name: string; description: string; type: string; bonusPercent?: number; bonusAmount?: number; minDeposit?: number; maxBonus?: number; wagerMultiplier?: number; expiresAt: string };
type DisplayPromo = { id: string; code: string; name: string; description: string; type: string; badge: string; gradient: string; cta: string };

export default function PromotionsPage() {
  const [dbPromos, setDbPromos] = useState<DbPromo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ promos: DbPromo[] }>("/api/promotions")
      .then((res) => setDbPromos(res.promos || []))
      .catch(() => setDbPromos([]))
      .finally(() => setLoading(false));
  }, []);

  const displayPromos: DisplayPromo[] = dbPromos.length > 0
    ? dbPromos.map((p) => ({ id: p._id, code: p.code, name: p.name, description: p.description, type: p.type, badge: TYPE_BADGE[p.type] || "PROMO", gradient: TYPE_GRADIENT[p.type] || "from-green-500 to-emerald-700", cta: "Claim Now" }))
    : FALLBACK_PROMOS;

  const [featured, ...rest] = displayPromos;

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-r from-[#ffc107]/10 via-[#161925] to-[#ffc107]/10 border-b border-[#ffc107]/20">
        <div className="px-4 lg:px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#ffc107]/20 rounded-xl flex items-center justify-center">
                <Gift className="w-5 h-5 text-[#ffc107]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Promotions</h1>
                <p className="text-xs text-[#8b95b8]">Exclusive bonuses and offers for you</p>
              </div>
            </div>
            {dbPromos.length > 0 && (
              <span className="text-[10px] font-bold bg-[#00d46e]/20 text-[#00d46e] border border-[#00d46e]/30 px-2.5 py-1 rounded-full">{dbPromos.length} ACTIVE</span>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-6 py-6">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#00d46e]" /></div>
        ) : (
          <>
            {featured && (
              <div className={`bg-gradient-to-br ${featured.gradient} rounded-2xl p-6 sm:p-8 mb-6 relative overflow-hidden`}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                <div className="relative z-10 max-w-lg">
                  <span className="inline-block text-[11px] font-bold bg-white/20 text-white px-3 py-1 rounded-full mb-4">{featured.badge}</span>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">{featured.name}</h2>
                  <p className="text-sm text-white/70 mb-4">{featured.description}</p>
                  {featured.code && (
                    <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 mb-4">
                      <Tag className="w-3.5 h-3.5 text-white/70" />
                      <span className="text-xs text-white/70">Code:</span>
                      <span className="text-sm font-bold text-white tracking-wider">{featured.code}</span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-3">
                    <Link href="/deposit" className="flex items-center gap-1.5 bg-white text-gray-900 font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-white/90 transition-all">
                      {featured.cta} <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link href="/register" className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-4 py-2.5 rounded-xl backdrop-blur-sm transition-all">
                      Register Now
                    </Link>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {rest.map((promo) => (
                <div key={promo.id} className="bg-[#1c2033] border border-[#2a3050] rounded-xl overflow-hidden hover:border-[#3a4060] transition-all group">
                  <div className={`bg-gradient-to-r ${promo.gradient} p-4 flex items-center justify-between`}>
                    <span className="text-[10px] font-bold bg-white/20 text-white px-2.5 py-1 rounded-full">{promo.badge}</span>
                    <Gift className="w-5 h-5 text-white/60" />
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-bold text-white mb-2 group-hover:text-[#00d46e] transition-colors">{promo.name}</h3>
                    <p className="text-xs text-[#8b95b8] mb-3 leading-relaxed">{promo.description}</p>
                    {promo.code && (
                      <div className="flex items-center gap-2 bg-[#0f1118] border border-[#2a3050] rounded-lg px-2.5 py-1.5 mb-3">
                        <Tag className="w-3 h-3 text-[#5a6485]" />
                        <span className="text-[10px] text-[#5a6485]">Code:</span>
                        <span className="text-xs font-bold text-white tracking-wider">{promo.code}</span>
                      </div>
                    )}
                    <Link href="/deposit" className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all">
                      {promo.cta} <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-6">
              <h3 className="text-base font-bold text-white mb-4">Why BetNexus Promotions?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <BenefitCard icon={<Percent className="w-5 h-5 text-[#00d46e]" />} title="Best Odds Guaranteed" description="We match or beat the best odds in the market." />
                <BenefitCard icon={<Clock className="w-5 h-5 text-[#3b82f6]" />} title="Instant Payouts" description="Winnings credited to your account instantly." />
                <BenefitCard icon={<Star className="w-5 h-5 text-[#ffc107]" />} title="VIP Rewards" description="Exclusive perks for our most loyal players." />
                <BenefitCard icon={<Shield className="w-5 h-5 text-[#8b5cf6]" />} title="Fair Play Certified" description="All games audited by independent authorities." />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function BenefitCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 bg-[#0f1118] rounded-lg flex items-center justify-center shrink-0">{icon}</div>
      <div>
        <p className="text-xs font-semibold text-white mb-0.5">{title}</p>
        <p className="text-[11px] text-[#5a6485]">{description}</p>
      </div>
    </div>
  );
}
