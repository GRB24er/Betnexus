import { NextRequest, NextResponse } from "next/server";
import { getMatches, getStoreStatus } from "@/lib/oddsapi";
import { serverError } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/matches
 *
 * Query params:
 *   sport  - "football", "basketball", "tennis", etc. or "all" (default)
 *   time   - "today", "tomorrow", "week", "all" (default)
 *   type   - "live", "upcoming", "all" (default) — for backward compat
 *
 * Returns:
 *   { live: Match[], upcoming: Match[], total: number, storeStatus: {...} }
 *
 * Response is INSTANT — data is served from a pre-fetched in-memory store.
 */
export async function GET(req: NextRequest) {
  try {
    const sport = req.nextUrl.searchParams.get("sport") || "all";
    const time = req.nextUrl.searchParams.get("time") || "all";
    const type = req.nextUrl.searchParams.get("type") || "all";

    const result = await getMatches({ sport, time });

    // Backward compat: if type=live, only return live; if type=upcoming, only return upcoming
    let { live, upcoming, total } = result;
    if (type === "live") {
      upcoming = [];
      total = live.length;
    } else if (type === "upcoming") {
      live = [];
      total = upcoming.length;
    }

    return NextResponse.json({
      live,
      upcoming: upcoming.slice(0, 200),
      total,
      storeStatus: getStoreStatus(),
    });
  } catch (err) {
    console.error("[api/matches]", err);
    return serverError(err instanceof Error ? err.message : "Failed to fetch matches");
  }
}
