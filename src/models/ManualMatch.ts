import mongoose, { Schema, Model, Types } from "mongoose";

/**
 * Manual matches are created by staff (super-admin or sub-admin) for events
 * not covered by the odds API. They appear on the public listings alongside
 * API matches. When a manual match is "settled", the system finds every bet
 * that referenced it and grades the relevant selections, paying winners
 * automatically.
 *
 *   matchId stored on bet selections === ManualMatch._id.toString()
 */

export type ManualMatchStatus =
  | "scheduled"
  | "live"
  | "completed"
  | "cancelled";

export type OutcomeResult = "pending" | "won" | "lost" | "void";

export interface IManualOutcome {
  label: string; // displayed text — must equal Bet.selections[i].selection
  odds: number;
  point?: number;
  result: OutcomeResult;
}

export interface IManualMarket {
  /** Stable key like "h2h", "totals_2.5". Used to keep market identity across edits. */
  key: string;
  /** Displayed name — must equal Bet.selections[i].market */
  name: string;
  outcomes: IManualOutcome[];
}

export interface IManualMatch {
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  startTime: Date;
  isLive: boolean;
  minute?: number;
  status: ManualMatchStatus;
  homeScore?: number;
  awayScore?: number;
  markets: IManualMarket[];
  createdBy: Types.ObjectId;
  createdByRole: "admin" | "subadmin";
  settledAt?: Date;
  settledBy?: Types.ObjectId;
  cancelledAt?: Date;
  cancelledBy?: Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OutcomeSchema = new Schema<IManualOutcome>(
  {
    label: { type: String, required: true, trim: true },
    odds: { type: Number, required: true, min: 1.01, max: 1000 },
    point: { type: Number },
    result: {
      type: String,
      enum: ["pending", "won", "lost", "void"],
      default: "pending",
    },
  },
  { _id: false }
);

const MarketSchema = new Schema<IManualMarket>(
  {
    key: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    outcomes: {
      type: [OutcomeSchema],
      validate: (v: IManualOutcome[]) => v.length >= 2,
    },
  },
  { _id: false }
);

const ManualMatchSchema = new Schema<IManualMatch>(
  {
    sport: { type: String, required: true, trim: true, index: true },
    league: { type: String, required: true, trim: true },
    homeTeam: { type: String, required: true, trim: true },
    awayTeam: { type: String, required: true, trim: true },
    startTime: { type: Date, required: true, index: true },
    isLive: { type: Boolean, default: false },
    minute: { type: Number },
    status: {
      type: String,
      enum: ["scheduled", "live", "completed", "cancelled"],
      default: "scheduled",
      index: true,
    },
    homeScore: { type: Number, min: 0 },
    awayScore: { type: Number, min: 0 },
    markets: {
      type: [MarketSchema],
      validate: (v: IManualMarket[]) => v.length >= 1,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    createdByRole: {
      type: String,
      enum: ["admin", "subadmin"],
      required: true,
    },
    settledAt: { type: Date },
    settledBy: { type: Schema.Types.ObjectId, ref: "User" },
    cancelledAt: { type: Date },
    cancelledBy: { type: Schema.Types.ObjectId, ref: "User" },
    notes: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

ManualMatchSchema.index({ status: 1, startTime: 1 });

export const ManualMatch: Model<IManualMatch> =
  (mongoose.models.ManualMatch as Model<IManualMatch>) ||
  mongoose.model<IManualMatch>("ManualMatch", ManualMatchSchema);
