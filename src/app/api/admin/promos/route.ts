import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { Promotion } from "@/models/Promotion";
import { requireAdmin } from "@/lib/adminAuth";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const status = req.nextUrl.searchParams.get("status");
  await connectDB();

  const query: Record<string, unknown> = {};
  if (status) query.status = status;

  const promos = await Promotion.find(query).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ promos });
}

const createSchema = z.object({
  code: z.string().min(3).max(20),
  name: z.string().min(1),
  description: z.string().min(1),
  type: z.enum([
    "welcome_bonus",
    "deposit_match",
    "free_bet",
    "cashback",
    "referral_bonus",
    "loyalty_reward",
  ]),
  bonusPercent: z.number().min(0).max(1000).optional(),
  bonusAmount: z.number().min(0).optional(),
  minDeposit: z.number().min(0).optional(),
  maxBonus: z.number().min(0).optional(),
  wagerMultiplier: z.number().min(1).default(1),
  maxRedemptions: z.number().min(0).default(0),
  perUserLimit: z.number().min(1).default(1),
  startsAt: z.string(),
  expiresAt: z.string(),
  applicableMethods: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.issues },
      { status: 400 }
    );
  }

  await connectDB();

  const existing = await Promotion.findOne({
    code: parsed.data.code.toUpperCase(),
  });
  if (existing) {
    return NextResponse.json(
      { error: "Promo code already exists" },
      { status: 400 }
    );
  }

  const promo = await Promotion.create({
    ...parsed.data,
    code: parsed.data.code.toUpperCase(),
    startsAt: new Date(parsed.data.startsAt),
    expiresAt: new Date(parsed.data.expiresAt),
    createdBy: auth.user._id,
  });

  await logAudit({
    userId: auth.user._id,
    action: "promo.create",
    resource: "Promotion",
    resourceId: promo._id.toString(),
    details: { code: promo.code },
    adminId: auth.user._id,
    req,
  });

  return NextResponse.json({ promo });
}
