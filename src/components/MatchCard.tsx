"use client";

import { useSyncExternalStore } from "react";
import { Match } from "@/lib/data";
import { betSlipStore } from "@/store/betslip";
import { BarChart3 } from "lucide-react";
import Link from "next/link";

interface MatchCardProps {
  match: Match;
  variant?: "default" | "compact" | "featured";
}

export default function MatchCard({ match, variant = "default" }: MatchCardProps) {
  const { items } = useSyncExternalStore(
    betSlipStore.subscribe,
    betSlipStore.getSnapshot,
    betSlipStore.getSnapshot
  );

  const handleOddsClick = (selection: string, odds: number) => {
    const id = `${match.id}-${selection}`;
    betSlipStore.addBet({
      id,
      matchId: match.id,
      match: `${match.homeTeam} vs ${match.awayTeam}`,
      selection:
        selection === "home"
          ? match.homeTeam
          : selection === "away"
          ? match.awayTeam
          : "Draw",
      odds,
      market: "Match Result",
    });
  };

  const isSelected = (selection: string) =>
    items.some((b) => b.id === `${match.id}-${selection}`);

  if (variant === "featured") {
    return (
      <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl overflow-hidden hover:border-[#3b82f6]/30 transition-all group">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#2a3050]/50">
          <div className="flex items-center gap-2">
            <span className="text-xs">{getSportIcon(match.sport)}</span>
            <span className="text-xs text-[#8b95b8] font-medium">{match.league}</span>
          </div>
          {match.isLive ? (
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-[#ff4757] rounded-full live-pulse" />
              <span className="text-[11px] font-bold text-[#ff4757]">{match.time}</span>
            </div>
          ) : (
            <span className="text-[11px] text-[#5a6485]">{match.time}</span>
          )}
        </div>

        {/* Teams & Score */}
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-white mb-1">{match.homeTeam}</p>
              <p className="text-sm font-semibold text-white">{match.awayTeam}</p>
            </div>
            {match.isLive && (
              <div className="text-right">
                <p className="text-lg font-bold text-white mb-1">{match.homeScore}</p>
                <p className="text-lg font-bold text-white">{match.awayScore}</p>
              </div>
            )}
          </div>

          {/* Odds */}
          <div className="grid grid-cols-3 gap-2">
            <OddsButton
              label="1"
              odds={match.odds.home}
              selected={isSelected("home")}
              onClick={() => handleOddsClick("home", match.odds.home)}
            />
            {match.odds.draw > 0 && (
              <OddsButton
                label="X"
                odds={match.odds.draw}
                selected={isSelected("draw")}
                onClick={() => handleOddsClick("draw", match.odds.draw)}
              />
            )}
            <OddsButton
              label="2"
              odds={match.odds.away}
              selected={isSelected("away")}
              onClick={() => handleOddsClick("away", match.odds.away)}
            />
          </div>

          {/* Markets count */}
          {match.markets && (
            <div className="flex items-center justify-center gap-1 mt-3 text-[11px] text-[#5a6485]">
              <BarChart3 className="w-3 h-3" />
              <span>+{match.markets} markets</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Compact variant
  if (variant === "compact") {
    return (
      <div className="bg-[#1c2033] border border-[#2a3050] rounded-lg p-3 hover:border-[#3b82f6]/30 transition-all">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs">{getSportIcon(match.sport)}</span>
            <span className="text-[11px] text-[#5a6485] truncate max-w-[120px]">{match.league}</span>
          </div>
          {match.isLive ? (
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-[#ff4757] rounded-full live-pulse" />
              <span className="text-[10px] font-bold text-[#ff4757]">{match.time}</span>
            </div>
          ) : (
            <span className="text-[10px] text-[#5a6485]">{match.time}</span>
          )}
        </div>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-white truncate">{match.homeTeam}</span>
              {match.isLive && <span className="text-xs font-bold text-white">{match.homeScore}</span>}
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs font-medium text-white truncate">{match.awayTeam}</span>
              {match.isLive && <span className="text-xs font-bold text-white">{match.awayScore}</span>}
            </div>
          </div>
        </div>
        <div className={`grid ${match.odds.draw > 0 ? "grid-cols-3" : "grid-cols-2"} gap-1.5`}>
          <OddsButton label="1" odds={match.odds.home} selected={isSelected("home")} onClick={() => handleOddsClick("home", match.odds.home)} small />
          {match.odds.draw > 0 && (
            <OddsButton label="X" odds={match.odds.draw} selected={isSelected("draw")} onClick={() => handleOddsClick("draw", match.odds.draw)} small />
          )}
          <OddsButton label="2" odds={match.odds.away} selected={isSelected("away")} onClick={() => handleOddsClick("away", match.odds.away)} small />
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-4 hover:border-[#3b82f6]/30 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm">{getSportIcon(match.sport)}</span>
          <span className="text-xs text-[#8b95b8] font-medium">{match.league}</span>
        </div>
        <div className="flex items-center gap-2">
          {match.isLive && (
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-[#ff4757] rounded-full live-pulse" />
              <span className="text-[11px] font-bold text-[#ff4757]">{match.time}</span>
            </div>
          )}
          {!match.isLive && (
            <span className="text-[11px] text-[#5a6485]">{match.time}</span>
          )}
          {match.markets && (
            <Link href="#" className="text-[11px] text-[#3b82f6] hover:underline">
              +{match.markets}
            </Link>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-white">{match.homeTeam}</span>
            {match.isLive && <span className="text-base font-bold text-white">{match.homeScore}</span>}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white">{match.awayTeam}</span>
            {match.isLive && <span className="text-base font-bold text-white">{match.awayScore}</span>}
          </div>
        </div>
      </div>

      {/* Progress bar for live match */}
      {match.isLive && match.minute && (
        <div className="mb-3">
          <div className="w-full h-1 bg-[#2a3050] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#00d46e] rounded-full transition-all duration-1000"
              style={{ width: `${(match.minute / 90) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className={`grid ${match.odds.draw > 0 ? "grid-cols-3" : "grid-cols-2"} gap-2`}>
        <OddsButton label="1" odds={match.odds.home} selected={isSelected("home")} onClick={() => handleOddsClick("home", match.odds.home)} />
        {match.odds.draw > 0 && (
          <OddsButton label="X" odds={match.odds.draw} selected={isSelected("draw")} onClick={() => handleOddsClick("draw", match.odds.draw)} />
        )}
        <OddsButton label="2" odds={match.odds.away} selected={isSelected("away")} onClick={() => handleOddsClick("away", match.odds.away)} />
      </div>
    </div>
  );
}

function OddsButton({
  label,
  odds,
  selected,
  onClick,
  small,
}: {
  label: string;
  odds: number;
  selected: boolean;
  onClick: () => void;
  small?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center rounded-lg transition-all duration-200 ${
        small ? "py-1.5 px-2" : "py-2 px-3"
      } ${
        selected
          ? "bg-[#00d46e]/20 border border-[#00d46e]/50 text-[#00d46e]"
          : "bg-[#0f1118] border border-[#2a3050] text-[#8b95b8] hover:border-[#00d46e]/30 hover:text-white"
      }`}
    >
      <span className={`${small ? "text-[9px]" : "text-[10px]"} font-medium opacity-60`}>{label}</span>
      <span className={`${small ? "text-xs" : "text-sm"} font-bold`}>{odds.toFixed(2)}</span>
    </button>
  );
}

function getSportIcon(sport: string): string {
  const icons: Record<string, string> = {
    football: "⚽",
    basketball: "🏀",
    tennis: "🎾",
    cricket: "🏏",
    baseball: "⚾",
    "ice-hockey": "🏒",
    mma: "🥊",
    rugby: "🏉",
  };
  return icons[sport] || "🏆";
}
