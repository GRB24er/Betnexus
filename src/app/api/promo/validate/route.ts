import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Promotion, PromoRedemption } from "@/models/Promotion";
import { getCurrentUser, unauthorized, badRequest } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const { code } = await req.json();
  if (!code) return badRequest("Promo code is required");

  await connectDB();

  const promo = await Promotion.findOne({
    code: code.toUpperCase(),
    status: "active",
    startsAt: { $lte: new Date() },
    expiresAt: { $gt: new Date() },
  });

  if (!promo) {
    return NextResponse.json(
      { error: "Invalid or expired promo code" },
      { status: 404 }
    );
  }

  if (promo.maxRedemptions > 0 && promo.currentRedemptions >= promo.maxRedemptions) {
    return NextResponse.json(
      { error: "This promotion has reached its maximum redemptions" },
      { status: 400 }
    );
  }

  const userRedemptions = await PromoRedemption.countDocuments({
    userId: user._id,
    promotionId: promo._id,
  });

  if (userRedemptions >= promo.perUserLimit) {
    return NextResponse.json(
      { error: "You have already used this promo code" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    valid: true,
    promo: {
      code: promo.code,
      name: promo.name,
      type: promo.type,
      bonusPercent: promo.bonusPercent,
      bonusAmount: promo.bonusAmount,
      minDeposit: promo.minDeposit,
      maxBonus: promo.maxBonus,
      wagerMultiplier: promo.wagerMultiplier,
    },
  });
}
