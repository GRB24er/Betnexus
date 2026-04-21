import { NextRequest, NextResponse } from "next/server";
import {
  fetchAllMatches,
  fetchLiveMatches,
  fetchOddsForSport,
  SUPPORTED_SPORTS,
} from "@/lib/oddsapi";
import { serverError } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/matches
 *
 * Query params:
 *   sport  - filter by sport key (e.g. "soccer_epl") or "all" (default)
 *   type   - "live" | "upcoming" | "all" (default: "all")
 *
 * Returns:
 *   { live: Match[], upcoming: Match[], sports: SportMeta[] }
 */
export async function GET(req: NextRequest) {
  try {
    const sport = req.nextUrl.searchParams.get("sport") || "all";
    const type = req.nextUrl.searchParams.get("type") || "all";

    let liveMatches = type === "upcoming" ? [] : await fetchLiveMatches();
    let upcomingMatches =
      type === "live"
        ? []
        : sport === "all"
        ? await fetchAllMatches()
        : await fetchOddsForSport(sport);

    // Remove from upcoming any match that is already in live
    const liveIds = new Set(liveMatches.map((m) => m.id));
    upcomingMatches = upcomingMatches.filter((m) => !liveIds.has(m.id));

    // If sport filter is applied, filter live matches too
    if (sport !== "all") {
      const sportMeta = SUPPORTED_SPORTS.find((s) => s.key === sport);
      if (sportMeta) {
        liveMatches = liveMatches.filter((m) => m.sport === sportMeta.sport);
      }
    }

    return NextResponse.json({
      live: liveMatches,
      upcoming: upcomingMatches.slice(0, 100), // cap at 100 upcoming
      sports: SUPPORTED_SPORTS,
      total: liveMatches.length + upcomingMatches.length,
    });
  } catch (err) {
    console.error("[api/matches]", err);
    return serverError(err instanceof Error ? err.message : "Failed to fetch matches");
  }
}
