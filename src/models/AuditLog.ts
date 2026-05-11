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
  | "user.limits_update"
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
  | "admin.email_user"
  | "admin.payment_config.update"
  | "admin.user.suspend"
  | "admin.user.activate"
  | "admin.user.block"
  | "admin.user.unblock"
  | "admin.user.ban_ip_device"
  | "admin.user.unban_ip_device"
  | "admin.user.set_role"
  | "admin.user.adjust_balance"
  | "admin.game.create"
  | "admin.game.update"
  | "admin.game.publish"
  | "admin.game.unpublish"
  | "admin.game.randomize"
  | "admin.game.finish"
  | "admin.game.cancel"
  | "admin.game.delete"
  | "admin.game.bulk_randomize"
  | "admin.stream.create"
  | "admin.stream.update"
  | "admin.stream.activate"
  | "admin.stream.deactivate"
  | "admin.stream.delete"
  | "admin.subadmin.create"
  | "admin.subadmin.update"
  | "admin.payout.approve"
  | "admin.payout.reject"
  | "admin.payout.mark_paid"
  | "subadmin.payout.request"
  | "subadmin.self_credit"
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
