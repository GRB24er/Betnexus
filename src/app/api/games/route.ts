import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Game } from "@/models/Game";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await connectDB();
  const league = req.nextUrl.searchParams.get("league");
  const status = req.nextUrl.searchParams.get("status") || "scheduled";
  const tier = req.nextUrl.searchParams.get("tier") || "free";

  const filter: Record<string, unknown> = { published: true };
  if (league) filter.league = league;
  if (status !== "all") filter.status = status;
  if (tier !== "all") filter.visibleToTier = tier;

  const games = await Game.find(filter).sort({ kickoffAt: 1 }).limit(200).lean();
  return NextResponse.json({ games });
}
