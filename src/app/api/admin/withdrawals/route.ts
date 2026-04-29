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

  const newStatus = action === "approve" ? "success" : "failed";
  const noteValue = note || (action === "approve" ? "Approved by admin" : "Rejected by admin");

  // Atomically transition the withdrawal so two admins clicking simultaneously
  // (or a webhook arriving mid-action) cannot double-process it.
  const tx = await Transaction.findOneAndUpdate(
    {
      _id: transactionId,
      type: "withdrawal",
      status: { $in: ["pending", "processing"] },
    },
    {
      $set: {
        status: newStatus,
        ...(action === "reject" ? { failureReason: noteValue } : {}),
        "metadata.adminNote": noteValue,
        "metadata.reviewedBy": auth.user._id,
        "metadata.reviewedAt": new Date().toISOString(),
      },
    },
    { new: true }
  );

  if (!tx) {
    const existing = await Transaction.findById(transactionId);
    if (!existing || existing.type !== "withdrawal") {
      return NextResponse.json({ error: "Withdrawal not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: `Withdrawal already ${existing.status}` },
      { status: 400 }
    );
  }

  if (action === "reject") {
    // Refund balance AND revert totalWithdrawn that was incremented at request time.
    await User.findByIdAndUpdate(tx.userId, {
      $inc: { balance: tx.amount, totalWithdrawn: -tx.amount },
    });
  }

  await logAudit({
    action: action === "approve" ? "withdraw.approve" : "withdraw.reject",
    adminId: auth.user._id,
    userId: tx.userId,
    details: {
      transactionId: tx._id,
      amount: tx.amount,
      ...(action === "reject" ? { refunded: true } : {}),
    },
  });

  return NextResponse.json({ message: `Withdrawal ${action}d successfully` });
}
