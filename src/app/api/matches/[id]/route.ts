import { NextRequest, NextResponse } from "next/server";
import { fetchMatchById, getMatches, SUPPORTED_SPORTS } from "@/lib/oddsapi";
import { serverError } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/matches/[id]?sport=soccer_epl
 *
 * Returns full match data. Checks the in-memory store first for instant
 * response, falls back to direct API call if not found.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sportKey = req.nextUrl.searchParams.get("sport");

    // First: check the store (instant)
    const { live, upcoming } = await getMatches();
    const fromStore = [...live, ...upcoming].find((m) => m.id === id);
    if (fromStore) {
      return NextResponse.json({ match: fromStore, sport: sportKey || fromStore.sport });
    }

    // Fallback: direct API call
    if (sportKey) {
      const match = await fetchMatchById(sportKey, id);
      if (match) return NextResponse.json({ match, sport: sportKey });
    } else {
      for (const sport of SUPPORTED_SPORTS) {
        const match = await fetchMatchById(sport.key, id);
        if (match) return NextResponse.json({ match, sport: sport.key });
      }
    }

    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  } catch (err) {
    console.error("[api/matches/[id]]", err);
    return serverError(err instanceof Error ? err.message : "Failed to fetch match");
  }
}
