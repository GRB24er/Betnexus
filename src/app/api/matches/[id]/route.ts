import { NextRequest, NextResponse } from "next/server";
import {
  fetchMatchById,
  fetchMatchMarkets,
  getMatches,
  SUPPORTED_SPORTS,
  findSportKeyForEvent,
} from "@/lib/oddsapi";
import { serverError } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/matches/[id]?sport=soccer_epl&markets=true
 *
 * Returns full match data. When markets=true, also fetches and returns
 * all available betting markets for the event.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sportKey = req.nextUrl.searchParams.get("sport");
    const wantMarkets = req.nextUrl.searchParams.get("markets") === "true";

    // First: check the store (instant)
    const { live, upcoming } = await getMatches();
    let match = [...live, ...upcoming].find((m) => m.id === id) || null;
    let resolvedSportKey = sportKey || null;

    if (match && !resolvedSportKey) {
      // Find the sport key from the store
      resolvedSportKey = findSportKeyForEvent(id);
      if (!resolvedSportKey) {
        // Fallback: derive from sport category
        const meta = SUPPORTED_SPORTS.find((s) => s.sport === match!.sport);
        resolvedSportKey = meta?.key || null;
      }
    }

    // Fallback: direct API call if not in store
    if (!match) {
      if (sportKey) {
        match = await fetchMatchById(sportKey, id);
        resolvedSportKey = sportKey;
      } else {
        for (const sport of SUPPORTED_SPORTS) {
          match = await fetchMatchById(sport.key, id);
          if (match) {
            resolvedSportKey = sport.key;
            break;
          }
        }
      }
    }

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Fetch full markets if requested
    let marketCategories = null;
    if (wantMarkets && resolvedSportKey) {
      try {
        marketCategories = await fetchMatchMarkets(
          id,
          resolvedSportKey,
          match.homeTeam,
          match.awayTeam,
          match.odds.home,
          match.odds.away,
          match.odds.draw,
          match.sport
        );
      } catch (err) {
        console.warn(`[api/matches/[id]] Failed to fetch markets:`, err);
        // Don't fail the whole request — just return match without markets
      }
    }

    return NextResponse.json({
      match,
      sport: resolvedSportKey || match.sport,
      ...(marketCategories ? { marketCategories } : {}),
    });
  } catch (err) {
    console.error("[api/matches/[id]]", err);
    return serverError(err instanceof Error ? err.message : "Failed to fetch match");
  }
}
