import mongoose, { Schema, Model, Types } from "mongoose";

export interface IReferral {
  referrerId: Types.ObjectId;
  referredId: Types.ObjectId;
  referralCode: string;
  referrerReward: number;
  referredReward: number;
  referrerPaid: boolean;
  referredPaid: boolean;
  status: "pending" | "qualified" | "rewarded";
  qualifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReferralSchema = new Schema<IReferral>(
  {
    referrerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    referredId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    referralCode: { type: String, required: true, index: true },
    referrerReward: { type: Number, default: 10 },
    referredReward: { type: Number, default: 5 },
    referrerPaid: { type: Boolean, default: false },
    referredPaid: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["pending", "qualified", "rewarded"],
      default: "pending",
    },
    qualifiedAt: { type: Date },
  },
  { timestamps: true }
);

export const Referral: Model<IReferral> =
  (mongoose.models.Referral as Model<IReferral>) ||
  mongoose.model<IReferral>("Referral", ReferralSchema);
