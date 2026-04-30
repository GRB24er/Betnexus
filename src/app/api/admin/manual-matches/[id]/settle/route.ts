import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { ManualMatch } from "@/models/ManualMatch";
import { requireStaff } from "@/lib/adminAuth";
import { logAudit } from "@/lib/audit";
import { propagateManualMatchSettlement } from "@/lib/manualMatchSettlement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const resultSchema = z.enum(["won", "lost", "void"]);

const settleSchema = z.object({
  homeScore: z.number().int().min(0).optional(),
  awayScore: z.number().int().min(0).optional(),
  /**
   * Map of market.key → (outcome.label → "won" | "lost" | "void").
   * Every outcome in every market must be present.
   */
  results: z.record(z.string(), z.record(z.string(), resultSchema)),
});

/**
 * POST /api/admin/manual-matches/[id]/settle
 *
 * Staff-only. Marks each market outcome as won / lost / void, sets the final
 * score, then walks every pending bet that referenced this match and finalizes
 * those that have no remaining pending legs.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const { id } = await params;
  const body = await req.json();
  const parsed = settleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid settle payload", details: parsed.error.issues },
      { status: 400 }
    );
  }

  await connectDB();
  const match = await ManualMatch.findById(id);
  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }
  if (match.status === "completed") {
    return NextResponse.json(
      { error: "Match already settled" },
      { status: 400 }
    );
  }
  if (match.status === "cancelled") {
    return NextResponse.json(
      { error: "Match was cancelled" },
      { status: 400 }
    );
  }

  // Validate that every outcome in every market has a result supplied.
  for (const market of match.markets) {
    const marketResults = parsed.data.results[market.key];
    if (!marketResults) {
      return NextResponse.json(
        { error: `Missing results for market: ${market.key}` },
        { status: 400 }
      );
    }
    for (const outcome of market.outcomes) {
      const r = marketResults[outcome.label];
      if (!r) {
        return NextResponse.json(
          {
            error: `Missing result for ${market.key} → ${outcome.label}`,
          },
          { status: 400 }
        );
      }
    }
    // Sanity: at most one "won" per market.
    const wonCount = market.outcomes.filter(
      (o) => marketResults[o.label] === "won"
    ).length;
    if (wonCount > 1) {
      return NextResponse.json(
        {
          error: `Market "${market.name}" cannot have more than one winning outcome`,
        },
        { status: 400 }
      );
    }
  }

  // Apply the grading.
  for (const market of match.markets) {
    const marketResults = parsed.data.results[market.key];
    for (const outcome of market.outcomes) {
      outcome.result = marketResults[outcome.label];
    }
  }

  if (parsed.data.homeScore !== undefined) match.homeScore = parsed.data.homeScore;
  if (parsed.data.awayScore !== undefined) match.awayScore = parsed.data.awayScore;
  match.status = "completed";
  match.isLive = false;
  match.settledAt = new Date();
  match.settledBy = auth.user._id;
  await match.save();

  // Propagate to all pending bets that referenced this match.
  const summary = await propagateManualMatchSettlement(match);

  await logAudit({
    userId: auth.user._id,
    action: "manualMatch.settle",
    resource: "ManualMatch",
    resourceId: match._id.toString(),
    details: {
      teams: `${match.homeTeam} vs ${match.awayTeam}`,
      score: `${match.homeScore ?? "-"}-${match.awayScore ?? "-"}`,
      ...summary,
    },
    adminId: auth.user._id,
    req,
  });

  return NextResponse.json({ match, summary });
}
