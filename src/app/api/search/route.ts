import { NextRequest, NextResponse } from "next/server";
import { getMatches } from "@/lib/oddsapi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim().toLowerCase();
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const { live, upcoming } = await getMatches();
    const allMatches = [...live, ...upcoming];

    const results = allMatches
      .filter((m) => {
        const searchable = `${m.homeTeam} ${m.awayTeam} ${m.league} ${m.sport}`.toLowerCase();
        return searchable.includes(q);
      })
      .slice(0, 20)
      .map((m) => ({
        id: m.id,
        home: m.homeTeam,
        away: m.awayTeam,
        league: m.league,
        sport: m.sport,
        time: m.time,
        isLive: m.isLive,
      }));

    return NextResponse.json({ results, total: results.length });
  } catch (err) {
    console.error("[api/search]", err);
    return NextResponse.json({ results: [], error: "Search unavailable" });
  }
}
