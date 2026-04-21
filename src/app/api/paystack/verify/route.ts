import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Transaction } from "@/models/Transaction";
import { User } from "@/models/User";
import { getCurrentUser, serverError, unauthorized } from "@/lib/auth";
import { fromMinorUnit, verifyTransaction } from "@/lib/paystack";
import { logAudit } from "@/lib/audit";
import { sendDepositConfirmation } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const reference = req.nextUrl.searchParams.get("reference");
    if (!reference) {
      return NextResponse.json(
        { error: "reference is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const tx = await Transaction.findOne({ reference, userId: user._id });
    if (!tx) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Already settled — return cached result (idempotent)
    if (tx.status === "success") {
      return NextResponse.json({ status: "success", transaction: tx });
    }

    const verification = await verifyTransaction(reference);
    const data = verification.data;

    if (data.status === "success") {
      const amount = fromMinorUnit(data.amount);

      // Atomic update: only credit if still pending/processing to prevent double-credit
      const updated = await Transaction.findOneAndUpdate(
        { reference, userId: user._id, status: { $in: ["pending", "processing"] } },
        {
          $set: {
            status: "success",
            paystackReference: data.reference,
            "metadata.paystack": data,
          },
        },
        { new: true }
      );

      if (!updated) {
        // Already processed by webhook or concurrent request
        const latest = await Transaction.findOne({ reference });
        return NextResponse.json({
          status: latest?.status ?? "success",
          transaction: latest,
        });
      }

      // Credit user balance atomically
      const freshUser = await User.findByIdAndUpdate(
        user._id,
        {
          $inc: { balance: amount, totalDeposited: amount },
        },
        { new: true }
      );

      if (!freshUser) return unauthorized();

      // Back-fill balance snapshot on the transaction
      await Transaction.updateOne(
        { _id: updated._id },
        {
          $set: {
            balanceBefore: freshUser.balance - amount,
            balanceAfter: freshUser.balance,
          },
        }
      );

      void logAudit({
        userId: user._id,
        action: "deposit.success",
        resource: "transaction",
        resourceId: reference,
        details: { amount, method: tx.method },
        req,
      });

      // Fire-and-forget email
      sendDepositConfirmation(
        freshUser.email,
        freshUser.firstName,
        amount,
        freshUser.currency,
        tx.method,
        reference,
        freshUser.balance
      ).catch(() => {});

      return NextResponse.json({
        status: "success",
        transaction: updated,
        balance: freshUser.balance,
      });
    }

    if (data.status === "failed" || data.status === "abandoned") {
      tx.status = "failed";
      tx.failureReason = `Paystack status: ${data.status}`;
      await tx.save();

      void logAudit({
        userId: user._id,
        action: "deposit.fail",
        resource: "transaction",
        resourceId: reference,
        details: { paystackStatus: data.status },
        req,
      });

      return NextResponse.json({ status: "failed", transaction: tx });
    }

    return NextResponse.json({ status: data.status, transaction: tx });
  } catch (err) {
    console.error("[paystack/verify]", err);
    return serverError(
      err instanceof Error ? err.message : "Verification failed"
    );
  }
}
