"use client";

import { Gift, ArrowRight, Clock, Star, Shield, Percent } from "lucide-react";
import { promotions } from "@/lib/data";

const allPromotions = [
  ...promotions,
  {
    id: "p5",
    title: "Cashback Monday - 10% Back",
    description: "Get 10% cashback on all losses every Monday. No wagering requirements!",
    badge: "WEEKLY",
    gradient: "from-cyan-500 to-blue-600",
    cta: "Learn More",
  },
  {
    id: "p6",
    title: "Refer a Friend - $50 Bonus",
    description: "Invite friends and earn $50 for each referral who makes a deposit.",
    badge: "ONGOING",
    gradient: "from-pink-500 to-rose-600",
    cta: "Refer Now",
  },
  {
    id: "p7",
    title: "VIP Loyalty Program",
    description: "Climb the ranks and unlock exclusive rewards, higher limits, and personal account managers.",
    badge: "EXCLUSIVE",
    gradient: "from-amber-500 to-yellow-600",
    cta: "Join VIP",
  },
  {
    id: "p8",
    title: "Weekend Reload - 50% Bonus",
    description: "Boost your weekend with a 50% deposit bonus up to $200 every Saturday!",
    badge: "WEEKEND",
    gradient: "from-teal-500 to-emerald-600",
    cta: "Reload Now",
  },
];

export default function PromotionsPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#ffc107]/10 via-[#161925] to-[#ffc107]/10 border-b border-[#ffc107]/20">
        <div className="px-4 lg:px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#ffc107]/20 rounded-xl flex items-center justify-center">
              <Gift className="w-5 h-5 text-[#ffc107]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Promotions</h1>
              <p className="text-xs text-[#8b95b8]">
                Exclusive bonuses and offers for you
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-6 py-6">
        {/* Featured Promo */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-700 rounded-2xl p-6 sm:p-8 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10 max-w-lg">
            <span className="inline-block text-[11px] font-bold bg-white/20 text-white px-3 py-1 rounded-full mb-4">
              WELCOME OFFER
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              100% Welcome Bonus Up To $500
            </h2>
            <p className="text-sm text-white/70 mb-6">
              Double your first deposit and get started with extra funds. Use bonus code{" "}
              <span className="font-bold text-white">NEXUS500</span> at checkout.
              Minimum deposit $20. 6x wagering requirement.
            </p>
            <div className="flex flex-wrap gap-3">
              <button className="bg-white text-green-700 font-bold text-sm px-6 py-3 rounded-lg hover:bg-white/90 transition-colors flex items-center gap-2">
                Claim Now <ArrowRight className="w-4 h-4" />
              </button>
              <button className="bg-white/20 text-white font-semibold text-sm px-6 py-3 rounded-lg hover:bg-white/30 transition-colors backdrop-blur-sm">
                Terms & Conditions
              </button>
            </div>
          </div>
        </div>

        {/* Promo Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {allPromotions.slice(1).map((promo) => (
            <div
              key={promo.id}
              className={`bg-gradient-to-br ${promo.gradient} rounded-xl p-5 relative overflow-hidden group cursor-pointer hover:scale-[1.01] transition-transform`}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <span className="inline-block text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full mb-3">
                {promo.badge}
              </span>
              <h3 className="text-base font-bold text-white mb-1.5">
                {promo.title}
              </h3>
              <p className="text-xs text-white/70 mb-4">{promo.description}</p>
              <button className="bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-4 py-2 rounded-lg backdrop-blur-sm transition-all flex items-center gap-1.5">
                {promo.cta} <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Benefits Section */}
        <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-6">
          <h3 className="text-base font-bold text-white mb-4">
            Why BetNexus Promotions?
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <BenefitCard
              icon={<Percent className="w-5 h-5 text-[#00d46e]" />}
              title="Best Odds Guaranteed"
              description="We match or beat the best odds in the market."
            />
            <BenefitCard
              icon={<Clock className="w-5 h-5 text-[#3b82f6]" />}
              title="Instant Payouts"
              description="Winnings credited to your account instantly."
            />
            <BenefitCard
              icon={<Star className="w-5 h-5 text-[#ffc107]" />}
              title="VIP Rewards"
              description="Exclusive perks for our most loyal players."
            />
            <BenefitCard
              icon={<Shield className="w-5 h-5 text-[#8b5cf6]" />}
              title="Fair Play Certified"
              description="All games audited by independent authorities."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function BenefitCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 bg-[#0f1118] rounded-lg flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold text-white mb-0.5">{title}</p>
        <p className="text-[11px] text-[#5a6485]">{description}</p>
      </div>
    </div>
  );
}
