import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Bet } from "@/models/Bet";
import { getCurrentUser, unauthorized } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const status = req.nextUrl.searchParams.get("status");
  const limit = Math.min(
    Number(req.nextUrl.searchParams.get("limit") || 50),
    100
  );

  await connectDB();

  const query: Record<string, unknown> = { userId: user._id };
  if (status) query.status = status;

  const bets = await Bet.find(query).sort({ createdAt: -1 }).limit(limit).lean();

  return NextResponse.json({ bets });
}
