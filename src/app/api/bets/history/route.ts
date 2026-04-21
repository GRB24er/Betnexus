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
  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") || 1));
  const limit = Math.min(
    Number(req.nextUrl.searchParams.get("limit") || 20),
    100
  );

  await connectDB();

  const query: Record<string, unknown> = { userId: user._id };
  if (status) query.status = status;

  const [bets, total] = await Promise.all([
    Bet.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Bet.countDocuments(query),
  ]);

  return NextResponse.json({
    bets,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}
