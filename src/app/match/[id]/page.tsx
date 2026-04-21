"use client";

import { use, useState, useEffect, useSyncExternalStore, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Star,
  Share2,
  TrendingUp,
  Loader2,
  Lock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Match } from "@/lib/data";
import { betSlipStore } from "@/store/betslip";

// ─── Types ──────────────────────────────────────────────────────────────────

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

// ─── Sport Icons ────────────────────────────────────────────────────────────

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

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [match, setMatch] = useState<Match | null>(null);
  const [categories, setCategories] = useState<MarketCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [marketsLoading, setMarketsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("main");

  // Fetch match + markets
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
          setActiveTab(data.marketCategories[0].id);
        } else {
          // If no markets returned, try fetching them separately
          setMarketsLoading(true);
          fetch(`/api/matches/${id}?markets=true`)
            .then((r) => r.json())
            .then((d) => {
              if (d.marketCategories?.length) {
                setCategories(d.marketCategories);
                setActiveTab(d.marketCategories[0].id);
              }
            })
            .catch(() => {})
            .finally(() => setMarketsLoading(false));
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#00d46e]" />
        <p className="text-sm text-[#5a6485]">Loading match data...</p>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-full bg-[#1c2033] flex items-center justify-center">
          <span className="text-2xl">😕</span>
        </div>
        <p className="text-[#5a6485]">{error || "Match not found"}</p>
        <Link href="/sports" className="text-[#00d46e] text-sm font-semibold hover:underline">
          Back to Sports
        </Link>
      </div>
    );
  }

  const activeCategory = categories.find((c) => c.id === activeTab);
  const sportIcon = sportIcons[match.sport] || "\uD83C\uDFC6";

  return (
    <div className="min-h-screen pb-24">
      {/* ═══ MATCH HEADER ═══ */}
      <div
        className={`border-b ${
          match.isLive
            ? "border-[#ff4757]/20 bg-gradient-to-b from-[#ff4757]/8 via-[#161925] to-[#0f1118]"
            : "border-[#2a3050] bg-gradient-to-b from-[#1c2033] to-[#0f1118]"
        }`}
      >
        <div className="px-4 lg:px-6 py-4 max-w-4xl mx-auto">
          {/* Nav Bar */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <Link
                href="/sports"
                className="p-2 -ml-2 text-[#5a6485] hover:text-white transition-colors rounded-lg hover:bg-[#1c2033]"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{sportIcon}</span>
                  <p className="text-xs text-[#8b95b8] font-medium">{match.league}</p>
                </div>
                {match.isLive ? (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 bg-[#ff4757] rounded-full live-pulse" />
                    <span className="text-[11px] font-bold text-[#ff4757]">LIVE - {match.time}</span>
                  </div>
                ) : (
                  <p className="text-[11px] text-[#5a6485] mt-0.5">{match.time}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button className="p-2.5 text-[#5a6485] hover:text-[#ffc107] transition-colors rounded-lg hover:bg-[#1c2033]">
                <Star className="w-5 h-5" />
              </button>
              <button className="p-2.5 text-[#5a6485] hover:text-white transition-colors rounded-lg hover:bg-[#1c2033]">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Teams & Score */}
          <div className="flex items-center justify-center gap-4 sm:gap-10 py-4 sm:py-6">
            <div className="text-center flex-1">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-[#2a3050] to-[#1c2033] rounded-2xl flex items-center justify-center mx-auto mb-3 border border-[#2a3050]">
                <span className="text-2xl sm:text-3xl font-bold text-white">
                  {match.homeTeam.charAt(0)}
                </span>
              </div>
              <p className="text-sm sm:text-base font-bold text-white truncate px-1">
                {match.homeTeam}
              </p>
              <p className="text-[10px] text-[#5a6485] mt-0.5">Home</p>
            </div>

            <div className="text-center shrink-0">
              {match.isLive ? (
                <>
                  <div className="text-3xl sm:text-5xl font-black text-white tracking-wider">
                    {match.homeScore}{" "}
                    <span className="text-[#5a6485] mx-1">-</span>{" "}
                    {match.awayScore}
                  </div>
                  {match.minute && (
                    <div className="mt-3">
                      <div className="w-24 sm:w-36 h-1.5 bg-[#2a3050] rounded-full overflow-hidden mx-auto">
                        <div
                          className="h-full bg-gradient-to-r from-[#00d46e] to-[#00ff85] rounded-full transition-all duration-1000"
                          style={{ width: `${Math.min((match.minute / 90) * 100, 100)}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-[#5a6485] mt-1">{match.minute}&apos; min</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <div className="text-2xl sm:text-3xl font-black text-[#5a6485]">VS</div>
                  <div className="text-[10px] text-[#5a6485]">Kick Off</div>
                </div>
              )}
            </div>

            <div className="text-center flex-1">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-[#2a3050] to-[#1c2033] rounded-2xl flex items-center justify-center mx-auto mb-3 border border-[#2a3050]">
                <span className="text-2xl sm:text-3xl font-bold text-white">
                  {match.awayTeam.charAt(0)}
                </span>
              </div>
              <p className="text-sm sm:text-base font-bold text-white truncate px-1">
                {match.awayTeam}
              </p>
              <p className="text-[10px] text-[#5a6485] mt-0.5">Away</p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ MARKET TABS ═══ */}
      <div className="sticky top-0 z-30 bg-[#0f1118]/95 backdrop-blur-md border-b border-[#2a3050]">
        <div className="max-w-4xl mx-auto">
          <div className="flex overflow-x-auto scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-all ${
                  activeTab === cat.id
                    ? "border-[#00d46e] text-[#00d46e]"
                    : "border-transparent text-[#5a6485] hover:text-[#8b95b8]"
                }`}
              >
                <span className="text-sm">{cat.icon}</span>
                <span>{cat.name}</span>
                <span className="text-[9px] opacity-60">({cat.markets.length})</span>
              </button>
            ))}
            {categories.length === 0 && !marketsLoading && (
              <div className="px-4 py-3 text-xs text-[#5a6485]">
                Loading markets...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ MARKET CONTENT ═══ */}
      <div className="px-4 lg:px-6 py-4 max-w-4xl mx-auto">
        {marketsLoading && categories.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-[#00d46e]" />
            <p className="text-sm text-[#5a6485]">Loading betting markets...</p>
          </div>
        )}

        {activeCategory && (
          <div className="space-y-3">
            {activeCategory.markets.map((market) => (
              <MarketBlock
                key={market.key}
                market={market}
                match={match}
              />
            ))}
          </div>
        )}

        {categories.length > 0 && !activeCategory && (
          <div className="text-center py-12">
            <p className="text-sm text-[#5a6485]">Select a market category above</p>
          </div>
        )}

        {/* Quick 1X2 always visible at bottom */}
        {categories.length > 0 && activeTab !== "main" && (
          <div className="mt-6 pt-4 border-t border-[#2a3050]/50">
            <p className="text-[10px] text-[#5a6485] uppercase tracking-wider mb-2 font-semibold">
              Quick Bet — Match Result
            </p>
            <div className={`grid ${match.odds.draw > 0 ? "grid-cols-3" : "grid-cols-2"} gap-2`}>
              <QuickOddsButton
                match={match}
                label="1"
                selection={match.homeTeam}
                odds={match.odds.home}
                market="Match Result"
                marketKey="h2h"
                outcomeName="home"
              />
              {match.odds.draw > 0 && (
                <QuickOddsButton
                  match={match}
                  label="X"
                  selection="Draw"
                  odds={match.odds.draw}
                  market="Match Result"
                  marketKey="h2h"
                  outcomeName="draw"
                />
              )}
              <QuickOddsButton
                match={match}
                label="2"
                selection={match.awayTeam}
                odds={match.odds.away}
                market="Match Result"
                marketKey="h2h"
                outcomeName="away"
              />
            </div>
          </div>
        )}

        {/* Match Info */}
        <div className="mt-6 bg-[#1c2033] border border-[#2a3050] rounded-xl p-4">
          <h3 className="text-xs font-bold text-[#8b95b8] uppercase tracking-wider mb-3">
            Match Information
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-[#5a6485] mb-0.5">Competition</p>
              <p className="text-white font-medium">{match.league}</p>
            </div>
            <div>
              <p className="text-[#5a6485] mb-0.5">Sport</p>
              <p className="text-white font-medium capitalize">{match.sport}</p>
            </div>
            <div>
              <p className="text-[#5a6485] mb-0.5">Status</p>
              <p className={`font-medium ${match.isLive ? "text-[#ff4757]" : "text-[#00d46e]"}`}>
                {match.isLive ? "In Play" : "Upcoming"}
              </p>
            </div>
            <div>
              <p className="text-[#5a6485] mb-0.5">Markets</p>
              <p className="text-white font-medium">
                {categories.reduce((acc, c) => acc + c.markets.length, 0)}+ available
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Market Block Component ─────────────────────────────────────────────────

function MarketBlock({ market, match }: { market: ProcessedMarket; match: Match }) {
  const [collapsed, setCollapsed] = useState(false);
  const { items } = useSyncExternalStore(
    betSlipStore.subscribe,
    betSlipStore.getSnapshot,
    betSlipStore.getServerSnapshot
  );

  const handleSelect = useCallback(
    (outcome: MarketOutcome) => {
      const betId = `${match.id}__${market.key}__${outcome.name}${outcome.point !== undefined ? `_${outcome.point}` : ""}`;
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
      const betId = `${match.id}__${market.key}__${outcome.name}${outcome.point !== undefined ? `_${outcome.point}` : ""}`;
      return items.some((b) => b.id === betId);
    },
    [match.id, market.key, items]
  );

  // Determine layout based on number of outcomes
  const outcomeCount = market.outcomes.length;
  const gridClass =
    outcomeCount === 2
      ? "grid-cols-2"
      : outcomeCount === 3
      ? "grid-cols-3"
      : outcomeCount <= 4
      ? "grid-cols-2 sm:grid-cols-4"
      : "grid-cols-2 sm:grid-cols-3";

  return (
    <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl overflow-hidden transition-all hover:border-[#2a3050]/80">
      {/* Market Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#161925]/50 transition-colors"
      >
        <p className="text-xs font-semibold text-[#8b95b8]">{market.name}</p>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-[#5a6485]">{outcomeCount} options</span>
          {collapsed ? (
            <ChevronDown className="w-3.5 h-3.5 text-[#5a6485]" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5 text-[#5a6485]" />
          )}
        </div>
      </button>

      {/* Market Outcomes */}
      {!collapsed && (
        <div className={`p-2 sm:p-3 grid ${gridClass} gap-1.5 sm:gap-2`}>
          {market.outcomes.map((outcome) => {
            const selected = isOutcomeSelected(outcome);
            return (
              <button
                key={`${outcome.name}-${outcome.point ?? ""}`}
                onClick={() => handleSelect(outcome)}
                className={`flex items-center justify-between rounded-lg px-3 py-2.5 transition-all duration-200 min-h-[44px] ${
                  selected
                    ? "bg-[#00d46e]/15 border border-[#00d46e]/50 shadow-sm shadow-[#00d46e]/10"
                    : "bg-[#0f1118] border border-[#2a3050] hover:border-[#00d46e]/30 hover:bg-[#0f1118]/80"
                }`}
              >
                <span
                  className={`text-xs font-medium truncate mr-2 ${
                    selected ? "text-[#00d46e]" : "text-[#8b95b8]"
                  }`}
                >
                  {outcome.label}
                </span>
                <span
                  className={`text-sm font-bold shrink-0 ${
                    selected ? "text-[#00d46e]" : "text-white"
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

// ─── Quick Odds Button (for the bottom 1X2 shortcut) ────────────────────────

function QuickOddsButton({
  match,
  label,
  selection,
  odds,
  market,
  marketKey,
  outcomeName,
}: {
  match: Match;
  label: string;
  selection: string;
  odds: number;
  market: string;
  marketKey: string;
  outcomeName: string;
}) {
  const { items } = useSyncExternalStore(
    betSlipStore.subscribe,
    betSlipStore.getSnapshot,
    betSlipStore.getServerSnapshot
  );

  // Use same ID format as MatchCard for compatibility
  const betId = `${match.id}-${outcomeName}`;
  const selected = items.some((b) => b.id === betId);

  const handleClick = () => {
    betSlipStore.addBet({
      id: betId,
      matchId: match.id,
      match: `${match.homeTeam} vs ${match.awayTeam}`,
      selection,
      odds,
      market,
    });
  };

  return (
    <button
      onClick={handleClick}
      className={`flex flex-col items-center justify-center rounded-xl py-3 px-3 transition-all duration-200 ${
        selected
          ? "bg-[#00d46e]/15 border border-[#00d46e]/50 text-[#00d46e] shadow-sm shadow-[#00d46e]/10"
          : "bg-[#1c2033] border border-[#2a3050] text-[#8b95b8] hover:border-[#00d46e]/30 hover:text-white"
      }`}
    >
      <span className="text-[10px] font-medium opacity-60">{label}</span>
      <span className="text-sm font-bold">{odds.toFixed(2)}</span>
    </button>
  );
}
