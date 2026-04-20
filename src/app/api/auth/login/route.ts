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

    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password"
    );
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
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

    user.lastLoginAt = new Date();
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
      req,
    });

    return NextResponse.json({ user: user.toPublicJSON() });
  } catch (err) {
    console.error("[login]", err);
    return serverError("Login failed");
  }
}
