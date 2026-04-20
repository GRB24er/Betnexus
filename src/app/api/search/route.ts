import { NextRequest, NextResponse } from "next/server";
import { liveMatches, featuredMatches, upcomingMatches } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim().toLowerCase();
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const allMatches = [...liveMatches, ...featuredMatches, ...upcomingMatches];
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
}
