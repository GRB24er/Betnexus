import { NextRequest } from "next/server";
import { connectDB } from "./mongodb";
import { AuditLog, AuditAction } from "@/models/AuditLog";
import { Types } from "mongoose";

export async function logAudit(params: {
  userId?: string | Types.ObjectId;
  action: AuditAction;
  resource?: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  adminId?: string | Types.ObjectId;
  req?: NextRequest;
}) {
  try {
    await connectDB();
    const ip =
      params.ip ||
      params.req?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      params.req?.headers.get("x-real-ip") ||
      undefined;
    const userAgent =
      params.userAgent || params.req?.headers.get("user-agent") || undefined;

    await AuditLog.create({
      userId: params.userId
        ? new Types.ObjectId(String(params.userId))
        : undefined,
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId,
      details: params.details,
      ip,
      userAgent,
      adminId: params.adminId
        ? new Types.ObjectId(String(params.adminId))
        : undefined,
    });
  } catch (err) {
    console.error("[audit]", err);
  }
}
