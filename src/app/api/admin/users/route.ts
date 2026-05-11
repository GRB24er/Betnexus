import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { requireAdmin } from "@/lib/adminAuth";
import { logAudit } from "@/lib/audit";
import type { AuditAction } from "@/models/AuditLog";
import { addBan, removeBan } from "@/lib/banlist";
import { sendAccountBlockedEmail } from "@/lib/email";

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

  await connectDB();

  const query: Record<string, unknown> = {};
  if (search) {
    query.$or = [
      { email: { $regex: search, $options: "i" } },
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { username: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { referralCode: { $regex: search, $options: "i" } },
    ];
  }
  if (status) query.status = status;
  if (kycStatus) query.kycStatus = kycStatus;
  if (role) query.role = role;

  const [users, total] = await Promise.all([
    User.find(query)
      .select("-password -__v")
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

  switch (action) {
    case "suspend":
      user.status = "suspended";
      break;
    case "activate":
      user.status = "active";
      user.blockedReason = undefined;
      user.blockedAt = undefined;
      break;
    case "block": {
      user.status = "blocked";
      user.blockedReason =
        (value && typeof value === "object" && "reason" in value
          ? String((value as { reason?: string }).reason || "")
          : "") || "Blocked by administrator";
      user.blockedAt = new Date();
      sendAccountBlockedEmail(
        user.email,
        user.firstName,
        user.blockedReason
      ).catch(() => {});
      break;
    }
    case "unblock": {
      user.status = "active";
      user.blockedReason = undefined;
      user.blockedAt = undefined;
      break;
    }
    case "ban_ip_device": {
      // Block account, ban every known ip + device fingerprint
      user.status = "blocked";
      user.blockedAt = new Date();
      const reason =
        value && typeof value === "object" && "reason" in value
          ? String((value as { reason?: string }).reason || "")
          : "Banned by administrator";
      user.blockedReason = reason;

      const ips = [user.lastIp, ...(user.knownIps || [])].filter(
        (ip): ip is string => !!ip && ip !== "unknown"
      );
      const devices = user.knownDevices || [];
      await Promise.all([
        ...Array.from(new Set(ips)).map((ip) =>
          addBan({
            type: "ip",
            value: ip,
            userId: user._id.toString(),
            reason,
            bannedBy: auth.user._id.toString(),
          })
        ),
        ...Array.from(new Set(devices)).map((d) =>
          addBan({
            type: "device",
            value: d,
            userId: user._id.toString(),
            reason,
            bannedBy: auth.user._id.toString(),
          })
        ),
      ]);
      sendAccountBlockedEmail(user.email, user.firstName, reason).catch(
        () => {}
      );
      break;
    }
    case "unban_ip_device": {
      const ips = [user.lastIp, ...(user.knownIps || [])].filter(
        (ip): ip is string => !!ip
      );
      const devices = user.knownDevices || [];
      await Promise.all([
        ...ips.map((ip) => removeBan({ type: "ip", value: ip })),
        ...devices.map((d) => removeBan({ type: "device", value: d })),
      ]);
      user.status = "active";
      user.blockedReason = undefined;
      user.blockedAt = undefined;
      break;
    }
    case "set_role": {
      const next =
        value === "admin" ? "admin" : value === "subadmin" ? "subadmin" : "user";
      user.role = next;
      break;
    }
    case "adjust_balance": {
      const amount =
        typeof value === "number"
          ? value
          : value && typeof value === "object" && "amount" in value
            ? Number((value as { amount?: number }).amount)
            : NaN;
      if (!Number.isFinite(amount)) {
        return NextResponse.json(
          { error: "Value must be a number" },
          { status: 400 }
        );
      }
      user.balance = Math.max(0, user.balance + amount);
      break;
    }
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  await user.save();

  await logAudit({
    userId: user._id,
    action: `admin.user.${action}` as AuditAction,
    resource: "User",
    resourceId: user._id.toString(),
    details: { action, value },
    adminId: auth.user._id,
    req,
  });

  return NextResponse.json({ user: user.toPublicJSON() });
}
