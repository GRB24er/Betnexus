/**
 * The Odds API Integration Library
 * https://the-odds-api.com
 *
 * Handles all communication with The Odds API, normalises the response
 * into the internal Match shape used across Betnexus, and provides a
 * server-side in-memory cache so we don't burn through API credits.
 *
 * Rate-limit aware: requests are throttled to max 1 per second with
 * automatic retry + exponential backoff on 429 responses.
 */

import { Match } from "@/lib/data";

const ODDS_API_KEY = process.env.ODDS_API_KEY!;
const BASE_URL = "https://api.the-odds-api.com/v4";

// ─── Types from The Odds API ──────────────────────────────────────────────────

export interface OddsAPIOutcome {
  name: string;
  price: number;
}

export interface OddsAPIMarket {
  key: string;
  last_update: string;
  outcomes: OddsAPIOutcome[];
}

export interface OddsAPIBookmaker {
  key: string;
  title: string;
  last_update: string;
  markets: OddsAPIMarket[];
}

export interface OddsAPIEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: OddsAPIBookmaker[];
}

export interface OddsAPIScore {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  completed: boolean;
  last_update: string | null;
  home_team: string;
  away_team: string;
  scores: { name: string; score: string }[] | null;
}

// ─── Sports we support (Odds API sport keys) ─────────────────────────────────

export const SUPPORTED_SPORTS: { key: string; name: string; icon: string; sport: string }[] = [
  { key: "soccer_epl",              name: "Premier League",        icon: "⚽", sport: "football" },
  { key: "soccer_uefa_champs_league", name: "Champions League",    icon: "⚽", sport: "football" },
  { key: "soccer_spain_la_liga",    name: "La Liga",               icon: "⚽", sport: "football" },
  { key: "soccer_germany_bundesliga", name: "Bundesliga",          icon: "⚽", sport: "football" },
  { key: "soccer_italy_serie_a",    name: "Serie A",               icon: "⚽", sport: "football" },
  { key: "soccer_france_ligue_one", name: "Ligue 1",               icon: "⚽", sport: "football" },
  { key: "soccer_africa_cup_of_nations", name: "AFCON",            icon: "⚽", sport: "football" },
  { key: "basketball_nba",          name: "NBA",                   icon: "🏀", sport: "basketball" },
  { key: "basketball_euroleague",   name: "EuroLeague",            icon: "🏀", sport: "basketball" },
  { key: "tennis_atp_french_open",  name: "ATP Tennis",            icon: "🎾", sport: "tennis" },
  { key: "cricket_ipl",             name: "IPL Cricket",           icon: "🏏", sport: "cricket" },
  { key: "cricket_test_match",      name: "Test Cricket",          icon: "🏏", sport: "cricket" },
  { key: "baseball_mlb",            name: "MLB",                   icon: "⚾", sport: "baseball" },
  { key: "icehockey_nhl",           name: "NHL",                   icon: "🏒", sport: "ice-hockey" },
  { key: "mma_mixed_martial_arts",  name: "MMA / UFC",             icon: "🥊", sport: "mma" },
  { key: "rugbyleague_nrl",         name: "NRL Rugby",             icon: "🏉", sport: "rugby" },
];

// ─── In-memory server-side cache ─────────────────────────────────────────────

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

function getCache<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache<T>(key: string, data: T, ttlMs: number): void {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

// ─── Request throttle (max 1 request per second) ────────────────────────────

let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1100; // 1.1 seconds between requests

async function throttle(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_REQUEST_INTERVAL) {
    await new Promise((resolve) => setTimeout(resolve, MIN_REQUEST_INTERVAL - elapsed));
  }
  lastRequestTime = Date.now();
}

// ─── Fetch helpers with retry on 429 ─────────────────────────────────────────

async function oddsApiFetch<T>(
  path: string,
  params: Record<string, string> = {},
  retries = 2
): Promise<T> {
  if (!ODDS_API_KEY) {
    throw new Error("ODDS_API_KEY environment variable is not set");
  }

  await throttle();

  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set("apiKey", ODDS_API_KEY);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), { next: { revalidate: 0 } });

  // Handle rate limiting with exponential backoff
  if (res.status === 429 && retries > 0) {
    const retryAfter = parseInt(res.headers.get("retry-after") || "5", 10);
    const backoffMs = Math.max(retryAfter * 1000, 3000) * (3 - retries);
    console.warn(`[oddsapi] Rate limited (429), retrying in ${backoffMs}ms... (${retries} retries left)`);
    await new Promise((resolve) => setTimeout(resolve, backoffMs));
    return oddsApiFetch<T>(path, params, retries - 1);
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Odds API error ${res.status}: ${text}`);
  }

  // Log remaining API credits
  const remaining = res.headers.get("x-requests-remaining");
  const used = res.headers.get("x-requests-used");
  if (remaining) {
    console.log(`[oddsapi] API credits: ${used} used, ${remaining} remaining`);
  }

  return res.json() as Promise<T>;
}

// ─── Normalisation: OddsAPIEvent → Match ─────────────────────────────────────

/**
 * Picks the best available bookmaker odds for h2h (moneyline) market.
 * Prefers Pinnacle → Bet365 → first available.
 */
function extractOdds(event: OddsAPIEvent): { home: number; draw: number; away: number } | null {
  const PREFERRED = ["pinnacle", "bet365", "unibet", "betfair_ex_eu", "betfair_ex_uk"];
  let bookmaker = event.bookmakers.find((b) => PREFERRED.includes(b.key));
  if (!bookmaker) bookmaker = event.bookmakers[0];
  if (!bookmaker) return null;

  const h2h = bookmaker.markets.find((m) => m.key === "h2h");
  if (!h2h) return null;

  const homeOutcome = h2h.outcomes.find((o) => o.name === event.home_team);
  const awayOutcome = h2h.outcomes.find((o) => o.name === event.away_team);
  const drawOutcome = h2h.outcomes.find(
    (o) => o.name !== event.home_team && o.name !== event.away_team
  );

  if (!homeOutcome || !awayOutcome) return null;

  return {
    home: +homeOutcome.price.toFixed(2),
    draw: drawOutcome ? +drawOutcome.price.toFixed(2) : 0,
    away: +awayOutcome.price.toFixed(2),
  };
}

function normaliseEvent(event: OddsAPIEvent, sportMeta: typeof SUPPORTED_SPORTS[number]): Match | null {
  const odds = extractOdds(event);
  if (!odds) return null;

  const commenceDate = new Date(event.commence_time);
  const now = new Date();
  const isToday = commenceDate.toDateString() === now.toDateString();
  const isTomorrow =
    commenceDate.toDateString() ===
    new Date(now.getTime() + 86400000).toDateString();

  const timeLabel = isToday
    ? `Today, ${commenceDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`
    : isTomorrow
    ? `Tomorrow, ${commenceDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`
    : commenceDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) +
      `, ${commenceDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;

  return {
    id: event.id,
    league: event.sport_title,
    homeTeam: event.home_team,
    awayTeam: event.away_team,
    time: timeLabel,
    isLive: false,
    odds,
    markets: event.bookmakers.reduce((acc, b) => acc + b.markets.length, 0),
    sport: sportMeta.sport,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetch upcoming odds for a single sport key.
 * Cached for 10 minutes to conserve API credits.
 */
export async function fetchOddsForSport(sportKey: string): Promise<Match[]> {
  const cacheKey = `odds:${sportKey}`;
  const cached = getCache<Match[]>(cacheKey);
  if (cached) return cached;

  const sportMeta = SUPPORTED_SPORTS.find((s) => s.key === sportKey);
  if (!sportMeta) return [];

  try {
    const events = await oddsApiFetch<OddsAPIEvent[]>(`/sports/${sportKey}/odds`, {
      regions: "eu,uk",
      markets: "h2h",
      oddsFormat: "decimal",
      dateFormat: "iso",
    });

    const matches = events
      .map((e) => normaliseEvent(e, sportMeta))
      .filter((m): m is Match => m !== null);

    setCache(cacheKey, matches, 10 * 60 * 1000); // 10 min TTL (was 5 min)
    return matches;
  } catch (err) {
    console.error(`[oddsapi] fetchOddsForSport(${sportKey}) failed:`, err);
    return [];
  }
}

/**
 * Fetch live in-play scores for a single sport key.
 * Cached for 60 seconds for near-real-time updates.
 */
export async function fetchLiveScores(sportKey: string): Promise<OddsAPIScore[]> {
  const cacheKey = `scores:${sportKey}`;
  const cached = getCache<OddsAPIScore[]>(cacheKey);
  if (cached) return cached;

  try {
    const scores = await oddsApiFetch<OddsAPIScore[]>(`/sports/${sportKey}/scores`, {
      daysFrom: "1",
    });
    setCache(cacheKey, scores, 60 * 1000); // 60 sec TTL (was 30 sec)
    return scores;
  } catch (err) {
    console.error(`[oddsapi] fetchLiveScores(${sportKey}) failed:`, err);
    return [];
  }
}

/**
 * Fetch upcoming matches across ALL supported sports.
 * Runs fetches SEQUENTIALLY with throttling to avoid 429 errors.
 * Each sport is cached individually, so only uncached sports hit the API.
 */
export async function fetchAllMatches(): Promise<Match[]> {
  const allMatches: Match[] = [];

  for (const sport of SUPPORTED_SPORTS) {
    try {
      const matches = await fetchOddsForSport(sport.key);
      allMatches.push(...matches);
    } catch {
      // Skip failed sports silently
    }
  }

  return allMatches;
}

/**
 * Fetch matches for a specific sport category (e.g. "football", "basketball").
 * Fetches all sport keys that belong to this category SEQUENTIALLY.
 */
export async function fetchMatchesBySport(sportCategory: string): Promise<Match[]> {
  const sportKeys = SUPPORTED_SPORTS.filter((s) => s.sport === sportCategory);
  const allMatches: Match[] = [];

  for (const sport of sportKeys) {
    try {
      const matches = await fetchOddsForSport(sport.key);
      allMatches.push(...matches);
    } catch {
      // Skip failed sport keys silently
    }
  }

  return allMatches;
}

/**
 * Fetch in-play events for all supported sports and merge live scores.
 * Runs SEQUENTIALLY to respect rate limits.
 * Returns matches enriched with current score and minute.
 */
export async function fetchLiveMatches(): Promise<Match[]> {
  const liveMatches: Match[] = [];

  // Cache the entire live result set for 2 minutes
  const cacheKey = "live:all";
  const cached = getCache<Match[]>(cacheKey);
  if (cached) return cached;

  for (const sportMeta of SUPPORTED_SPORTS) {
    try {
      // Check if we already have cached odds for this sport
      const oddsCacheKey = `odds:${sportMeta.key}`;
      let events: OddsAPIEvent[];
      const cachedOdds = getCache<Match[]>(oddsCacheKey);

      if (cachedOdds) {
        // Use cached data to find live matches without an API call
        const now = Date.now();
        const liveFromCache = cachedOdds.filter((m) => {
          // We can't easily determine "live" from cached Match objects
          // so we fetch scores separately
          return false; // Fall through to score-based detection
        });
        // Still need to fetch odds if not cached
        events = await oddsApiFetch<OddsAPIEvent[]>(
          `/sports/${sportMeta.key}/odds`,
          {
            regions: "eu,uk",
            markets: "h2h",
            oddsFormat: "decimal",
            dateFormat: "iso",
          }
        );
      } else {
        events = await oddsApiFetch<OddsAPIEvent[]>(
          `/sports/${sportMeta.key}/odds`,
          {
            regions: "eu,uk",
            markets: "h2h",
            oddsFormat: "decimal",
            dateFormat: "iso",
          }
        );
        // Cache these odds too
        const matches = events
          .map((e) => normaliseEvent(e, sportMeta))
          .filter((m): m is Match => m !== null);
        setCache(oddsCacheKey, matches, 10 * 60 * 1000);
      }

      // Scores for this sport
      const scores = await fetchLiveScores(sportMeta.key);
      const scoreMap = new Map(scores.map((s) => [s.id, s]));

      const now = Date.now();
      for (const event of events) {
        const commence = new Date(event.commence_time).getTime();
        // Consider a match "live" if it started within the last 3 hours
        const isLive = commence <= now && now - commence < 3 * 60 * 60 * 1000;
        if (!isLive) continue;

        const match = normaliseEvent(event, sportMeta);
        if (!match) continue;

        const scoreData = scoreMap.get(event.id);
        if (scoreData?.scores) {
          const homeScore = scoreData.scores.find((s) => s.name === event.home_team);
          const awayScore = scoreData.scores.find((s) => s.name === event.away_team);
          match.homeScore = homeScore ? parseInt(homeScore.score, 10) : undefined;
          match.awayScore = awayScore ? parseInt(awayScore.score, 10) : undefined;
        }

        match.isLive = true;
        const elapsedMin = Math.floor((now - commence) / 60000);
        match.minute = Math.min(90, elapsedMin);
        match.time = `${match.minute}'`;

        liveMatches.push(match);
      }
    } catch {
      // Silently skip sports with no live events or rate limit issues
    }
  }

  // Cache live results for 2 minutes
  setCache(cacheKey, liveMatches, 2 * 60 * 1000);
  return liveMatches;
}

/**
 * Fetch odds for a single specific event by its Odds API event ID.
 * Used on the match detail page.
 */
export async function fetchMatchById(sportKey: string, eventId: string): Promise<Match | null> {
  const cacheKey = `match:${eventId}`;
  const cached = getCache<Match>(cacheKey);
  if (cached) return cached;

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
    const match = normaliseEvent(events[0], sportMeta);
    if (match) setCache(cacheKey, match, 5 * 60 * 1000); // 5 min TTL (was 2 min)
    return match;
  } catch (err) {
    console.error(`[oddsapi] fetchMatchById(${eventId}) failed:`, err);
    return null;
  }
}
