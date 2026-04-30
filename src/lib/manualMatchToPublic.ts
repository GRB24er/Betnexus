import type { Match } from "@/lib/data";
import type { IManualMatch, IManualMarket } from "@/models/ManualMatch";
import type { Types } from "mongoose";

type StoredManualMatch = IManualMatch & { _id: Types.ObjectId };

/**
 * Convert a ManualMatch document into the public Match shape used by
 * /sports, /live, search, etc. The first market with key "h2h" supplies
 * the home / draw / away odds shown on listings; if it's missing we fall
 * back to the first market's first three outcomes.
 */
export function manualMatchToPublic(m: StoredManualMatch): Match {
  const h2h = m.markets.find((mk) => mk.key === "h2h") ?? m.markets[0];
  const odds = extractOdds(h2h, m.homeTeam, m.awayTeam);

  return {
    id: m._id.toString(),
    league: m.league,
    homeTeam: m.homeTeam,
    awayTeam: m.awayTeam,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    time: formatTime(m),
    commenceTime: m.startTime.toISOString(),
    isLive: m.isLive && m.status !== "completed" && m.status !== "cancelled",
    minute: m.minute,
    odds,
    markets: m.markets.length,
    sport: m.sport,
  };
}

function extractOdds(
  market: IManualMarket | undefined,
  homeTeam: string,
  awayTeam: string
): Match["odds"] {
  if (!market) return { home: 0, draw: 0, away: 0 };

  const find = (matchers: string[]): number => {
    for (const o of market.outcomes) {
      const lower = o.label.toLowerCase();
      if (matchers.some((m) => lower === m || lower.includes(m))) return o.odds;
    }
    return 0;
  };

  return {
    home: find([homeTeam.toLowerCase(), "home", "1"]),
    draw: find(["draw", "tie", "x"]),
    away: find([awayTeam.toLowerCase(), "away", "2"]),
  };
}

function formatTime(m: StoredManualMatch): string {
  if (m.isLive && m.minute !== undefined) return `${m.minute}'`;
  if (m.isLive) return "LIVE";
  if (m.status === "completed") return "FT";
  if (m.status === "cancelled") return "Cancelled";
  const now = new Date();
  const start = new Date(m.startTime);
  const sameDay = now.toDateString() === start.toDateString();
  const time = start.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  return sameDay ? `Today, ${time}` : start.toLocaleString();
}
