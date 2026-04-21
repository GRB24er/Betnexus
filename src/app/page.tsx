"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Zap,
  TrendingUp,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
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
import { virtualGames, casinoGames, Match } from "@/lib/data";

const heroBanners = [
  {
    image: "/images/banners/hero-football.jpg",
    fallback: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=1600&q=80",
    title: "Premium Sports Betting",
    subtitle: "Bet on the world's biggest football leagues with the best odds.",
    cta: "Bet Now",
    ctaLink: "/sports?cat=football",
    badge: "FOOTBALL",
    badgeColor: "#00d46e",
    gradient: "linear-gradient(135deg, #0a4d2e 0%, #0d1b2a 50%, #1a1a2e 100%)",
  },
  {
    image: "/images/banners/hero-basketball.jpg",
    fallback: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1600&q=80",
    title: "Elevate Your Game",
    subtitle: "NBA, EuroLeague & more. Live odds updated every second.",
    cta: "View Basketball",
    ctaLink: "/sports?cat=basketball",
    badge: "BASKETBALL",
    badgeColor: "#ff6b35",
    gradient: "linear-gradient(135deg, #4d2600 0%, #1a0a00 50%, #1a1a2e 100%)",
  },
  {
    image: "/images/banners/hero-live.jpg",
    fallback: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=1600&q=80",
    title: "Live Betting",
    subtitle: "Every moment matters. Bet in real-time on live matches across all sports.",
    cta: "Go Live",
    ctaLink: "/live",
    badge: "LIVE",
    badgeColor: "#ff4757",
    gradient: "linear-gradient(135deg, #4d0a14 0%, #1a0a0e 50%, #1a1a2e 100%)",
  },
  {
    image: "/images/banners/hero-cashout.jpg",
    fallback: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1600&q=80",
    title: "Instant Cash Out",
    subtitle: "Take your winnings early. Cash out anytime before the match ends.",
    cta: "Start Winning",
    ctaLink: "/sports",
    badge: "CASH OUT",
    badgeColor: "#ffc107",
    gradient: "linear-gradient(135deg, #4d3a00 0%, #1a1400 50%, #1a1a2e 100%)",
  },
];

const promoCards = [
  {
    image: "/images/promos/welcome-bonus.jpg",
    fallback: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80",
    title: "Welcome Bonus",
    desc: "Get up to 100% bonus on your first deposit. Start winning big today!",
    cta: "Claim Now",
    link: "/deposit",
    icon: "🎁",
    gradient: "linear-gradient(135deg, #00d46e33, #0a0c14)",
  },
  {
    image: "/images/promos/live-betting.jpg",
    fallback: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80",
    title: "Live Betting",
    desc: "Bet on matches as they happen. Real-time odds, real-time action.",
    cta: "Bet Live",
    link: "/live",
    icon: "🔴",
    gradient: "linear-gradient(135deg, #ff475733, #0a0c14)",
  },
  {
    image: "/images/promos/multi-bet.jpg",
    fallback: "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&q=80",
    title: "Accumulator Boost",
    desc: "Combine multiple bets and multiply your winnings up to 10x!",
    cta: "Build Acca",
    link: "/sports",
    icon: "🚀",
    gradient: "linear-gradient(135deg, #ffc10733, #0a0c14)",
  },
  {
    image: "/images/promos/virtual-sports.jpg",
    fallback: "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=800&q=80",
    title: "Virtual Sports",
    desc: "24/7 virtual football, basketball, racing & more. Instant results.",
    cta: "Play Now",
    link: "/virtuals",
    icon: "🎮",
    gradient: "linear-gradient(135deg, #8b5cf633, #0a0c14)",
  },
];

const sportCategories = [
  { name: "Football", icon: "\u26BD", image: "/images/sports/football-header.jpg", fallback: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&q=80", borderColor: "#00d46e", href: "/sports?cat=football" },
  { name: "Basketball", icon: "\uD83C\uDFC0", image: "/images/sports/basketball-header.jpg", fallback: "https://images.unsplash.com/photo-1519861531473-9200262188bf?w=800&q=80", borderColor: "#ff6b35", href: "/sports?cat=basketball" },
  { name: "Tennis", icon: "\uD83C\uDFBE", image: "/images/sports/tennis-header.jpg", fallback: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&q=80", borderColor: "#ffc107", href: "/sports?cat=tennis" },
  { name: "Cricket", icon: "\uD83C\uDFCF", image: "/images/sports/cricket-header.jpg", fallback: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=80", borderColor: "#3b82f6", href: "/sports?cat=cricket" },
  { name: "MMA", icon: "\uD83E\uDD4A", image: "/images/sports/mma-header.jpg", fallback: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=800&q=80", borderColor: "#8b5cf6", href: "/sports?cat=mma" },
  { name: "Baseball", icon: "\u26BE", borderColor: "#ff4757", href: "/sports?cat=baseball" },
  { name: "Hockey", icon: "\uD83C\uDFD2", borderColor: "#06b6d4", href: "/sports?cat=ice-hockey" },
  { name: "Rugby", icon: "\uD83C\uDFC9", borderColor: "#10b981", href: "/sports?cat=rugby" },
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
        <div className="relative" style={{ height: "clamp(280px, 40vw, 400px)" }}>
          {heroBanners.map((banner, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                inset: 0,
                opacity: i === currentBanner ? 1 : 0,
                transform: i === currentBanner ? "scale(1)" : "scale(1.05)",
                transition: "opacity 700ms ease-in-out, transform 700ms ease-in-out",
                zIndex: i === currentBanner ? 2 : 1,
              }}
            >
              <img
                src={banner.image}
                alt={banner.title}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
                loading={i === 0 ? "eager" : "lazy"}
                onError={(e) => {
                  const img = e.currentTarget;
                  if (img.src !== banner.fallback) {
                    img.src = banner.fallback;
                  } else {
                    img.style.display = "none";
                  }
                }}
              />
              {/* Gradient fallback background in case both images fail */}
              <div style={{ position: "absolute", inset: 0, background: banner.gradient, zIndex: -1 }} />
              <div style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to right, rgba(10,12,20,0.92), rgba(10,12,20,0.55), transparent)",
              }} />
              <div style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to top, rgba(10,12,20,0.7), transparent, transparent)",
              }} />

              <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 24px", maxWidth: "640px" }}>
                <span style={{
                  display: "inline-flex",
                  alignSelf: "flex-start",
                  fontSize: "10px",
                  fontWeight: 900,
                  backgroundColor: banner.badgeColor,
                  color: "white",
                  padding: "4px 12px",
                  borderRadius: "999px",
                  marginBottom: "12px",
                  letterSpacing: "0.1em",
                }}>
                  {banner.badge}
                </span>
                <h2 style={{
                  fontSize: "clamp(1.5rem, 4vw, 3rem)",
                  fontWeight: 900,
                  color: "white",
                  lineHeight: 1.1,
                  marginBottom: "8px",
                  textShadow: "0 2px 8px rgba(0,0,0,0.5)",
                }}>
                  {banner.title}
                </h2>
                <p style={{
                  fontSize: "clamp(0.8rem, 1.5vw, 1rem)",
                  color: "rgba(255,255,255,0.8)",
                  marginBottom: "20px",
                  maxWidth: "400px",
                }}>
                  {banner.subtitle}
                </p>
                <Link
                  href={banner.ctaLink}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    alignSelf: "flex-start",
                    gap: "8px",
                    background: "linear-gradient(135deg, #00d46e, #00b85c)",
                    color: "white",
                    fontWeight: 700,
                    fontSize: "14px",
                    padding: "12px 28px",
                    borderRadius: "12px",
                    textDecoration: "none",
                    boxShadow: "0 4px 20px rgba(0,212,110,0.3)",
                  }}
                >
                  {banner.cta} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}

          <button
            onClick={prevBanner}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              width: 36,
              height: 36,
              borderRadius: "50%",
              backgroundColor: "rgba(0,0,0,0.4)",
              backdropFilter: "blur(4px)",
              border: "1px solid rgba(255,255,255,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "rgba(255,255,255,0.7)",
              cursor: "pointer",
              zIndex: 10,
            }}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextBanner}
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              width: 36,
              height: 36,
              borderRadius: "50%",
              backgroundColor: "rgba(0,0,0,0.4)",
              backdropFilter: "blur(4px)",
              border: "1px solid rgba(255,255,255,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "rgba(255,255,255,0.7)",
              cursor: "pointer",
              zIndex: 10,
            }}
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 8, zIndex: 10 }}>
            {heroBanners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentBanner(i)}
                style={{
                  height: 6,
                  width: i === currentBanner ? 32 : 6,
                  borderRadius: 999,
                  backgroundColor: i === currentBanner ? "#00d46e" : "rgba(255,255,255,0.3)",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 300ms",
                  padding: 0,
                }}
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
            <Link key={i} href={promo.link} className="group block rounded-xl overflow-hidden" style={{ position: "relative" }}>
              <div style={{ position: "relative", height: "clamp(160px, 20vw, 192px)" }}>
                <img
                  src={promo.image}
                  alt={promo.title}
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transition: "transform 500ms",
                  }}
                  className="group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => {
                    const img = e.currentTarget;
                    if (img.src !== promo.fallback) {
                      img.src = promo.fallback;
                    } else {
                      img.style.display = "none";
                    }
                  }}
                />
                {/* Gradient fallback + icon */}
                <div style={{ position: "absolute", inset: 0, background: promo.gradient, zIndex: -1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 48, opacity: 0.3 }}>{promo.icon}</span>
                </div>
                <div style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.35), transparent)",
                }} />
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "12px 16px" }}>
                  <h3 style={{ fontSize: "clamp(0.8rem, 1.5vw, 1rem)", fontWeight: 700, color: "white", marginBottom: 2 }}>{promo.title}</h3>
                  <p style={{ fontSize: "clamp(0.6rem, 1vw, 0.75rem)", color: "rgba(255,255,255,0.6)", marginBottom: 8, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{promo.desc}</p>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "clamp(0.6rem, 1vw, 0.75rem)", fontWeight: 700, color: "#00d46e" }}>
                    {promo.cta} <ArrowRight style={{ width: 12, height: 12 }} />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══ LIVE NOW ═══ */}
      <section className="px-4 lg:px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#ff4757] rounded-full block" style={{ animation: "pulse 2s infinite" }} />
            <h2 className="text-lg font-bold text-white ml-1">Live Now</h2>
            <span className="text-[10px] font-bold text-[#ff4757] bg-[#ff4757]/10 px-2.5 py-0.5 rounded-full border border-[#ff4757]/20">
              {liveMatches.length || "\u2014"} LIVE
            </span>
          </div>
          <Link href="/live" className="text-sm text-[#00d46e] hover:text-[#00b85c] flex items-center gap-1 font-medium group">
            View All <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
        <div className="flex gap-2.5 sm:gap-3 overflow-x-auto pb-2 snap-x snap-mandatory -mx-4 px-4 lg:mx-0 lg:px-0" style={{ scrollbarWidth: "none" }}>
          {loadingMatches
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="min-w-[250px] sm:min-w-[280px] snap-start h-44 rounded-xl bg-[#141724] animate-pulse" />
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
                <Link href="/sports" className="text-sm text-[#00d46e] mt-2 inline-block hover:underline">Browse upcoming matches</Link>
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
            <Link key={sport.name} href={sport.href} className="group block rounded-xl overflow-hidden" style={{ border: `1px solid ${sport.borderColor}33` }}>
              {sport.image ? (
                <div style={{ position: "relative", height: "clamp(112px, 14vw, 128px)" }}>
                  <img
                    src={sport.image}
                    alt={sport.name}
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transition: "transform 500ms",
                    }}
                    className="group-hover:scale-110"
                    loading="lazy"
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (sport.fallback && img.src !== sport.fallback) {
                        img.src = sport.fallback;
                      } else {
                        img.style.display = "none";
                      }
                    }}
                  />
                  {/* Gradient fallback */}
                  <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, ${sport.borderColor}40, ${sport.borderColor}10)`, zIndex: -1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 48, opacity: 0.3 }}>{sport.icon}</span>
                  </div>
                  <div style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.25), transparent)",
                  }} />
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 12, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 20 }}>{sport.icon}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "white" }}>{sport.name}</span>
                  </div>
                </div>
              ) : (
                <div style={{
                  height: "clamp(112px, 14vw, 128px)",
                  background: `linear-gradient(to bottom, ${sport.borderColor}30, ${sport.borderColor}08)`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}>
                  <span style={{ fontSize: 30, transition: "transform 300ms" }} className="group-hover:scale-110">{sport.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "white" }}>{sport.name}</span>
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
          <Link href="/sports" className="text-sm text-[#00d46e] hover:text-[#00b85c] flex items-center gap-1 font-medium group">
            All Sports <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
          {loadingMatches
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-36 rounded-xl bg-[#141724] animate-pulse" />
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
            <Link key={game.id} href="/virtuals" className="group rounded-xl overflow-hidden bg-[#141724] border border-[#2a3050]/50">
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
            <Link key={game.id} href="/casino" className="group rounded-xl overflow-hidden bg-[#141724] border border-[#2a3050]/50">
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
            { icon: <Shield className="w-6 h-6" />, title: "Licensed & Secure", desc: "Fully regulated platform", color: "#00d46e" },
            { icon: <CreditCard className="w-6 h-6" />, title: "Instant Deposits", desc: "Mobile Money & Cards", color: "#3b82f6" },
            { icon: <Clock className="w-6 h-6" />, title: "Fast Payouts", desc: "Withdraw in minutes", color: "#ffc107" },
            { icon: <Headphones className="w-6 h-6" />, title: "24/7 Support", desc: "Always here to help", color: "#8b5cf6" },
          ].map((badge, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[#141724]/50 border border-[#2a3050]/30">
              <div style={{ color: badge.color }}>{badge.icon}</div>
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
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "linear-gradient(135deg, #00d46e, #00b85c)" }}>
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
