import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Notification, NotificationType } from "@/models/Notification";

export async function createNotification({
  userId,
  type,
  title,
  message,
  metadata,
}: {
  userId: Types.ObjectId | string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await connectDB();
    await Notification.create({ userId, type, title, message, metadata });
  } catch (err) {
    // Notifications are non-critical — log but never throw
    console.error("[notifications] Failed to create notification:", err);
  }
}
