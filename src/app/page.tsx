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
import Image from "next/image";
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
      {/* ═══ HERO BANNER CAROUSEL (Bet365 + Betway style) ═══ */}
      <section className="relative overflow-hidden">
        <div className="relative h-[280px] sm:h-[340px] lg:h-[400px]">
          {heroBanners.map((banner, i) => (
            <div
              key={i}
              className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                i === currentBanner ? "opacity-100 scale-100" : "opacity-0 scale-105"
              }`}
            >
              <Image
                src={banner.image}
                alt={banner.title}
                fill
                sizes="100vw"
                className="object-cover"
                priority={i === 0}
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

      {/* ═══ PROMO CARDS (Bet365 style) ═══ */}
      <section className="px-4 lg:px-6 py-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {promoCards.map((promo, i) => (
            <Link
              key={i}
              href={promo.link}
              className="group relative rounded-xl overflow-hidden card-hover"
            >
              <div className="relative h-40 sm:h-48">
                <Image
                  src={promo.image}
                  alt={promo.title}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
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

      {/* ═══ POPULAR SPORTS (with images — Betway style) ═══ */}
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
                  <Image
                    src={sport.image}
                    alt={sport.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
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
    <div className="px-3 sm:px-4 py-3 sm:py-3.5 flex items-center gap-2 sm:gap-3">
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
