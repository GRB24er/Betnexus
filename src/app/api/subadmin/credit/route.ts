import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Transaction } from "@/models/Transaction";
import { requireSubadmin } from "@/lib/subadminAuth";
import { generateReference } from "@/lib/reference";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";

const schema = z.object({
  amount: z.number().positive(),
  source: z.enum(["commission", "external"]).default("commission"),
});

/**
 * Sub-admin self-credit endpoint.
 * Funds either come from their accumulated commission (deducted from balance)
 * or are recorded as an external top-up (admin-tracked).
 */
export async function POST(req: NextRequest) {
  const auth = await requireSubadmin();
  if (auth.error) return auth.error;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid", details: parsed.error.issues },
      { status: 400 }
    );
  }

  await connectDB();
  const user = await User.findById(auth.user._id);
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const reference = generateReference("SAC");
  const before = user.balance;
  user.balance = before + parsed.data.amount;
  await user.save();

  await Transaction.create({
    userId: user._id,
    type: parsed.data.source === "commission" ? "bonus" : "deposit",
    status: "success",
    amount: parsed.data.amount,
    currency: user.currency,
    method: "internal",
    reference,
    balanceBefore: before,
    balanceAfter: user.balance,
    metadata: {
      source: parsed.data.source,
      kind: "subadmin_self_credit",
    },
  });

  void logAudit({
    userId: user._id,
    action: "subadmin.self_credit",
    resource: "Transaction",
    resourceId: reference,
    details: { amount: parsed.data.amount, source: parsed.data.source },
    req,
  });

  return NextResponse.json({
    ok: true,
    newBalance: user.balance,
    reference,
  });
}
