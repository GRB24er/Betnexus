"use client";
import { useState, useEffect } from "react";
import {
  Zap,
  TrendingUp,
  ArrowRight,
  ChevronRight,
  Timer,
  Users,
  Star,
  Trophy,
  Flame,
  Shield,
  Headphones,
  CreditCard,
  Clock,
} from "lucide-react";
import Link from "next/link";
import MatchCard from "@/components/MatchCard";
import { promotions, virtualGames, casinoGames, Match } from "@/lib/data";

export default function HomePage() {
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [featuredMatches, setFeaturedMatches] = useState<Match[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);

  useEffect(() => {
    fetch("/api/matches?type=all")
      .then((r) => r.json())
      .then((data) => {
        setLiveMatches((data.live || []).slice(0, 6));
        setFeaturedMatches((data.upcoming || []).slice(0, 6));
      })
      .catch(console.error)
      .finally(() => setLoadingMatches(false));
  }, []);

  return (
    <div className="min-h-screen">
      {/* ═══ HERO BANNER ═══ */}
      <section className="relative gradient-hero-premium overflow-hidden">
        {/* Decorative orbs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00d46e] rounded-full blur-[200px] opacity-[0.04]" />
        <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] bg-[#3b82f6] rounded-full blur-[150px] opacity-[0.05]" />

        <div className="relative px-4 lg:px-6 pt-8 lg:pt-12 pb-6">
          {/* Main CTA Hero */}
          <div className="mb-8 fade-in-up">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold bg-[#00d46e]/15 text-[#00d46e] px-3 py-1 rounded-full border border-[#00d46e]/20">
                <Zap className="w-3 h-3" fill="currentColor" /> LIVE BETTING
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold bg-[#ff4757]/15 text-[#ff4757] px-3 py-1 rounded-full border border-[#ff4757]/20">
                <span className="w-1.5 h-1.5 bg-[#ff4757] rounded-full live-pulse" /> {liveMatches.length || "—"} LIVE
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-2">
              Bet on <span className="text-gradient-green">Real Sports.</span><br />
              Win <span className="text-gradient-gold">Real Money.</span>
            </h1>
            <p className="text-sm sm:text-base text-[#8b95b8] max-w-lg mb-5">
              Live odds from 16+ leagues. Instant deposits. Fast payouts. Your next big win starts here.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/sports"
                className="inline-flex items-center gap-2 gradient-green text-white font-bold text-sm px-6 py-3 rounded-xl hover:opacity-90 transition-all glow-green-strong"
              >
                Start Betting <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/live"
                className="inline-flex items-center gap-2 bg-[#ff4757]/10 border border-[#ff4757]/30 text-[#ff4757] font-bold text-sm px-6 py-3 rounded-xl hover:bg-[#ff4757]/20 transition-all"
              >
                <span className="w-2 h-2 bg-[#ff4757] rounded-full live-pulse" /> Watch Live
              </Link>
            </div>
          </div>

          {/* Promotions Carousel */}
          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0">
            {promotions.map((promo, i) => (
              <div
                key={promo.id}
                className={`min-w-[260px] sm:min-w-[320px] md:min-w-[300px] lg:min-w-0 lg:flex-1 snap-start bg-gradient-to-br ${promo.gradient} rounded-xl p-4 sm:p-5 lg:p-6 relative overflow-hidden card-hover fade-in-up fade-in-up-delay-${i + 1}`}
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                <span className="inline-block text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full mb-3">
                  {promo.badge}
                </span>
                <h3 className="text-lg font-bold text-white mb-1.5 leading-tight">
                  {promo.title}
                </h3>
                <p className="text-sm text-white/70 mb-4">{promo.description}</p>
                <Link
                  href="/promotions"
                  className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-4 py-2 rounded-lg backdrop-blur-sm transition-all"
                >
                  {promo.cta} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mt-6">
            <StatCard icon={<Zap className="w-4 h-4" />} label="Live Events" value={String(liveMatches.length || "24")} color="text-[#ff4757]" />
            <StatCard icon={<TrendingUp className="w-4 h-4" />} label="Today's Events" value="1,247" color="text-[#00d46e]" />
            <StatCard icon={<Users className="w-4 h-4" />} label="Online Now" value="15,892" color="text-[#3b82f6]" />
            <StatCard icon={<Trophy className="w-4 h-4" />} label="Big Wins Today" value="GHS 284K" color="text-[#ffc107]" />
          </div>
        </div>
      </section>

      {/* ═══ LIVE NOW ═══ */}
      <section className="px-4 lg:px-6 py-6 fade-in">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <span className="w-2.5 h-2.5 bg-[#ff4757] rounded-full block live-dot" />
            </div>
            <h2 className="text-lg font-bold text-white ml-1">Live Now</h2>
            <span className="text-[10px] font-bold text-[#ff4757] bg-[#ff4757]/10 px-2.5 py-0.5 rounded-full border border-[#ff4757]/20">
              {liveMatches.length || "—"} LIVE
            </span>
          </div>
          <Link
            href="/live"
            className="text-sm text-[#00d46e] hover:text-[#00b85c] flex items-center gap-1 font-medium group"
          >
            View All <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
        <div className="flex gap-2.5 sm:gap-3 overflow-x-auto pb-2 snap-x snap-mandatory -mx-4 px-4 lg:mx-0 lg:px-0 scrollbar-hide">
          {loadingMatches
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="min-w-[250px] sm:min-w-[280px] snap-start skeleton h-44 rounded-xl" />
              ))
            : liveMatches.length > 0
            ? liveMatches.map((match) => (
                <div key={match.id} className="min-w-[250px] sm:min-w-[280px] snap-start">
                  <MatchCard match={match} variant="featured" />
                </div>
              ))
            : (
              <div className="w-full text-center py-10">
                <p className="text-sm text-[#5a6485]">No live matches right now. Check back soon!</p>
                <Link href="/sports" className="text-sm text-[#00d46e] mt-2 inline-block hover:underline">
                  Browse upcoming matches
                </Link>
              </div>
            )
          }
        </div>
      </section>

      {/* ═══ FEATURED MATCHES ═══ */}
      <section className="px-4 lg:px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#ffc107]/10 flex items-center justify-center">
              <Star className="w-4 h-4 text-[#ffc107]" />
            </div>
            <h2 className="text-lg font-bold text-white">Featured Matches</h2>
          </div>
          <Link
            href="/sports"
            className="text-sm text-[#00d46e] hover:text-[#00b85c] flex items-center gap-1 font-medium group"
          >
            All Sports <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
          {loadingMatches
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton h-36 rounded-xl" />
              ))
            : featuredMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))
          }
        </div>
      </section>

      {/* ═══ SPORTS QUICK LINKS ═══ */}
      <section className="px-4 lg:px-6 py-6">
        <h2 className="text-lg font-bold text-white mb-4">Popular Sports</h2>
        <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-2 sm:gap-3">
          {[
            { name: "Football", icon: "\u26BD", color: "from-[#00d46e]/20 to-[#00d46e]/5", href: "/sports?cat=football" },
            { name: "Basketball", icon: "\uD83C\uDFC0", color: "from-[#ff6b35]/20 to-[#ff6b35]/5", href: "/sports?cat=basketball" },
            { name: "Tennis", icon: "\uD83C\uDFBE", color: "from-[#ffc107]/20 to-[#ffc107]/5", href: "/sports?cat=tennis" },
            { name: "Cricket", icon: "\uD83C\uDFCF", color: "from-[#3b82f6]/20 to-[#3b82f6]/5", href: "/sports?cat=cricket" },
            { name: "Baseball", icon: "\u26BE", color: "from-[#ff4757]/20 to-[#ff4757]/5", href: "/sports?cat=baseball" },
            { name: "MMA", icon: "\uD83E\uDD4A", color: "from-[#8b5cf6]/20 to-[#8b5cf6]/5", href: "/sports?cat=mma" },
            { name: "Hockey", icon: "\uD83C\uDFD2", color: "from-[#06b6d4]/20 to-[#06b6d4]/5", href: "/sports?cat=ice-hockey" },
            { name: "Rugby", icon: "\uD83C\uDFC9", color: "from-[#10b981]/20 to-[#10b981]/5", href: "/sports?cat=rugby" },
          ].map((sport) => (
            <Link
              key={sport.name}
              href={sport.href}
              className={`bg-gradient-to-b ${sport.color} border border-[#2a3050] rounded-xl p-3 sm:p-4 flex flex-col items-center gap-1.5 hover:border-[#00d46e]/30 transition-all card-hover group`}
            >
              <span className="text-2xl sm:text-3xl group-hover:scale-110 transition-transform">{sport.icon}</span>
              <span className="text-[10px] sm:text-xs font-medium text-[#8b95b8] group-hover:text-white transition-colors">{sport.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══ VIRTUAL GAMES ═══ */}
      <section className="px-4 lg:px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#8b5cf6]/10 flex items-center justify-center">
              <Timer className="w-4 h-4 text-[#8b5cf6]" />
            </div>
            <h2 className="text-lg font-bold text-white">Virtual Games</h2>
            <span className="text-[9px] font-bold bg-[#8b5cf6]/15 text-[#8b5cf6] px-2 py-0.5 rounded-full">24/7</span>
          </div>
          <Link
            href="/virtuals"
            className="text-sm text-[#00d46e] hover:text-[#00b85c] flex items-center gap-1 font-medium group"
          >
            View All <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
          {virtualGames.slice(0, 6).map((game) => (
            <Link
              key={game.id}
              href="/virtuals"
              className={`bg-gradient-to-br ${game.gradient} rounded-xl p-4 text-center card-hover group relative overflow-hidden`}
            >
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              <span className="text-4xl block mb-2 group-hover:scale-110 transition-transform">{game.image}</span>
              <p className="text-xs font-semibold text-white truncate">{game.name}</p>
              <p className="text-[10px] text-white/60 mt-1">{game.nextRace}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══ CASINO GAMES ═══ */}
      <section className="px-4 lg:px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#ff6b35]/10 flex items-center justify-center">
              <Flame className="w-4 h-4 text-[#ff6b35]" />
            </div>
            <h2 className="text-lg font-bold text-white">Popular Casino Games</h2>
          </div>
          <Link
            href="/casino"
            className="text-sm text-[#00d46e] hover:text-[#00b85c] flex items-center gap-1 font-medium group"
          >
            View All <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
          {casinoGames.slice(0, 6).map((game) => (
            <Link key={game.id} href="/casino" className="group relative">
              <div
                className={`bg-gradient-to-br ${game.gradient} rounded-xl p-4 h-36 flex flex-col items-center justify-center relative overflow-hidden card-hover`}
              >
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                {game.isHot && (
                  <span className="absolute top-2 right-2 text-[9px] font-bold gradient-live text-white px-1.5 py-0.5 rounded-full">
                    HOT
                  </span>
                )}
                {game.isNew && (
                  <span className="absolute top-2 right-2 text-[9px] font-bold gradient-blue text-white px-1.5 py-0.5 rounded-full">
                    NEW
                  </span>
                )}
                <span className="text-4xl mb-2 group-hover:scale-110 transition-transform">{game.image}</span>
                <p className="text-xs font-semibold text-white text-center truncate w-full">{game.name}</p>
                <p className="text-[10px] text-white/60 mt-0.5">{game.provider}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══ TRUST BADGES ═══ */}
      <section className="px-4 lg:px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: <Shield className="w-5 h-5" />, title: "Licensed & Secure", desc: "Fully regulated platform", color: "text-[#00d46e]" },
            { icon: <CreditCard className="w-5 h-5" />, title: "Instant Deposits", desc: "Via Paystack & Mobile Money", color: "text-[#3b82f6]" },
            { icon: <Clock className="w-5 h-5" />, title: "Fast Payouts", desc: "Withdrawals within 24hrs", color: "text-[#ffc107]" },
            { icon: <Headphones className="w-5 h-5" />, title: "24/7 Support", desc: "Always here to help", color: "text-[#8b5cf6]" },
          ].map((badge) => (
            <div key={badge.title} className="bg-[#1c2033]/50 border border-[#2a3050] rounded-xl p-4 text-center card-hover">
              <div className={`${badge.color} flex justify-center mb-2`}>{badge.icon}</div>
              <p className="text-xs font-bold text-white mb-0.5">{badge.title}</p>
              <p className="text-[10px] text-[#5a6485]">{badge.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="px-4 lg:px-6 py-8 border-t border-[#2a3050] mt-2 bg-[#0d0f16]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Sports</h4>
            <div className="space-y-2">
              {[
                { n: "Football", h: "/sports?cat=football" },
                { n: "Basketball", h: "/sports?cat=basketball" },
                { n: "Tennis", h: "/sports?cat=tennis" },
                { n: "Cricket", h: "/sports?cat=cricket" },
                { n: "MMA", h: "/sports?cat=mma" },
              ].map((s) => (
                <Link key={s.n} href={s.h} className="block text-xs text-[#5a6485] hover:text-[#00d46e] transition-colors">{s.n}</Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Casino</h4>
            <div className="space-y-2">
              {["Slots", "Live Casino", "Table Games", "Crash Games", "Jackpots"].map((s) => (
                <Link key={s} href="/casino" className="block text-xs text-[#5a6485] hover:text-[#00d46e] transition-colors">{s}</Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Support</h4>
            <div className="space-y-2">
              <Link href="/help" className="block text-xs text-[#5a6485] hover:text-[#00d46e] transition-colors">Help Center</Link>
              <Link href="/help" className="block text-xs text-[#5a6485] hover:text-[#00d46e] transition-colors">Live Chat</Link>
              <Link href="/help" className="block text-xs text-[#5a6485] hover:text-[#00d46e] transition-colors">FAQs</Link>
              <Link href="/help" className="block text-xs text-[#5a6485] hover:text-[#00d46e] transition-colors">Contact Us</Link>
              <Link href="/responsible-gaming" className="block text-xs text-[#5a6485] hover:text-[#00d46e] transition-colors">Responsible Gaming</Link>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Legal</h4>
            <div className="space-y-2">
              <Link href="/help" className="block text-xs text-[#5a6485] hover:text-[#00d46e] transition-colors">Terms of Service</Link>
              <Link href="/help" className="block text-xs text-[#5a6485] hover:text-[#00d46e] transition-colors">Privacy Policy</Link>
              <Link href="/help" className="block text-xs text-[#5a6485] hover:text-[#00d46e] transition-colors">Cookie Policy</Link>
              <Link href="/help" className="block text-xs text-[#5a6485] hover:text-[#00d46e] transition-colors">Betting Rules</Link>
              <Link href="/help" className="block text-xs text-[#5a6485] hover:text-[#00d46e] transition-colors">License Info</Link>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="flex flex-wrap items-center justify-center gap-4 py-4 border-t border-[#2a3050] mb-4">
          {["Paystack", "MTN MoMo", "Vodafone Cash", "AirtelTigo", "Visa", "Mastercard"].map((m) => (
            <span key={m} className="text-[10px] font-medium text-[#5a6485] bg-[#1c2033] px-3 py-1.5 rounded-lg border border-[#2a3050]">
              {m}
            </span>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#2a3050]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md gradient-green flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" fill="white" />
            </div>
            <span className="text-sm font-bold text-white">
              Bet<span className="text-[#00d46e]">Nexus</span>
            </span>
          </div>
          <p className="text-[11px] text-[#5a6485] text-center">
            18+ | <Link href="/responsible-gaming" className="hover:text-[#00d46e] transition-colors">Gamble Responsibly</Link> | BetNexus is licensed and regulated. All rights reserved &copy; {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="glass rounded-xl px-3 sm:px-4 py-3 sm:py-3.5 flex items-center gap-2 sm:gap-3 card-hover">
      <div className={`w-9 h-9 rounded-lg bg-[#0f1118]/50 flex items-center justify-center ${color} shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] sm:text-[11px] text-[#5a6485] truncate">{label}</p>
        <p className={`text-sm sm:text-base font-bold ${color}`}>{value}</p>
      </div>
    </div>
  );
}
