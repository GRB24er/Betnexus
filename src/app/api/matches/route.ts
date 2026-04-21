import { NextRequest, NextResponse } from "next/server";
import {
  fetchAllMatches,
  fetchLiveMatches,
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
        // Fetch all sports in parallel
        upcomingMatches = await fetchAllMatches();
      } else {
        // sport can be a category name like "basketball" OR a raw key like "basketball_nba"
        // Find all Odds API sport keys that belong to this category
        const matchingSports = SUPPORTED_SPORTS.filter(
          (s) => s.sport === sport || s.key === sport
        );

        if (matchingSports.length > 0) {
          // Fetch all leagues for this sport category in parallel
          const results = await Promise.allSettled(
            matchingSports.map((s) => fetchOddsForSport(s.key))
          );
          upcomingMatches = results.flatMap((r) =>
            r.status === "fulfilled" ? r.value : []
          );
        }
        // If no matching sports found, upcomingMatches stays []
      }
    }

    // ── Deduplicate: remove from upcoming anything already in live ──────────────
    const liveIds = new Set(liveMatches.map((m) => m.id));
    upcomingMatches = upcomingMatches.filter((m) => !liveIds.has(m.id));

    // ── Filter live matches by sport category if requested ─────────────────────
    if (sport !== "all") {
      // Determine the normalised sport category name
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
