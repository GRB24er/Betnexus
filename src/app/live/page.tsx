"use client";

import { useState } from "react";
import { Zap, Radio, Eye, TrendingUp, BarChart3, Activity } from "lucide-react";
import MatchCard from "@/components/MatchCard";
import { liveMatches, sportsCategories } from "@/lib/data";

const liveSports = [
  { id: "all", label: "All Live", count: liveMatches.length },
  ...sportsCategories
    .filter((s) => liveMatches.some((m) => m.sport === s.id))
    .map((s) => ({
      id: s.id,
      label: s.name,
      count: liveMatches.filter((m) => m.sport === s.id).length,
    })),
];

export default function LivePage() {
  const [selectedSport, setSelectedSport] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filtered =
    selectedSport === "all"
      ? liveMatches
      : liveMatches.filter((m) => m.sport === selectedSport);

  return (
    <div className="min-h-screen">
      {/* Live Header Banner */}
      <div className="bg-gradient-to-r from-[#ff4757]/10 via-[#161925] to-[#ff4757]/10 border-b border-[#ff4757]/20">
        <div className="px-4 lg:px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#ff4757]/20 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-[#ff4757]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  Live Betting
                  <span className="w-2 h-2 bg-[#ff4757] rounded-full live-pulse" />
                </h1>
                <p className="text-xs text-[#8b95b8]">
                  {liveMatches.length} events happening now
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-4">
              <div className="flex items-center gap-2 text-[11px] text-[#5a6485]">
                <Eye className="w-3.5 h-3.5" />
                <span>12,453 watching</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[#5a6485]">
                <Activity className="w-3.5 h-3.5" />
                <span>2,341 bets/min</span>
              </div>
            </div>
          </div>

          {/* Live Sport Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {liveSports.map((sport) => (
              <button
                key={sport.id}
                onClick={() => setSelectedSport(sport.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  selectedSport === sport.id
                    ? "bg-[#ff4757]/20 text-[#ff4757] border border-[#ff4757]/30"
                    : "bg-[#1c2033] text-[#8b95b8] border border-[#2a3050] hover:text-white"
                }`}
              >
                {sport.label}
                <span className="text-[10px] bg-[#0f1118] px-1.5 py-0.5 rounded-full">
                  {sport.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-6 py-6">
        {/* Top Live Event Feature */}
        <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl overflow-hidden mb-6">
          <div className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Radio className="w-4 h-4 text-[#ff4757]" />
              <span className="text-xs font-bold text-[#ff4757] uppercase tracking-wider">
                Featured Live Event
              </span>
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-4 sm:gap-6">
              {/* Match Info */}
              <div className="flex-1">
                <p className="text-xs text-[#5a6485] mb-3">
                  {liveMatches[0].league}
                </p>
                <div className="flex items-center gap-3 sm:gap-6">
                  <div className="text-center flex-1">
                    <div className="w-16 h-16 bg-[#2a3050] rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-2xl">
                        {liveMatches[0].sport === "football" ? "⚽" : "🏀"}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-white">
                      {liveMatches[0].homeTeam}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white mb-1">
                      {liveMatches[0].homeScore} - {liveMatches[0].awayScore}
                    </div>
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-[#ff4757] rounded-full live-pulse" />
                      <span className="text-xs font-semibold text-[#ff4757]">
                        {liveMatches[0].time}
                      </span>
                    </div>
                    {liveMatches[0].minute && (
                      <div className="w-32 h-1 bg-[#2a3050] rounded-full overflow-hidden mt-2 mx-auto">
                        <div
                          className="h-full bg-[#00d46e] rounded-full"
                          style={{
                            width: `${(liveMatches[0].minute / 90) * 100}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="text-center flex-1">
                    <div className="w-16 h-16 bg-[#2a3050] rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-2xl">
                        {liveMatches[0].sport === "football" ? "⚽" : "🏀"}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-white">
                      {liveMatches[0].awayTeam}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Markets */}
              <div className="md:w-64 lg:w-72 space-y-2">
                <p className="text-[11px] font-semibold text-[#5a6485] uppercase tracking-wider">
                  Quick Markets
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <MarketButton label="1" sublabel={liveMatches[0].homeTeam} odds={liveMatches[0].odds.home} />
                  {liveMatches[0].odds.draw > 0 && (
                    <MarketButton label="X" sublabel="Draw" odds={liveMatches[0].odds.draw} />
                  )}
                  <MarketButton label="2" sublabel={liveMatches[0].awayTeam} odds={liveMatches[0].odds.away} />
                </div>
                <div className="flex items-center justify-center gap-1 text-[11px] text-[#3b82f6]">
                  <BarChart3 className="w-3 h-3" />
                  <span>+{liveMatches[0].markets} markets available</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* All Live Matches */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-white">
            All Live Events ({filtered.length})
          </h2>
          <div className="flex items-center gap-1 bg-[#1c2033] border border-[#2a3050] rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${
                viewMode === "grid"
                  ? "bg-[#2a3050] text-white"
                  : "text-[#5a6485] hover:text-white"
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${
                viewMode === "list"
                  ? "bg-[#2a3050] text-white"
                  : "text-[#5a6485] hover:text-white"
              }`}
            >
              List
            </button>
          </div>
        </div>

        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3"
              : "space-y-2"
          }
        >
          {filtered.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              variant={viewMode === "list" ? "compact" : "default"}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Zap className="w-12 h-12 text-[#2a3050] mx-auto mb-3" />
            <p className="text-sm text-[#5a6485]">
              No live events for this sport right now
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function MarketButton({
  label,
  sublabel,
  odds,
}: {
  label: string;
  sublabel: string;
  odds: number;
}) {
  return (
    <button className="bg-[#0f1118] border border-[#2a3050] rounded-lg p-2 text-center hover:border-[#00d46e]/30 transition-all group">
      <span className="text-[9px] text-[#5a6485] block truncate">{sublabel}</span>
      <span className="text-sm font-bold text-[#8b95b8] group-hover:text-[#00d46e] transition-colors">
        {odds.toFixed(2)}
      </span>
    </button>
  );
}
