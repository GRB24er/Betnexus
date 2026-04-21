/**
 * The Odds API Integration Library — v3 (Background Pre-fetch)
 * https://the-odds-api.com
 *
 * Architecture:
 *   1. On first request, fetches ALL sports sequentially and stores them in a
 *      global in-memory match store.
 *   2. A background interval refreshes the store every 10 minutes.
 *   3. All page requests read from the store INSTANTLY — zero API wait time.
 *   4. Requests are throttled to 1 per 1.1s with auto-retry on 429.
 */

import { Match } from "@/lib/data";

const ODDS_API_KEY = process.env.ODDS_API_KEY!;
const BASE_URL = "https://api.the-odds-api.com/v4";

// ─── Types from The Odds API ──────────────────────────────────────────────────

export interface OddsAPIOutcome { name: string; price: number; }
export interface OddsAPIMarket { key: string; last_update: string; outcomes: OddsAPIOutcome[]; }
export interface OddsAPIBookmaker { key: string; title: string; last_update: string; markets: OddsAPIMarket[]; }
export interface OddsAPIEvent {
  id: string; sport_key: string; sport_title: string; commence_time: string;
  home_team: string; away_team: string; bookmakers: OddsAPIBookmaker[];
}
export interface OddsAPIScore {
  id: string; sport_key: string; sport_title: string; commence_time: string;
  completed: boolean; last_update: string | null;
  home_team: string; away_team: string; scores: { name: string; score: string }[] | null;
}

// ─── Supported Sports ────────────────────────────────────────────────────────

export const SUPPORTED_SPORTS: { key: string; name: string; icon: string; sport: string }[] = [
  { key: "soccer_epl",                  name: "Premier League",     icon: "⚽", sport: "football" },
  { key: "soccer_uefa_champs_league",   name: "Champions League",   icon: "⚽", sport: "football" },
  { key: "soccer_spain_la_liga",        name: "La Liga",            icon: "⚽", sport: "football" },
  { key: "soccer_germany_bundesliga",   name: "Bundesliga",         icon: "⚽", sport: "football" },
  { key: "soccer_italy_serie_a",        name: "Serie A",            icon: "⚽", sport: "football" },
  { key: "soccer_france_ligue_one",     name: "Ligue 1",            icon: "⚽", sport: "football" },
  { key: "soccer_africa_cup_of_nations", name: "AFCON",             icon: "⚽", sport: "football" },
  { key: "basketball_nba",              name: "NBA",                icon: "🏀", sport: "basketball" },
  { key: "basketball_euroleague",       name: "EuroLeague",         icon: "🏀", sport: "basketball" },
  { key: "tennis_atp_french_open",      name: "ATP Tennis",         icon: "🎾", sport: "tennis" },
  { key: "cricket_ipl",                 name: "IPL Cricket",        icon: "🏏", sport: "cricket" },
  { key: "cricket_test_match",          name: "Test Cricket",       icon: "🏏", sport: "cricket" },
  { key: "baseball_mlb",               name: "MLB",                icon: "⚾", sport: "baseball" },
  { key: "icehockey_nhl",              name: "NHL",                icon: "🏒", sport: "ice-hockey" },
  { key: "mma_mixed_martial_arts",     name: "MMA / UFC",          icon: "🥊", sport: "mma" },
  { key: "rugbyleague_nrl",            name: "NRL Rugby",          icon: "🏉", sport: "rugby" },
];

// ─── Request Throttle & Retry ────────────────────────────────────────────────

let lastRequestTime = 0;
const MIN_INTERVAL = 1100;

async function throttle(): Promise<void> {
  const elapsed = Date.now() - lastRequestTime;
  if (elapsed < MIN_INTERVAL) {
    await new Promise((r) => setTimeout(r, MIN_INTERVAL - elapsed));
  }
  lastRequestTime = Date.now();
}

async function oddsApiFetch<T>(path: string, params: Record<string, string> = {}, retries = 2): Promise<T> {
  if (!ODDS_API_KEY) throw new Error("ODDS_API_KEY not set");
  await throttle();

  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set("apiKey", ODDS_API_KEY);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString(), { cache: "no-store" });

  if (res.status === 429 && retries > 0) {
    const wait = Math.max(parseInt(res.headers.get("retry-after") || "5", 10) * 1000, 3000) * (3 - retries);
    console.warn(`[oddsapi] 429 — retrying in ${wait}ms (${retries} left)`);
    await new Promise((r) => setTimeout(r, wait));
    return oddsApiFetch<T>(path, params, retries - 1);
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Odds API ${res.status}: ${text}`);
  }

  const remaining = res.headers.get("x-requests-remaining");
  if (remaining) console.log(`[oddsapi] credits: ${res.headers.get("x-requests-used")} used, ${remaining} remaining`);

  return res.json() as Promise<T>;
}

// ─── Normalise Event → Match ─────────────────────────────────────────────────

function extractOdds(event: OddsAPIEvent): { home: number; draw: number; away: number } | null {
  const PREFERRED = ["pinnacle", "bet365", "unibet", "betfair_ex_eu"];
  let bm = event.bookmakers.find((b) => PREFERRED.includes(b.key)) || event.bookmakers[0];
  if (!bm) return null;
  const h2h = bm.markets.find((m) => m.key === "h2h");
  if (!h2h) return null;
  const home = h2h.outcomes.find((o) => o.name === event.home_team);
  const away = h2h.outcomes.find((o) => o.name === event.away_team);
  const draw = h2h.outcomes.find((o) => o.name !== event.home_team && o.name !== event.away_team);
  if (!home || !away) return null;
  return { home: +home.price.toFixed(2), draw: draw ? +draw.price.toFixed(2) : 0, away: +away.price.toFixed(2) };
}

function normaliseEvent(event: OddsAPIEvent, sportMeta: typeof SUPPORTED_SPORTS[number]): Match | null {
  const odds = extractOdds(event);
  if (!odds) return null;

  const d = new Date(event.commence_time);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const isTomorrow = d.toDateString() === new Date(now.getTime() + 86400000).toDateString();
  const fmt = (dt: Date) => dt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  const time = isToday ? `Today, ${fmt(d)}`
    : isTomorrow ? `Tomorrow, ${fmt(d)}`
    : `${d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}, ${fmt(d)}`;

  return {
    id: event.id,
    league: event.sport_title,
    homeTeam: event.home_team,
    awayTeam: event.away_team,
    time,
    commenceTime: event.commence_time,
    isLive: false,
    odds,
    markets: event.bookmakers.reduce((a, b) => a + b.markets.length, 0),
    sport: sportMeta.sport,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// GLOBAL MATCH STORE — Pre-fetched, always ready
// ═════════════════════════════════════════════════════════════════════════════

interface MatchStore {
  matches: Match[];
  lastRefresh: number;
  refreshing: boolean;
  initialized: boolean;
}

const store: MatchStore = {
  matches: [],
  lastRefresh: 0,
  refreshing: false,
  initialized: false,
};

const REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes

/**
 * Fetch all matches from all sports sequentially and populate the store.
 * Called once on first request, then every 10 minutes in the background.
 */
async function refreshStore(): Promise<void> {
  if (store.refreshing) return;
  store.refreshing = true;

  console.log("[oddsapi] Refreshing match store...");
  const allMatches: Match[] = [];

  for (const sportMeta of SUPPORTED_SPORTS) {
    try {
      const events = await oddsApiFetch<OddsAPIEvent[]>(`/sports/${sportMeta.key}/odds`, {
        regions: "eu,uk",
        markets: "h2h",
        oddsFormat: "decimal",
        dateFormat: "iso",
      });
      const matches = events.map((e) => normaliseEvent(e, sportMeta)).filter((m): m is Match => m !== null);
      allMatches.push(...matches);
    } catch (err) {
      // Log but continue — don't let one sport failure block everything
      console.warn(`[oddsapi] Skipping ${sportMeta.key}:`, err instanceof Error ? err.message : err);
    }
  }

  store.matches = allMatches;
  store.lastRefresh = Date.now();
  store.initialized = true;
  store.refreshing = false;

  console.log(`[oddsapi] Store refreshed: ${allMatches.length} matches across ${SUPPORTED_SPORTS.length} sports`);
}

/**
 * Ensure the store is populated. If stale, triggers a background refresh
 * but still returns the current (stale) data instantly.
 */
async function ensureStore(): Promise<void> {
  if (!store.initialized) {
    // First request ever — must wait for initial load
    await refreshStore();
    return;
  }

  // If data is stale, trigger background refresh (don't wait)
  if (Date.now() - store.lastRefresh > REFRESH_INTERVAL && !store.refreshing) {
    refreshStore().catch((err) => console.error("[oddsapi] Background refresh failed:", err));
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// PUBLIC API — All reads are instant from the store
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Get all matches, optionally filtered by sport category and date range.
 * Returns INSTANTLY from the in-memory store.
 */
export async function getMatches(options?: {
  sport?: string;       // "football", "basketball", etc. or "all"
  time?: string;        // "today", "tomorrow", "week", "all"
}): Promise<{ upcoming: Match[]; live: Match[]; total: number }> {
  await ensureStore();

  const sport = options?.sport || "all";
  const time = options?.time || "all";
  const now = new Date();

  let matches = [...store.matches];

  // ── Filter by sport ────────────────────────────────────────────────────────
  if (sport !== "all") {
    const isDirectKey = SUPPORTED_SPORTS.some((s) => s.key === sport);
    if (isDirectKey) {
      const cat = SUPPORTED_SPORTS.find((s) => s.key === sport)?.sport;
      matches = matches.filter((m) => m.sport === cat);
    } else {
      matches = matches.filter((m) => m.sport === sport);
    }
  }

  // ── Filter by date ─────────────────────────────────────────────────────────
  if (time !== "all" && time) {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfTomorrow = new Date(startOfToday.getTime() + 86400000);
    const startOfDayAfterTomorrow = new Date(startOfTomorrow.getTime() + 86400000);
    const endOfWeek = new Date(startOfToday.getTime() + 7 * 86400000);

    matches = matches.filter((m) => {
      if (!m.commenceTime) return true;
      const ct = new Date(m.commenceTime);

      switch (time.toLowerCase()) {
        case "today":
          return ct >= startOfToday && ct < startOfTomorrow;
        case "tomorrow":
          return ct >= startOfTomorrow && ct < startOfDayAfterTomorrow;
        case "this week":
        case "week":
          return ct >= startOfToday && ct < endOfWeek;
        default:
          return true;
      }
    });
  }

  // ── Separate live vs upcoming ──────────────────────────────────────────────
  const nowMs = now.getTime();
  const live: Match[] = [];
  const upcoming: Match[] = [];

  for (const m of matches) {
    if (m.commenceTime) {
      const commence = new Date(m.commenceTime).getTime();
      const isLive = commence <= nowMs && nowMs - commence < 3 * 60 * 60 * 1000;
      if (isLive) {
        m.isLive = true;
        m.minute = Math.min(90, Math.floor((nowMs - commence) / 60000));
        m.time = `${m.minute}'`;
        live.push(m);
        continue;
      }
    }
    upcoming.push(m);
  }

  // Sort upcoming by commence time (soonest first)
  upcoming.sort((a, b) => {
    if (!a.commenceTime || !b.commenceTime) return 0;
    return new Date(a.commenceTime).getTime() - new Date(b.commenceTime).getTime();
  });

  return { upcoming, live, total: live.length + upcoming.length };
}

/**
 * Fetch odds for a single specific event by its Odds API event ID.
 * This one still hits the API directly (single event, fast response).
 */
export async function fetchMatchById(sportKey: string, eventId: string): Promise<Match | null> {
  // First check the store
  await ensureStore();
  const fromStore = store.matches.find((m) => m.id === eventId);
  if (fromStore) return fromStore;

  // Not in store — fetch directly
  const sportMeta = SUPPORTED_SPORTS.find((s) => s.key === sportKey);
  if (!sportMeta) return null;

  try {
    const events = await oddsApiFetch<OddsAPIEvent[]>(`/sports/${sportKey}/odds`, {
      regions: "eu,uk",
      markets: "h2h,spreads,totals",
      oddsFormat: "decimal",
      dateFormat: "iso",
      eventIds: eventId,
    });
    if (!events.length) return null;
    return normaliseEvent(events[0], sportMeta);
  } catch (err) {
    console.error(`[oddsapi] fetchMatchById(${eventId}) failed:`, err);
    return null;
  }
}

/**
 * Get the store status (for debugging/admin).
 */
export function getStoreStatus() {
  return {
    matchCount: store.matches.length,
    lastRefresh: store.lastRefresh ? new Date(store.lastRefresh).toISOString() : "never",
    isRefreshing: store.refreshing,
    initialized: store.initialized,
    sportBreakdown: SUPPORTED_SPORTS.map((s) => ({
      sport: s.name,
      count: store.matches.filter((m) => m.sport === s.sport && m.league === s.name).length,
    })).filter((s) => s.count > 0),
  };
}
