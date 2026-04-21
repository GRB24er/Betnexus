import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Transaction } from "@/models/Transaction";
import { User } from "@/models/User";
import { requireAdmin } from "@/lib/adminAuth";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* GET — list withdrawal requests with filtering */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") || 1));
  const limit = Math.min(100, Number(req.nextUrl.searchParams.get("limit") || 20));
  const status = req.nextUrl.searchParams.get("status") || "";

  await connectDB();

  const query: Record<string, unknown> = { type: "withdrawal" };
  if (status) query.status = status;

  const [withdrawals, total] = await Promise.all([
    Transaction.find(query)
      .populate("userId", "firstName lastName email phone balance")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Transaction.countDocuments(query),
  ]);

  return NextResponse.json({
    withdrawals,
    total,
    pages: Math.ceil(total / limit),
  });
}

/* PATCH — approve or reject a withdrawal */
export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { transactionId, action, note } = await req.json();

  if (!transactionId || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  await connectDB();

  const tx = await Transaction.findById(transactionId);
  if (!tx || tx.type !== "withdrawal") {
    return NextResponse.json({ error: "Withdrawal not found" }, { status: 404 });
  }
  if (tx.status !== "pending") {
    return NextResponse.json({ error: "Withdrawal already processed" }, { status: 400 });
  }

  if (action === "approve") {
    tx.status = "success";
    tx.metadata = { ...(tx.metadata || {}), adminNote: note || "Approved by admin" };
    await tx.save();

    await logAudit({
      action: "withdraw.approve",
      adminId: auth.user._id,
      userId: tx.userId,
      details: { transactionId: tx._id, amount: tx.amount },
    });
  } else {
    // Reject — refund the user's balance
    tx.status = "failed";
    tx.failureReason = note || "Rejected by admin";
    tx.metadata = { ...(tx.metadata || {}), adminNote: note || "Rejected by admin" };
    await tx.save();

    await User.findByIdAndUpdate(tx.userId, {
      $inc: { balance: tx.amount },
    });

    await logAudit({
      action: "withdraw.reject",
      adminId: auth.user._id,
      userId: tx.userId,
      details: { transactionId: tx._id, amount: tx.amount, refunded: true },
    });
  }

  return NextResponse.json({ message: `Withdrawal ${action}d successfully` });
}
