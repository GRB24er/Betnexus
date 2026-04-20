import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Referral } from "@/models/Referral";
import { getCurrentUser, unauthorized } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  await connectDB();

  const referrals = await Referral.find({ referrerId: user._id })
    .sort({ createdAt: -1 })
    .populate("referredId", "firstName lastName createdAt")
    .lean();

  const totalEarned = referrals
    .filter((r) => r.referrerPaid)
    .reduce((sum, r) => sum + r.referrerReward, 0);

  const pending = referrals.filter((r) => r.status === "pending").length;
  const qualified = referrals.filter(
    (r) => r.status === "qualified" || r.status === "rewarded"
  ).length;

  return NextResponse.json({
    referralCode: user.referralCode,
    totalReferrals: user.totalReferrals,
    totalEarned,
    pending,
    qualified,
    referrals: referrals.map((r) => ({
      id: r._id,
      status: r.status,
      reward: r.referrerReward,
      paid: r.referrerPaid,
      createdAt: r.createdAt,
    })),
  });
}
