/**
 * POST /api/admin/setup
 *
 * Creates or promotes an admin account. Always requires ADMIN_SETUP_SECRET
 * to be configured AND supplied — including for the very first admin — so that
 * a freshly-deployed instance cannot be hijacked by whoever hits the endpoint
 * first. Use scripts/create-admin.mjs for offline bootstrap if preferred.
 *
 * Body: { firstName, lastName, email, password, secret }
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function constantTimeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

export async function POST(req: NextRequest) {
  try {
    const setupSecret = process.env.ADMIN_SETUP_SECRET;
    if (!setupSecret || setupSecret.length < 32) {
      return NextResponse.json(
        {
          error:
            "Admin setup is disabled. Configure ADMIN_SETUP_SECRET (>=32 chars) on the server.",
        },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { firstName, lastName, email, password, secret } = body;

    if (typeof secret !== "string" || !constantTimeEqual(secret, setupSecret)) {
      return NextResponse.json(
        { error: "Invalid setup secret" },
        { status: 403 }
      );
    }

    await connectDB();

    // ── Validate required fields ────────────────────────────────────────────
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: "firstName, lastName, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // ── Check if email is already taken ────────────────────────────────────
    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (existingUser) {
      if (existingUser.role === "admin") {
        return NextResponse.json(
          { error: "This email is already an admin account" },
          { status: 409 }
        );
      }
      // Promote existing user to admin
      existingUser.role = "admin";
      existingUser.status = "active";
      await existingUser.save();

      return NextResponse.json({
        message: `User ${email} has been promoted to admin`,
        action: "promoted",
      });
    }

    // ── Create new admin user ───────────────────────────────────────────────
    // NOTE: Do NOT hash password here — the User model's pre-save hook
    // automatically hashes it. Hashing here would cause double-hashing,
    // making login impossible.
    await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      password: password,
      role: "admin",
      status: "active",
      balance: 0,
      kycStatus: "none",
    });

    return NextResponse.json(
      {
        message: "Admin account created successfully",
        email: email.toLowerCase().trim(),
        action: "created",
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[api/admin/setup]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
