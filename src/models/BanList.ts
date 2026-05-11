import mongoose, { Schema, Model } from "mongoose";

export type BanType = "ip" | "device" | "email" | "phone";

export interface IBanEntry {
  type: BanType;
  value: string;
  userId?: mongoose.Types.ObjectId;
  reason?: string;
  bannedBy?: mongoose.Types.ObjectId;
  active: boolean;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BanEntrySchema = new Schema<IBanEntry>(
  {
    type: {
      type: String,
      enum: ["ip", "device", "email", "phone"],
      required: true,
      index: true,
    },
    value: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    reason: { type: String },
    bannedBy: { type: Schema.Types.ObjectId, ref: "User" },
    active: { type: Boolean, default: true, index: true },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

BanEntrySchema.index({ type: 1, value: 1, active: 1 });

export const BanList: Model<IBanEntry> =
  (mongoose.models.BanList as Model<IBanEntry>) ||
  mongoose.model<IBanEntry>("BanList", BanEntrySchema);
