import { NextRequest, NextResponse } from "next/server";
import {
  fetchMatchById,
  fetchMatchMarkets,
  getMatches,
  SUPPORTED_SPORTS,
  findSportKeyForEvent,
} from "@/lib/oddsapi";
import { findFixture, getMatchLogos } from "@/lib/apifootball";
import { connectDB } from "@/lib/mongodb";
import { ManualMatch } from "@/models/ManualMatch";
import { manualMatchToPublic } from "@/lib/manualMatchToPublic";
import { serverError } from "@/lib/auth";
import mongoose from "mongoose";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function buildManualMarketCategories(
  markets: { key: string; name: string; outcomes: { label: string; odds: number; point?: number }[] }[]
) {
  return [
    {
      id: "manual",
      name: "Markets",
      icon: "🏟️",
      markets: markets.map((m) => ({
        key: m.key,
        name: m.name,
        outcomes: m.outcomes.map((o) => ({
          name: o.label,
          label: o.label,
          odds: o.odds,
          point: o.point,
        })),
      })),
    },
  ];
}

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

    // First: check if this is a manual (staff-created) match — they use
    // ObjectId for their public id, so a quick shape check + DB lookup.
    if (mongoose.isValidObjectId(id)) {
      try {
        await connectDB();
        const manual = await ManualMatch.findById(id).lean();
        if (manual) {
          const publicMatch = manualMatchToPublic(manual);
          return NextResponse.json({
            match: publicMatch,
            sport: manual.sport,
            ...(wantMarkets
              ? { marketCategories: buildManualMarketCategories(manual.markets) }
              : {}),
          });
        }
      } catch (err) {
        console.warn("[api/matches/[id]] manual lookup failed:", err);
      }
    }

    // Then: check the in-memory API store (instant)
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

    // Enrich with API-Football data (logos, league logo, country flag).
    // Only attempt for football — other sports aren't covered by api-football.
    // Runs in parallel and is fully optional: if the key is missing or the
    // lookup fails, we return the match unchanged.
    if (match.sport === "football") {
      const [logos, fixture] = await Promise.all([
        getMatchLogos(match.homeTeam, match.awayTeam),
        findFixture(match.homeTeam, match.awayTeam),
      ]);
      if (logos.homeLogo) match.homeLogo = logos.homeLogo;
      if (logos.awayLogo) match.awayLogo = logos.awayLogo;
      if (fixture) {
        if (fixture.league.logo) match.leagueLogo = fixture.league.logo;
        if (fixture.league.flag) match.countryFlag = fixture.league.flag;
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
