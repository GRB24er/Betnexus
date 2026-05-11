import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Notification } from "@/models/Notification";
import { getCurrentUser, unauthorized } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * PATCH /api/notifications/[id]/read
 * Marks a single notification as read (only if it belongs to the current user).
 */
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const { id } = await params;
  await connectDB();

  await Notification.findOneAndUpdate(
    { _id: id, userId: user._id },
    { $set: { read: true } }
  );

  return NextResponse.json({ success: true });
}
