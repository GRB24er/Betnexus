import mongoose, { Schema, Model, Types } from "mongoose";

export type BetStatus = "pending" | "won" | "lost" | "void" | "cashed_out";
export type BetType = "single" | "accumulator" | "system";

export interface IBetSelection {
  matchId: string;
  match: string;
  market: string;
  selection: string;
  odds: number;
  result?: "won" | "lost" | "pending" | "void";
  sport?: string;
  league?: string;
  startTime?: Date;
}

export interface IBet {
  userId: Types.ObjectId;
  reference: string;
  type: BetType;
  status: BetStatus;
  selections: IBetSelection[];
  stake: number;
  totalOdds: number;
  potentialWin: number;
  payout: number;
  currency: string;
  cashedOutAt?: Date;
  cashedOutAmount?: number;
  settledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SelectionSchema = new Schema<IBetSelection>(
  {
    matchId: { type: String, required: true },
    match: { type: String, required: true },
    market: { type: String, required: true },
    selection: { type: String, required: true },
    odds: { type: Number, required: true, min: 1.01 },
    result: {
      type: String,
      enum: ["won", "lost", "pending", "void"],
      default: "pending",
    },
    sport: { type: String },
    league: { type: String },
    startTime: { type: Date },
  },
  { _id: false }
);

const BetSchema = new Schema<IBet>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    reference: { type: String, required: true, unique: true, index: true },
    type: {
      type: String,
      enum: ["single", "accumulator", "system"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "won", "lost", "void", "cashed_out"],
      default: "pending",
      index: true,
    },
    selections: {
      type: [SelectionSchema],
      validate: (v: IBetSelection[]) => v.length > 0,
    },
    stake: { type: Number, required: true, min: 1 },
    totalOdds: { type: Number, required: true, min: 1.01 },
    potentialWin: { type: Number, required: true },
    payout: { type: Number, default: 0 },
    currency: { type: String, default: "GHS" },
    cashedOutAt: { type: Date },
    cashedOutAmount: { type: Number },
    settledAt: { type: Date },
  },
  { timestamps: true }
);

BetSchema.index({ userId: 1, createdAt: -1 });

export const Bet: Model<IBet> =
  (mongoose.models.Bet as Model<IBet>) ||
  mongoose.model<IBet>("Bet", BetSchema);
