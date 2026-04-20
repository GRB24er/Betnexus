import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Promotion, PromoRedemption } from "@/models/Promotion";
import { User } from "@/models/User";
import { Transaction } from "@/models/Transaction";
import { getCurrentUser, unauthorized, badRequest, serverError } from "@/lib/auth";
import { generateReference } from "@/lib/reference";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { code, depositAmount } = await req.json();
    if (!code) return badRequest("Promo code is required");

    await connectDB();

    const promo = await Promotion.findOne({
      code: code.toUpperCase(),
      status: "active",
      startsAt: { $lte: new Date() },
      expiresAt: { $gt: new Date() },
    });

    if (!promo) return badRequest("Invalid or expired promo code");

    if (promo.maxRedemptions > 0 && promo.currentRedemptions >= promo.maxRedemptions) {
      return badRequest("Promotion fully redeemed");
    }

    const userRedemptions = await PromoRedemption.countDocuments({
      userId: user._id,
      promotionId: promo._id,
    });
    if (userRedemptions >= promo.perUserLimit) {
      return badRequest("Already redeemed");
    }

    if (promo.minDeposit && depositAmount < promo.minDeposit) {
      return badRequest(`Minimum deposit of ${promo.minDeposit} required`);
    }

    let bonusAmount = 0;
    if (promo.bonusPercent) {
      bonusAmount = (depositAmount || 0) * (promo.bonusPercent / 100);
    }
    if (promo.bonusAmount) {
      bonusAmount = Math.max(bonusAmount, promo.bonusAmount);
    }
    if (promo.maxBonus) {
      bonusAmount = Math.min(bonusAmount, promo.maxBonus);
    }
    bonusAmount = Math.round(bonusAmount * 100) / 100;

    const fresh = await User.findById(user._id);
    if (!fresh) return unauthorized();

    const before = fresh.bonusBalance;
    fresh.bonusBalance += bonusAmount;
    await fresh.save();

    await PromoRedemption.create({
      userId: fresh._id,
      promotionId: promo._id,
      promoCode: promo.code,
      bonusAmount,
      wagerRequired: bonusAmount * promo.wagerMultiplier,
      wagerCompleted: 0,
      status: "active",
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    promo.currentRedemptions += 1;
    await promo.save();

    await Transaction.create({
      userId: fresh._id,
      type: "bonus" as const,
      status: "success",
      amount: bonusAmount,
      currency: fresh.currency,
      method: "internal" as const,
      reference: generateReference("BNS"),
      balanceBefore: before,
      balanceAfter: fresh.bonusBalance,
      metadata: { promoCode: promo.code, promoType: promo.type },
    });

    await logAudit({
      userId: fresh._id,
      action: "promo.redeem",
      resource: "Promotion",
      resourceId: promo._id.toString(),
      details: { code: promo.code, bonusAmount },
      req,
    });

    return NextResponse.json({
      bonusAmount,
      bonusBalance: fresh.bonusBalance,
      wagerRequired: bonusAmount * promo.wagerMultiplier,
    });
  } catch (err) {
    console.error("[promo/redeem]", err);
    return serverError("Failed to redeem promo");
  }
}
