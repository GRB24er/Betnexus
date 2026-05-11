import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { Game, randomOddsBracket } from "@/models/Game";
import { requireAdmin } from "@/lib/adminAuth";
import { logAudit } from "@/lib/audit";
import type { AuditAction } from "@/models/AuditLog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  league: z.string().min(1).max(120),
  sport: z.string().default("football"),
  homeTeam: z.string().min(1).max(120),
  awayTeam: z.string().min(1).max(120),
  homeLogo: z.string().optional(),
  awayLogo: z.string().optional(),
  kickoffAt: z.string(),
  odds: z
    .object({
      home: z.number().positive(),
      draw: z.number().positive(),
      away: z.number().positive(),
      over15: z.number().positive().optional(),
      under15: z.number().positive().optional(),
      over25: z.number().positive().optional(),
      under25: z.number().positive().optional(),
      bttsYes: z.number().positive().optional(),
      bttsNo: z.number().positive().optional(),
    })
    .optional(),
  published: z.boolean().optional(),
  premium: z.boolean().optional(),
  accessFee: z.number().min(0).optional(),
  visibleToTier: z.enum(["free", "premium", "vip"]).optional(),
});

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  await connectDB();
  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") || 1));
  const limit = Math.min(100, Number(req.nextUrl.searchParams.get("limit") || 30));
  const status = req.nextUrl.searchParams.get("status");
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  const [games, total] = await Promise.all([
    Game.find(filter)
      .sort({ kickoffAt: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Game.countDocuments(filter),
  ]);
  return NextResponse.json({ games, total, page, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid game", details: parsed.error.issues },
      { status: 400 }
    );
  }

  await connectDB();
  const game = await Game.create({
    ...parsed.data,
    kickoffAt: new Date(parsed.data.kickoffAt),
    odds: parsed.data.odds || randomOddsBracket(),
    createdBy: auth.user._id,
  });

  void logAudit({
    userId: auth.user._id,
    adminId: auth.user._id,
    action: "admin.game.create",
    resource: "Game",
    resourceId: game._id.toString(),
    details: { title: game.title },
    req,
  });

  return NextResponse.json({ game });
}

const patchSchema = z.object({
  id: z.string().min(1),
  action: z
    .enum(["update", "publish", "unpublish", "randomize", "finish", "cancel", "delete"])
    .optional(),
  patch: z.record(z.string(), z.unknown()).optional(),
  result: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  await connectDB();
  const game = await Game.findById(parsed.data.id);
  if (!game) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const action = parsed.data.action || "update";

  switch (action) {
    case "update": {
      const patch = parsed.data.patch || {};
      for (const [k, v] of Object.entries(patch)) {
        if (k === "kickoffAt" && typeof v === "string") {
          game.kickoffAt = new Date(v);
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (game as any)[k] = v;
        }
      }
      break;
    }
    case "publish":
      game.published = true;
      break;
    case "unpublish":
      game.published = false;
      break;
    case "randomize":
      game.odds = randomOddsBracket();
      break;
    case "finish":
      game.status = "finished";
      if (parsed.data.result) game.result = parsed.data.result;
      break;
    case "cancel":
      game.status = "cancelled";
      break;
    case "delete":
      await Game.deleteOne({ _id: game._id });
      void logAudit({
        userId: auth.user._id,
        adminId: auth.user._id,
        action: "admin.game.delete",
        resource: "Game",
        resourceId: game._id.toString(),
        req,
      });
      return NextResponse.json({ ok: true });
  }

  await game.save();

  void logAudit({
    userId: auth.user._id,
    adminId: auth.user._id,
    action: `admin.game.${action}` as AuditAction,
    resource: "Game",
    resourceId: game._id.toString(),
    req,
  });

  return NextResponse.json({ game });
}

const bulkRandomizeSchema = z.object({ ids: z.array(z.string()).min(1) });

export async function PUT(req: NextRequest) {
  // Bulk-randomize odds for selected games
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const body = await req.json();
  const parsed = bulkRandomizeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  await connectDB();
  const games = await Game.find({ _id: { $in: parsed.data.ids } });
  for (const g of games) {
    g.odds = randomOddsBracket();
    await g.save();
  }
  void logAudit({
    userId: auth.user._id,
    adminId: auth.user._id,
    action: "admin.game.bulk_randomize",
    resource: "Game",
    details: { count: games.length },
    req,
  });
  return NextResponse.json({ updated: games.length });
}
