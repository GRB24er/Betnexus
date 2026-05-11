import { NextResponse } from "next/server";
import { getCurrentUser } from "./auth";
import type { UserDocument } from "@/models/User";

export async function requireSubadminOrAdmin(): Promise<
  | { user: UserDocument; error?: undefined }
  | { user?: undefined; error: NextResponse }
> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (user.role !== "admin" && user.role !== "subadmin") {
    return {
      error: NextResponse.json(
        { error: "Sub-admin access required" },
        { status: 403 }
      ),
    };
  }
  return { user };
}

export async function requireSubadmin(): Promise<
  | { user: UserDocument; error?: undefined }
  | { user?: undefined; error: NextResponse }
> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (user.role !== "subadmin") {
    return {
      error: NextResponse.json(
        { error: "Sub-admin access required" },
        { status: 403 }
      ),
    };
  }
  return { user };
}

export function computeNextPayoutDate(payoutDay: number, from = new Date()): Date {
  const day = Math.max(1, Math.min(31, payoutDay));
  const next = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), day, 0, 0, 0)
  );
  if (next.getTime() <= from.getTime()) {
    next.setUTCMonth(next.getUTCMonth() + 1);
  }
  return next;
}
