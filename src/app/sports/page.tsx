"use client";

import { useState } from "react";
import { Search, Filter, ChevronDown, SlidersHorizontal } from "lucide-react";
import MatchCard from "@/components/MatchCard";
import {
  sportsCategories,
  featuredMatches,
  liveMatches,
  upcomingMatches,
} from "@/lib/data";

const timeFilters = ["All", "Today", "Tomorrow", "This Week"];

export default function SportsPage() {
  const [selectedSport, setSelectedSport] = useState("all");
  const [selectedTime, setSelectedTime] = useState("All");
  const [showFilters, setShowFilters] = useState(false);

  const allMatches = [...liveMatches, ...upcomingMatches, ...featuredMatches];
  const filteredMatches =
    selectedSport === "all"
      ? allMatches
      : allMatches.filter((m) => m.sport === selectedSport);

  const uniqueMatches = filteredMatches.filter(
    (match, index, self) => index === self.findIndex((m) => m.id === match.id)
  );

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
            {sportsCategories.map((sport) => (
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
                <span className="text-[10px] text-[#5a6485]">
                  {sport.count}
                </span>
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

        {/* Results Count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-[#8b95b8]">
            <span className="font-semibold text-white">{uniqueMatches.length}</span>{" "}
            matches found
          </p>
          <div className="flex items-center gap-2">
            <button className="text-[11px] text-[#8b95b8] hover:text-white flex items-center gap-1">
              <Filter className="w-3 h-3" /> Sort by: Popular
            </button>
          </div>
        </div>

        {/* Live Section */}
        {uniqueMatches.some((m) => m.isLive) && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1.5 h-1.5 bg-[#ff4757] rounded-full live-pulse" />
              <h3 className="text-sm font-bold text-white">Live Matches</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              {uniqueMatches
                .filter((m) => m.isLive)
                .map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
            </div>
          </div>
        )}

        {/* Upcoming Section */}
        {uniqueMatches.some((m) => !m.isLive) && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-bold text-white">Upcoming</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              {uniqueMatches
                .filter((m) => !m.isLive)
                .map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
