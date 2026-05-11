import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { sendPasswordResetEmail } from "@/lib/email";

export const runtime = "nodejs";

/**
 * POST /api/auth/forgot-password
 * Generates a secure reset token, saves its hash to the user document,
 * and emails a reset link. Always returns 200 to prevent email enumeration.
 */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ message: "If that email exists, a reset link has been sent." });
    }

    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (user) {
      // Generate a cryptographically secure token
      const rawToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

      // Store hashed token + 1-hour expiry
      user.passwordResetToken = hashedToken;
      user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
      await user.save({ validateBeforeSave: false });

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const resetUrl = `${appUrl}/reset-password?token=${rawToken}`;

      await sendPasswordResetEmail(user.email, user.firstName, resetUrl);
    }

    // Always return the same message to prevent email enumeration
    return NextResponse.json({
      message: "If that email exists, a reset link has been sent.",
    });
  } catch (err) {
    console.error("[forgot-password]", err);
    return NextResponse.json({ message: "If that email exists, a reset link has been sent." });
  }
}
