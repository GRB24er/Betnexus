import mongoose, { Schema, Model, Types } from "mongoose";

export type AuditAction =
  | "user.register"
  | "user.login"
  | "user.logout"
  | "user.update"
  | "user.suspend"
  | "user.kyc_submit"
  | "user.kyc_approve"
  | "user.kyc_reject"
  | "bet.place"
  | "bet.cashout"
  | "bet.settle"
  | "deposit.init"
  | "deposit.success"
  | "deposit.fail"
  | "withdraw.request"
  | "withdraw.approve"
  | "withdraw.reject"
  | "promo.create"
  | "promo.redeem"
  | "admin.balance_adjust"
  | "admin.odds_update"
  | "manualMatch.create"
  | "manualMatch.update"
  | "manualMatch.delete"
  | "manualMatch.settle"
  | "manualMatch.cancel"
  | "referral.signup"
  | "referral.reward";

export interface IAuditLog {
  userId?: Types.ObjectId;
  action: AuditAction;
  resource?: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  adminId?: Types.ObjectId;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    action: { type: String, required: true, index: true },
    resource: { type: String },
    resourceId: { type: String },
    details: { type: Schema.Types.Mixed },
    ip: { type: String },
    userAgent: { type: String },
    adminId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ userId: 1, createdAt: -1 });

export const AuditLog: Model<IAuditLog> =
  (mongoose.models.AuditLog as Model<IAuditLog>) ||
  mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
