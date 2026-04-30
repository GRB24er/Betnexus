import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ManualMatch } from "@/models/ManualMatch";
import { requireStaff } from "@/lib/adminAuth";
import { logAudit } from "@/lib/audit";
import { cancelManualMatchAndRefund } from "@/lib/manualMatchSettlement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/manual-matches/[id]/cancel
 *
 * Voids the match: every pending outcome becomes "void", every bet that
 * referenced it is graded with that void result, and bets that fully resolve
 * to all-void get the user's stake refunded automatically.
 */
export async function POST(
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
  if (match.status === "cancelled") {
    return NextResponse.json(
      { error: "Match already cancelled" },
      { status: 400 }
    );
  }
  if (match.status === "completed") {
    return NextResponse.json(
      { error: "Cannot cancel a settled match" },
      { status: 400 }
    );
  }

  match.cancelledBy = auth.user._id;
  const summary = await cancelManualMatchAndRefund(match);

  await logAudit({
    userId: auth.user._id,
    action: "manualMatch.cancel",
    resource: "ManualMatch",
    resourceId: match._id.toString(),
    details: {
      teams: `${match.homeTeam} vs ${match.awayTeam}`,
      ...summary,
    },
    adminId: auth.user._id,
    req,
  });

  // Re-read so we return the up-to-date doc (cancelManualMatchAndRefund mutated it).
  const fresh = await ManualMatch.findById(id);
  return NextResponse.json({ match: fresh, summary });
}
