import mongoose, { Schema, Model, HydratedDocument } from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export type UserRole = "user" | "admin" | "subadmin";
export type UserStatus = "active" | "suspended" | "self-excluded" | "blocked";

export interface IUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username?: string;
  phone?: string;
  dateOfBirth?: Date;
  country?: string;
  balance: number;
  bonusBalance: number;
  currency: string;
  kycVerified: boolean;
  kycStatus: "none" | "pending" | "approved" | "rejected";
  twoFactorEnabled: boolean;
  role: UserRole;
  status: UserStatus;
  referralCode: string;
  referredBy?: string;
  depositLimit?: number;
  lossLimit?: number;
  sessionLimit?: number;
  totalDeposited: number;
  totalWithdrawn: number;
  totalWagered: number;
  totalWon: number;
  totalReferrals: number;
  lastLoginAt?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;

  // Sub-admin fields
  commissionRate: number;
  commissionFromStakes: number;
  commissionFromDeposits: number;
  commissionPaidOut: number;
  payoutDay: number;
  nextPayoutDate?: Date;
  createdBySubadmin?: mongoose.Types.ObjectId;

  // IP / device tracking and ban controls
  lastIp?: string;
  knownIps: string[];
  knownDevices: string[];
  blockedReason?: string;
  blockedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMethods {
  comparePassword(candidate: string): Promise<boolean>;
  toPublicJSON(): Record<string, unknown>;
}

export type UserDocument = HydratedDocument<IUser, IUserMethods>;
export type UserModel = Model<IUser, Record<string, never>, IUserMethods>;

const UserSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true, select: false },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    username: { type: String, trim: true, sparse: true, index: true },
    phone: { type: String, trim: true, index: true },
    dateOfBirth: { type: Date },
    country: { type: String, default: "Ghana" },
    balance: { type: Number, default: 0, min: 0 },
    bonusBalance: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: "GHS" },
    kycVerified: { type: Boolean, default: false },
    kycStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none",
    },
    twoFactorEnabled: { type: Boolean, default: false },
    role: {
      type: String,
      enum: ["user", "admin", "subadmin"],
      default: "user",
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "suspended", "self-excluded", "blocked"],
      default: "active",
    },
    referralCode: { type: String, unique: true, sparse: true, index: true },
    referredBy: { type: String, index: true },
    depositLimit: { type: Number },
    lossLimit: { type: Number },
    sessionLimit: { type: Number },
    totalDeposited: { type: Number, default: 0 },
    totalWithdrawn: { type: Number, default: 0 },
    totalWagered: { type: Number, default: 0 },
    totalWon: { type: Number, default: 0 },
    totalReferrals: { type: Number, default: 0 },
    lastLoginAt: { type: Date },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },

    // Sub-admin fields
    commissionRate: { type: Number, default: 0, min: 0, max: 100 },
    commissionFromStakes: { type: Number, default: 0 },
    commissionFromDeposits: { type: Number, default: 0 },
    commissionPaidOut: { type: Number, default: 0 },
    payoutDay: { type: Number, default: 1, min: 1, max: 31 },
    nextPayoutDate: { type: Date },
    createdBySubadmin: { type: Schema.Types.ObjectId, ref: "User" },

    // IP / device tracking
    lastIp: { type: String, index: true },
    knownIps: { type: [String], default: [] },
    knownDevices: { type: [String], default: [] },
    blockedReason: { type: String },
    blockedAt: { type: Date },
  },
  { timestamps: true }
);

UserSchema.index({ status: 1, createdAt: -1 });
UserSchema.index({ kycStatus: 1, createdAt: -1 });
UserSchema.index({ role: 1 });

UserSchema.pre("save", async function () {
  if (this.isNew && !this.referralCode) {
    this.referralCode = `BN${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
  }
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.comparePassword = async function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

UserSchema.methods.toPublicJSON = function (): Record<string, unknown> {
  const raw = this.toObject();
  const obj = { ...raw } as Record<string, unknown>;
  delete obj.password;
  delete obj.__v;
  return obj;
};

export const User: UserModel =
  (mongoose.models.User as UserModel) ||
  mongoose.model<IUser, UserModel>("User", UserSchema);
