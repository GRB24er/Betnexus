import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Notification } from "@/models/Notification";
import { getCurrentUser, unauthorized } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * PATCH /api/notifications/read-all
 * Marks all unread notifications for the current user as read.
 */
export async function PATCH() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  await connectDB();

  await Notification.updateMany(
    { userId: user._id, read: false },
    { $set: { read: true } }
  );

  return NextResponse.json({ success: true });
}
