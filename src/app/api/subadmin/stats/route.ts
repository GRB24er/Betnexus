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

  // Sub-admins only ever see their share. The platform's slice is
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
    deposits: {
      total: { amount: data.total.deposits, count: data.total.depositsCount },
      today: { amount: data.today.deposits, count: data.today.depositsCount },
      thisWeek: { amount: data.thisWeek.deposits, count: data.thisWeek.depositsCount },
      thisMonth: { amount: data.thisMonth.deposits, count: data.thisMonth.depositsCount },
    },
    currency: auth.user.currency,
  });
}
