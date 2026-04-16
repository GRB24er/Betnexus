"use client";

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
} from "lucide-react";
import Link from "next/link";
import MatchCard from "@/components/MatchCard";
import {
  featuredMatches,
  liveMatches,
  promotions,
  virtualGames,
  casinoGames,
} from "@/lib/data";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <section className="relative gradient-hero overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#00d46e] rounded-full blur-[150px]" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#3b82f6] rounded-full blur-[120px]" />
        </div>
        <div className="relative px-4 lg:px-6 py-8 lg:py-12">
          {/* Promotions Carousel */}
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0">
            {promotions.map((promo) => (
              <div
                key={promo.id}
                className={`min-w-[300px] sm:min-w-[340px] lg:min-w-0 lg:flex-1 snap-start bg-gradient-to-br ${promo.gradient} rounded-xl p-5 lg:p-6 relative overflow-hidden`}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <span className="inline-block text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full mb-3">
                  {promo.badge}
                </span>
                <h3 className="text-lg font-bold text-white mb-1.5 leading-tight">
                  {promo.title}
                </h3>
                <p className="text-sm text-white/70 mb-4">{promo.description}</p>
                <button className="bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-4 py-2 rounded-lg backdrop-blur-sm transition-all flex items-center gap-1.5">
                  {promo.cta} <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <StatCard icon={<Zap className="w-4 h-4" />} label="Live Events" value="24" color="text-[#ff4757]" />
            <StatCard icon={<TrendingUp className="w-4 h-4" />} label="Today's Events" value="1,247" color="text-[#00d46e]" />
            <StatCard icon={<Users className="w-4 h-4" />} label="Online Now" value="15,892" color="text-[#3b82f6]" />
            <StatCard icon={<Trophy className="w-4 h-4" />} label="Big Wins Today" value="$284K" color="text-[#ffc107]" />
          </div>
        </div>
      </section>

      {/* Live Now Section */}
      <section className="px-4 lg:px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#ff4757] rounded-full live-pulse" />
            <h2 className="text-lg font-bold text-white">Live Now</h2>
            <span className="text-xs text-[#5a6485] bg-[#1c2033] px-2 py-0.5 rounded-full">
              {liveMatches.length} events
            </span>
          </div>
          <Link
            href="/live"
            className="text-sm text-[#00d46e] hover:text-[#00b85c] flex items-center gap-1 font-medium"
          >
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory -mx-4 px-4 lg:mx-0 lg:px-0">
          {liveMatches.slice(0, 6).map((match) => (
            <div key={match.id} className="min-w-[280px] snap-start">
              <MatchCard match={match} variant="featured" />
            </div>
          ))}
        </div>
      </section>

      {/* Featured Matches */}
      <section className="px-4 lg:px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-[#ffc107]" />
            <h2 className="text-lg font-bold text-white">Featured Matches</h2>
          </div>
          <Link
            href="/sports"
            className="text-sm text-[#00d46e] hover:text-[#00b85c] flex items-center gap-1 font-medium"
          >
            All Sports <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {featuredMatches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      </section>

      {/* Virtual Games Preview */}
      <section className="px-4 lg:px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-[#8b5cf6]" />
            <h2 className="text-lg font-bold text-white">Virtual Games</h2>
          </div>
          <Link
            href="/virtuals"
            className="text-sm text-[#00d46e] hover:text-[#00b85c] flex items-center gap-1 font-medium"
          >
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {virtualGames.slice(0, 6).map((game) => (
            <Link
              key={game.id}
              href="/virtuals"
              className={`bg-gradient-to-br ${game.gradient} rounded-xl p-4 text-center hover:scale-105 transition-transform group relative overflow-hidden`}
            >
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              <span className="text-4xl block mb-2">{game.image}</span>
              <p className="text-xs font-semibold text-white truncate">
                {game.name}
              </p>
              <p className="text-[10px] text-white/60 mt-1">
                {game.nextRace}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Casino Games Preview */}
      <section className="px-4 lg:px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-[#ff6b35]" />
            <h2 className="text-lg font-bold text-white">Popular Casino Games</h2>
          </div>
          <Link
            href="/casino"
            className="text-sm text-[#00d46e] hover:text-[#00b85c] flex items-center gap-1 font-medium"
          >
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {casinoGames.slice(0, 6).map((game) => (
            <Link
              key={game.id}
              href="/casino"
              className="group relative"
            >
              <div
                className={`bg-gradient-to-br ${game.gradient} rounded-xl p-4 h-36 flex flex-col items-center justify-center relative overflow-hidden hover:scale-105 transition-transform`}
              >
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                {game.isHot && (
                  <span className="absolute top-2 right-2 text-[9px] font-bold bg-[#ff4757] text-white px-1.5 py-0.5 rounded">
                    HOT
                  </span>
                )}
                {game.isNew && (
                  <span className="absolute top-2 right-2 text-[9px] font-bold bg-[#3b82f6] text-white px-1.5 py-0.5 rounded">
                    NEW
                  </span>
                )}
                <span className="text-4xl mb-2">{game.image}</span>
                <p className="text-xs font-semibold text-white text-center truncate w-full">
                  {game.name}
                </p>
                <p className="text-[10px] text-white/60 mt-0.5">
                  {game.provider}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 lg:px-6 py-8 border-t border-[#2a3050] mt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Sports</h4>
            <div className="space-y-2">
              {["Football", "Basketball", "Tennis", "Cricket", "Esports"].map(
                (s) => (
                  <p
                    key={s}
                    className="text-xs text-[#5a6485] hover:text-[#8b95b8] cursor-pointer"
                  >
                    {s}
                  </p>
                )
              )}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Casino</h4>
            <div className="space-y-2">
              {["Slots", "Live Casino", "Table Games", "Crash Games", "Jackpots"].map(
                (s) => (
                  <p
                    key={s}
                    className="text-xs text-[#5a6485] hover:text-[#8b95b8] cursor-pointer"
                  >
                    {s}
                  </p>
                )
              )}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Support</h4>
            <div className="space-y-2">
              {["Help Center", "Live Chat", "FAQs", "Contact Us", "Responsible Gaming"].map(
                (s) => (
                  <p
                    key={s}
                    className="text-xs text-[#5a6485] hover:text-[#8b95b8] cursor-pointer"
                  >
                    {s}
                  </p>
                )
              )}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Legal</h4>
            <div className="space-y-2">
              {["Terms of Service", "Privacy Policy", "Cookie Policy", "Betting Rules", "License Info"].map(
                (s) => (
                  <p
                    key={s}
                    className="text-xs text-[#5a6485] hover:text-[#8b95b8] cursor-pointer"
                  >
                    {s}
                  </p>
                )
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[#2a3050]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md gradient-green flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" fill="white" />
            </div>
            <span className="text-sm font-bold text-white">
              Bet<span className="text-[#00d46e]">Nexus</span>
            </span>
          </div>
          <p className="text-[11px] text-[#5a6485] text-center">
            18+ | Gamble Responsibly | BetNexus is licensed and regulated. All rights reserved.
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
    <div className="bg-[#1c2033]/60 border border-[#2a3050] rounded-lg px-4 py-3 flex items-center gap-3">
      <div className={`${color}`}>{icon}</div>
      <div>
        <p className="text-xs text-[#5a6485]">{label}</p>
        <p className={`text-sm font-bold ${color}`}>{value}</p>
      </div>
    </div>
  );
}
