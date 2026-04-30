import { NextRequest, NextResponse } from "next/server";
import { getMatches, getStoreStatus } from "@/lib/oddsapi";
import { connectDB } from "@/lib/mongodb";
import { ManualMatch } from "@/models/ManualMatch";
import { manualMatchToPublic } from "@/lib/manualMatchToPublic";
import { serverError } from "@/lib/auth";
import type { Match } from "@/lib/data";

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
 * Manual matches (created by staff) are merged in alongside API matches.
 */
export async function GET(req: NextRequest) {
  try {
    const sport = req.nextUrl.searchParams.get("sport") || "all";
    const time = req.nextUrl.searchParams.get("time") || "all";
    const type = req.nextUrl.searchParams.get("type") || "all";

    const [apiResult, manual] = await Promise.all([
      getMatches({ sport, time }),
      fetchManualMatches({ sport }),
    ]);

    let live = [...apiResult.live, ...manual.live];
    let upcoming = [...apiResult.upcoming, ...manual.upcoming];

    if (type === "live") {
      upcoming = [];
    } else if (type === "upcoming") {
      live = [];
    }

    return NextResponse.json({
      live,
      upcoming: upcoming.slice(0, 200),
      total: live.length + upcoming.length,
      storeStatus: getStoreStatus(),
    });
  } catch (err) {
    console.error("[api/matches]", err);
    return serverError(err instanceof Error ? err.message : "Failed to fetch matches");
  }
}

async function fetchManualMatches({
  sport,
}: {
  sport: string;
}): Promise<{ live: Match[]; upcoming: Match[] }> {
  try {
    await connectDB();
    const filter: Record<string, unknown> = {
      status: { $in: ["scheduled", "live"] },
    };
    if (sport !== "all") filter.sport = sport;

    const docs = await ManualMatch.find(filter)
      .sort({ startTime: 1 })
      .limit(200)
      .lean();

    const live: Match[] = [];
    const upcoming: Match[] = [];
    for (const d of docs) {
      const m = manualMatchToPublic(d);
      if (m.isLive) live.push(m);
      else upcoming.push(m);
    }
    return { live, upcoming };
  } catch (err) {
    console.warn("[api/matches] manual fetch failed:", err);
    return { live: [], upcoming: [] };
  }
}
