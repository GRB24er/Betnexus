import mongoose, { Schema, Model } from "mongoose";

export interface ILiveStream {
  title: string;
  description?: string;
  sourceType: "hls" | "youtube" | "twitch" | "mp4" | "iframe";
  sourceUrl: string;
  thumbnail?: string;
  league?: string;
  active: boolean;
  startsAt?: Date;
  endsAt?: Date;
  viewers: number;
  premium: boolean;
  accessFee: number;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LiveStreamSchema = new Schema<ILiveStream>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    sourceType: {
      type: String,
      enum: ["hls", "youtube", "twitch", "mp4", "iframe"],
      default: "youtube",
    },
    sourceUrl: { type: String, required: true },
    thumbnail: { type: String },
    league: { type: String, index: true },
    active: { type: Boolean, default: true, index: true },
    startsAt: { type: Date },
    endsAt: { type: Date },
    viewers: { type: Number, default: 0 },
    premium: { type: Boolean, default: false },
    accessFee: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

LiveStreamSchema.index({ active: 1, createdAt: -1 });

export const LiveStream: Model<ILiveStream> =
  (mongoose.models.LiveStream as Model<ILiveStream>) ||
  mongoose.model<ILiveStream>("LiveStream", LiveStreamSchema);
