import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import {
  badRequest,
  serverError,
  setSessionCookie,
  signToken,
} from "@/lib/auth";
import { rateLimit, AUTH_RATE_LIMIT } from "@/lib/rateLimit";
import { logAudit } from "@/lib/audit";
import { getIdentity } from "@/lib/clientIdentity";
import { isBanned } from "@/lib/banlist";

export const runtime = "nodejs";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const limited = await rateLimit(req, AUTH_RATE_LIMIT);
    if (limited) return limited;

    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid credentials");
    }

    const { email, password } = parsed.data;
    const { ip, deviceFingerprint } = getIdentity(req);

    await connectDB();

    // Pre-auth: hard block if IP or device is in the global banlist
    const ban = await isBanned(ip, deviceFingerprint);
    if (ban.banned) {
      return NextResponse.json(
        {
          error:
            ban.type === "device"
              ? "This device has been banned from BetNexus."
              : "This network has been banned from BetNexus.",
        },
        { status: 403 }
      );
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password"
    );
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (user.status === "blocked") {
      return NextResponse.json(
        {
          error:
            user.blockedReason ||
            "Your account has been blocked. Contact support.",
        },
        { status: 403 }
      );
    }
    if (user.status !== "active") {
      return NextResponse.json(
        { error: `Account is ${user.status}` },
        { status: 403 }
      );
    }

    const ok = await user.comparePassword(password);
    if (!ok) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Record IP + device fingerprint
    user.lastLoginAt = new Date();
    user.lastIp = ip;
    if (ip && ip !== "unknown" && !user.knownIps.includes(ip)) {
      user.knownIps = [...user.knownIps, ip].slice(-25);
    }
    if (
      deviceFingerprint &&
      !user.knownDevices.includes(deviceFingerprint)
    ) {
      user.knownDevices = [...user.knownDevices, deviceFingerprint].slice(
        -10
      );
    }
    await user.save();

    const token = signToken({
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    });
    await setSessionCookie(token);

    void logAudit({
      userId: user._id,
      action: "user.login",
      resource: "user",
      resourceId: user._id.toString(),
      details: { ip, deviceFingerprint },
      req,
    });

    return NextResponse.json({ user: user.toPublicJSON() });
  } catch (err) {
    console.error("[login]", err);
    return serverError("Login failed");
  }
}
