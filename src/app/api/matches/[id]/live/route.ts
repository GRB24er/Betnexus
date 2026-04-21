import { NextRequest, NextResponse } from "next/server";
import { getMatches } from "@/lib/oddsapi";
import {
  getLiveScore,
  getLineups,
  getFixtureEvents,
  apiFootballEnabled,
} from "@/lib/apifootball";
import { serverError } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/matches/[id]/live
 *
 * Returns fast-changing data for a football match: live score, lineups,
 * and in-play events (goals, cards, subs). Meant to be polled every
 * 15-30s from the match detail page.
 *
 * If API_FOOTBALL_KEY is unset or the fixture isn't found, responds
 * with { enabled: false } so the UI can hide the panel.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!apiFootballEnabled()) {
      return NextResponse.json({ enabled: false });
    }

    const { live, upcoming } = await getMatches();
    const match = [...live, ...upcoming].find((m) => m.id === id);
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }
    if (match.sport !== "football") {
      return NextResponse.json({ enabled: false });
    }

    const [score, lineups, events] = await Promise.all([
      getLiveScore(match.homeTeam, match.awayTeam),
      getLineups(match.homeTeam, match.awayTeam),
      getFixtureEvents(match.homeTeam, match.awayTeam),
    ]);

    return NextResponse.json({
      enabled: true,
      score,
      lineups,
      events,
    });
  } catch (err) {
    console.error("[api/matches/[id]/live]", err);
    return serverError(err instanceof Error ? err.message : "Failed to fetch live data");
  }
}
