"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, ChevronDown, SlidersHorizontal, RefreshCw, Loader2 } from "lucide-react";
import MatchCard from "@/components/MatchCard";
import { Match, sportsCategories } from "@/lib/data";

const timeFilters = ["All", "Today", "Tomorrow", "This Week"];

interface MatchesResponse {
  live: Match[];
  upcoming: Match[];
  total: number;
}

export default function SportsPage() {
  const [selectedSport, setSelectedSport] = useState("all");
  const [selectedTime, setSelectedTime] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMatches = useCallback(async (sport: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ sport, type: "all" });
      const res = await fetch(`/api/matches?${params}`);
      if (!res.ok) throw new Error(`Failed to fetch matches (${res.status})`);
      const data: MatchesResponse = await res.json();
      setLiveMatches(data.live);
      setUpcomingMatches(data.upcoming);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load matches");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatches(selectedSport);
    const interval = setInterval(() => fetchMatches(selectedSport), 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedSport, fetchMatches]);

  const filterBySearch = (matches: Match[]) => {
    if (!searchQuery.trim()) return matches;
    const q = searchQuery.toLowerCase();
    return matches.filter((m) =>
      `${m.homeTeam} ${m.awayTeam} ${m.league}`.toLowerCase().includes(q)
    );
  };

  const filteredLive = filterBySearch(liveMatches);
  const filteredUpcoming = filterBySearch(upcomingMatches);
  const totalCount = filteredLive.length + filteredUpcoming.length;

  const sportCategoryList = sportsCategories.map((cat) => ({
    ...cat,
    count: [...liveMatches, ...upcomingMatches].filter((m) => m.sport === cat.id).length,
  }));

  return (
    <div className="min-h-screen">
      {/* Sport Categories */}
      <div className="border-b border-[#2a3050] bg-[#161925]/50">
        <div className="px-4 lg:px-6 py-3">
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0 scrollbar-hide">
            <button
              onClick={() => setSelectedSport("all")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                selectedSport === "all"
                  ? "bg-[#00d46e]/10 text-[#00d46e] border border-[#00d46e]/30"
                  : "bg-[#1c2033] text-[#8b95b8] border border-[#2a3050] hover:border-[#3b82f6]/30"
              }`}
            >
              All Sports
            </button>
            {sportCategoryList.map((sport) => (
              <button
                key={sport.id}
                onClick={() => setSelectedSport(sport.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  selectedSport === sport.id
                    ? "bg-[#00d46e]/10 text-[#00d46e] border border-[#00d46e]/30"
                    : "bg-[#1c2033] text-[#8b95b8] border border-[#2a3050] hover:border-[#3b82f6]/30"
                }`}
              >
                <span>{sport.icon}</span>
                <span>{sport.name}</span>
                {sport.count > 0 && (
                  <span className="text-[10px] text-[#5a6485]">{sport.count}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-6 py-6">
        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a6485]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search matches, teams, leagues..."
              className="w-full bg-[#1c2033] border border-[#2a3050] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#5a6485] focus:outline-none focus:border-[#00d46e]/50"
            />
          </div>
          <div className="flex gap-2">
            {timeFilters.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTime(t)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  selectedTime === t
                    ? "bg-[#00d46e]/10 text-[#00d46e] border border-[#00d46e]/30"
                    : "bg-[#1c2033] text-[#8b95b8] border border-[#2a3050] hover:text-white"
                }`}
              >
                {t}
              </button>
            ))}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#1c2033] border border-[#2a3050] rounded-lg text-xs text-[#8b95b8] hover:text-white"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <label className="text-[11px] text-[#5a6485] font-medium mb-1 block">
                League
              </label>
              <button className="w-full flex items-center justify-between bg-[#0f1118] border border-[#2a3050] rounded-lg px-3 py-2 text-sm text-[#8b95b8]">
                All Leagues <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
            <div>
              <label className="text-[11px] text-[#5a6485] font-medium mb-1 block">
                Market
              </label>
              <button className="w-full flex items-center justify-between bg-[#0f1118] border border-[#2a3050] rounded-lg px-3 py-2 text-sm text-[#8b95b8]">
                Match Result <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
            <div>
              <label className="text-[11px] text-[#5a6485] font-medium mb-1 block">
                Odds Range
              </label>
              <button className="w-full flex items-center justify-between bg-[#0f1118] border border-[#2a3050] rounded-lg px-3 py-2 text-sm text-[#8b95b8]">
                Any Odds <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
            <div>
              <label className="text-[11px] text-[#5a6485] font-medium mb-1 block">
                Sort By
              </label>
              <button className="w-full flex items-center justify-between bg-[#0f1118] border border-[#2a3050] rounded-lg px-3 py-2 text-sm text-[#8b95b8]">
                Popularity <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Results Header */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-[#8b95b8]">
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading real matches...
              </span>
            ) : (
              <>
                <span className="font-semibold text-white">{totalCount}</span> matches found
                {lastUpdated && (
                  <span className="ml-2 text-[10px] text-[#5a6485]">· Updated {lastUpdated.toLocaleTimeString()}</span>
                )}
              </>
            )}
          </p>
          <button
            onClick={() => fetchMatches(selectedSport)}
            disabled={loading}
            className="flex items-center gap-1.5 text-[11px] text-[#8b95b8] hover:text-[#00d46e] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 text-sm text-red-400">
            {error} —{" "}
            <button onClick={() => fetchMatches(selectedSport)} className="underline">Try again</button>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-4 animate-pulse">
                <div className="h-3 bg-[#2a3050] rounded w-1/3 mb-3" />
                <div className="h-4 bg-[#2a3050] rounded w-2/3 mb-2" />
                <div className="h-4 bg-[#2a3050] rounded w-1/2 mb-4" />
                <div className="flex gap-2">
                  <div className="h-8 bg-[#2a3050] rounded flex-1" />
                  <div className="h-8 bg-[#2a3050] rounded flex-1" />
                  <div className="h-8 bg-[#2a3050] rounded flex-1" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Live Section */}
        {!loading && filteredLive.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1.5 h-1.5 bg-[#ff4757] rounded-full live-pulse" />
              <h3 className="text-sm font-bold text-white">
                Live Matches
                <span className="ml-2 text-[10px] font-normal text-[#ff4757] bg-[#ff4757]/10 px-1.5 py-0.5 rounded">
                  {filteredLive.length} LIVE
                </span>
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              {filteredLive.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Section */}
        {!loading && filteredUpcoming.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-bold text-white">Upcoming</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              {filteredUpcoming.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && totalCount === 0 && !error && (
          <div className="text-center py-16">
            <p className="text-[#5a6485] text-sm">No matches available right now.</p>
            <p className="text-[#5a6485] text-xs mt-1">Check back soon or try a different sport.</p>
          </div>
        )}
      </div>
    </div>
  );
}
