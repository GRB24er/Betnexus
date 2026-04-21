"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Zap,
  TrendingUp,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
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

const heroBanners = [
  {
    image: "/images/banners/hero-football.jpg",
    title: "Premium Sports Betting",
    subtitle: "Bet on the world's biggest football leagues with the best odds.",
    cta: "Bet Now",
    ctaLink: "/sports?cat=football",
    badge: "FOOTBALL",
    badgeColor: "bg-[#00d46e]",
  },
  {
    image: "/images/banners/hero-basketball.jpg",
    title: "Elevate Your Game",
    subtitle: "NBA, EuroLeague & more. Live odds updated every second.",
    cta: "View Basketball",
    ctaLink: "/sports?cat=basketball",
    badge: "BASKETBALL",
    badgeColor: "bg-[#ff6b35]",
  },
  {
    image: "/images/banners/hero-live.jpg",
    title: "Live Betting",
    subtitle: "Every moment matters. Bet in real-time on live matches across all sports.",
    cta: "Go Live",
    ctaLink: "/live",
    badge: "LIVE",
    badgeColor: "bg-[#ff4757]",
  },
  {
    image: "/images/banners/hero-cashout.jpg",
    title: "Instant Cash Out",
    subtitle: "Take your winnings early. Cash out anytime before the match ends.",
    cta: "Start Winning",
    ctaLink: "/sports",
    badge: "CASH OUT",
    badgeColor: "bg-[#ffc107]",
  },
];

const promoCards = [
  {
    image: "/images/promos/welcome-bonus.jpg",
    title: "Welcome Bonus",
    desc: "Get up to 100% bonus on your first deposit. Start winning big today!",
    cta: "Claim Now",
    link: "/deposit",
  },
  {
    image: "/images/promos/live-betting.jpg",
    title: "Live Betting",
    desc: "Bet on matches as they happen. Real-time odds, real-time action.",
    cta: "Bet Live",
    link: "/live",
  },
  {
    image: "/images/promos/multi-bet.jpg",
    title: "Accumulator Boost",
    desc: "Combine multiple bets and multiply your winnings up to 10x!",
    cta: "Build Acca",
    link: "/sports",
  },
  {
    image: "/images/promos/virtual-sports.jpg",
    title: "Virtual Sports",
    desc: "24/7 virtual football, basketball, racing & more. Instant results.",
    cta: "Play Now",
    link: "/virtuals",
  },
];

const sportCategories = [
  { name: "Football", icon: "\u26BD", image: "/images/sports/football-header.jpg", color: "from-[#00d46e]/30 to-[#00d46e]/5", border: "border-[#00d46e]/30", href: "/sports?cat=football" },
  { name: "Basketball", icon: "\uD83C\uDFC0", image: "/images/sports/basketball-header.jpg", color: "from-[#ff6b35]/30 to-[#ff6b35]/5", border: "border-[#ff6b35]/30", href: "/sports?cat=basketball" },
  { name: "Tennis", icon: "\uD83C\uDFBE", image: "/images/sports/tennis-header.jpg", color: "from-[#ffc107]/30 to-[#ffc107]/5", border: "border-[#ffc107]/30", href: "/sports?cat=tennis" },
  { name: "Cricket", icon: "\uD83C\uDFCF", image: "/images/sports/cricket-header.jpg", color: "from-[#3b82f6]/30 to-[#3b82f6]/5", border: "border-[#3b82f6]/30", href: "/sports?cat=cricket" },
  { name: "MMA", icon: "\uD83E\uDD4A", image: "/images/sports/mma-header.jpg", color: "from-[#8b5cf6]/30 to-[#8b5cf6]/5", border: "border-[#8b5cf6]/30", href: "/sports?cat=mma" },
  { name: "Baseball", icon: "\u26BE", color: "from-[#ff4757]/30 to-[#ff4757]/5", border: "border-[#ff4757]/30", href: "/sports?cat=baseball" },
  { name: "Hockey", icon: "\uD83C\uDFD2", color: "from-[#06b6d4]/30 to-[#06b6d4]/5", border: "border-[#06b6d4]/30", href: "/sports?cat=ice-hockey" },
  { name: "Rugby", icon: "\uD83C\uDFC9", color: "from-[#10b981]/30 to-[#10b981]/5", border: "border-[#10b981]/30", href: "/sports?cat=rugby" },
];

export default function HomePage() {
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [featuredMatches, setFeaturedMatches] = useState<Match[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [currentBanner, setCurrentBanner] = useState(0);

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

  // Auto-rotate hero banners
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % heroBanners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextBanner = useCallback(() => {
    setCurrentBanner((prev) => (prev + 1) % heroBanners.length);
  }, []);

  const prevBanner = useCallback(() => {
    setCurrentBanner((prev) => (prev - 1 + heroBanners.length) % heroBanners.length);
  }, []);

  return (
    <div className="min-h-screen">
      {/* ═══ HERO BANNER CAROUSEL ═══ */}
      <section className="relative overflow-hidden">
        <div className="relative h-[280px] sm:h-[340px] lg:h-[400px]">
          {heroBanners.map((banner, i) => (
            <div
              key={i}
              className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                i === currentBanner ? "opacity-100 scale-100" : "opacity-0 scale-105"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={banner.image}
                alt={banner.title}
                className="absolute inset-0 w-full h-full object-cover"
                loading={i === 0 ? "eager" : "lazy"}
              />
              {/* Dark gradient overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#0a0c14]/90 via-[#0a0c14]/60 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c14] via-transparent to-transparent opacity-60" />

              {/* Banner content */}
              <div className="relative h-full flex flex-col justify-center px-6 lg:px-10 max-w-2xl">
                <span className={`inline-flex items-center self-start text-[10px] font-black ${banner.badgeColor} text-white px-3 py-1 rounded-full mb-3 tracking-wider`}>
                  {banner.badge}
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-5xl font-black text-white leading-tight mb-2 drop-shadow-lg">
                  {banner.title}
                </h2>
                <p className="text-sm sm:text-base text-white/80 mb-5 max-w-md">
                  {banner.subtitle}
                </p>
                <Link
                  href={banner.ctaLink}
                  className="inline-flex items-center gap-2 self-start gradient-green text-white font-bold text-sm px-7 py-3 rounded-xl hover:opacity-90 transition-all glow-green-strong shadow-lg"
                >
                  {banner.cta} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}

          {/* Navigation arrows */}
          <button
            onClick={prevBanner}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 transition-all z-10"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextBanner}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 transition-all z-10"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Dot indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {heroBanners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentBanner(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentBanner ? "w-8 bg-[#00d46e]" : "w-1.5 bg-white/30 hover:bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="bg-[#0f1118]/80 backdrop-blur-md border-y border-[#2a3050]/50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-[#2a3050]/50">
            <StatCard icon={<Zap className="w-4 h-4" />} label="Live Events" value={String(liveMatches.length || "24")} color="text-[#ff4757]" />
            <StatCard icon={<TrendingUp className="w-4 h-4" />} label="Today's Events" value="1,247" color="text-[#00d46e]" />
            <StatCard icon={<Users className="w-4 h-4" />} label="Online Now" value="15,892" color="text-[#3b82f6]" />
            <StatCard icon={<Trophy className="w-4 h-4" />} label="Big Wins Today" value="GHS 284K" color="text-[#ffc107]" />
          </div>
        </div>
      </section>

      {/* ═══ PROMO CARDS ═══ */}
      <section className="px-4 lg:px-6 py-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {promoCards.map((promo, i) => (
            <Link
              key={i}
              href={promo.link}
              className="group relative rounded-xl overflow-hidden card-hover"
            >
              <div className="relative h-40 sm:h-48">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={promo.image}
                  alt={promo.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                  <h3 className="text-sm sm:text-base font-bold text-white mb-0.5">{promo.title}</h3>
                  <p className="text-[10px] sm:text-xs text-white/60 line-clamp-2 mb-2">{promo.desc}</p>
                  <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold text-[#00d46e] group-hover:gap-2 transition-all">
                    {promo.cta} <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
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
              {liveMatches.length || "\u2014"} LIVE
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

      {/* ═══ POPULAR SPORTS ═══ */}
      <section className="px-4 lg:px-6 py-6">
        <h2 className="text-lg font-bold text-white mb-4">Popular Sports</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
          {sportCategories.map((sport) => (
            <Link
              key={sport.name}
              href={sport.href}
              className={`group relative rounded-xl overflow-hidden border ${sport.border} card-hover`}
            >
              {sport.image ? (
                <div className="relative h-28 sm:h-32">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={sport.image}
                    alt={sport.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center gap-2">
                    <span className="text-xl">{sport.icon}</span>
                    <span className="text-sm font-bold text-white">{sport.name}</span>
                  </div>
                </div>
              ) : (
                <div className={`h-28 sm:h-32 bg-gradient-to-b ${sport.color} flex flex-col items-center justify-center gap-2`}>
                  <span className="text-3xl group-hover:scale-110 transition-transform">{sport.icon}</span>
                  <span className="text-xs font-bold text-white">{sport.name}</span>
                </div>
              )}
            </Link>
          ))}
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

      {/* ═══ VIRTUAL GAMES ═══ */}
      <section className="px-4 lg:px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#8b5cf6]/10 flex items-center justify-center">
              <Flame className="w-4 h-4 text-[#8b5cf6]" />
            </div>
            <h2 className="text-lg font-bold text-white">Virtual Games</h2>
          </div>
          <Link href="/virtuals" className="text-sm text-[#00d46e] hover:text-[#00b85c] flex items-center gap-1 font-medium group">
            View All <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {virtualGames.slice(0, 6).map((game) => (
            <Link
              key={game.id}
              href="/virtuals"
              className="group rounded-xl overflow-hidden bg-[#141724] border border-[#2a3050]/50 card-hover"
            >
              <div className="aspect-square bg-gradient-to-b from-[#8b5cf6]/20 to-transparent flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                {game.image}
              </div>
              <div className="p-2 text-center">
                <p className="text-[10px] sm:text-xs font-medium text-white truncate">{game.name}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══ CASINO GAMES ═══ */}
      <section className="px-4 lg:px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#ffc107]/10 flex items-center justify-center">
              <Star className="w-4 h-4 text-[#ffc107]" />
            </div>
            <h2 className="text-lg font-bold text-white">Casino Games</h2>
          </div>
          <Link href="/casino" className="text-sm text-[#00d46e] hover:text-[#00b85c] flex items-center gap-1 font-medium group">
            View All <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {casinoGames.slice(0, 6).map((game) => (
            <Link
              key={game.id}
              href="/casino"
              className="group rounded-xl overflow-hidden bg-[#141724] border border-[#2a3050]/50 card-hover"
            >
              <div className="aspect-square bg-gradient-to-b from-[#ffc107]/20 to-transparent flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                {game.image}
              </div>
              <div className="p-2 text-center">
                <p className="text-[10px] sm:text-xs font-medium text-white truncate">{game.name}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══ TRUST BADGES ═══ */}
      <section className="px-4 lg:px-6 py-8 border-t border-[#2a3050]/50">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: <Shield className="w-6 h-6" />, title: "Licensed & Secure", desc: "Fully regulated platform", color: "text-[#00d46e]" },
            { icon: <CreditCard className="w-6 h-6" />, title: "Instant Deposits", desc: "Mobile Money & Cards", color: "text-[#3b82f6]" },
            { icon: <Clock className="w-6 h-6" />, title: "Fast Payouts", desc: "Withdraw in minutes", color: "text-[#ffc107]" },
            { icon: <Headphones className="w-6 h-6" />, title: "24/7 Support", desc: "Always here to help", color: "text-[#8b5cf6]" },
          ].map((badge, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[#141724]/50 border border-[#2a3050]/30">
              <div className={`${badge.color}`}>{badge.icon}</div>
              <div>
                <p className="text-xs font-bold text-white">{badge.title}</p>
                <p className="text-[10px] text-[#5a6485]">{badge.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-[#2a3050]/50 bg-[#0a0c14] px-4 lg:px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div>
            <h4 className="text-xs font-bold text-white mb-3">Sports</h4>
            <div className="space-y-2">
              {["Football", "Basketball", "Tennis", "Cricket", "MMA"].map((s) => (
                <Link key={s} href={`/sports?cat=${s.toLowerCase()}`} className="block text-xs text-[#5a6485] hover:text-white transition-colors">{s}</Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold text-white mb-3">Quick Links</h4>
            <div className="space-y-2">
              {[{ label: "Live Betting", href: "/live" }, { label: "Virtuals", href: "/virtuals" }, { label: "Casino", href: "/casino" }, { label: "Promotions", href: "/promotions" }].map((l) => (
                <Link key={l.label} href={l.href} className="block text-xs text-[#5a6485] hover:text-white transition-colors">{l.label}</Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold text-white mb-3">Support</h4>
            <div className="space-y-2">
              {[{ label: "Help Center", href: "/help" }, { label: "Contact Us", href: "/help" }, { label: "Responsible Gaming", href: "/responsible-gaming" }].map((l) => (
                <Link key={l.label} href={l.href} className="block text-xs text-[#5a6485] hover:text-white transition-colors">{l.label}</Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold text-white mb-3">Payment Methods</h4>
            <div className="flex flex-wrap gap-2">
              {["MTN MoMo", "Telecel Cash", "AirtelTigo", "Visa", "Mastercard"].map((m) => (
                <span key={m} className="text-[10px] text-[#5a6485] bg-[#141724] px-2 py-1 rounded">{m}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-[#2a3050]/30 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md gradient-green flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" fill="white" />
            </div>
            <span className="text-sm font-bold text-white">BetNexus</span>
          </div>
          <p className="text-[10px] text-[#5a6485] text-center">
            &copy; {new Date().getFullYear()} BetNexus. All rights reserved. 18+ | Gamble Responsibly.
          </p>
        </div>
      </footer>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-3 justify-center">
      <div className={`${color}`}>{icon}</div>
      <div>
        <p className="text-xs sm:text-sm font-bold text-white">{value}</p>
        <p className="text-[10px] text-[#5a6485]">{label}</p>
      </div>
    </div>
  );
}
