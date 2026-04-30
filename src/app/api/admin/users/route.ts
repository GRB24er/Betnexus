import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { requireAdmin } from "@/lib/adminAuth";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") || 1));
  const limit = Math.min(
    100,
    Number(req.nextUrl.searchParams.get("limit") || 20)
  );
  const search = req.nextUrl.searchParams.get("search");
  const status = req.nextUrl.searchParams.get("status");
  const kycStatus = req.nextUrl.searchParams.get("kycStatus");
  const role = req.nextUrl.searchParams.get("role");
  const referredBy = req.nextUrl.searchParams.get("referredBy");

  await connectDB();

  const query: Record<string, unknown> = {};
  if (search) {
    query.$or = [
      { email: { $regex: search, $options: "i" } },
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }
  if (status) query.status = status;
  if (kycStatus) query.kycStatus = kycStatus;
  if (role) query.role = role;
  if (referredBy) query.referredBy = referredBy;

  const [users, total] = await Promise.all([
    User.find(query)
      .select("-password -__v")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<
        ({
          _id: string;
          referredBy?: string;
        } & Record<string, unknown>)[]
      >(),
    User.countDocuments(query),
  ]);

  // Resolve referrer details (firstName/lastName/email) so the UI can show
  // "Brought by: <agent>" without an N+1 lookup.
  const referrerIds = Array.from(
    new Set(users.map((u) => u.referredBy).filter((x): x is string => !!x))
  );
  const referrers = referrerIds.length
    ? await User.find({ _id: { $in: referrerIds } })
        .select("_id firstName lastName email role")
        .lean<
          {
            _id: string;
            firstName: string;
            lastName: string;
            email: string;
            role: string;
          }[]
        >()
    : [];
  const referrerMap = new Map(referrers.map((r) => [r._id.toString(), r]));

  const usersWithReferrer = users.map((u) => ({
    ...u,
    referrer: u.referredBy ? referrerMap.get(u.referredBy.toString()) ?? null : null,
  }));

  return NextResponse.json({
    users: usersWithReferrer,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { userId, action, value } = await req.json();
  if (!userId || !action) {
    return NextResponse.json(
      { error: "userId and action required" },
      { status: 400 }
    );
  }

  await connectDB();
  const user = await User.findById(userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Don't let an admin demote themselves and lock everyone out.
  if (
    action === "set_role" &&
    user._id.toString() === auth.user._id.toString() &&
    value !== "admin"
  ) {
    return NextResponse.json(
      { error: "You cannot change your own admin role" },
      { status: 400 }
    );
  }

  switch (action) {
    case "suspend":
      user.status = "suspended";
      break;
    case "activate":
      user.status = "active";
      break;
    case "set_role": {
      const allowed = ["user", "admin", "subadmin"] as const;
      if (!allowed.includes(value)) {
        return NextResponse.json(
          { error: `role must be one of: ${allowed.join(", ")}` },
          { status: 400 }
        );
      }
      user.role = value;
      // A sub-admin's referralCode IS their agent link. Ensure one exists
      // even for users that signed up before auto-generation was added.
      if (value === "subadmin" && !user.referralCode) {
        user.referralCode = `BN${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
      }
      break;
    }
    case "adjust_balance":
      if (typeof value !== "number") {
        return NextResponse.json(
          { error: "Value must be a number" },
          { status: 400 }
        );
      }
      user.balance = Math.max(0, user.balance + value);
      break;
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  await user.save();

  await logAudit({
    userId: user._id,
    action:
      action === "adjust_balance" ? "admin.balance_adjust" : "user.update",
    resource: "User",
    resourceId: user._id.toString(),
    details: { action, value },
    adminId: auth.user._id,
    req,
  });

  return NextResponse.json({ user: user.toPublicJSON() });
}
