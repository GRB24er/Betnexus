import mongoose, { Schema, Model, Types } from "mongoose";

export type PayoutMethod = "crypto" | "mtn_momo" | "telecel_cash" | "bank_transfer";
export type PayoutStatus = "pending" | "approved" | "rejected" | "paid";

export interface IPayoutRequest {
  subadminId: Types.ObjectId;
  amount: number;
  currency: string;
  method: PayoutMethod;
  status: PayoutStatus;

  // Crypto
  cryptoAddress?: string;
  cryptoNetwork?: string;

  // Mobile money
  momoNumber?: string;
  momoName?: string;
  momoNetwork?: string;

  // Bank
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  swiftCode?: string;
  routingNumber?: string;

  note?: string;
  rejectionReason?: string;
  processedBy?: Types.ObjectId;
  processedAt?: Date;
  txReference?: string;

  createdAt: Date;
  updatedAt: Date;
}

const PayoutRequestSchema = new Schema<IPayoutRequest>(
  {
    subadminId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, default: "GHS" },
    method: {
      type: String,
      enum: ["crypto", "mtn_momo", "telecel_cash", "bank_transfer"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "paid"],
      default: "pending",
      index: true,
    },

    cryptoAddress: { type: String },
    cryptoNetwork: { type: String },

    momoNumber: { type: String },
    momoName: { type: String },
    momoNetwork: { type: String },

    bankName: { type: String },
    accountName: { type: String },
    accountNumber: { type: String },
    swiftCode: { type: String },
    routingNumber: { type: String },

    note: { type: String },
    rejectionReason: { type: String },
    processedBy: { type: Schema.Types.ObjectId, ref: "User" },
    processedAt: { type: Date },
    txReference: { type: String },
  },
  { timestamps: true }
);

PayoutRequestSchema.index({ status: 1, createdAt: -1 });
PayoutRequestSchema.index({ subadminId: 1, createdAt: -1 });

export const PayoutRequest: Model<IPayoutRequest> =
  (mongoose.models.PayoutRequest as Model<IPayoutRequest>) ||
  mongoose.model<IPayoutRequest>("PayoutRequest", PayoutRequestSchema);
