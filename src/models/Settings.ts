import mongoose, { Schema, Document } from "mongoose";

export interface ISettings extends Document {
  key: string;
  platformName: string;
  currency: string;
  minDeposit: number;
  maxDeposit: number;
  minBet: number;
  maxBet: number;
  minWithdrawal: number;
  maxWithdrawal: number;
  maxPayout: number;
  maxAccaLegs: number;
  houseEdge: number;
  withdrawalProcessingDays: number;
  kycRequired: boolean;
  kycThreshold: number;
  referralBonus: number;
  welcomeBonus: number;
  maintenanceMode: boolean;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>(
  {
    key: { type: String, default: "platform", unique: true },
    platformName: { type: String, default: "BetNexus" },
    currency: { type: String, default: "GHS" },
    minDeposit: { type: Number, default: 1 },
    maxDeposit: { type: Number, default: 50000 },
    minBet: { type: Number, default: 0.5 },
    maxBet: { type: Number, default: 10000 },
    minWithdrawal: { type: Number, default: 10 },
    maxWithdrawal: { type: Number, default: 50000 },
    maxPayout: { type: Number, default: 100000 },
    maxAccaLegs: { type: Number, default: 20 },
    houseEdge: { type: Number, default: 5 },
    withdrawalProcessingDays: { type: Number, default: 1 },
    kycRequired: { type: Boolean, default: true },
    kycThreshold: { type: Number, default: 1000 },
    referralBonus: { type: Number, default: 5 },
    welcomeBonus: { type: Number, default: 100 },
    maintenanceMode: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Settings ||
  mongoose.model<ISettings>("Settings", SettingsSchema);
