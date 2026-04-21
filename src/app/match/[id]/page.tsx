"use client";

import { use, useState, useEffect, useSyncExternalStore, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Star,
  TrendingUp,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Match } from "@/lib/data";
import { betSlipStore } from "@/store/betslip";
import { getTeamColors, getTeamAbbr } from "@/lib/teamColors";
import TeamBadge from "@/components/TeamBadge";
import MatchLivePanel from "@/components/MatchLivePanel";

/* ═══════════════════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════════════════ */

interface MarketOutcome {
  name: string;
  label: string;
  odds: number;
  point?: number;
}
interface ProcessedMarket {
  key: string;
  name: string;
  outcomes: MarketOutcome[];
}
interface MarketCategory {
  id: string;
  name: string;
  icon: string;
  markets: ProcessedMarket[];
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════════════════════════════════ */

export default function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [match, setMatch] = useState<Match | null>(null);
  const [categories, setCategories] = useState<MarketCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [starred, setStarred] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/matches/${id}?markets=true`)
      .then((r) => {
        if (!r.ok) throw new Error("Match not found");
        return r.json();
      })
      .then((data) => {
        setMatch(data.match);
        if (data.marketCategories?.length) {
          setCategories(data.marketCategories);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#0f1118]">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-[#2a3050] border-t-[#00d46e] animate-spin" />
        </div>
        <p className="text-xs text-[#5a6485] font-medium">Loading match &amp; markets...</p>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#0f1118]">
        <div className="w-16 h-16 rounded-2xl bg-[#1c2033] flex items-center justify-center border border-[#2a3050]">
          <span className="text-3xl">😕</span>
        </div>
        <p className="text-[#5a6485] text-sm">{error || "Match not found"}</p>
        <Link
          href="/sports"
          className="text-[#00d46e] text-sm font-bold hover:underline"
        >
          ← Back to Sports
        </Link>
      </div>
    );
  }

  const homeColors = getTeamColors(match.homeTeam);
  const awayColors = getTeamColors(match.awayTeam);
  const totalMarkets = categories.reduce((acc, c) => acc + c.markets.length, 0);

  // "All" tab shows every category, otherwise filter
  const visibleCategories =
    activeTab === "all"
      ? categories
      : categories.filter((c) => c.id === activeTab);

  return (
    <div className="min-h-screen bg-[#0f1118] pb-28">
      {/* ═══ MATCH HEADER ═══ */}
      <div className="relative overflow-hidden">
        {/* Background gradient using team colors */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: `linear-gradient(135deg, ${homeColors.primary} 0%, transparent 50%, ${awayColors.primary} 100%)`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0f1118]/60 to-[#0f1118]" />

        <div className="relative px-4 lg:px-6 max-w-5xl mx-auto">
          {/* Top Bar */}
          <div className="flex items-center justify-between py-3">
            <Link
              href="/sports"
              className="flex items-center gap-2 text-[#8b95b8] hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-xs font-medium hidden sm:inline">Back</span>
            </Link>
            <div className="flex items-center gap-2 text-center">
              {match.countryFlag && (
                <img
                  src={match.countryFlag}
                  alt=""
                  loading="lazy"
                  className="h-3 w-auto rounded-sm"
                />
              )}
              {match.leagueLogo && (
                <img
                  src={match.leagueLogo}
                  alt=""
                  loading="lazy"
                  className="h-4 w-4 object-contain"
                />
              )}
              <span className="text-[10px] text-[#8b95b8] uppercase tracking-widest font-semibold">
                {match.league}
              </span>
            </div>
            <button
              onClick={() => setStarred(!starred)}
              className={`p-2 rounded-lg transition-all ${
                starred
                  ? "text-[#ffc107] bg-[#ffc107]/10"
                  : "text-[#5a6485] hover:text-[#ffc107]"
              }`}
            >
              <Star className="w-5 h-5" fill={starred ? "#ffc107" : "none"} />
            </button>
          </div>

          {/* Match Status */}
          <div className="flex justify-center mb-3">
            {match.isLive ? (
              <div className="flex items-center gap-2 bg-[#ff4757]/15 border border-[#ff4757]/30 px-4 py-1.5 rounded-full">
                <span className="w-2 h-2 bg-[#ff4757] rounded-full live-pulse" />
                <span className="text-xs font-bold text-[#ff4757] tracking-wide">
                  LIVE — {match.time}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-[#1c2033] border border-[#2a3050] px-4 py-1.5 rounded-full">
                <span className="text-xs text-[#8b95b8] font-medium">{match.time}</span>
              </div>
            )}
          </div>

          {/* Teams & Score */}
          <div className="flex items-center justify-center gap-3 sm:gap-8 py-3 sm:py-5">
            {/* Home Team */}
            <div className="flex-1 text-center">
              <div className="mx-auto mb-2 flex justify-center">
                <TeamBadge
                  name={match.homeTeam}
                  logo={match.homeLogo}
                  size="xl"
                  className="shadow-lg border-2"
                />
              </div>
              <p className="text-sm sm:text-base font-bold text-white truncate px-1">
                {match.homeTeam}
              </p>
              <p className="text-[10px] text-[#5a6485] mt-0.5 uppercase tracking-wider">Home</p>
            </div>

            {/* Score / VS */}
            <div className="text-center shrink-0 min-w-[80px]">
              {match.isLive ? (
                <div>
                  <div className="text-4xl sm:text-5xl font-black text-white tracking-wider leading-none">
                    {match.homeScore}
                    <span className="text-[#5a6485] mx-2 text-2xl sm:text-3xl">:</span>
                    {match.awayScore}
                  </div>
                  {match.minute && (
                    <div className="mt-3">
                      <div className="w-28 sm:w-40 h-1.5 bg-[#2a3050] rounded-full overflow-hidden mx-auto">
                        <div
                          className="h-full bg-gradient-to-r from-[#00d46e] to-[#00ff85] rounded-full transition-all duration-1000"
                          style={{
                            width: `${Math.min((match.minute / 90) * 100, 100)}%`,
                          }}
                        />
                      </div>
                      <p className="text-[10px] text-[#5a6485] mt-1">
                        {match.minute}&apos; min
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-3xl sm:text-4xl font-black text-[#2a3050]">VS</div>
              )}
            </div>

            {/* Away Team */}
            <div className="flex-1 text-center">
              <div className="mx-auto mb-2 flex justify-center">
                <TeamBadge
                  name={match.awayTeam}
                  logo={match.awayLogo}
                  size="xl"
                  className="shadow-lg border-2"
                />
              </div>
              <p className="text-sm sm:text-base font-bold text-white truncate px-1">
                {match.awayTeam}
              </p>
              <p className="text-[10px] text-[#5a6485] mt-0.5 uppercase tracking-wider">Away</p>
            </div>
          </div>

          {/* Quick 1X2 Odds Bar */}
          <div className="pb-4">
            <div
              className={`grid ${
                match.odds.draw > 0 ? "grid-cols-3" : "grid-cols-2"
              } gap-2 max-w-md mx-auto`}
            >
              <QuickOddsButton
                match={match}
                label="1"
                sublabel={getTeamAbbr(match.homeTeam)}
                selection={match.homeTeam}
                odds={match.odds.home}
                outcomeName="home"
                teamColor={homeColors.primary}
              />
              {match.odds.draw > 0 && (
                <QuickOddsButton
                  match={match}
                  label="X"
                  sublabel="Draw"
                  selection="Draw"
                  odds={match.odds.draw}
                  outcomeName="draw"
                  teamColor="#5a6485"
                />
              )}
              <QuickOddsButton
                match={match}
                label="2"
                sublabel={getTeamAbbr(match.awayTeam)}
                selection={match.awayTeam}
                odds={match.odds.away}
                outcomeName="away"
                teamColor={awayColors.primary}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ═══ MATCH CENTER (Lineups + Events from API-Football) ═══ */}
      {match.sport === "football" && (
        <MatchLivePanel
          matchId={match.id}
          homeTeam={match.homeTeam}
          awayTeam={match.awayTeam}
          isLive={match.isLive}
        />
      )}

      {/* ═══ MARKET TABS — Sticky ═══ */}
      <div className="sticky top-0 z-30 bg-[#0f1118] border-b border-[#2a3050]">
        <div className="max-w-5xl mx-auto">
          <div className="flex overflow-x-auto scrollbar-hide">
            {/* "All" tab */}
            <button
              onClick={() => setActiveTab("all")}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-all shrink-0 ${
                activeTab === "all"
                  ? "border-[#00d46e] text-[#00d46e]"
                  : "border-transparent text-[#5a6485] hover:text-[#8b95b8]"
              }`}
            >
              <span className="text-sm">📋</span>
              <span>All</span>
              <span className="bg-[#00d46e]/15 text-[#00d46e] text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                {totalMarkets}
              </span>
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-all shrink-0 ${
                  activeTab === cat.id
                    ? "border-[#00d46e] text-[#00d46e]"
                    : "border-transparent text-[#5a6485] hover:text-[#8b95b8]"
                }`}
              >
                <span className="text-sm">{cat.icon}</span>
                <span>{cat.name}</span>
                <span className="text-[9px] opacity-50">({cat.markets.length})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ MARKETS CONTENT ═══ */}
      <div className="px-3 lg:px-6 py-3 max-w-5xl mx-auto">
        {categories.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-[#00d46e]" />
            <p className="text-sm text-[#5a6485]">Loading markets...</p>
          </div>
        )}

        {visibleCategories.map((cat) => (
          <div key={cat.id} className="mb-4">
            {/* Category Header — only show when viewing "All" */}
            {activeTab === "all" && (
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="text-base">{cat.icon}</span>
                <h3 className="text-xs font-bold text-[#8b95b8] uppercase tracking-wider">
                  {cat.name}
                </h3>
                <div className="flex-1 h-px bg-[#2a3050]" />
                <span className="text-[10px] text-[#5a6485] font-medium">
                  {cat.markets.length} markets
                </span>
              </div>
            )}

            {/* Markets List */}
            <div className="space-y-1.5">
              {cat.markets.map((market) => (
                <MarketRow key={market.key} market={market} match={match} />
              ))}
            </div>
          </div>
        ))}

        {/* Match Info Footer */}
        <div className="mt-6 bg-[#1c2033] border border-[#2a3050] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-[#00d46e]" />
            <h3 className="text-xs font-bold text-[#8b95b8] uppercase tracking-wider">
              Match Info
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <InfoCell label="Competition" value={match.league} />
            <InfoCell label="Sport" value={match.sport} capitalize />
            <InfoCell
              label="Status"
              value={match.isLive ? "In Play" : "Upcoming"}
              color={match.isLive ? "#ff4757" : "#00d46e"}
            />
            <InfoCell label="Markets" value={`${totalMarkets}`} color="#00d46e" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Market Row — Dense SportyBet-style layout
   ═══════════════════════════════════════════════════════════════════════════ */

function MarketRow({
  market,
  match,
}: {
  market: ProcessedMarket;
  match: Match;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const { items } = useSyncExternalStore(
    betSlipStore.subscribe,
    betSlipStore.getSnapshot,
    betSlipStore.getServerSnapshot
  );

  const handleSelect = useCallback(
    (outcome: MarketOutcome) => {
      const betId = `${match.id}__${market.key}__${outcome.name}${
        outcome.point !== undefined ? `_${outcome.point}` : ""
      }`;
      betSlipStore.addBet({
        id: betId,
        matchId: match.id,
        match: `${match.homeTeam} vs ${match.awayTeam}`,
        selection: outcome.label,
        odds: outcome.odds,
        market: market.name,
      });
    },
    [match, market]
  );

  const isOutcomeSelected = useCallback(
    (outcome: MarketOutcome) => {
      const betId = `${match.id}__${market.key}__${outcome.name}${
        outcome.point !== undefined ? `_${outcome.point}` : ""
      }`;
      return items.some((b) => b.id === betId);
    },
    [match.id, market.key, items]
  );

  const outcomeCount = market.outcomes.length;
  // Correct Score (28+), Multi-Goal (11+) → compact 3-col grid
  // HT/FT (9), Result & BTTS (6) → 3-col
  // Standard 2-way → 2-col, 3-way → 3-col
  const gridClass =
    outcomeCount === 2
      ? "grid-cols-2"
      : outcomeCount === 3
      ? "grid-cols-3"
      : outcomeCount <= 4
      ? "grid-cols-2 sm:grid-cols-4"
      : outcomeCount <= 6
      ? "grid-cols-2 sm:grid-cols-3"
      : outcomeCount <= 9
      ? "grid-cols-3"
      : "grid-cols-3 sm:grid-cols-4";

  return (
    <div className="bg-[#161925] border border-[#1e2338] rounded-lg overflow-hidden">
      {/* Market Name Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-[#1c2033]/50 transition-colors"
      >
        <span className="text-[11px] font-semibold text-[#8b95b8]">
          {market.name}
        </span>
        {collapsed ? (
          <ChevronDown className="w-3.5 h-3.5 text-[#5a6485]" />
        ) : (
          <ChevronUp className="w-3.5 h-3.5 text-[#5a6485]" />
        )}
      </button>

      {/* Outcomes Grid */}
      {!collapsed && (
        <div className={`px-2 pb-2 grid ${gridClass} gap-1.5`}>
          {market.outcomes.map((outcome) => {
            const selected = isOutcomeSelected(outcome);
            return (
              <button
                key={`${outcome.name}-${outcome.point ?? ""}`}
                onClick={() => handleSelect(outcome)}
                className={`flex items-center justify-between rounded-md px-2.5 py-2 transition-all duration-150 ${
                  selected
                    ? "bg-[#00d46e] text-white shadow-md shadow-[#00d46e]/20"
                    : "bg-[#0d0f17] border border-[#1e2338] hover:border-[#00d46e]/40 hover:bg-[#0d0f17]/80"
                }`}
              >
                <span
                  className={`text-[11px] font-medium truncate mr-2 ${
                    selected ? "text-white" : "text-[#8b95b8]"
                  }`}
                >
                  {outcome.label}
                </span>
                <span
                  className={`text-[13px] font-bold shrink-0 ${
                    selected ? "text-white" : "text-[#00d46e]"
                  }`}
                >
                  {outcome.odds.toFixed(2)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Quick Odds Button (Header 1X2)
   ═══════════════════════════════════════════════════════════════════════════ */

function QuickOddsButton({
  match,
  label,
  sublabel,
  selection,
  odds,
  outcomeName,
  teamColor,
}: {
  match: Match;
  label: string;
  sublabel: string;
  selection: string;
  odds: number;
  outcomeName: string;
  teamColor: string;
}) {
  const { items } = useSyncExternalStore(
    betSlipStore.subscribe,
    betSlipStore.getSnapshot,
    betSlipStore.getServerSnapshot
  );

  const betId = `${match.id}-${outcomeName}`;
  const selected = items.some((b) => b.id === betId);

  const handleClick = () => {
    betSlipStore.addBet({
      id: betId,
      matchId: match.id,
      match: `${match.homeTeam} vs ${match.awayTeam}`,
      selection,
      odds,
      market: "Match Result",
    });
  };

  return (
    <button
      onClick={handleClick}
      className={`relative flex flex-col items-center justify-center rounded-xl py-3 px-3 transition-all duration-200 overflow-hidden ${
        selected
          ? "bg-[#00d46e] text-white shadow-lg shadow-[#00d46e]/25"
          : "bg-[#1c2033] border border-[#2a3050] hover:border-[#00d46e]/40"
      }`}
    >
      {/* Team color accent bar */}
      {!selected && (
        <div
          className="absolute top-0 left-0 right-0 h-[3px]"
          style={{ backgroundColor: teamColor }}
        />
      )}
      <span
        className={`text-[10px] font-medium ${
          selected ? "text-white/80" : "text-[#5a6485]"
        }`}
      >
        {label} · {sublabel}
      </span>
      <span
        className={`text-base font-black mt-0.5 ${
          selected ? "text-white" : "text-[#00d46e]"
        }`}
      >
        {odds.toFixed(2)}
      </span>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Info Cell
   ═══════════════════════════════════════════════════════════════════════════ */

function InfoCell({
  label,
  value,
  color,
  capitalize,
}: {
  label: string;
  value: string;
  color?: string;
  capitalize?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] text-[#5a6485] mb-0.5 uppercase tracking-wider">{label}</p>
      <p
        className={`text-xs font-semibold ${capitalize ? "capitalize" : ""}`}
        style={{ color: color || "#FFFFFF" }}
      >
        {value}
      </p>
    </div>
  );
}
