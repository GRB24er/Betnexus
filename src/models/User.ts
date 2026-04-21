import mongoose, { Schema, Model, HydratedDocument } from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export interface IUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: Date;
  country?: string;
  balance: number;
  bonusBalance: number;
  currency: string;
  kycVerified: boolean;
  kycStatus: "none" | "pending" | "approved" | "rejected";
  twoFactorEnabled: boolean;
  role: "user" | "admin";
  status: "active" | "suspended" | "self-excluded";
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
    phone: { type: String, trim: true },
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
    role: { type: String, enum: ["user", "admin"], default: "user" },
    status: {
      type: String,
      enum: ["active", "suspended", "self-excluded"],
      default: "active",
    },
    referralCode: { type: String, unique: true, sparse: true, index: true },
    referredBy: { type: String },
    depositLimit: { type: Number },
    lossLimit: { type: Number },
    sessionLimit: { type: Number },
    totalDeposited: { type: Number, default: 0 },
    totalWithdrawn: { type: Number, default: 0 },
    totalWagered: { type: Number, default: 0 },
    totalWon: { type: Number, default: 0 },
    totalReferrals: { type: Number, default: 0 },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

// Compound indexes for common admin queries
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
