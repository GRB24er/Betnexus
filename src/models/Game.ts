import mongoose, { Schema, Model } from "mongoose";

export interface IGameOdds {
  home: number;
  draw: number;
  away: number;
  over15?: number;
  under15?: number;
  over25?: number;
  under25?: number;
  bttsYes?: number;
  bttsNo?: number;
}

export interface IGame {
  title: string;
  league: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo?: string;
  awayLogo?: string;
  kickoffAt: Date;
  status: "scheduled" | "live" | "finished" | "cancelled";
  result?: string;
  odds: IGameOdds;
  published: boolean;
  premium: boolean;
  accessFee: number;
  visibleToTier: "free" | "premium" | "vip";
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const GameSchema = new Schema<IGame>(
  {
    title: { type: String, required: true, trim: true },
    league: { type: String, required: true, trim: true, index: true },
    sport: { type: String, required: true, default: "football", index: true },
    homeTeam: { type: String, required: true, trim: true },
    awayTeam: { type: String, required: true, trim: true },
    homeLogo: { type: String },
    awayLogo: { type: String },
    kickoffAt: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ["scheduled", "live", "finished", "cancelled"],
      default: "scheduled",
      index: true,
    },
    result: { type: String },
    odds: {
      home: { type: Number, default: 2.0 },
      draw: { type: Number, default: 3.0 },
      away: { type: Number, default: 2.5 },
      over15: { type: Number },
      under15: { type: Number },
      over25: { type: Number },
      under25: { type: Number },
      bttsYes: { type: Number },
      bttsNo: { type: Number },
    },
    published: { type: Boolean, default: false, index: true },
    premium: { type: Boolean, default: false },
    accessFee: { type: Number, default: 0 },
    visibleToTier: {
      type: String,
      enum: ["free", "premium", "vip"],
      default: "free",
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

GameSchema.index({ published: 1, kickoffAt: 1 });
GameSchema.index({ status: 1, kickoffAt: 1 });

export const Game: Model<IGame> =
  (mongoose.models.Game as Model<IGame>) ||
  mongoose.model<IGame>("Game", GameSchema);

export function randomOddsBracket(): IGameOdds {
  const rand = (min: number, max: number) =>
    Math.round((Math.random() * (max - min) + min) * 100) / 100;
  return {
    home: rand(1.4, 4.5),
    draw: rand(2.6, 4.8),
    away: rand(1.5, 5.5),
    over15: rand(1.15, 1.65),
    under15: rand(2.1, 4.2),
    over25: rand(1.6, 2.6),
    under25: rand(1.4, 2.4),
    bttsYes: rand(1.55, 2.2),
    bttsNo: rand(1.6, 2.3),
  };
}
