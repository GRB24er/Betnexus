import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { ManualMatch } from "@/models/ManualMatch";
import { requireStaff } from "@/lib/adminAuth";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const outcomeSchema = z.object({
  label: z.string().min(1).max(100),
  odds: z.number().min(1.01).max(1000),
  point: z.number().optional(),
});

const marketSchema = z.object({
  key: z.string().min(1).max(60),
  name: z.string().min(1).max(80),
  outcomes: z.array(outcomeSchema).min(2).max(20),
});

const updateSchema = z.object({
  league: z.string().min(1).max(120).optional(),
  homeTeam: z.string().min(1).max(80).optional(),
  awayTeam: z.string().min(1).max(80).optional(),
  startTime: z.string().optional(),
  isLive: z.boolean().optional(),
  minute: z.number().int().min(0).max(300).optional(),
  homeScore: z.number().int().min(0).optional(),
  awayScore: z.number().int().min(0).optional(),
  markets: z.array(marketSchema).optional(),
  notes: z.string().max(500).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const { id } = await params;
  await connectDB();

  const match = await ManualMatch.findById(id)
    .populate("createdBy", "firstName lastName email role")
    .populate("settledBy", "firstName lastName email")
    .lean();
  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }
  return NextResponse.json({ match });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid update payload", details: parsed.error.issues },
      { status: 400 }
    );
  }

  await connectDB();
  const existing = await ManualMatch.findById(id);
  if (!existing) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }
  if (existing.status === "completed" || existing.status === "cancelled") {
    return NextResponse.json(
      { error: `Cannot edit a ${existing.status} match` },
      { status: 400 }
    );
  }

  // Replacing markets resets every outcome's result to "pending" — staff
  // shouldn't lose grading work without an explicit re-settle, so we refuse
  // a markets update if any outcome is already graded.
  if (parsed.data.markets) {
    const alreadyGraded = existing.markets.some((m) =>
      m.outcomes.some((o) => o.result !== "pending")
    );
    if (alreadyGraded) {
      return NextResponse.json(
        { error: "Cannot replace markets after some outcomes are graded" },
        { status: 400 }
      );
    }
    existing.markets = parsed.data.markets.map((m) => ({
      ...m,
      outcomes: m.outcomes.map((o) => ({ ...o, result: "pending" as const })),
    }));
  }

  if (parsed.data.league !== undefined) existing.league = parsed.data.league;
  if (parsed.data.homeTeam !== undefined) existing.homeTeam = parsed.data.homeTeam;
  if (parsed.data.awayTeam !== undefined) existing.awayTeam = parsed.data.awayTeam;
  if (parsed.data.startTime !== undefined) {
    const t = new Date(parsed.data.startTime);
    if (isNaN(t.getTime())) {
      return NextResponse.json({ error: "Invalid startTime" }, { status: 400 });
    }
    existing.startTime = t;
  }
  if (parsed.data.isLive !== undefined) {
    existing.isLive = parsed.data.isLive;
    if (parsed.data.isLive && existing.status === "scheduled") {
      existing.status = "live";
    }
  }
  if (parsed.data.minute !== undefined) existing.minute = parsed.data.minute;
  if (parsed.data.homeScore !== undefined) existing.homeScore = parsed.data.homeScore;
  if (parsed.data.awayScore !== undefined) existing.awayScore = parsed.data.awayScore;
  if (parsed.data.notes !== undefined) existing.notes = parsed.data.notes;

  await existing.save();

  await logAudit({
    userId: auth.user._id,
    action: "manualMatch.update",
    resource: "ManualMatch",
    resourceId: existing._id.toString(),
    details: { fields: Object.keys(parsed.data) },
    adminId: auth.user._id,
    req,
  });

  return NextResponse.json({ match: existing });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const { id } = await params;
  await connectDB();
  const match = await ManualMatch.findById(id);
  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  // We never hard-delete a match that has bets — too risky for the audit
  // trail. The /cancel endpoint should be used to refund bets and mark as
  // cancelled. Hard delete is only allowed if the match is brand new.
  const { Bet } = await import("@/models/Bet");
  const betsExist = await Bet.exists({ "selections.matchId": match._id.toString() });
  if (betsExist) {
    return NextResponse.json(
      {
        error:
          "Cannot delete a match that has bets attached. Use cancel to void bets and refund users.",
      },
      { status: 400 }
    );
  }

  await ManualMatch.deleteOne({ _id: match._id });

  await logAudit({
    userId: auth.user._id,
    action: "manualMatch.delete",
    resource: "ManualMatch",
    resourceId: match._id.toString(),
    details: { teams: `${match.homeTeam} vs ${match.awayTeam}` },
    adminId: auth.user._id,
    req,
  });

  return NextResponse.json({ deleted: true });
}
