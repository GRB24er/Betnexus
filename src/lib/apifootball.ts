/**
 * API-Football (api-sports.io v3) integration
 * https://www.api-football.com/documentation-v3
 *
 * Used alongside The Odds API: Odds API provides markets & odds; this
 * provides team logos, league logos, country flags, live scores, lineups,
 * and in-play events.
 *
 * Free tier is 100 calls/day, so everything is aggressively cached in-memory.
 * If API_FOOTBALL_KEY is unset, every function resolves to null — callers
 * must handle that gracefully so the app still works without this source.
 */

const KEY = process.env.API_FOOTBALL_KEY;
const BASE_URL = "https://v3.football.api-sports.io";

const enabled = () => Boolean(KEY);

interface CacheEntry<T> {
  value: T;
  expires: number;
}
const cache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | undefined {
  const hit = cache.get(key);
  if (!hit) return undefined;
  if (hit.expires < Date.now()) {
    cache.delete(key);
    return undefined;
  }
  return hit.value as T;
}

function setCached<T>(key: string, value: T, ttlMs: number) {
  cache.set(key, { value, expires: Date.now() + ttlMs });
}

async function apiFootballFetch<T>(
  path: string,
  params: Record<string, string | number> = {}
): Promise<T | null> {
  if (!enabled()) return null;
  const url = new URL(`${BASE_URL}${path}`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v));
  }
  try {
    const res = await fetch(url.toString(), {
      headers: { "x-apisports-key": KEY! },
      cache: "no-store",
    });
    if (!res.ok) {
      console.warn(`[apifootball] ${res.status} on ${path}`);
      return null;
    }
    const json = (await res.json()) as { response: T; errors?: unknown };
    const errs = json.errors;
    const hasErrors = Array.isArray(errs)
      ? errs.length > 0
      : errs && typeof errs === "object" && Object.keys(errs).length > 0;
    if (hasErrors) {
      console.warn(`[apifootball] errors on ${path}:`, errs);
      return null;
    }
    return json.response;
  } catch (err) {
    console.warn(`[apifootball] fetch failed on ${path}:`, err);
    return null;
  }
}

// ─── TTLs ───────────────────────────────────────────────────────────────────

const TTL = {
  teamLookup: 24 * 60 * 60 * 1000, // name → team id mapping
  logo: 7 * 24 * 60 * 60 * 1000, // team & league logos rarely change
  flag: 7 * 24 * 60 * 60 * 1000,
  lineup: 60 * 60 * 1000, // lineups ~1h (released shortly before kickoff)
  liveFixture: 30 * 1000, // score/minute polling
  events: 30 * 1000,
};

// ─── Team logo resolution ──────────────────────────────────────────────────

interface AFTeam {
  team: { id: number; name: string; code: string | null; country: string; logo: string };
  venue: { name: string | null; city: string | null };
}

/**
 * Find an API-Football team by free-text name. Fuzzy (uses the /teams?search=
 * endpoint). Returns the first match or null.
 *
 * Odds API uses short names like "Man City" while API-Football uses
 * "Manchester City" — the search endpoint handles this well.
 */
export async function findTeam(name: string): Promise<AFTeam | null> {
  if (!enabled()) return null;
  const normalised = name.trim();
  if (normalised.length < 3) return null;

  const cacheKey = `team:${normalised.toLowerCase()}`;
  const cached = getCached<AFTeam | null>(cacheKey);
  if (cached !== undefined) return cached;

  const response = await apiFootballFetch<AFTeam[]>("/teams", { search: normalised });
  const first = response && response.length > 0 ? response[0] : null;
  setCached(cacheKey, first, TTL.teamLookup);
  return first;
}

export async function getTeamLogo(name: string): Promise<string | null> {
  const team = await findTeam(name);
  return team?.team.logo ?? null;
}

/** Resolve logos for home + away in parallel. Either may be null. */
export async function getMatchLogos(
  homeTeam: string,
  awayTeam: string
): Promise<{ homeLogo: string | null; awayLogo: string | null }> {
  if (!enabled()) return { homeLogo: null, awayLogo: null };
  const [home, away] = await Promise.all([
    getTeamLogo(homeTeam),
    getTeamLogo(awayTeam),
  ]);
  return { homeLogo: home, awayLogo: away };
}

// ─── Country flags ─────────────────────────────────────────────────────────

interface AFCountry {
  name: string;
  code: string | null;
  flag: string | null; // SVG URL
}

export async function getCountryFlag(country: string): Promise<string | null> {
  if (!enabled()) return null;
  const key = `flag:${country.toLowerCase()}`;
  const cached = getCached<string | null>(key);
  if (cached !== undefined) return cached;

  const response = await apiFootballFetch<AFCountry[]>("/countries", { name: country });
  const flag = response && response.length > 0 ? response[0].flag : null;
  setCached(key, flag, TTL.flag);
  return flag;
}

// ─── Live fixture lookup ───────────────────────────────────────────────────

interface AFFixtureLite {
  fixture: {
    id: number;
    date: string;
    status: { short: string; long: string; elapsed: number | null };
  };
  league: { id: number; name: string; country: string; logo: string; flag: string | null };
  teams: {
    home: { id: number; name: string; logo: string };
    away: { id: number; name: string; logo: string };
  };
  goals: { home: number | null; away: number | null };
  score: {
    halftime: { home: number | null; away: number | null };
    fulltime: { home: number | null; away: number | null };
  };
}

/**
 * Find the API-Football fixture that matches an Odds API match by team names.
 * Searches the team's recent fixtures and returns the one where the opponent
 * matches. Null if not found.
 */
export async function findFixture(
  homeTeam: string,
  awayTeam: string
): Promise<AFFixtureLite | null> {
  if (!enabled()) return null;
  const cacheKey = `fixture:${homeTeam}|${awayTeam}`.toLowerCase();
  const cached = getCached<AFFixtureLite | null>(cacheKey);
  if (cached !== undefined) return cached;

  const home = await findTeam(homeTeam);
  if (!home) {
    setCached(cacheKey, null, 60 * 60 * 1000);
    return null;
  }

  // Pull a small window of fixtures (last 3 + next 3) for this team
  const [past, future] = await Promise.all([
    apiFootballFetch<AFFixtureLite[]>("/fixtures", { team: home.team.id, last: 3 }),
    apiFootballFetch<AFFixtureLite[]>("/fixtures", { team: home.team.id, next: 3 }),
  ]);
  const candidates = [...(past ?? []), ...(future ?? [])];
  const away = awayTeam.toLowerCase();
  const match =
    candidates.find(
      (f) =>
        f.teams.home.name.toLowerCase().includes(away) ||
        f.teams.away.name.toLowerCase().includes(away)
    ) ?? null;

  setCached(cacheKey, match, TTL.liveFixture);
  return match;
}

export interface LiveScore {
  homeScore: number | null;
  awayScore: number | null;
  minute: number | null;
  status: string; // e.g. "1H", "HT", "2H", "FT"
  isLive: boolean;
}

export async function getLiveScore(
  homeTeam: string,
  awayTeam: string
): Promise<LiveScore | null> {
  const fixture = await findFixture(homeTeam, awayTeam);
  if (!fixture) return null;
  const liveCodes = new Set(["1H", "HT", "2H", "ET", "P", "BT", "LIVE"]);
  return {
    homeScore: fixture.goals.home,
    awayScore: fixture.goals.away,
    minute: fixture.fixture.status.elapsed,
    status: fixture.fixture.status.short,
    isLive: liveCodes.has(fixture.fixture.status.short),
  };
}

// ─── Lineups ────────────────────────────────────────────────────────────────

export interface AFPlayer {
  id: number | null;
  name: string;
  number: number | null;
  pos: string | null; // G, D, M, F
  grid: string | null; // "4:2" = row 4 col 2
}
export interface AFLineup {
  team: { id: number; name: string; logo: string; colors?: unknown };
  formation: string;
  startXI: { player: AFPlayer }[];
  substitutes: { player: AFPlayer }[];
  coach: { id: number; name: string; photo: string } | null;
}

export async function getLineups(
  homeTeam: string,
  awayTeam: string
): Promise<AFLineup[] | null> {
  const fixture = await findFixture(homeTeam, awayTeam);
  if (!fixture) return null;

  const key = `lineup:${fixture.fixture.id}`;
  const cached = getCached<AFLineup[] | null>(key);
  if (cached !== undefined) return cached;

  const response = await apiFootballFetch<AFLineup[]>("/fixtures/lineups", {
    fixture: fixture.fixture.id,
  });
  setCached(key, response, TTL.lineup);
  return response;
}

// ─── Events (goals, cards, subs, VAR) ──────────────────────────────────────

export interface AFEvent {
  time: { elapsed: number; extra: number | null };
  team: { id: number; name: string; logo: string };
  player: { id: number | null; name: string };
  assist: { id: number | null; name: string | null };
  type: string; // "Goal", "Card", "subst", "Var"
  detail: string; // "Normal Goal", "Yellow Card", etc.
  comments: string | null;
}

export async function getFixtureEvents(
  homeTeam: string,
  awayTeam: string
): Promise<AFEvent[] | null> {
  const fixture = await findFixture(homeTeam, awayTeam);
  if (!fixture) return null;

  const key = `events:${fixture.fixture.id}`;
  const cached = getCached<AFEvent[] | null>(key);
  if (cached !== undefined) return cached;

  const response = await apiFootballFetch<AFEvent[]>("/fixtures/events", {
    fixture: fixture.fixture.id,
  });
  setCached(key, response, TTL.events);
  return response;
}

// ─── Re-exports for callers that want to inspect enablement ────────────────
export const apiFootballEnabled = enabled;
