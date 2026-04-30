import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Bet } from "@/models/Bet";
import { User } from "@/models/User";
import { requireSubAdmin } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireSubAdmin();
  if (auth.error) return auth.error;

  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") || 1));
  const limit = Math.min(
    100,
    Number(req.nextUrl.searchParams.get("limit") || 20)
  );
  const status = req.nextUrl.searchParams.get("status");

  await connectDB();

  // Resolve referred user IDs first so the bet query is properly scoped.
  const referredIds = await User.find({ referredBy: auth.user._id.toString() })
    .select("_id")
    .lean<{ _id: string }[]>();

  if (referredIds.length === 0) {
    return NextResponse.json({ bets: [], total: 0, page, pages: 0 });
  }

  const ids = referredIds.map((u) => u._id);
  const query: Record<string, unknown> = { userId: { $in: ids } };
  if (status) query.status = status;

  const [bets, total] = await Promise.all([
    Bet.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("userId", "firstName lastName email")
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
