import { NextRequest, NextResponse } from "next/server";
import {
  fetchAllMatches,
  fetchLiveMatches,
  fetchMatchesBySport,
  fetchOddsForSport,
  SUPPORTED_SPORTS,
} from "@/lib/oddsapi";
import { serverError } from "@/lib/auth";
import { Match } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/matches
 *
 * Query params:
 *   sport  - sport category name (e.g. "football", "basketball") or "all" (default)
 *            Also accepts a raw Odds API sport key (e.g. "soccer_epl") for direct lookup.
 *   type   - "live" | "upcoming" | "all" (default: "all")
 *
 * Returns:
 *   { live: Match[], upcoming: Match[], total: number }
 */
export async function GET(req: NextRequest) {
  try {
    const sport = req.nextUrl.searchParams.get("sport") || "all";
    const type = req.nextUrl.searchParams.get("type") || "all";

    // ── Fetch live matches ──────────────────────────────────────────────────────
    let liveMatches: Match[] = type === "upcoming" ? [] : await fetchLiveMatches();

    // ── Fetch upcoming matches ──────────────────────────────────────────────────
    let upcomingMatches: Match[] = [];

    if (type !== "live") {
      if (sport === "all") {
        // Fetch all sports sequentially (respects rate limits)
        upcomingMatches = await fetchAllMatches();
      } else {
        // sport can be a category name like "basketball" OR a raw key like "basketball_nba"
        const isDirectKey = SUPPORTED_SPORTS.some((s) => s.key === sport);

        if (isDirectKey) {
          // Direct sport key lookup
          upcomingMatches = await fetchOddsForSport(sport);
        } else {
          // Category name — fetch all leagues sequentially
          upcomingMatches = await fetchMatchesBySport(sport);
        }
      }
    }

    // ── Deduplicate: remove from upcoming anything already in live ──────────────
    const liveIds = new Set(liveMatches.map((m) => m.id));
    upcomingMatches = upcomingMatches.filter((m) => !liveIds.has(m.id));

    // ── Filter live matches by sport category if requested ─────────────────────
    if (sport !== "all") {
      const categoryName =
        SUPPORTED_SPORTS.find((s) => s.key === sport)?.sport || sport;
      liveMatches = liveMatches.filter((m) => m.sport === categoryName);
    }

    return NextResponse.json({
      live: liveMatches,
      upcoming: upcomingMatches.slice(0, 100), // cap at 100 per request
      total: liveMatches.length + upcomingMatches.length,
    });
  } catch (err) {
    console.error("[api/matches]", err);
    return serverError(err instanceof Error ? err.message : "Failed to fetch matches");
  }
}
