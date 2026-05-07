import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Notification } from "@/models/Notification";
import { getCurrentUser, unauthorized } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/notifications
 * Returns the authenticated user's notifications (latest 50).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  await connectDB();

  const notifications = await Notification.find({ userId: user._id })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  const unreadCount = await Notification.countDocuments({
    userId: user._id,
    read: false,
  });

  return NextResponse.json({ notifications, unreadCount });
}
