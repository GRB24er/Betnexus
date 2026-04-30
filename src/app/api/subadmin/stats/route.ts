import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireSubAdmin } from "@/lib/adminAuth";
import { getSubAdminCommissionedEarnings } from "@/lib/earnings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireSubAdmin();
  if (auth.error) return auth.error;

  await connectDB();
  const data = await getSubAdminCommissionedEarnings(auth.user._id);

  // Sub-admins only ever see their share. The platform's 40% slice is
  // intentionally omitted from the response.
  return NextResponse.json({
    referredUsersCount: data.referredUsersCount,
    commissionPercent: data.commissionPercent,
    referralCode: auth.user.referralCode,
    earnings: {
      total: data.subAdminPayout.total,
      today: data.subAdminPayout.today,
      thisWeek: data.subAdminPayout.thisWeek,
      thisMonth: data.subAdminPayout.thisMonth,
    },
    activity: {
      total: { betsCount: data.total.betsCount, totalStaked: data.total.totalStaked },
      today: { betsCount: data.today.betsCount, totalStaked: data.today.totalStaked },
      thisWeek: { betsCount: data.thisWeek.betsCount, totalStaked: data.thisWeek.totalStaked },
      thisMonth: { betsCount: data.thisMonth.betsCount, totalStaked: data.thisMonth.totalStaked },
    },
    currency: auth.user.currency,
  });
}
