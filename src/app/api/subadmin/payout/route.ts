import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { PayoutRequest } from "@/models/PayoutRequest";
import { User } from "@/models/User";
import { Transaction } from "@/models/Transaction";
import { Bet } from "@/models/Bet";
import { requireSubadminOrAdmin } from "@/lib/subadminAuth";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createSchema = z.object({
  amount: z.number().positive(),
  method: z.enum(["crypto", "mtn_momo", "telecel_cash", "bank_transfer"]),
  cryptoAddress: z.string().optional(),
  cryptoNetwork: z.string().optional(),
  momoNumber: z.string().optional(),
  momoName: z.string().optional(),
  momoNetwork: z.string().optional(),
  bankName: z.string().optional(),
  accountName: z.string().optional(),
  accountNumber: z.string().optional(),
  swiftCode: z.string().optional(),
  routingNumber: z.string().optional(),
  note: z.string().max(500).optional(),
});

export async function GET() {
  const auth = await requireSubadminOrAdmin();
  if (auth.error) return auth.error;
  await connectDB();
  const list = await PayoutRequest.find({ subadminId: auth.user._id })
    .sort({ createdAt: -1 })
    .lean();
  return NextResponse.json({ payouts: list });
}

export async function POST(req: NextRequest) {
  const auth = await requireSubadminOrAdmin();
  if (auth.error) return auth.error;
  if (auth.user.role !== "subadmin") {
    return NextResponse.json(
      { error: "Only sub-admins can request payouts" },
      { status: 403 }
    );
  }
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.issues },
      { status: 400 }
    );
  }

  await connectDB();

  // Verify the sub-admin has enough commission available
  const referred = await User.find({ referredBy: auth.user._id.toString() })
    .select("_id")
    .lean();
  const ids = referred.map((r) => r._id);
  const [depAgg, stakeAgg] = await Promise.all([
    Transaction.aggregate([
      { $match: { userId: { $in: ids }, type: "deposit", status: "success" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Bet.aggregate([
      { $match: { userId: { $in: ids } } },
      { $group: { _id: null, total: { $sum: "$stake" } } },
    ]).catch(() => []),
  ]);
  const totalCommission =
    ((depAgg[0]?.total || 0) + (stakeAgg[0]?.total || 0)) *
    (auth.user.commissionRate / 100);
  const available = totalCommission - (auth.user.commissionPaidOut || 0);

  // Sum pending payouts already submitted
  const pending = await PayoutRequest.aggregate([
    {
      $match: {
        subadminId: auth.user._id,
        status: { $in: ["pending", "approved"] },
      },
    },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const pendingTotal = pending[0]?.total || 0;
  const remaining = available - pendingTotal;

  if (parsed.data.amount > remaining) {
    return NextResponse.json(
      {
        error: `Insufficient commission. Available: GHS ${remaining.toFixed(2)}`,
      },
      { status: 400 }
    );
  }

  // Method-specific field validation
  if (parsed.data.method === "crypto" && !parsed.data.cryptoAddress) {
    return NextResponse.json(
      { error: "Crypto address is required" },
      { status: 400 }
    );
  }
  if (
    (parsed.data.method === "mtn_momo" ||
      parsed.data.method === "telecel_cash") &&
    !parsed.data.momoNumber
  ) {
    return NextResponse.json(
      { error: "Mobile money number is required" },
      { status: 400 }
    );
  }
  if (
    parsed.data.method === "bank_transfer" &&
    (!parsed.data.bankName ||
      !parsed.data.accountName ||
      !parsed.data.accountNumber)
  ) {
    return NextResponse.json(
      { error: "Bank name, account name and number required" },
      { status: 400 }
    );
  }

  const pr = await PayoutRequest.create({
    subadminId: auth.user._id,
    ...parsed.data,
    currency: auth.user.currency || "GHS",
  });

  void logAudit({
    userId: auth.user._id,
    action: "subadmin.payout.request",
    resource: "PayoutRequest",
    resourceId: pr._id.toString(),
    details: { amount: parsed.data.amount, method: parsed.data.method },
    req,
  });

  return NextResponse.json({ payout: pr });
}
