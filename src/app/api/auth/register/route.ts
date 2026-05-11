import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Referral } from "@/models/Referral";
import {
  badRequest,
  serverError,
  setSessionCookie,
  signToken,
} from "@/lib/auth";
import { rateLimit, AUTH_RATE_LIMIT } from "@/lib/rateLimit";
import { logAudit } from "@/lib/audit";
import { sendWelcomeEmail } from "@/lib/email";
import { getIdentity } from "@/lib/clientIdentity";
import { isBanned } from "@/lib/banlist";

export const runtime = "nodejs";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  phone: z.string().min(7).max(20).optional(),
  dateOfBirth: z.string().optional(),
  country: z.string().optional(),
  referralCode: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const limited = await rateLimit(req, AUTH_RATE_LIMIT);
    if (limited) return limited;

    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid registration data", parsed.error.issues);
    }

    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      dateOfBirth,
      country,
      referralCode,
    } = parsed.data;

    if (dateOfBirth) {
      const dob = new Date(dateOfBirth);
      if (isNaN(dob.getTime())) {
        return badRequest("Invalid date of birth");
      }
      const age =
        (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      if (age < 18) {
        return badRequest("You must be 18 or older to register");
      }
    }

    await connectDB();

    const { ip, deviceFingerprint } = getIdentity(req);
    const ban = await isBanned(ip, deviceFingerprint);
    if (ban.banned) {
      return NextResponse.json(
        {
          error:
            ban.type === "device"
              ? "This device is banned and cannot create new accounts."
              : "This network is banned and cannot create new accounts.",
        },
        { status: 403 }
      );
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return badRequest("An account with this email already exists");
    }

    let referrerId: string | undefined;
    if (referralCode) {
      const referrer = await User.findOne({
        referralCode: referralCode.toUpperCase(),
      });
      if (referrer) {
        referrerId = referrer._id.toString();
      }
    }

    let user;
    try {
      user = await User.create({
        email: email.toLowerCase(),
        password,
        firstName,
        lastName,
        phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        country: country || "Ghana",
        lastLoginAt: new Date(),
        referredBy: referrerId,
        lastIp: ip,
        knownIps: ip && ip !== "unknown" ? [ip] : [],
        knownDevices: deviceFingerprint ? [deviceFingerprint] : [],
      });
    } catch (err: unknown) {
      // Handle MongoDB duplicate key error (race condition on email uniqueness)
      if (
        err &&
        typeof err === "object" &&
        "code" in err &&
        (err as { code: number }).code === 11000
      ) {
        return badRequest("An account with this email already exists");
      }
      throw err;
    }

    // Create referral record if applicable
    if (referrerId) {
      await Referral.create({
        referrerId,
        referredId: user._id,
        referralCode: referralCode!.toUpperCase(),
        status: "pending",
      }).catch(() => {}); // Non-fatal if referral creation fails
    }

    const token = signToken({
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    });
    await setSessionCookie(token);

    void logAudit({
      userId: user._id,
      action: "user.register",
      resource: "user",
      resourceId: user._id.toString(),
      details: { referralCode: referralCode || undefined },
      req,
    });

    // Fire-and-forget welcome email
    sendWelcomeEmail(user.email, user.firstName, user.referralCode).catch(
      () => {}
    );

    return NextResponse.json({
      user: user.toPublicJSON(),
    });
  } catch (err) {
    console.error("[register]", err);
    return serverError("Registration failed");
  }
}
