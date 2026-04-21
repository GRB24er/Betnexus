"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  Star,
  Share2,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { Match } from "@/lib/data";
import MatchCard from "@/components/MatchCard";

const additionalMarkets = [
  { name: "Over/Under 2.5 Goals", options: [{ label: "Over 2.5", odds: 1.72 }, { label: "Under 2.5", odds: 2.10 }] },
  { name: "Both Teams to Score", options: [{ label: "Yes", odds: 1.65 }, { label: "No", odds: 2.20 }] },
  { name: "Double Chance", options: [{ label: "1X", odds: 1.25 }, { label: "12", odds: 1.15 }, { label: "X2", odds: 1.55 }] },
  { name: "Correct Score", options: [{ label: "1-0", odds: 6.50 }, { label: "2-1", odds: 7.00 }, { label: "0-0", odds: 8.50 }, { label: "1-1", odds: 5.50 }] },
  { name: "Half-Time Result", options: [{ label: "Home", odds: 2.40 }, { label: "Draw", odds: 2.10 }, { label: "Away", odds: 3.80 }] },
  { name: "Total Corners", options: [{ label: "Over 9.5", odds: 1.90 }, { label: "Under 9.5", odds: 1.90 }] },
];

export default function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/matches/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Match not found");
        return r.json();
      })
      .then((data) => setMatch(data.match))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#00d46e]" />
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-[#5a6485]">{error || "Match not found"}</p>
        <Link href="/sports" className="text-[#00d46e] text-sm underline">Back to Sports</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className={`border-b ${match.isLive ? "border-[#ff4757]/20 bg-gradient-to-r from-[#ff4757]/5 via-[#161925] to-[#ff4757]/5" : "border-[#2a3050] bg-[#161925]"}`}>
        <div className="px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Link href="/sports" className="p-2 text-[#5a6485] hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <p className="text-xs text-[#5a6485]">{match.league}</p>
                {match.isLive && (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 bg-[#ff4757] rounded-full live-pulse" />
                    <span className="text-[11px] font-bold text-[#ff4757]">LIVE - {match.time}</span>
                  </div>
                )}
                {!match.isLive && <p className="text-[11px] text-[#8b95b8] mt-0.5">{match.time}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 text-[#5a6485] hover:text-[#ffc107] transition-colors">
                <Star className="w-5 h-5" />
              </button>
              <button className="p-2 text-[#5a6485] hover:text-white transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Score */}
          <div className="flex items-center justify-center gap-4 sm:gap-8 py-4 sm:py-6">
            <div className="text-center flex-1">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#2a3050] rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-xl sm:text-2xl">{match.sport === "football" ? "⚽" : "🏀"}</span>
              </div>
              <p className="text-sm sm:text-base font-bold text-white truncate px-1">{match.homeTeam}</p>
            </div>
            <div className="text-center shrink-0">
              {match.isLive ? (
                <div className="text-2xl sm:text-4xl font-bold text-white mb-1">
                  {match.homeScore} - {match.awayScore}
                </div>
              ) : (
                <div className="text-xl sm:text-2xl font-bold text-[#5a6485] mb-1">VS</div>
              )}
              {match.isLive && match.minute && (
                <div className="w-20 sm:w-32 h-1 bg-[#2a3050] rounded-full overflow-hidden mt-2 mx-auto">
                  <div className="h-full bg-[#00d46e] rounded-full" style={{ width: `${(match.minute / 90) * 100}%` }} />
                </div>
              )}
            </div>
            <div className="text-center flex-1">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#2a3050] rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-xl sm:text-2xl">{match.sport === "football" ? "⚽" : "🏀"}</span>
              </div>
              <p className="text-sm sm:text-base font-bold text-white truncate px-1">{match.awayTeam}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-6 py-6 max-w-3xl">
        {/* Main Market */}
        <div className="mb-6">
          <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#00d46e]" /> Match Result
          </h2>
          <MatchCard match={match} />
        </div>

        {/* Additional Markets */}
        <div className="mb-6">
          <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#3b82f6]" /> All Markets ({match.markets || 150}+)
          </h2>
          <div className="space-y-3">
            {additionalMarkets.map((market) => (
              <div key={market.name} className="bg-[#1c2033] border border-[#2a3050] rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 border-b border-[#2a3050]/50">
                  <p className="text-xs font-semibold text-[#8b95b8]">{market.name}</p>
                </div>
                <div className="p-2 sm:p-3 flex flex-wrap gap-1.5 sm:gap-2">
                  {market.options.map((opt) => (
                    <button
                      key={opt.label}
                      className="flex-1 min-w-[70px] sm:min-w-[80px] flex items-center justify-between bg-[#0f1118] border border-[#2a3050] rounded-lg px-2 sm:px-3 py-2 hover:border-[#00d46e]/30 transition-all min-h-[44px]"
                    >
                      <span className="text-xs text-[#8b95b8]">{opt.label}</span>
                      <span className="text-sm font-bold text-[#8b95b8] hover:text-[#00d46e]">{opt.odds.toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Match Stats */}
        {match.isLive && (
          <div className="mb-6">
            <h2 className="text-sm font-bold text-white mb-3">Match Statistics</h2>
            <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-4 space-y-4">
              <StatBar label="Possession" home={62} away={38} />
              <StatBar label="Shots on Target" home={5} away={3} />
              <StatBar label="Corners" home={6} away={4} />
              <StatBar label="Fouls" home={8} away={11} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatBar({ label, home, away }: { label: string; home: number; away: number }) {
  const total = home + away || 1;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-white">{home}</span>
        <span className="text-[11px] text-[#5a6485]">{label}</span>
        <span className="text-xs font-semibold text-white">{away}</span>
      </div>
      <div className="flex gap-1 h-1.5">
        <div className="flex-1 bg-[#2a3050] rounded-full overflow-hidden flex justify-end">
          <div className="bg-[#00d46e] rounded-full" style={{ width: `${(home / total) * 100}%` }} />
        </div>
        <div className="flex-1 bg-[#2a3050] rounded-full overflow-hidden">
          <div className="bg-[#3b82f6] rounded-full" style={{ width: `${(away / total) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}
