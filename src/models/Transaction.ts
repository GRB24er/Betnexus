import mongoose, { Schema, Model, Types } from "mongoose";

export type TransactionType =
  | "deposit"
  | "withdrawal"
  | "bet"
  | "win"
  | "refund"
  | "bonus";

export type TransactionStatus =
  | "pending"
  | "processing"
  | "success"
  | "failed"
  | "cancelled";

export type PaymentMethod =
  | "mtn_momo"
  | "telecel_cash"
  | "btc"
  | "usdt_trc20"
  | "bank_transfer"
  | "card"
  | "internal";

export interface ITransaction {
  userId: Types.ObjectId;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  currency: string;
  method: PaymentMethod;
  reference: string;
  paystackReference?: string;
  accountNumber?: string;
  accountName?: string;
  cryptoAddress?: string;
  balanceBefore: number;
  balanceAfter: number;
  metadata?: Record<string, unknown>;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["deposit", "withdrawal", "bet", "win", "refund", "bonus"],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "success", "failed", "cancelled"],
      default: "pending",
      index: true,
    },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "GHS" },
    method: {
      type: String,
      enum: [
        "mtn_momo",
        "telecel_cash",
        "btc",
        "usdt_trc20",
        "bank_transfer",
        "card",
        "internal",
      ],
      required: true,
    },
    reference: { type: String, required: true, unique: true, index: true },
    paystackReference: { type: String, index: true, sparse: true },
    accountNumber: { type: String },
    accountName: { type: String },
    cryptoAddress: { type: String },
    balanceBefore: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    metadata: { type: Schema.Types.Mixed },
    failureReason: { type: String },
  },
  { timestamps: true }
);

TransactionSchema.index({ userId: 1, createdAt: -1 });

export const Transaction: Model<ITransaction> =
  (mongoose.models.Transaction as Model<ITransaction>) ||
  mongoose.model<ITransaction>("Transaction", TransactionSchema);
