import { NextRequest, NextResponse } from "next/server";
import { fetchMatchById, SUPPORTED_SPORTS } from "@/lib/oddsapi";
import { serverError } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/matches/[id]?sport=soccer_epl
 *
 * Returns full match data including all available bookmaker odds
 * for a specific event ID.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sportKey = req.nextUrl.searchParams.get("sport");

    if (!sportKey) {
      // Try to find the match across all sports
      for (const sport of SUPPORTED_SPORTS) {
        const match = await fetchMatchById(sport.key, id);
        if (match) {
          return NextResponse.json({ match, sport: sport.key });
        }
      }
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const match = await fetchMatchById(sportKey, id);
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    return NextResponse.json({ match, sport: sportKey });
  } catch (err) {
    console.error("[api/matches/[id]]", err);
    return serverError(err instanceof Error ? err.message : "Failed to fetch match");
  }
}
