/**
 * POST /api/admin/setup
 *
 * One-time endpoint to create the very first admin account.
 * This route is ONLY active when:
 *   1. No admin user exists in the database yet, OR
 *   2. The correct ADMIN_SETUP_SECRET is provided in the request body.
 *
 * Once an admin exists, this endpoint returns 403 unless the secret is provided.
 * Add ADMIN_SETUP_SECRET to your .env.local to keep this endpoint usable for
 * future admin creation without the script.
 *
 * Body: { firstName, lastName, email, password, secret? }
 */

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { firstName, lastName, email, password, secret } = body;

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

    // ── Check if an admin already exists ───────────────────────────────────
    const existingAdmin = await User.findOne({ role: "admin" });

    if (existingAdmin) {
      // An admin already exists — require the setup secret to proceed
      const setupSecret = process.env.ADMIN_SETUP_SECRET;
      if (!setupSecret || secret !== setupSecret) {
        return NextResponse.json(
          {
            error:
              "An admin already exists. Provide the correct ADMIN_SETUP_SECRET to create another admin.",
          },
          { status: 403 }
        );
      }
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
