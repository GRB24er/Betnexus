import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Transaction } from "@/models/Transaction";
import { getCurrentUser, unauthorized } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const limit = Math.min(
    Number(req.nextUrl.searchParams.get("limit") || 50),
    100
  );
  const type = req.nextUrl.searchParams.get("type");

  await connectDB();

  const query: Record<string, unknown> = { userId: user._id };
  if (type) query.type = type;

  const transactions = await Transaction.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return NextResponse.json({ transactions });
}
