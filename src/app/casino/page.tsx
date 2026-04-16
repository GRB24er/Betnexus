"use client";

import { useState } from "react";
import {
  Gamepad2,
  Search,
  Flame,
  Sparkles,
  Star,
  Zap,
  TrendingUp,
  Grid3X3,
  LayoutList,
} from "lucide-react";
import { casinoGames } from "@/lib/data";

const categories = [
  "All Games",
  "Slots",
  "Live Casino",
  "Table Games",
  "Crash Games",
];
const providers = [
  "All",
  "Evolution",
  "Pragmatic",
  "NetEnt",
  "Spribe",
  "Playtech",
];

export default function CasinoPage() {
  const [selectedCategory, setSelectedCategory] = useState("All Games");
  const [selectedProvider, setSelectedProvider] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "large">("grid");

  const filtered = casinoGames.filter((game) => {
    const matchCat =
      selectedCategory === "All Games" || game.category === selectedCategory;
    const matchProv =
      selectedProvider === "All" || game.provider === selectedProvider;
    const matchSearch =
      !searchQuery ||
      game.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchProv && matchSearch;
  });

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#ff6b35]/10 via-[#161925] to-[#ff6b35]/10 border-b border-[#ff6b35]/20">
        <div className="px-4 lg:px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#ff6b35]/20 rounded-xl flex items-center justify-center">
                <Gamepad2 className="w-5 h-5 text-[#ff6b35]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Casino</h1>
                <p className="text-xs text-[#8b95b8]">
                  {casinoGames.length} games from top providers
                </p>
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? "bg-[#ff6b35]/20 text-[#ff6b35] border border-[#ff6b35]/30"
                    : "bg-[#1c2033] text-[#8b95b8] border border-[#2a3050] hover:text-white"
                }`}
              >
                {cat === "All Games" && <Grid3X3 className="w-3 h-3" />}
                {cat === "Slots" && <Sparkles className="w-3 h-3" />}
                {cat === "Live Casino" && <Zap className="w-3 h-3" />}
                {cat === "Table Games" && <Star className="w-3 h-3" />}
                {cat === "Crash Games" && <TrendingUp className="w-3 h-3" />}
                {cat}
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
              placeholder="Search games..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1c2033] border border-[#2a3050] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#5a6485] focus:outline-none focus:border-[#ff6b35]/50"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {providers.map((p) => (
              <button
                key={p}
                onClick={() => setSelectedProvider(p)}
                className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  selectedProvider === p
                    ? "bg-[#2a3050] text-white border border-[#3b82f6]/30"
                    : "bg-[#1c2033] text-[#5a6485] border border-[#2a3050] hover:text-[#8b95b8]"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 bg-[#1c2033] border border-[#2a3050] rounded-lg p-0.5 self-start">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded transition-all ${viewMode === "grid" ? "bg-[#2a3050] text-white" : "text-[#5a6485]"}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("large")}
              className={`p-1.5 rounded transition-all ${viewMode === "large" ? "bg-[#2a3050] text-white" : "text-[#5a6485]"}`}
            >
              <LayoutList className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hot Games Banner */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-4 h-4 text-[#ff4757]" />
            <h2 className="text-sm font-bold text-white">Hot Right Now</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 lg:mx-0 lg:px-0 scrollbar-hide">
            {casinoGames
              .filter((g) => g.isHot)
              .map((game) => (
                <div
                  key={game.id}
                  className={`min-w-[200px] bg-gradient-to-br ${game.gradient} rounded-xl p-5 text-center hover:scale-105 transition-transform cursor-pointer relative overflow-hidden group`}
                >
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  <span className="absolute top-2 right-2 text-[9px] font-bold bg-[#ff4757] text-white px-1.5 py-0.5 rounded">
                    HOT
                  </span>
                  <span className="text-5xl block mb-3">{game.image}</span>
                  <p className="text-sm font-bold text-white">{game.name}</p>
                  <p className="text-[11px] text-white/60 mt-1">
                    {game.provider} | RTP: {game.rtp}%
                  </p>
                </div>
              ))}
          </div>
        </div>

        {/* Games Grid */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-white">
            {selectedCategory} ({filtered.length})
          </h2>
        </div>

        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3"
              : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          }
        >
          {filtered.map((game) => (
            <div
              key={game.id}
              className={`group cursor-pointer ${
                viewMode === "large"
                  ? "bg-[#1c2033] border border-[#2a3050] rounded-xl overflow-hidden hover:border-[#ff6b35]/30 transition-all"
                  : ""
              }`}
            >
              <div
                className={`bg-gradient-to-br ${game.gradient} ${
                  viewMode === "large" ? "h-48" : "h-36 rounded-xl"
                } flex flex-col items-center justify-center relative overflow-hidden hover:scale-[1.02] transition-transform`}
              >
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-4 py-2 rounded-lg border border-white/30">
                      Play Now
                    </button>
                  </div>
                </div>
                {game.isHot && (
                  <span className="absolute top-2 right-2 text-[9px] font-bold bg-[#ff4757] text-white px-1.5 py-0.5 rounded z-10">
                    HOT
                  </span>
                )}
                {game.isNew && (
                  <span className="absolute top-2 right-2 text-[9px] font-bold bg-[#3b82f6] text-white px-1.5 py-0.5 rounded z-10">
                    NEW
                  </span>
                )}
                <span className={`${viewMode === "large" ? "text-6xl" : "text-4xl"} mb-2`}>
                  {game.image}
                </span>
                {viewMode !== "large" && (
                  <>
                    <p className="text-xs font-semibold text-white text-center truncate w-full px-2">
                      {game.name}
                    </p>
                    <p className="text-[10px] text-white/60 mt-0.5">
                      {game.provider}
                    </p>
                  </>
                )}
              </div>
              {viewMode === "large" && (
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-white mb-1">
                    {game.name}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#5a6485]">
                      {game.provider}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#8b95b8] bg-[#0f1118] px-2 py-0.5 rounded">
                        {game.category}
                      </span>
                      {game.rtp && (
                        <span className="text-[10px] text-[#00d46e]">
                          RTP: {game.rtp}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Gamepad2 className="w-12 h-12 text-[#2a3050] mx-auto mb-3" />
            <p className="text-sm text-[#5a6485]">No games match your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
