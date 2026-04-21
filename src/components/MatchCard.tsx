"use client";

import { useSyncExternalStore } from "react";
import { Match } from "@/lib/data";
import { betSlipStore } from "@/store/betslip";
import { getTeamColors } from "@/lib/teamColors";
import { Clock } from "lucide-react";
import Link from "next/link";
import TeamBadge from "@/components/TeamBadge";

interface MatchCardProps {
  match: Match;
  variant?: "default" | "compact" | "featured";
}

const sportIcons: Record<string, string> = {
  football: "\u26BD",
  basketball: "\uD83C\uDFC0",
  tennis: "\uD83C\uDFBE",
  cricket: "\uD83C\uDFCF",
  baseball: "\u26BE",
  "ice-hockey": "\uD83C\uDFD2",
  mma: "\uD83E\uDD4A",
  rugby: "\uD83C\uDFC9",
};

export default function MatchCard({ match, variant = "default" }: MatchCardProps) {
  const { items } = useSyncExternalStore(
    betSlipStore.subscribe,
    betSlipStore.getSnapshot,
    betSlipStore.getServerSnapshot
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

  const homeColors = getTeamColors(match.homeTeam);
  const awayColors = getTeamColors(match.awayTeam);
  const sportIcon = sportIcons[match.sport] || "\uD83C\uDFC6";

  // ═══ FEATURED VARIANT ═══
  if (variant === "featured") {
    return (
      <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl overflow-hidden card-hover group relative">
        {/* Team color accent */}
        <div className="absolute top-0 left-0 right-0 h-[3px] flex">
          <div className="flex-1" style={{ backgroundColor: homeColors.primary }} />
          <div className="flex-1" style={{ backgroundColor: awayColors.primary }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 mt-[3px]">
          <div className="flex items-center gap-2">
            <span className="text-sm">{sportIcon}</span>
            <span className="text-[11px] text-[#8b95b8] font-medium truncate max-w-[140px]">
              {match.league}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {match.isLive ? (
              <div className="flex items-center gap-1.5 bg-[#ff4757]/10 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 bg-[#ff4757] rounded-full live-pulse" />
                <span className="text-[10px] font-bold text-[#ff4757]">
                  LIVE {match.time}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-[#5a6485]">
                <Clock className="w-3 h-3" />
                <span className="text-[11px]">{match.time}</span>
              </div>
            )}
          </div>
        </div>

        {/* Teams & Score */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1 min-w-0">
              {/* Home Team */}
              <div className="flex items-center gap-2.5 mb-2.5">
                <TeamBadge name={match.homeTeam} logo={match.homeLogo} size="md" />
                <p className="text-sm font-semibold text-white truncate">
                  {match.homeTeam}
                </p>
              </div>
              {/* Away Team */}
              <div className="flex items-center gap-2.5">
                <TeamBadge name={match.awayTeam} logo={match.awayLogo} size="md" />
                <p className="text-sm font-semibold text-white truncate">
                  {match.awayTeam}
                </p>
              </div>
            </div>
            {/* Score */}
            {match.isLive && (
              <div className="text-right ml-3">
                <p className="text-xl font-bold text-white mb-1">
                  {match.homeScore}
                </p>
                <p className="text-xl font-bold text-white">
                  {match.awayScore}
                </p>
              </div>
            )}
          </div>

          {/* Live progress */}
          {match.isLive && match.minute && (
            <div className="mb-3">
              <div className="w-full h-1 bg-[#2a3050] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-[#00d46e] to-[#00ff85]"
                  style={{
                    width: `${Math.min((match.minute / 90) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Odds Row */}
          <div className="grid grid-cols-3 gap-2">
            <OddsButton
              label="1"
              odds={match.odds.home}
              selected={isSelected("home")}
              onClick={() => handleOddsClick("home", match.odds.home)}
            />
            {match.odds.draw > 0 ? (
              <OddsButton
                label="X"
                odds={match.odds.draw}
                selected={isSelected("draw")}
                onClick={() => handleOddsClick("draw", match.odds.draw)}
              />
            ) : (
              <div />
            )}
            <OddsButton
              label="2"
              odds={match.odds.away}
              selected={isSelected("away")}
              onClick={() => handleOddsClick("away", match.odds.away)}
            />
          </div>

          {/* Market Count Badge — prominent green like SportyBet */}
          {match.markets && (
            <Link
              href={`/match/${match.id}`}
              className="flex items-center justify-center gap-1.5 mt-3 bg-[#00d46e]/10 hover:bg-[#00d46e]/20 border border-[#00d46e]/20 rounded-lg py-2 transition-all group/link"
            >
              <span className="text-[12px] font-bold text-[#00d46e] group-hover/link:text-[#00ff85]">
                +{match.markets} Markets
              </span>
              <span className="text-[#00d46e] text-sm">›</span>
            </Link>
          )}
        </div>
      </div>
    );
  }

  // ═══ COMPACT VARIANT ═══
  if (variant === "compact") {
    return (
      <div className="bg-[#1c2033] border border-[#2a3050] rounded-lg overflow-hidden card-hover relative">
        {/* Team color accent */}
        <div className="absolute top-0 left-0 right-0 h-[2px] flex">
          <div className="flex-1" style={{ backgroundColor: homeColors.primary }} />
          <div className="flex-1" style={{ backgroundColor: awayColors.primary }} />
        </div>

        <div className="p-3 pt-[10px]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs">{sportIcon}</span>
              <span className="text-[10px] text-[#5a6485] truncate max-w-[100px]">
                {match.league}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {match.isLive ? (
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-[#ff4757] rounded-full live-pulse" />
                  <span className="text-[10px] font-bold text-[#ff4757]">
                    {match.time}
                  </span>
                </div>
              ) : (
                <span className="text-[10px] text-[#5a6485]">{match.time}</span>
              )}
              {match.markets && (
                <Link
                  href={`/match/${match.id}`}
                  className="text-[10px] font-bold text-[#00d46e] bg-[#00d46e]/10 px-1.5 py-0.5 rounded hover:bg-[#00d46e]/20 transition-colors"
                >
                  +{match.markets}
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <TeamBadge name={match.homeTeam} logo={match.homeLogo} size="xs" />
                  <span className="text-xs font-medium text-white truncate">
                    {match.homeTeam}
                  </span>
                </div>
                {match.isLive && (
                  <span className="text-xs font-bold text-white">
                    {match.homeScore}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <div className="flex items-center gap-1.5">
                  <TeamBadge name={match.awayTeam} logo={match.awayLogo} size="xs" />
                  <span className="text-xs font-medium text-white truncate">
                    {match.awayTeam}
                  </span>
                </div>
                {match.isLive && (
                  <span className="text-xs font-bold text-white">
                    {match.awayScore}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div
            className={`grid ${
              match.odds.draw > 0 ? "grid-cols-3" : "grid-cols-2"
            } gap-1.5`}
          >
            <OddsButton
              label="1"
              odds={match.odds.home}
              selected={isSelected("home")}
              onClick={() => handleOddsClick("home", match.odds.home)}
              small
            />
            {match.odds.draw > 0 && (
              <OddsButton
                label="X"
                odds={match.odds.draw}
                selected={isSelected("draw")}
                onClick={() => handleOddsClick("draw", match.odds.draw)}
                small
              />
            )}
            <OddsButton
              label="2"
              odds={match.odds.away}
              selected={isSelected("away")}
              onClick={() => handleOddsClick("away", match.odds.away)}
              small
            />
          </div>
        </div>
      </div>
    );
  }

  // ═══ DEFAULT VARIANT ═══
  return (
    <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl overflow-hidden card-hover relative">
      {/* Team color accent */}
      <div className="absolute top-0 left-0 right-0 h-[3px] flex">
        <div className="flex-1" style={{ backgroundColor: homeColors.primary }} />
        <div className="flex-1" style={{ backgroundColor: awayColors.primary }} />
      </div>

      <div className="p-4 pt-[11px]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm">{sportIcon}</span>
            <span className="text-xs text-[#8b95b8] font-medium truncate max-w-[150px]">
              {match.league}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {match.isLive ? (
              <div className="flex items-center gap-1.5 bg-[#ff4757]/10 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 bg-[#ff4757] rounded-full live-pulse" />
                <span className="text-[10px] font-bold text-[#ff4757]">
                  LIVE {match.time}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-[#5a6485]">
                <Clock className="w-3 h-3" />
                <span className="text-[11px]">{match.time}</span>
              </div>
            )}
            {/* Prominent market count badge */}
            {match.markets && (
              <Link
                href={`/match/${match.id}`}
                className="text-[11px] font-bold text-[#00d46e] bg-[#00d46e]/10 border border-[#00d46e]/20 px-2 py-0.5 rounded-md hover:bg-[#00d46e]/20 transition-colors"
              >
                +{match.markets}
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="flex-1 min-w-0">
            {/* Home */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TeamBadge name={match.homeTeam} logo={match.homeLogo} size="sm" />
                <span className="text-sm font-medium text-white truncate">
                  {match.homeTeam}
                </span>
              </div>
              {match.isLive && (
                <span className="text-base font-bold text-white ml-2">
                  {match.homeScore}
                </span>
              )}
            </div>
            {/* Away */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TeamBadge name={match.awayTeam} logo={match.awayLogo} size="sm" />
                <span className="text-sm font-medium text-white truncate">
                  {match.awayTeam}
                </span>
              </div>
              {match.isLive && (
                <span className="text-base font-bold text-white ml-2">
                  {match.awayScore}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Progress bar for live match */}
        {match.isLive && match.minute && (
          <div className="mb-3">
            <div className="w-full h-1 bg-[#2a3050] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-[#00d46e] to-[#00ff85]"
                style={{
                  width: `${Math.min((match.minute / 90) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Odds */}
        <div
          className={`grid ${
            match.odds.draw > 0 ? "grid-cols-3" : "grid-cols-2"
          } gap-2`}
        >
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
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Odds Button — Green odds like SportyBet
   ═══════════════════════════════════════════════════════════════════════════ */

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
        small ? "py-1.5 px-2" : "py-2.5 px-3"
      } ${
        selected
          ? "bg-[#00d46e] text-white shadow-md shadow-[#00d46e]/20"
          : "bg-[#0f1118] border border-[#2a3050] hover:border-[#00d46e]/40 hover:bg-[#0f1118]/80"
      }`}
    >
      <span
        className={`${small ? "text-[9px]" : "text-[10px]"} font-medium ${
          selected ? "text-white/70" : "text-[#5a6485]"
        }`}
      >
        {label}
      </span>
      <span
        className={`${small ? "text-xs" : "text-sm"} font-bold ${
          selected ? "text-white" : "text-[#00d46e]"
        }`}
      >
        {odds.toFixed(2)}
      </span>
    </button>
  );
}
