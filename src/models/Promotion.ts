import mongoose, { Schema, Model, Types } from "mongoose";

export type PromoType =
  | "welcome_bonus"
  | "deposit_match"
  | "free_bet"
  | "cashback"
  | "referral_bonus"
  | "loyalty_reward";

export interface IPromotion {
  code: string;
  name: string;
  description: string;
  type: PromoType;
  status: "active" | "paused" | "expired";
  bonusPercent?: number;
  bonusAmount?: number;
  minDeposit?: number;
  maxBonus?: number;
  wagerMultiplier: number;
  maxRedemptions: number;
  currentRedemptions: number;
  perUserLimit: number;
  startsAt: Date;
  expiresAt: Date;
  applicableMethods?: string[];
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PromotionSchema = new Schema<IPromotion>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    name: { type: String, required: true },
    description: { type: String, required: true },
    type: {
      type: String,
      enum: [
        "welcome_bonus",
        "deposit_match",
        "free_bet",
        "cashback",
        "referral_bonus",
        "loyalty_reward",
      ],
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "paused", "expired"],
      default: "active",
    },
    bonusPercent: { type: Number, min: 0, max: 1000 },
    bonusAmount: { type: Number, min: 0 },
    minDeposit: { type: Number, default: 0 },
    maxBonus: { type: Number },
    wagerMultiplier: { type: Number, default: 1, min: 1 },
    maxRedemptions: { type: Number, default: 0 },
    currentRedemptions: { type: Number, default: 0 },
    perUserLimit: { type: Number, default: 1 },
    startsAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true, index: true },
    applicableMethods: [{ type: String }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const Promotion: Model<IPromotion> =
  (mongoose.models.Promotion as Model<IPromotion>) ||
  mongoose.model<IPromotion>("Promotion", PromotionSchema);

export interface IPromoRedemption {
  userId: Types.ObjectId;
  promotionId: Types.ObjectId;
  promoCode: string;
  bonusAmount: number;
  wagerRequired: number;
  wagerCompleted: number;
  status: "active" | "completed" | "expired" | "forfeited";
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PromoRedemptionSchema = new Schema<IPromoRedemption>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    promotionId: {
      type: Schema.Types.ObjectId,
      ref: "Promotion",
      required: true,
    },
    promoCode: { type: String, required: true },
    bonusAmount: { type: Number, required: true },
    wagerRequired: { type: Number, required: true },
    wagerCompleted: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["active", "completed", "expired", "forfeited"],
      default: "active",
    },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

PromoRedemptionSchema.index({ userId: 1, promotionId: 1 });

export const PromoRedemption: Model<IPromoRedemption> =
  (mongoose.models.PromoRedemption as Model<IPromoRedemption>) ||
  mongoose.model<IPromoRedemption>("PromoRedemption", PromoRedemptionSchema);
