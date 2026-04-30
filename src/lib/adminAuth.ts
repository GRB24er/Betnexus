import { NextResponse } from "next/server";
import { getCurrentUser } from "./auth";
import type { UserDocument } from "@/models/User";

/**
 * Authorization helpers.
 *
 *  - requireAdmin    → super admin only (full platform control)
 *  - requireSubAdmin → sub-admin only (read-only, scoped to referred users)
 *  - requireStaff    → either of the above (use sparingly; check ownership)
 *
 * Sub-admins must NEVER reach a route that mutates platform state, approves
 * withdrawals, or sees data outside their referred-user pool.
 */

type AuthOk = { user: UserDocument; error?: undefined };
type AuthErr = { user?: undefined; error: NextResponse };

export async function requireAdmin(): Promise<AuthOk | AuthErr> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (user.role !== "admin") {
    return { error: NextResponse.json({ error: "Admin access required" }, { status: 403 }) };
  }
  return { user };
}

export async function requireSubAdmin(): Promise<AuthOk | AuthErr> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (user.role !== "subadmin") {
    return { error: NextResponse.json({ error: "Sub-admin access required" }, { status: 403 }) };
  }
  return { user };
}

export async function requireStaff(): Promise<AuthOk | AuthErr> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (user.role !== "admin" && user.role !== "subadmin") {
    return { error: NextResponse.json({ error: "Staff access required" }, { status: 403 }) };
  }
  return { user };
}
