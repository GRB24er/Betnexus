import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Bet } from "@/models/Bet";
import { requireAdmin } from "@/lib/adminAuth";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") || 1));
  const limit = Math.min(100, Number(req.nextUrl.searchParams.get("limit") || 20));
  const status = req.nextUrl.searchParams.get("status");
  const userId = req.nextUrl.searchParams.get("userId");

  await connectDB();

  const query: Record<string, unknown> = {};
  if (status) query.status = status;
  if (userId) query.userId = userId;

  const [bets, total] = await Promise.all([
    Bet.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("userId", "firstName lastName email")
      .lean(),
    Bet.countDocuments(query),
  ]);

  return NextResponse.json({ bets, total, page, pages: Math.ceil(total / limit) });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { betId, action, result } = await req.json();
  if (!betId || !action) {
    return NextResponse.json({ error: "betId and action required" }, { status: 400 });
  }

  await connectDB();
  const bet = await Bet.findById(betId);
  if (!bet) {
    return NextResponse.json({ error: "Bet not found" }, { status: 404 });
  }

  if (action === "void") {
    bet.status = "void";
    bet.settledAt = new Date();
  } else if (action === "settle" && result) {
    bet.status = result === "won" ? "won" : "lost";
    bet.settledAt = new Date();
    if (result === "won") {
      bet.payout = bet.potentialWin;
    }
  }

  await bet.save();

  await logAudit({
    userId: bet.userId,
    action: "bet.settle",
    resource: "Bet",
    resourceId: bet._id.toString(),
    details: { action, result },
    adminId: auth.user._id,
    req,
  });

  return NextResponse.json({ bet });
}
