/**
 * The Odds API Integration Library — v4 (Full Markets)
 * https://the-odds-api.com
 *
 * Architecture:
 *   1. On first request, fetches ALL sports sequentially and stores them in a
 *      global in-memory match store.
 *   2. A background interval refreshes the store every 10 minutes.
 *   3. All page requests read from the store INSTANTLY — zero API wait time.
 *   4. Requests are throttled to 1 per 1.1s with auto-retry on 429.
 *   5. Per-event market data fetched on demand and cached for 5 minutes.
 */

import { Match } from "@/lib/data";

const ODDS_API_KEY = process.env.ODDS_API_KEY!;
const BASE_URL = "https://api.the-odds-api.com/v4";

// ─── Types from The Odds API ──────────────────────────────────────────────────

export interface OddsAPIOutcome {
  name: string;
  price: number;
  point?: number;
  description?: string;
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

// ─── Processed Market Types ─────────────────────────────────────────────────

export interface MarketOutcome {
  name: string;
  label: string;
  odds: number;
  point?: number;
}

export interface ProcessedMarket {
  key: string;
  name: string;
  outcomes: MarketOutcome[];
}

export interface MarketCategory {
  id: string;
  name: string;
  icon: string;
  markets: ProcessedMarket[];
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
  const bm = event.bookmakers.find((b) => PREFERRED.includes(b.key)) || event.bookmakers[0];
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
// PER-EVENT MARKET CACHE — Fetched on demand, cached 5 minutes
// ═════════════════════════════════════════════════════════════════════════════

interface CachedMarkets {
  categories: MarketCategory[];
  fetchedAt: number;
}

const marketCache = new Map<string, CachedMarkets>();
const MARKET_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Preferred bookmaker order for extracting odds
const PREFERRED_BOOKMAKERS = ["pinnacle", "bet365", "unibet", "betfair_ex_eu", "williamhill", "betway"];

function pickBookmaker(bookmakers: OddsAPIBookmaker[]): OddsAPIBookmaker | null {
  for (const key of PREFERRED_BOOKMAKERS) {
    const bm = bookmakers.find((b) => b.key === key);
    if (bm) return bm;
  }
  return bookmakers[0] || null;
}

function extractMarketFromBookmakers(
  bookmakers: OddsAPIBookmaker[],
  marketKey: string
): OddsAPIMarket | null {
  const bm = pickBookmaker(bookmakers);
  if (!bm) return null;
  return bm.markets.find((m) => m.key === marketKey) || null;
}

/**
 * Process raw API market data into our ProcessedMarket format.
 */
function processMarket(
  raw: OddsAPIMarket,
  displayName: string,
  homeTeam: string,
  awayTeam: string
): ProcessedMarket {
  const outcomes: MarketOutcome[] = raw.outcomes.map((o) => {
    let label = o.name;

    // Replace team names with Home/Away for cleaner display
    if (o.name === homeTeam) label = homeTeam;
    else if (o.name === awayTeam) label = awayTeam;

    // For totals, format as "Over X.5" / "Under X.5"
    if (o.point !== undefined) {
      if (o.name === "Over" || o.name === "Under") {
        label = `${o.name} ${o.point}`;
      } else {
        // Team totals: "Team Over X.5"
        label = `${o.name} ${o.description || ""} ${o.point !== undefined ? o.point : ""}`.trim();
      }
    }

    return {
      name: o.name,
      label,
      odds: +o.price.toFixed(2),
      point: o.point,
    };
  });

  return { key: raw.key, name: displayName, outcomes };
}

/**
 * Generate synthetic odds for markets not available from the API.
 * Uses the match's h2h odds to derive realistic synthetic odds.
 * Covers: Corners, Bookings, Correct Score, HT/FT, First/Last Goal,
 * Odd/Even, Exact Goals, Winning Margin, Multi-Goal, Clean Sheet, Result & BTTS.
 */
function generateSyntheticMarkets(
  homeOdds: number,
  awayOdds: number,
  drawOdds: number,
  homeTeam: string,
  awayTeam: string,
  sport: string
): MarketCategory[] {
  const categories: MarketCategory[] = [];

  // Only generate synthetic markets for football/soccer
  if (sport !== "football") return categories;

  // ─── Probability helpers ───────────────────────────────────────────────
  const homeProb = 1 / homeOdds;
  const drawProb = drawOdds > 0 ? 1 / drawOdds : 0.25;
  const awayProb = 1 / awayOdds;
  const totalProb = homeProb + drawProb + awayProb;
  const hP = homeProb / totalProb;
  const dP = drawProb / totalProb;
  const aP = awayProb / totalProb;

  // Expected goals per team (derived from odds)
  const homeExpGoals = Math.max(0.5, 1.35 * (hP / (hP + aP)) * 2.5);
  const awayExpGoals = Math.max(0.3, 1.35 * (aP / (hP + aP)) * 2.5);
  const totalExpGoals = homeExpGoals + awayExpGoals;

  // Poisson probability helper
  const poisson = (k: number, lambda: number): number => {
    let result = Math.exp(-lambda);
    for (let i = 1; i <= k; i++) {
      result *= lambda / i;
    }
    return result;
  };

  // Odds from probability with margin
  const toOdds = (prob: number, margin = 1.05): number => {
    const clamped = Math.min(0.97, Math.max(0.01, prob));
    return Math.max(1.05, +(1 / clamped * margin).toFixed(2));
  };

  const homeFavStrength = 1 / homeOdds;
  const awayFavStrength = 1 / awayOdds;
  const matchIntensity = homeFavStrength + awayFavStrength;

  // ═════════════════════════════════════════════════════════════════════════
  // CORRECT SCORE
  // ═════════════════════════════════════════════════════════════════════════
  const correctScoreMarkets: ProcessedMarket[] = [];
  const scores: [number, number][] = [
    [0,0],[1,0],[0,1],[1,1],[2,0],[0,2],[2,1],[1,2],[2,2],
    [3,0],[0,3],[3,1],[1,3],[3,2],[2,3],[4,0],[0,4],[4,1],[1,4],[4,2],[2,4],
    [3,3],[4,3],[3,4],[5,0],[0,5],[5,1],[1,5],
  ];

  const csOutcomes: MarketOutcome[] = [];
  let csOtherProb = 1;

  for (const [h, a] of scores) {
    const prob = poisson(h, homeExpGoals) * poisson(a, awayExpGoals);
    csOtherProb -= prob;
    csOutcomes.push({
      name: `${h}-${a}`,
      label: `${h} - ${a}`,
      odds: toOdds(prob, 1.08),
    });
  }

  // "Any Other" score
  csOutcomes.push({
    name: "Other",
    label: "Any Other",
    odds: toOdds(Math.max(0.01, csOtherProb), 1.08),
  });

  correctScoreMarkets.push({
    key: "correct_score",
    name: "Correct Score",
    outcomes: csOutcomes,
  });

  categories.push({
    id: "correctscore",
    name: "Correct Score",
    icon: "🎯",
    markets: correctScoreMarkets,
  });

  // ═════════════════════════════════════════════════════════════════════════
  // HT/FT (Half Time / Full Time)
  // ═════════════════════════════════════════════════════════════════════════
  const htftMarkets: ProcessedMarket[] = [];

  // HT probabilities (draws more likely at HT)
  const htHomeP = hP * 0.7;
  const htDrawP = 0.38 + dP * 0.15;
  const htAwayP = 1 - htHomeP - htDrawP;

  const htftCombos: { ht: string; ft: string; htLabel: string; ftLabel: string; prob: number }[] = [
    { ht: "1", ft: "1", htLabel: homeTeam, ftLabel: homeTeam, prob: htHomeP * hP * 1.3 },
    { ht: "1", ft: "X", htLabel: homeTeam, ftLabel: "Draw", prob: htHomeP * dP * 0.6 },
    { ht: "1", ft: "2", htLabel: homeTeam, ftLabel: awayTeam, prob: htHomeP * aP * 0.3 },
    { ht: "X", ft: "1", htLabel: "Draw", ftLabel: homeTeam, prob: htDrawP * hP * 0.8 },
    { ht: "X", ft: "X", htLabel: "Draw", ftLabel: "Draw", prob: htDrawP * dP * 1.5 },
    { ht: "X", ft: "2", htLabel: "Draw", ftLabel: awayTeam, prob: htDrawP * aP * 0.8 },
    { ht: "2", ft: "1", htLabel: awayTeam, ftLabel: homeTeam, prob: htAwayP * hP * 0.3 },
    { ht: "2", ft: "X", htLabel: awayTeam, ftLabel: "Draw", prob: htAwayP * dP * 0.6 },
    { ht: "2", ft: "2", htLabel: awayTeam, ftLabel: awayTeam, prob: htAwayP * aP * 1.3 },
  ];

  // Normalise probabilities
  const htftTotal = htftCombos.reduce((s, c) => s + c.prob, 0);
  const htftOutcomes: MarketOutcome[] = htftCombos.map((c) => ({
    name: `${c.ht}/${c.ft}`,
    label: `${c.htLabel} / ${c.ftLabel}`,
    odds: toOdds(c.prob / htftTotal, 1.1),
  }));

  htftMarkets.push({
    key: "htft",
    name: "Half Time / Full Time",
    outcomes: htftOutcomes,
  });

  categories.push({
    id: "htft",
    name: "HT/FT",
    icon: "⏰",
    markets: htftMarkets,
  });

  // ═════════════════════════════════════════════════════════════════════════
  // SPECIALS — First Goal, Last Goal, Odd/Even, Exact Goals, Winning Margin,
  //            Multi-Goal, Clean Sheet, Result & BTTS
  // ═════════════════════════════════════════════════════════════════════════
  const specialMarkets: ProcessedMarket[] = [];

  // ─── First Goal Scorer (team) ──────────────────────────────────────────
  const noGoalProb = poisson(0, homeExpGoals) * poisson(0, awayExpGoals);
  const firstGoalHome = (homeExpGoals / totalExpGoals) * (1 - noGoalProb);
  const firstGoalAway = (awayExpGoals / totalExpGoals) * (1 - noGoalProb);

  specialMarkets.push({
    key: "first_goal",
    name: "First Goal",
    outcomes: [
      { name: homeTeam, label: homeTeam, odds: toOdds(firstGoalHome) },
      { name: awayTeam, label: awayTeam, odds: toOdds(firstGoalAway) },
      { name: "No Goal", label: "No Goal", odds: toOdds(noGoalProb) },
    ],
  });

  // ─── Last Goal ─────────────────────────────────────────────────────────
  specialMarkets.push({
    key: "last_goal",
    name: "Last Goal",
    outcomes: [
      { name: homeTeam, label: homeTeam, odds: toOdds(firstGoalHome * 0.98) },
      { name: awayTeam, label: awayTeam, odds: toOdds(firstGoalAway * 0.98) },
      { name: "No Goal", label: "No Goal", odds: toOdds(noGoalProb) },
    ],
  });

  // ─── Odd/Even Total Goals ──────────────────────────────────────────────
  let oddProb = 0;
  let evenProb = 0;
  for (let h = 0; h <= 8; h++) {
    for (let a = 0; a <= 8; a++) {
      const p = poisson(h, homeExpGoals) * poisson(a, awayExpGoals);
      if ((h + a) % 2 === 0) evenProb += p;
      else oddProb += p;
    }
  }
  const oeTotal = oddProb + evenProb;

  specialMarkets.push({
    key: "odd_even",
    name: "Odd/Even Total Goals",
    outcomes: [
      { name: "Odd", label: "Odd", odds: toOdds(oddProb / oeTotal) },
      { name: "Even", label: "Even", odds: toOdds(evenProb / oeTotal) },
    ],
  });

  // ─── Exact Total Goals ─────────────────────────────────────────────────
  const exactGoalsOutcomes: MarketOutcome[] = [];
  let exactRemaining = 1;
  for (let g = 0; g <= 5; g++) {
    let prob = 0;
    for (let h = 0; h <= g; h++) {
      prob += poisson(h, homeExpGoals) * poisson(g - h, awayExpGoals);
    }
    exactRemaining -= prob;
    exactGoalsOutcomes.push({
      name: `${g}`,
      label: `Exactly ${g} Goals`,
      odds: toOdds(prob, 1.06),
    });
  }
  exactGoalsOutcomes.push({
    name: "6+",
    label: "6 or More Goals",
    odds: toOdds(Math.max(0.005, exactRemaining), 1.06),
  });

  specialMarkets.push({
    key: "exact_goals",
    name: "Exact Total Goals",
    outcomes: exactGoalsOutcomes,
  });

  // ─── Winning Margin ────────────────────────────────────────────────────
  const marginOutcomes: { name: string; label: string; prob: number }[] = [
    { name: "Home by 1", label: `${homeTeam} by 1`, prob: 0 },
    { name: "Home by 2", label: `${homeTeam} by 2`, prob: 0 },
    { name: "Home by 3+", label: `${homeTeam} by 3+`, prob: 0 },
    { name: "Draw", label: "Draw", prob: 0 },
    { name: "Away by 1", label: `${awayTeam} by 1`, prob: 0 },
    { name: "Away by 2", label: `${awayTeam} by 2`, prob: 0 },
    { name: "Away by 3+", label: `${awayTeam} by 3+`, prob: 0 },
  ];

  for (let h = 0; h <= 7; h++) {
    for (let a = 0; a <= 7; a++) {
      const p = poisson(h, homeExpGoals) * poisson(a, awayExpGoals);
      const diff = h - a;
      if (diff === 0) marginOutcomes[3].prob += p;
      else if (diff === 1) marginOutcomes[0].prob += p;
      else if (diff === 2) marginOutcomes[1].prob += p;
      else if (diff >= 3) marginOutcomes[2].prob += p;
      else if (diff === -1) marginOutcomes[4].prob += p;
      else if (diff === -2) marginOutcomes[5].prob += p;
      else if (diff <= -3) marginOutcomes[6].prob += p;
    }
  }

  specialMarkets.push({
    key: "winning_margin",
    name: "Winning Margin",
    outcomes: marginOutcomes.map((o) => ({
      name: o.name,
      label: o.label,
      odds: toOdds(o.prob, 1.08),
    })),
  });

  // ─── Multi-Goal (Goal Range) ───────────────────────────────────────────
  const multiGoalRanges: [number, number, string][] = [
    [1, 2, "1-2 Goals"], [1, 3, "1-3 Goals"], [1, 4, "1-4 Goals"],
    [1, 5, "1-5 Goals"], [2, 3, "2-3 Goals"], [2, 4, "2-4 Goals"],
    [2, 5, "2-5 Goals"], [2, 6, "2-6 Goals"], [3, 4, "3-4 Goals"],
    [3, 5, "3-5 Goals"], [3, 6, "3-6 Goals"],
  ];

  const multiGoalOutcomes: MarketOutcome[] = multiGoalRanges.map(([lo, hi, label]) => {
    let prob = 0;
    for (let h = 0; h <= 8; h++) {
      for (let a = 0; a <= 8; a++) {
        const total = h + a;
        if (total >= lo && total <= hi) {
          prob += poisson(h, homeExpGoals) * poisson(a, awayExpGoals);
        }
      }
    }
    return { name: label, label, odds: toOdds(prob, 1.06) };
  });

  specialMarkets.push({
    key: "multi_goal",
    name: "Multi-Goal",
    outcomes: multiGoalOutcomes,
  });

  // ─── Clean Sheet ───────────────────────────────────────────────────────
  const homeCSProb = poisson(0, awayExpGoals); // away scores 0
  const awayCSProb = poisson(0, homeExpGoals); // home scores 0

  specialMarkets.push({
    key: "home_clean_sheet",
    name: `${homeTeam} Clean Sheet`,
    outcomes: [
      { name: "Yes", label: "Yes", odds: toOdds(homeCSProb) },
      { name: "No", label: "No", odds: toOdds(1 - homeCSProb) },
    ],
  });

  specialMarkets.push({
    key: "away_clean_sheet",
    name: `${awayTeam} Clean Sheet`,
    outcomes: [
      { name: "Yes", label: "Yes", odds: toOdds(awayCSProb) },
      { name: "No", label: "No", odds: toOdds(1 - awayCSProb) },
    ],
  });

  // ─── Result & Both Teams to Score ──────────────────────────────────────
  const bttsProb = 1 - poisson(0, homeExpGoals) - poisson(0, awayExpGoals) + noGoalProb;
  const noBttsProb = 1 - bttsProb;

  const resultBttsOutcomes: MarketOutcome[] = [
    { name: "Home & Yes", label: `${homeTeam} & BTTS Yes`, odds: toOdds(hP * bttsProb * 0.85, 1.1) },
    { name: "Home & No", label: `${homeTeam} & BTTS No`, odds: toOdds(hP * noBttsProb * 1.1, 1.1) },
    { name: "Draw & Yes", label: `Draw & BTTS Yes`, odds: toOdds(dP * bttsProb * 1.1, 1.1) },
    { name: "Draw & No", label: `Draw & BTTS No`, odds: toOdds(dP * noBttsProb * 0.5, 1.1) },
    { name: "Away & Yes", label: `${awayTeam} & BTTS Yes`, odds: toOdds(aP * bttsProb * 0.85, 1.1) },
    { name: "Away & No", label: `${awayTeam} & BTTS No`, odds: toOdds(aP * noBttsProb * 1.1, 1.1) },
  ];

  specialMarkets.push({
    key: "result_btts",
    name: "Result & Both Teams to Score",
    outcomes: resultBttsOutcomes,
  });

  // ─── Result & Over/Under 2.5 ──────────────────────────────────────────
  const over25Prob = 1 - (() => {
    let under = 0;
    for (let h = 0; h <= 2; h++) {
      for (let a = 0; a <= 2 - h; a++) {
        under += poisson(h, homeExpGoals) * poisson(a, awayExpGoals);
      }
    }
    return under;
  })();
  const under25Prob = 1 - over25Prob;

  specialMarkets.push({
    key: "result_ou25",
    name: "Result & Over/Under 2.5",
    outcomes: [
      { name: "Home & Over", label: `${homeTeam} & Over 2.5`, odds: toOdds(hP * over25Prob * 0.9, 1.1) },
      { name: "Home & Under", label: `${homeTeam} & Under 2.5`, odds: toOdds(hP * under25Prob * 1.05, 1.1) },
      { name: "Draw & Over", label: `Draw & Over 2.5`, odds: toOdds(dP * over25Prob * 0.7, 1.1) },
      { name: "Draw & Under", label: `Draw & Under 2.5`, odds: toOdds(dP * under25Prob * 1.3, 1.1) },
      { name: "Away & Over", label: `${awayTeam} & Over 2.5`, odds: toOdds(aP * over25Prob * 0.9, 1.1) },
      { name: "Away & Under", label: `${awayTeam} & Under 2.5`, odds: toOdds(aP * under25Prob * 1.05, 1.1) },
    ],
  });

  // ─── Half Time Correct Score ───────────────────────────────────────────
  const htHomeExp = homeExpGoals * 0.45;
  const htAwayExp = awayExpGoals * 0.45;
  const htScores: [number, number][] = [
    [0,0],[1,0],[0,1],[1,1],[2,0],[0,2],[2,1],[1,2],[2,2],[3,0],[0,3],
  ];

  const htCSOutcomes: MarketOutcome[] = [];
  let htCSRemaining = 1;
  for (const [h, a] of htScores) {
    const prob = poisson(h, htHomeExp) * poisson(a, htAwayExp);
    htCSRemaining -= prob;
    htCSOutcomes.push({
      name: `${h}-${a}`,
      label: `${h} - ${a}`,
      odds: toOdds(prob, 1.1),
    });
  }
  htCSOutcomes.push({
    name: "Other",
    label: "Any Other",
    odds: toOdds(Math.max(0.005, htCSRemaining), 1.1),
  });

  specialMarkets.push({
    key: "ht_correct_score",
    name: "Half Time Correct Score",
    outcomes: htCSOutcomes,
  });

  // ─── Both Halves Over 0.5 / Under 0.5 ─────────────────────────────────
  const h1Over05 = 1 - poisson(0, htHomeExp) * poisson(0, htAwayExp);
  const h2Over05 = 1 - poisson(0, homeExpGoals * 0.55) * poisson(0, awayExpGoals * 0.55);
  const bothHalvesOver = h1Over05 * h2Over05;

  specialMarkets.push({
    key: "both_halves_over05",
    name: "Both Halves Over 0.5 Goals",
    outcomes: [
      { name: "Yes", label: "Yes", odds: toOdds(bothHalvesOver) },
      { name: "No", label: "No", odds: toOdds(1 - bothHalvesOver) },
    ],
  });

  // ─── Home/Away to Score in Both Halves ─────────────────────────────────
  const homeScoreBothH = (1 - poisson(0, htHomeExp)) * (1 - poisson(0, homeExpGoals * 0.55));
  const awayScoreBothH = (1 - poisson(0, htAwayExp)) * (1 - poisson(0, awayExpGoals * 0.55));

  specialMarkets.push({
    key: "home_score_both_halves",
    name: `${homeTeam} to Score in Both Halves`,
    outcomes: [
      { name: "Yes", label: "Yes", odds: toOdds(homeScoreBothH) },
      { name: "No", label: "No", odds: toOdds(1 - homeScoreBothH) },
    ],
  });

  specialMarkets.push({
    key: "away_score_both_halves",
    name: `${awayTeam} to Score in Both Halves`,
    outcomes: [
      { name: "Yes", label: "Yes", odds: toOdds(awayScoreBothH) },
      { name: "No", label: "No", odds: toOdds(1 - awayScoreBothH) },
    ],
  });

  // ─── Highest Scoring Half ──────────────────────────────────────────────
  const h1ExpTotal = htHomeExp + htAwayExp;
  const h2ExpTotal = (homeExpGoals + awayExpGoals) * 0.55;
  const h1HigherProb = 0.35 + (h1ExpTotal - h2ExpTotal) * 0.1;
  const equalProb = 0.28;
  const h2HigherProb = 1 - h1HigherProb - equalProb;

  specialMarkets.push({
    key: "highest_scoring_half",
    name: "Highest Scoring Half",
    outcomes: [
      { name: "1st Half", label: "1st Half", odds: toOdds(Math.max(0.15, h1HigherProb)) },
      { name: "Equal", label: "Equal", odds: toOdds(equalProb) },
      { name: "2nd Half", label: "2nd Half", odds: toOdds(Math.max(0.15, h2HigherProb)) },
    ],
  });

  // ─── To Win to Nil ─────────────────────────────────────────────────────
  const homeWinNilProb = hP * poisson(0, awayExpGoals) * 1.5;
  const awayWinNilProb = aP * poisson(0, homeExpGoals) * 1.5;

  specialMarkets.push({
    key: "home_win_to_nil",
    name: `${homeTeam} to Win to Nil`,
    outcomes: [
      { name: "Yes", label: "Yes", odds: toOdds(Math.min(0.5, homeWinNilProb)) },
      { name: "No", label: "No", odds: toOdds(1 - Math.min(0.5, homeWinNilProb)) },
    ],
  });

  specialMarkets.push({
    key: "away_win_to_nil",
    name: `${awayTeam} to Win to Nil`,
    outcomes: [
      { name: "Yes", label: "Yes", odds: toOdds(Math.min(0.5, awayWinNilProb)) },
      { name: "No", label: "No", odds: toOdds(1 - Math.min(0.5, awayWinNilProb)) },
    ],
  });

  categories.push({
    id: "specials",
    name: "Specials",
    icon: "✨",
    markets: specialMarkets,
  });

  // ═════════════════════════════════════════════════════════════════════════
  // CORNERS
  // ═════════════════════════════════════════════════════════════════════════
  const cornerLines = [6.5, 7.5, 8.5, 9.5, 10.5, 11.5, 12.5];
  const cornerMarkets: ProcessedMarket[] = cornerLines.map((line) => {
    const baseProb = 1 / (1 + Math.exp(-(10 - line) * 0.45));
    const adjustedProb = Math.min(0.95, Math.max(0.05, baseProb * (0.9 + matchIntensity * 0.15)));
    const overOdds = +(1 / adjustedProb * 1.04).toFixed(2);
    const underOdds = +(1 / (1 - adjustedProb) * 1.04).toFixed(2);

    return {
      key: `corners_ou_${line}`,
      name: `Total Corners — Over/Under ${line}`,
      outcomes: [
        { name: "Over", label: `Over ${line}`, odds: Math.max(overOdds, 1.05), point: line },
        { name: "Under", label: `Under ${line}`, odds: Math.max(underOdds, 1.05), point: line },
      ],
    };
  });

  const homeCornerLines = [3.5, 4.5, 5.5, 6.5];
  const awayCornerLines = [3.5, 4.5, 5.5, 6.5];

  const homeCornerMarkets: ProcessedMarket[] = homeCornerLines.map((line) => {
    const baseProb = 1 / (1 + Math.exp(-(5.5 * homeFavStrength * 2 - line) * 0.5));
    const overOdds = +(1 / baseProb * 1.05).toFixed(2);
    const underOdds = +(1 / (1 - baseProb) * 1.05).toFixed(2);
    return {
      key: `home_corners_ou_${line}`,
      name: `${homeTeam} Corners — O/U ${line}`,
      outcomes: [
        { name: "Over", label: `Over ${line}`, odds: Math.max(overOdds, 1.05), point: line },
        { name: "Under", label: `Under ${line}`, odds: Math.max(underOdds, 1.05), point: line },
      ],
    };
  });

  const awayCornerMarkets: ProcessedMarket[] = awayCornerLines.map((line) => {
    const baseProb = 1 / (1 + Math.exp(-(4.5 * awayFavStrength * 2 - line) * 0.5));
    const overOdds = +(1 / baseProb * 1.05).toFixed(2);
    const underOdds = +(1 / (1 - baseProb) * 1.05).toFixed(2);
    return {
      key: `away_corners_ou_${line}`,
      name: `${awayTeam} Corners — O/U ${line}`,
      outcomes: [
        { name: "Over", label: `Over ${line}`, odds: Math.max(overOdds, 1.05), point: line },
        { name: "Under", label: `Under ${line}`, odds: Math.max(underOdds, 1.05), point: line },
      ],
    };
  });

  // Corner Match Bet (which team gets more corners)
  const homeMoreCorners = 0.42 + (homeFavStrength - awayFavStrength) * 0.3;
  const equalCorners = 0.18;
  const awayMoreCorners = 1 - homeMoreCorners - equalCorners;

  const cornerMatchBet: ProcessedMarket = {
    key: "corner_match_bet",
    name: "Corner Match Bet",
    outcomes: [
      { name: homeTeam, label: homeTeam, odds: toOdds(Math.max(0.15, homeMoreCorners)) },
      { name: "Tie", label: "Tie", odds: toOdds(equalCorners) },
      { name: awayTeam, label: awayTeam, odds: toOdds(Math.max(0.15, awayMoreCorners)) },
    ],
  };

  categories.push({
    id: "corners",
    name: "Corners",
    icon: "🚩",
    markets: [cornerMatchBet, ...cornerMarkets, ...homeCornerMarkets, ...awayCornerMarkets],
  });

  // ═════════════════════════════════════════════════════════════════════════
  // BOOKINGS / CARDS
  // ═════════════════════════════════════════════════════════════════════════
  const cardLines = [1.5, 2.5, 3.5, 4.5, 5.5, 6.5];
  const cardMarkets: ProcessedMarket[] = cardLines.map((line) => {
    const baseProb = 1 / (1 + Math.exp(-(4 - line) * 0.55));
    const adjustedProb = Math.min(0.95, Math.max(0.05, baseProb * (0.85 + matchIntensity * 0.2)));
    const overOdds = +(1 / adjustedProb * 1.04).toFixed(2);
    const underOdds = +(1 / (1 - adjustedProb) * 1.04).toFixed(2);

    return {
      key: `cards_ou_${line}`,
      name: `Total Cards — Over/Under ${line}`,
      outcomes: [
        { name: "Over", label: `Over ${line}`, odds: Math.max(overOdds, 1.05), point: line },
        { name: "Under", label: `Under ${line}`, odds: Math.max(underOdds, 1.05), point: line },
      ],
    };
  });

  const bookingPointLines = [20.5, 30.5, 40.5, 50.5, 60.5];
  const bookingPointMarkets: ProcessedMarket[] = bookingPointLines.map((line) => {
    const baseProb = 1 / (1 + Math.exp(-(40 - line) * 0.06));
    const overOdds = +(1 / baseProb * 1.05).toFixed(2);
    const underOdds = +(1 / (1 - baseProb) * 1.05).toFixed(2);
    return {
      key: `booking_points_ou_${line}`,
      name: `Booking Points — O/U ${line}`,
      outcomes: [
        { name: "Over", label: `Over ${line}`, odds: Math.max(overOdds, 1.05), point: line },
        { name: "Under", label: `Under ${line}`, odds: Math.max(underOdds, 1.05), point: line },
      ],
    };
  });

  // Card Match Bet
  const homeMoreCards = 0.38 + (awayFavStrength - homeFavStrength) * 0.15;
  const equalCards = 0.22;
  const awayMoreCards = 1 - homeMoreCards - equalCards;

  const cardMatchBet: ProcessedMarket = {
    key: "card_match_bet",
    name: "Card Match Bet",
    outcomes: [
      { name: homeTeam, label: `${homeTeam} More`, odds: toOdds(Math.max(0.15, homeMoreCards)) },
      { name: "Equal", label: "Equal Cards", odds: toOdds(equalCards) },
      { name: awayTeam, label: `${awayTeam} More`, odds: toOdds(Math.max(0.15, awayMoreCards)) },
    ],
  };

  // Red Card in Match
  const redCardProb = 0.08 + matchIntensity * 0.04;

  const redCardMarket: ProcessedMarket = {
    key: "red_card",
    name: "Red Card in Match",
    outcomes: [
      { name: "Yes", label: "Yes", odds: toOdds(Math.min(0.25, redCardProb)) },
      { name: "No", label: "No", odds: toOdds(1 - Math.min(0.25, redCardProb)) },
    ],
  };

  categories.push({
    id: "bookings",
    name: "Bookings",
    icon: "🟨",
    markets: [cardMatchBet, redCardMarket, ...cardMarkets, ...bookingPointMarkets],
  });

  return categories;
}

/**
 * Fetch full market data for a specific event from The Odds API.
 * Uses the /events/{eventId}/odds endpoint for additional markets.
 * Results are cached for 5 minutes to save API credits.
 */
export async function fetchMatchMarkets(
  eventId: string,
  sportKey: string,
  homeTeam: string,
  awayTeam: string,
  homeOdds: number,
  awayOdds: number,
  drawOdds: number,
  sport: string
): Promise<MarketCategory[]> {
  // Check cache first
  const cached = marketCache.get(eventId);
  if (cached && Date.now() - cached.fetchedAt < MARKET_CACHE_TTL) {
    return cached.categories;
  }

  const categories: MarketCategory[] = [];

  try {
    // Determine which markets to request based on sport type
    const isSoccer = sportKey.startsWith("soccer_");
    const marketKeys = isSoccer
      ? "h2h,spreads,totals,alternate_totals,btts,draw_no_bet,h2h_3_way,team_totals"
      : "h2h,spreads,totals,alternate_totals,team_totals";

    const events = await oddsApiFetch<OddsAPIEvent[]>(
      `/sports/${sportKey}/events/${eventId}/odds`,
      {
        regions: "eu,uk",
        markets: marketKeys,
        oddsFormat: "decimal",
        dateFormat: "iso",
      }
    );

    if (!events || (Array.isArray(events) && events.length === 0)) {
      // API returned nothing — build from what we have
      const fallback = buildFallbackMarkets(homeTeam, awayTeam, homeOdds, awayOdds, drawOdds, sport);
      const synthetic = generateSyntheticMarkets(homeOdds, awayOdds, drawOdds, homeTeam, awayTeam, sport);
      const all = [...fallback, ...synthetic];
      marketCache.set(eventId, { categories: all, fetchedAt: Date.now() });
      return all;
    }

    // The event odds endpoint returns a single event object (not array)
    const event: OddsAPIEvent = Array.isArray(events) ? events[0] : events;
    if (!event?.bookmakers?.length) {
      const fallback = buildFallbackMarkets(homeTeam, awayTeam, homeOdds, awayOdds, drawOdds, sport);
      const synthetic = generateSyntheticMarkets(homeOdds, awayOdds, drawOdds, homeTeam, awayTeam, sport);
      const all = [...fallback, ...synthetic];
      marketCache.set(eventId, { categories: all, fetchedAt: Date.now() });
      return all;
    }

    const bookmakers = event.bookmakers;

    // ─── MAIN MARKETS ────────────────────────────────────────────────────
    const mainMarkets: ProcessedMarket[] = [];

    // 1X2 / Match Result
    const h2h = extractMarketFromBookmakers(bookmakers, "h2h");
    if (h2h) mainMarkets.push(processMarket(h2h, "Match Result (1X2)", homeTeam, awayTeam));

    // 3-Way (same as h2h for soccer, different for US sports)
    const h2h3 = extractMarketFromBookmakers(bookmakers, "h2h_3_way");
    if (h2h3 && !h2h) mainMarkets.push(processMarket(h2h3, "Match Result", homeTeam, awayTeam));

    // Double Chance (derived from h2h odds)
    if (h2h && drawOdds > 0) {
      const homeProb = 1 / homeOdds;
      const drawProb = 1 / drawOdds;
      const awayProb = 1 / awayOdds;
      const margin = 1.05;

      mainMarkets.push({
        key: "double_chance",
        name: "Double Chance",
        outcomes: [
          { name: "1X", label: `${homeTeam} or Draw`, odds: +(1 / (homeProb + drawProb) * margin).toFixed(2) },
          { name: "12", label: `${homeTeam} or ${awayTeam}`, odds: +(1 / (homeProb + awayProb) * margin).toFixed(2) },
          { name: "X2", label: `Draw or ${awayTeam}`, odds: +(1 / (drawProb + awayProb) * margin).toFixed(2) },
        ],
      });
    }

    // Draw No Bet
    const dnb = extractMarketFromBookmakers(bookmakers, "draw_no_bet");
    if (dnb) mainMarkets.push(processMarket(dnb, "Draw No Bet", homeTeam, awayTeam));

    // Both Teams to Score
    const btts = extractMarketFromBookmakers(bookmakers, "btts");
    if (btts) {
      mainMarkets.push({
        key: "btts",
        name: "Both Teams to Score",
        outcomes: btts.outcomes.map((o) => ({
          name: o.name,
          label: o.name,
          odds: +o.price.toFixed(2),
        })),
      });
    }

    if (mainMarkets.length > 0) {
      categories.push({ id: "main", name: "Main", icon: "⚽", markets: mainMarkets });
    }

    // ─── GOALS / TOTALS ─────────────────────────────────────────────────
    const goalsMarkets: ProcessedMarket[] = [];

    // Featured totals
    const totals = extractMarketFromBookmakers(bookmakers, "totals");
    if (totals) goalsMarkets.push(processMarket(totals, "Total Goals", homeTeam, awayTeam));

    // Alternate totals (0.5, 1.5, 2.5, 3.5, 4.5, 5.5)
    const altTotals = extractMarketFromBookmakers(bookmakers, "alternate_totals");
    if (altTotals) {
      // Group by point value
      const pointGroups = new Map<number, OddsAPIOutcome[]>();
      for (const o of altTotals.outcomes) {
        if (o.point !== undefined) {
          const existing = pointGroups.get(o.point) || [];
          existing.push(o);
          pointGroups.set(o.point, existing);
        }
      }

      // Sort by point value and create individual markets
      const sortedPoints = [...pointGroups.keys()].sort((a, b) => a - b);
      for (const point of sortedPoints) {
        const outcomes = pointGroups.get(point)!;
        goalsMarkets.push({
          key: `totals_${point}`,
          name: `Over/Under ${point} Goals`,
          outcomes: outcomes.map((o) => ({
            name: o.name,
            label: `${o.name} ${point}`,
            odds: +o.price.toFixed(2),
            point,
          })),
        });
      }
    }

    // Team totals
    const teamTotals = extractMarketFromBookmakers(bookmakers, "team_totals");
    if (teamTotals) {
      // Group by team name and point
      const teamGroups = new Map<string, OddsAPIOutcome[]>();
      for (const o of teamTotals.outcomes) {
        const key = `${o.description || o.name}_${o.point}`;
        const existing = teamGroups.get(key) || [];
        existing.push(o);
        teamGroups.set(key, existing);
      }

      for (const [, outcomes] of teamGroups) {
        if (outcomes.length >= 2) {
          const teamName = outcomes[0].description || outcomes[0].name;
          const point = outcomes[0].point;
          goalsMarkets.push({
            key: `team_totals_${teamName}_${point}`,
            name: `${teamName} — Over/Under ${point}`,
            outcomes: outcomes.map((o) => ({
              name: o.name,
              label: `${o.name} ${point}`,
              odds: +o.price.toFixed(2),
              point,
            })),
          });
        }
      }
    }

    if (goalsMarkets.length > 0) {
      categories.push({ id: "goals", name: "Goals", icon: "🎯", markets: goalsMarkets });
    }

    // ─── HANDICAP / SPREADS ─────────────────────────────────────────────
    const handicapMarkets: ProcessedMarket[] = [];

    const spreads = extractMarketFromBookmakers(bookmakers, "spreads");
    if (spreads) handicapMarkets.push(processMarket(spreads, "Handicap", homeTeam, awayTeam));

    const altSpreads = extractMarketFromBookmakers(bookmakers, "alternate_spreads");
    if (altSpreads) {
      const pointGroups = new Map<number, OddsAPIOutcome[]>();
      for (const o of altSpreads.outcomes) {
        if (o.point !== undefined) {
          const existing = pointGroups.get(o.point) || [];
          existing.push(o);
          pointGroups.set(o.point, existing);
        }
      }

      const sortedPoints = [...pointGroups.keys()].sort((a, b) => a - b);
      for (const point of sortedPoints) {
        const outcomes = pointGroups.get(point)!;
        if (outcomes.length >= 2) {
          handicapMarkets.push({
            key: `spreads_${point}`,
            name: `Handicap ${point > 0 ? "+" : ""}${point}`,
            outcomes: outcomes.map((o) => ({
              name: o.name,
              label: `${o.name} (${o.point! > 0 ? "+" : ""}${o.point})`,
              odds: +o.price.toFixed(2),
              point: o.point,
            })),
          });
        }
      }
    }

    if (handicapMarkets.length > 0) {
      categories.push({ id: "handicap", name: "Handicap", icon: "📊", markets: handicapMarkets });
    }

    // ─── HALF TIME (if available) ───────────────────────────────────────
    const htMarkets: ProcessedMarket[] = [];

    // Try half-time markets
    for (const bm of bookmakers) {
      for (const m of bm.markets) {
        if (m.key === "h2h_h1" && !htMarkets.some((hm) => hm.key === "h2h_h1")) {
          htMarkets.push(processMarket(m, "Half Time Result", homeTeam, awayTeam));
        }
        if (m.key === "totals_h1" && !htMarkets.some((hm) => hm.key === "totals_h1")) {
          htMarkets.push(processMarket(m, "Half Time Over/Under", homeTeam, awayTeam));
        }
        if (m.key === "h2h_h2" && !htMarkets.some((hm) => hm.key === "h2h_h2")) {
          htMarkets.push(processMarket(m, "2nd Half Result", homeTeam, awayTeam));
        }
        if (m.key === "totals_h2" && !htMarkets.some((hm) => hm.key === "totals_h2")) {
          htMarkets.push(processMarket(m, "2nd Half Over/Under", homeTeam, awayTeam));
        }
      }
    }

    // If no HT markets from API, generate synthetic ones for soccer
    if (htMarkets.length === 0 && isSoccer) {
      // HT 1X2 derived from FT odds
      const htHomeOdds = +(homeOdds * 1.3 + 0.2).toFixed(2);
      const htDrawOdds = +(drawOdds * 0.65).toFixed(2);
      const htAwayOdds = +(awayOdds * 1.3 + 0.2).toFixed(2);

      htMarkets.push({
        key: "ht_1x2",
        name: "Half Time Result",
        outcomes: [
          { name: homeTeam, label: homeTeam, odds: Math.max(htHomeOdds, 1.2) },
          { name: "Draw", label: "Draw", odds: Math.max(htDrawOdds, 1.5) },
          { name: awayTeam, label: awayTeam, odds: Math.max(htAwayOdds, 1.2) },
        ],
      });

      // HT Over/Under
      const htLines = [0.5, 1.5, 2.5];
      for (const line of htLines) {
        const baseProb = 1 / (1 + Math.exp(-(1.2 - line) * 1.2));
        const overOdds = +(1 / baseProb * 1.05).toFixed(2);
        const underOdds = +(1 / (1 - baseProb) * 1.05).toFixed(2);
        htMarkets.push({
          key: `ht_totals_${line}`,
          name: `HT Over/Under ${line}`,
          outcomes: [
            { name: "Over", label: `Over ${line}`, odds: Math.max(overOdds, 1.05), point: line },
            { name: "Under", label: `Under ${line}`, odds: Math.max(underOdds, 1.05), point: line },
          ],
        });
      }
    }

    if (htMarkets.length > 0) {
      categories.push({ id: "halftime", name: "Half Time", icon: "⏱️", markets: htMarkets });
    }

    // ─── SYNTHETIC MARKETS (Corners, Bookings) ──────────────────────────
    const syntheticCategories = generateSyntheticMarkets(
      homeOdds, awayOdds, drawOdds, homeTeam, awayTeam, sport
    );
    categories.push(...syntheticCategories);

  } catch (err) {
    console.warn(`[oddsapi] fetchMatchMarkets(${eventId}) failed:`, err instanceof Error ? err.message : err);

    // Fallback: build basic markets from the h2h odds we already have
    const fallback = buildFallbackMarkets(homeTeam, awayTeam, homeOdds, awayOdds, drawOdds, sport);
    const synthetic = generateSyntheticMarkets(homeOdds, awayOdds, drawOdds, homeTeam, awayTeam, sport);
    const all = [...fallback, ...synthetic];
    marketCache.set(eventId, { categories: all, fetchedAt: Date.now() });
    return all;
  }

  // Cache the result
  marketCache.set(eventId, { categories, fetchedAt: Date.now() });

  // Cleanup old cache entries (prevent memory leak)
  if (marketCache.size > 200) {
    const oldest = [...marketCache.entries()]
      .sort((a, b) => a[1].fetchedAt - b[1].fetchedAt)
      .slice(0, 50);
    for (const [key] of oldest) marketCache.delete(key);
  }

  return categories;
}

/**
 * Build fallback market categories when the per-event API call fails.
 * Uses the h2h odds already available from the main store.
 */
function buildFallbackMarkets(
  homeTeam: string,
  awayTeam: string,
  homeOdds: number,
  awayOdds: number,
  drawOdds: number,
  sport: string
): MarketCategory[] {
  const categories: MarketCategory[] = [];
  const isSoccer = sport === "football";

  // ─── Main Markets ─────────────────────────────────────────────────────
  const mainMarkets: ProcessedMarket[] = [];

  // 1X2
  const h2hOutcomes: MarketOutcome[] = [
    { name: homeTeam, label: homeTeam, odds: homeOdds },
    { name: awayTeam, label: awayTeam, odds: awayOdds },
  ];
  if (drawOdds > 0) {
    h2hOutcomes.splice(1, 0, { name: "Draw", label: "Draw", odds: drawOdds });
  }
  mainMarkets.push({ key: "h2h", name: "Match Result (1X2)", outcomes: h2hOutcomes });

  // Double Chance (soccer only)
  if (isSoccer && drawOdds > 0) {
    const homeProb = 1 / homeOdds;
    const drawProb = 1 / drawOdds;
    const awayProb = 1 / awayOdds;
    const margin = 1.05;
    mainMarkets.push({
      key: "double_chance",
      name: "Double Chance",
      outcomes: [
        { name: "1X", label: `${homeTeam} or Draw`, odds: +(1 / (homeProb + drawProb) * margin).toFixed(2) },
        { name: "12", label: `${homeTeam} or ${awayTeam}`, odds: +(1 / (homeProb + awayProb) * margin).toFixed(2) },
        { name: "X2", label: `Draw or ${awayTeam}`, odds: +(1 / (drawProb + awayProb) * margin).toFixed(2) },
      ],
    });
  }

  // Draw No Bet (soccer only)
  if (isSoccer && drawOdds > 0) {
    const homeProb = 1 / homeOdds;
    const awayProb = 1 / awayOdds;
    const total = homeProb + awayProb;
    mainMarkets.push({
      key: "draw_no_bet",
      name: "Draw No Bet",
      outcomes: [
        { name: homeTeam, label: homeTeam, odds: +(total / homeProb * 0.97).toFixed(2) },
        { name: awayTeam, label: awayTeam, odds: +(total / awayProb * 0.97).toFixed(2) },
      ],
    });
  }

  // BTTS (soccer only, synthetic)
  if (isSoccer) {
    const avgGoals = 2.5 + (1 / homeOdds + 1 / awayOdds - 1) * 0.5;
    const bttsProb = Math.min(0.75, Math.max(0.35, avgGoals * 0.22));
    mainMarkets.push({
      key: "btts",
      name: "Both Teams to Score",
      outcomes: [
        { name: "Yes", label: "Yes", odds: +(1 / bttsProb * 1.04).toFixed(2) },
        { name: "No", label: "No", odds: +(1 / (1 - bttsProb) * 1.04).toFixed(2) },
      ],
    });
  }

  categories.push({ id: "main", name: "Main", icon: "⚽", markets: mainMarkets });

  // ─── Goals (synthetic totals) ─────────────────────────────────────────
  const goalsMarkets: ProcessedMarket[] = [];
  const totalLines = isSoccer ? [0.5, 1.5, 2.5, 3.5, 4.5, 5.5] : [150.5, 160.5, 170.5, 180.5, 190.5, 200.5, 210.5, 220.5, 230.5];
  const avgTotal = isSoccer ? 2.5 : 210;

  for (const line of totalLines) {
    const baseProb = 1 / (1 + Math.exp(-(avgTotal - line) * (isSoccer ? 0.8 : 0.02)));
    const overOdds = +(1 / baseProb * 1.05).toFixed(2);
    const underOdds = +(1 / (1 - baseProb) * 1.05).toFixed(2);
    goalsMarkets.push({
      key: `totals_${line}`,
      name: isSoccer ? `Over/Under ${line} Goals` : `Over/Under ${line} Points`,
      outcomes: [
        { name: "Over", label: `Over ${line}`, odds: Math.max(overOdds, 1.05), point: line },
        { name: "Under", label: `Under ${line}`, odds: Math.max(underOdds, 1.05), point: line },
      ],
    });
  }

  categories.push({ id: "goals", name: isSoccer ? "Goals" : "Totals", icon: "🎯", markets: goalsMarkets });

  // ─── Handicap (synthetic) ─────────────────────────────────────────────
  const handicapMarkets: ProcessedMarket[] = [];
  const handicapLines = isSoccer ? [-2.5, -1.5, -0.5, 0.5, 1.5, 2.5] : [-10.5, -7.5, -5.5, -3.5, -1.5, 1.5, 3.5, 5.5, 7.5, 10.5];

  for (const line of handicapLines) {
    const homeHandicapProb = 1 / (1 + Math.exp(-(1 / homeOdds - 1 / awayOdds + line * (isSoccer ? 0.3 : 0.03)) * 2));
    const hOdds = +(1 / homeHandicapProb * 1.04).toFixed(2);
    const aOdds = +(1 / (1 - homeHandicapProb) * 1.04).toFixed(2);
    handicapMarkets.push({
      key: `spreads_${line}`,
      name: `Handicap ${line > 0 ? "+" : ""}${line}`,
      outcomes: [
        { name: homeTeam, label: `${homeTeam} (${line > 0 ? "+" : ""}${line})`, odds: Math.max(hOdds, 1.05) },
        { name: awayTeam, label: `${awayTeam} (${-line > 0 ? "+" : ""}${-line})`, odds: Math.max(aOdds, 1.05) },
      ],
    });
  }

  categories.push({ id: "handicap", name: "Handicap", icon: "📊", markets: handicapMarkets });

  // ─── Half Time (soccer only, synthetic) ───────────────────────────────
  if (isSoccer) {
    const htMarkets: ProcessedMarket[] = [];

    const htHomeOdds = +(homeOdds * 1.3 + 0.2).toFixed(2);
    const htDrawOdds = +(drawOdds * 0.65).toFixed(2);
    const htAwayOdds = +(awayOdds * 1.3 + 0.2).toFixed(2);

    htMarkets.push({
      key: "ht_1x2",
      name: "Half Time Result",
      outcomes: [
        { name: homeTeam, label: homeTeam, odds: Math.max(htHomeOdds, 1.2) },
        { name: "Draw", label: "Draw", odds: Math.max(htDrawOdds, 1.5) },
        { name: awayTeam, label: awayTeam, odds: Math.max(htAwayOdds, 1.2) },
      ],
    });

    const htLines = [0.5, 1.5, 2.5];
    for (const line of htLines) {
      const baseProb = 1 / (1 + Math.exp(-(1.2 - line) * 1.2));
      const overOdds = +(1 / baseProb * 1.05).toFixed(2);
      const underOdds = +(1 / (1 - baseProb) * 1.05).toFixed(2);
      htMarkets.push({
        key: `ht_totals_${line}`,
        name: `HT Over/Under ${line}`,
        outcomes: [
          { name: "Over", label: `Over ${line}`, odds: Math.max(overOdds, 1.05), point: line },
          { name: "Under", label: `Under ${line}`, odds: Math.max(underOdds, 1.05), point: line },
        ],
      });
    }

    categories.push({ id: "halftime", name: "Half Time", icon: "⏱️", markets: htMarkets });
  }

  return categories;
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
 * Find the sport key for a given event ID by checking the store.
 */
export function findSportKeyForEvent(eventId: string): string | null {
  const match = store.matches.find((m) => m.id === eventId);
  if (!match) return null;

  // Find the sport key from the sport category
  const sportMeta = SUPPORTED_SPORTS.find((s) => s.sport === match.sport);
  return sportMeta?.key || null;
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
