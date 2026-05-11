import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Transaction } from "@/models/Transaction";
import { Bet } from "@/models/Bet";
import { PayoutRequest } from "@/models/PayoutRequest";
import { requireAdmin } from "@/lib/adminAuth";
import { computeNextPayoutDate } from "@/lib/subadminAuth";
import { sendSubadminWelcomeEmail } from "@/lib/email";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  phone: z.string().optional(),
  commissionRate: z.number().min(0).max(100),
  payoutDay: z.number().int().min(1).max(31).default(1),
  password: z.string().min(8).optional(),
});

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  await connectDB();
  const subadmins = await User.find({ role: "subadmin" })
    .select("-password -__v")
    .sort({ createdAt: -1 })
    .lean();

  // Compute stats for each sub-admin
  const enriched = await Promise.all(
    subadmins.map(async (sa) => {
      const referralCode = sa.referralCode;
      const referredUsers = await User.countDocuments({
        referredBy: sa._id.toString(),
      });
      const referredIds = await User.find({
        referredBy: sa._id.toString(),
      })
        .select("_id")
        .lean();
      const referredObjectIds = referredIds.map((u) => u._id);

      const [depAgg, stakeAgg, pendingPayouts] = await Promise.all([
        Transaction.aggregate([
          {
            $match: {
              userId: { $in: referredObjectIds },
              type: "deposit",
              status: "success",
            },
          },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        Bet.aggregate([
          { $match: { userId: { $in: referredObjectIds } } },
          { $group: { _id: null, total: { $sum: "$stake" } } },
        ]).catch(() => []),
        PayoutRequest.countDocuments({
          subadminId: sa._id,
          status: "pending",
        }),
      ]);

      const totalDeposits = depAgg[0]?.total || 0;
      const totalStakes = stakeAgg[0]?.total || 0;
      const computedCommission =
        (totalDeposits + totalStakes) * (sa.commissionRate / 100);
      return {
        ...sa,
        referralCode,
        referredUsers,
        totalDeposits,
        totalStakes,
        computedCommission,
        pendingPayouts,
      };
    })
  );

  return NextResponse.json({ subadmins: enriched });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.issues },
      { status: 400 }
    );
  }

  await connectDB();
  const email = parsed.data.email.toLowerCase();
  const existing = await User.findOne({ email });
  const tempPassword =
    parsed.data.password || crypto.randomBytes(6).toString("base64url");

  let user;
  if (existing) {
    existing.role = "subadmin";
    existing.commissionRate = parsed.data.commissionRate;
    existing.payoutDay = parsed.data.payoutDay;
    existing.nextPayoutDate = computeNextPayoutDate(parsed.data.payoutDay);
    if (parsed.data.password) existing.password = parsed.data.password;
    if (parsed.data.firstName) existing.firstName = parsed.data.firstName;
    if (parsed.data.lastName) existing.lastName = parsed.data.lastName;
    if (parsed.data.phone) existing.phone = parsed.data.phone;
    user = await existing.save();
  } else {
    user = await User.create({
      email,
      password: tempPassword,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      phone: parsed.data.phone,
      role: "subadmin",
      status: "active",
      commissionRate: parsed.data.commissionRate,
      payoutDay: parsed.data.payoutDay,
      nextPayoutDate: computeNextPayoutDate(parsed.data.payoutDay),
    });
  }

  sendSubadminWelcomeEmail(
    user.email,
    user.firstName,
    user.commissionRate,
    user.referralCode,
    parsed.data.password ? "[set by admin]" : tempPassword
  ).catch(() => {});

  void logAudit({
    userId: user._id,
    adminId: auth.user._id,
    action: "admin.subadmin.create",
    resource: "User",
    resourceId: user._id.toString(),
    details: { commissionRate: user.commissionRate },
    req,
  });

  return NextResponse.json({
    user: user.toPublicJSON(),
    referralCode: user.referralCode,
    tempPassword: parsed.data.password ? undefined : tempPassword,
  });
}

const patchSchema = z.object({
  id: z.string().min(1),
  commissionRate: z.number().min(0).max(100).optional(),
  payoutDay: z.number().int().min(1).max(31).optional(),
  resetPassword: z.boolean().optional(),
  revoke: z.boolean().optional(),
  status: z.enum(["active", "suspended", "blocked"]).optional(),
});

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  await connectDB();
  const user = await User.findById(parsed.data.id);
  if (!user || user.role !== "subadmin") {
    return NextResponse.json({ error: "Sub-admin not found" }, { status: 404 });
  }
  if (parsed.data.commissionRate !== undefined) {
    user.commissionRate = parsed.data.commissionRate;
  }
  if (parsed.data.payoutDay !== undefined) {
    user.payoutDay = parsed.data.payoutDay;
    user.nextPayoutDate = computeNextPayoutDate(parsed.data.payoutDay);
  }
  if (parsed.data.status) {
    user.status = parsed.data.status;
  }
  if (parsed.data.revoke) {
    user.role = "user";
  }
  let tempPassword: string | undefined;
  if (parsed.data.resetPassword) {
    tempPassword = crypto.randomBytes(6).toString("base64url");
    user.password = tempPassword;
  }
  await user.save();

  void logAudit({
    userId: user._id,
    adminId: auth.user._id,
    action: "admin.subadmin.update",
    resource: "User",
    resourceId: user._id.toString(),
    details: parsed.data,
    req,
  });

  return NextResponse.json({ user: user.toPublicJSON(), tempPassword });
}
