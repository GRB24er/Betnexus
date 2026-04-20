import mongoose, { Schema, Model, Types } from "mongoose";

export type KYCDocType =
  | "national_id"
  | "passport"
  | "drivers_license"
  | "utility_bill"
  | "selfie";

export type KYCStatus = "pending" | "approved" | "rejected";

export interface IKYCDocument {
  userId: Types.ObjectId;
  docType: KYCDocType;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  status: KYCStatus;
  reviewNote?: string;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const KYCDocumentSchema = new Schema<IKYCDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    docType: {
      type: String,
      enum: [
        "national_id",
        "passport",
        "drivers_license",
        "utility_bill",
        "selfie",
      ],
      required: true,
    },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    reviewNote: { type: String },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

KYCDocumentSchema.index({ userId: 1, docType: 1 });

export const KYCDocument: Model<IKYCDocument> =
  (mongoose.models.KYCDocument as Model<IKYCDocument>) ||
  mongoose.model<IKYCDocument>("KYCDocument", KYCDocumentSchema);
