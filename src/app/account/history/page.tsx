"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Filter, Calendar, Search } from "lucide-react";

const filters = ["All", "Won", "Lost", "Pending", "Cashout"];

const betHistory = [
  { id: "h1", date: "Apr 16, 2026 14:32", match: "Real Madrid vs Man City", league: "UCL", selection: "Real Madrid (1X2)", odds: 1.85, stake: 50, status: "won", payout: 92.5 },
  { id: "h2", date: "Apr 16, 2026 13:10", match: "Arsenal vs Liverpool", league: "Premier League", selection: "Draw (1X2)", odds: 3.40, stake: 20, status: "pending", payout: 0 },
  { id: "h3", date: "Apr 16, 2026 10:45", match: "LA Lakers vs Golden State", league: "NBA", selection: "Golden State (ML)", odds: 1.65, stake: 100, status: "won", payout: 165 },
  { id: "h4", date: "Apr 15, 2026 21:00", match: "Barcelona vs Atl. Madrid", league: "La Liga", selection: "Barcelona (1X2)", odds: 1.65, stake: 30, status: "lost", payout: 0 },
  { id: "h5", date: "Apr 15, 2026 19:30", match: "Bayern Munich vs Dortmund", league: "Bundesliga", selection: "Over 2.5 Goals", odds: 1.72, stake: 40, status: "won", payout: 68.8 },
  { id: "h6", date: "Apr 15, 2026 16:00", match: "PSG vs Marseille", league: "Ligue 1", selection: "PSG -1.5", odds: 2.10, stake: 25, status: "won", payout: 52.5 },
  { id: "h7", date: "Apr 14, 2026 22:00", match: "Djokovic vs Alcaraz", league: "ATP Masters", selection: "Alcaraz (ML)", odds: 2.15, stake: 60, status: "lost", payout: 0 },
  { id: "h8", date: "Apr 14, 2026 20:15", match: "Chelsea vs Tottenham", league: "Premier League", selection: "BTTS Yes", odds: 1.80, stake: 35, status: "won", payout: 63 },
  { id: "h9", date: "Apr 14, 2026 18:00", match: "AC Milan vs Inter Milan", league: "Serie A", selection: "Under 3.5 Goals", odds: 1.55, stake: 75, status: "lost", payout: 0 },
  { id: "h10", date: "Apr 13, 2026 21:45", match: "Accumulator (4 legs)", league: "Mixed", selection: "4-Fold Acca", odds: 8.42, stake: 10, status: "won", payout: 84.2 },
];

export default function BetHistoryPage() {
  const [activeFilter, setActiveFilter] = useState("All");

  const filtered = activeFilter === "All"
    ? betHistory
    : betHistory.filter((b) => b.status === activeFilter.toLowerCase());

  const totalStaked = betHistory.reduce((a, b) => a + b.stake, 0);
  const totalWon = betHistory.filter((b) => b.status === "won").reduce((a, b) => a + b.payout, 0);

  return (
    <div className="min-h-screen">
      <div className="bg-[#161925] border-b border-[#2a3050]">
        <div className="px-4 lg:px-6 py-4">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/account" className="p-2 text-[#5a6485] hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-bold text-white">Bet History</h1>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-[#0f1118] border border-[#2a3050] rounded-lg px-3 py-2 text-center">
              <p className="text-[10px] text-[#5a6485]">Total Staked</p>
              <p className="text-sm font-bold text-white">${totalStaked.toFixed(2)}</p>
            </div>
            <div className="bg-[#0f1118] border border-[#2a3050] rounded-lg px-3 py-2 text-center">
              <p className="text-[10px] text-[#5a6485]">Total Won</p>
              <p className="text-sm font-bold text-[#00d46e]">${totalWon.toFixed(2)}</p>
            </div>
            <div className="bg-[#0f1118] border border-[#2a3050] rounded-lg px-3 py-2 text-center">
              <p className="text-[10px] text-[#5a6485]">Profit</p>
              <p className={`text-sm font-bold ${totalWon - totalStaked >= 0 ? "text-[#00d46e]" : "text-[#ff4757]"}`}>
                {totalWon - totalStaked >= 0 ? "+" : ""}${(totalWon - totalStaked).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  activeFilter === f
                    ? "bg-[#00d46e]/10 text-[#00d46e] border border-[#00d46e]/30"
                    : "bg-[#1c2033] text-[#8b95b8] border border-[#2a3050]"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-6 py-4 max-w-3xl">
        <div className="space-y-2">
          {filtered.map((bet) => (
            <div key={bet.id} className="bg-[#1c2033] border border-[#2a3050] rounded-xl px-4 py-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{bet.match}</p>
                  <p className="text-[11px] text-[#5a6485]">{bet.league}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ml-2 ${
                  bet.status === "won"
                    ? "bg-[#00d46e]/20 text-[#00d46e]"
                    : bet.status === "lost"
                    ? "bg-[#ff4757]/20 text-[#ff4757]"
                    : "bg-[#ffc107]/20 text-[#ffc107]"
                }`}>
                  {bet.status.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#8b95b8]">{bet.selection}</p>
                  <p className="text-[10px] text-[#5a6485] mt-0.5">{bet.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#5a6485]">Stake: ${bet.stake.toFixed(2)} @ {bet.odds.toFixed(2)}</p>
                  {bet.status === "won" && (
                    <p className="text-sm font-bold text-[#00d46e]">+${bet.payout.toFixed(2)}</p>
                  )}
                  {bet.status === "lost" && (
                    <p className="text-sm font-bold text-[#ff4757]">-${bet.stake.toFixed(2)}</p>
                  )}
                  {bet.status === "pending" && (
                    <p className="text-sm font-bold text-[#ffc107]">Potential: ${(bet.stake * bet.odds).toFixed(2)}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm text-[#5a6485]">No bets found for this filter</p>
          </div>
        )}
      </div>
    </div>
  );
}
