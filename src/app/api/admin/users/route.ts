import { NextRequest, NextResponse } from "next/server";
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
  const limit = Math.min(100, Number(req.nextUrl.searchParams.get("limit") || 20));
  const search = req.nextUrl.searchParams.get("search");
  const status = req.nextUrl.searchParams.get("status");
  const kycStatus = req.nextUrl.searchParams.get("kycStatus");

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

  const [users, total] = await Promise.all([
    User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    User.countDocuments(query),
  ]);

  return NextResponse.json({
    users,
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
    return NextResponse.json({ error: "userId and action required" }, { status: 400 });
  }

  await connectDB();
  const user = await User.findById(userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  switch (action) {
    case "suspend":
      user.status = "suspended";
      break;
    case "activate":
      user.status = "active";
      break;
    case "set_role":
      user.role = value === "admin" ? "admin" : "user";
      break;
    case "adjust_balance":
      if (typeof value !== "number") {
        return NextResponse.json({ error: "Value must be a number" }, { status: 400 });
      }
      user.balance = Math.max(0, user.balance + value);
      break;
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  await user.save();

  await logAudit({
    userId: user._id,
    action: action === "adjust_balance" ? "admin.balance_adjust" : "user.update",
    resource: "User",
    resourceId: user._id.toString(),
    details: { action, value },
    adminId: auth.user._id,
    req,
  });

  return NextResponse.json({ user: user.toPublicJSON() });
}
