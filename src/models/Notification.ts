import mongoose, { Schema, Model, Types } from "mongoose";

export type NotificationType =
  | "bet_won"
  | "bet_lost"
  | "bet_void"
  | "bet_cashout"
  | "deposit"
  | "withdrawal"
  | "withdrawal_failed"
  | "promo"
  | "kyc"
  | "system";

export interface INotification {
  userId: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "bet_won",
        "bet_lost",
        "bet_void",
        "bet_cashout",
        "deposit",
        "withdrawal",
        "withdrawal_failed",
        "promo",
        "kyc",
        "system",
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false, index: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, read: 1 });

export const Notification: Model<INotification> =
  (mongoose.models.Notification as Model<INotification>) ||
  mongoose.model<INotification>("Notification", NotificationSchema);
