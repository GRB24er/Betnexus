"use client";

import { useState } from "react";
import {
  MonitorPlay,
  Timer,
  Users,
  Play,
  ChevronRight,
  Zap,
  RefreshCw,
} from "lucide-react";
import { virtualGames } from "@/lib/data";

const categories = ["All", "Sports", "Racing", "Instant"];

export default function VirtualsPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filtered =
    selectedCategory === "All"
      ? virtualGames
      : virtualGames.filter((g) => g.category === selectedCategory);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#8b5cf6]/10 via-[#161925] to-[#8b5cf6]/10 border-b border-[#8b5cf6]/20">
        <div className="px-4 lg:px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#8b5cf6]/20 rounded-xl flex items-center justify-center">
                <MonitorPlay className="w-5 h-5 text-[#8b5cf6]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Virtual Games</h1>
                <p className="text-xs text-[#8b95b8]">
                  24/7 virtual sports & instant games
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <div className="flex items-center gap-2 text-[11px] text-[#5a6485]">
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Events every 3 min</span>
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                  selectedCategory === cat
                    ? "bg-[#8b5cf6]/20 text-[#8b5cf6] border border-[#8b5cf6]/30"
                    : "bg-[#1c2033] text-[#8b95b8] border border-[#2a3050] hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-6 py-6">
        {/* Next Up Banner */}
        <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-5 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#8b5cf6]/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-[#ffc107]" />
                <span className="text-xs font-bold text-[#ffc107] uppercase tracking-wider">
                  Starting Now
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-1">
                Virtual Dog Racing - Race #2847
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-xs text-[#8b95b8]">
                  <Timer className="w-3.5 h-3.5 text-[#ff4757]" />
                  <span className="text-[#ff4757] font-semibold">00:45</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#5a6485]">
                  <Users className="w-3.5 h-3.5" />
                  <span>1,087 betting</span>
                </div>
              </div>
            </div>
            <button className="gradient-green text-white font-semibold text-sm px-6 py-2.5 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2">
              <Play className="w-4 h-4" fill="white" />
              Bet Now
            </button>
          </div>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((game) => (
            <div
              key={game.id}
              className={`bg-gradient-to-br ${game.gradient} rounded-xl overflow-hidden group cursor-pointer hover:scale-[1.02] transition-transform`}
            >
              <div className="p-5 relative">
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                <div className="relative z-10">
                  <span className="text-5xl block mb-3">{game.image}</span>
                  <h3 className="text-base font-bold text-white mb-1">
                    {game.name}
                  </h3>
                  <span className="inline-block text-[10px] font-semibold bg-white/20 text-white px-2 py-0.5 rounded-full mb-3">
                    {game.category}
                  </span>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-white/70">
                      <Timer className="w-3 h-3" />
                      <span>{game.nextRace}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-white/70">
                      <Users className="w-3 h-3" />
                      <span>{game.players?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-black/20 px-5 py-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-white/80">
                  Play Now
                </span>
                <ChevronRight className="w-4 h-4 text-white/60 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-[#1c2033] border border-[#2a3050] rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-3">
            How Virtual Games Work
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-[#8b5cf6]/20 rounded-lg flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-[#8b5cf6]">1</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-white mb-1">Choose Your Game</p>
                <p className="text-[11px] text-[#5a6485]">
                  Pick from football, horse racing, dog racing, and more virtual sports.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-[#00d46e]/20 rounded-lg flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-[#00d46e]">2</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-white mb-1">Place Your Bet</p>
                <p className="text-[11px] text-[#5a6485]">
                  Select your market, enter your stake, and confirm your bet before the event starts.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-[#ffc107]/20 rounded-lg flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-[#ffc107]">3</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-white mb-1">Watch & Win</p>
                <p className="text-[11px] text-[#5a6485]">
                  Watch the action unfold in real-time. Results are determined by a certified RNG.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
