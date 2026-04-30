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

const createSchema = z.object({
  sport: z.string().min(1).max(40),
  league: z.string().min(1).max(120),
  homeTeam: z.string().min(1).max(80),
  awayTeam: z.string().min(1).max(80),
  startTime: z.string(),
  isLive: z.boolean().optional(),
  minute: z.number().int().min(0).max(300).optional(),
  markets: z.array(marketSchema).min(1).max(15),
  notes: z.string().max(500).optional(),
});

export async function GET(req: NextRequest) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const status = req.nextUrl.searchParams.get("status");
  const sport = req.nextUrl.searchParams.get("sport");
  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") || 1));
  const limit = Math.min(
    100,
    Number(req.nextUrl.searchParams.get("limit") || 30)
  );

  await connectDB();

  const query: Record<string, unknown> = {};
  if (status) query.status = status;
  if (sport) query.sport = sport;

  const [matches, total] = await Promise.all([
    ManualMatch.find(query)
      .sort({ startTime: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("createdBy", "firstName lastName email role")
      .populate("settledBy", "firstName lastName email")
      .lean(),
    ManualMatch.countDocuments(query),
  ]);

  return NextResponse.json({
    matches,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid match payload", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const startTime = new Date(parsed.data.startTime);
  if (isNaN(startTime.getTime())) {
    return NextResponse.json({ error: "Invalid startTime" }, { status: 400 });
  }

  // Each market key must be unique within this match.
  const seen = new Set<string>();
  for (const m of parsed.data.markets) {
    if (seen.has(m.key)) {
      return NextResponse.json(
        { error: `Duplicate market key: ${m.key}` },
        { status: 400 }
      );
    }
    seen.add(m.key);
  }

  await connectDB();

  const match = await ManualMatch.create({
    sport: parsed.data.sport,
    league: parsed.data.league,
    homeTeam: parsed.data.homeTeam,
    awayTeam: parsed.data.awayTeam,
    startTime,
    isLive: parsed.data.isLive ?? false,
    minute: parsed.data.minute,
    status: parsed.data.isLive ? "live" : "scheduled",
    markets: parsed.data.markets.map((m) => ({
      ...m,
      outcomes: m.outcomes.map((o) => ({ ...o, result: "pending" })),
    })),
    createdBy: auth.user._id,
    createdByRole: auth.user.role === "admin" ? "admin" : "subadmin",
    notes: parsed.data.notes,
  });

  await logAudit({
    userId: auth.user._id,
    action: "manualMatch.create",
    resource: "ManualMatch",
    resourceId: match._id.toString(),
    details: {
      teams: `${parsed.data.homeTeam} vs ${parsed.data.awayTeam}`,
      league: parsed.data.league,
      markets: parsed.data.markets.length,
    },
    adminId: auth.user._id,
    req,
  });

  return NextResponse.json({ match }, { status: 201 });
}
