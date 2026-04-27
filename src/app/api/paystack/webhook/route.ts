import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/mongodb";
import { Transaction } from "@/models/Transaction";
import { User } from "@/models/User";
import { fromMinorUnit } from "@/lib/paystack";
import { logAudit } from "@/lib/audit";
import { sendDepositConfirmation } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 500 }
    );
  }

  const raw = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  const computed = crypto
    .createHmac("sha512", secret)
    .update(raw)
    .digest("hex");

  // Constant-time comparison to prevent timing attacks
  if (
    !signature ||
    !crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature))
  ) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: {
    event: string;
    data: {
      reference: string;
      amount: number;
      status: string;
      customer?: { email?: string };
      metadata?: Record<string, unknown>;
    };
  };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    await connectDB();

    if (event.event === "charge.success") {
      const amount = fromMinorUnit(event.data.amount);

      // Idempotent: the filter `status: { $in: [pending, processing] }` means
      // a re-delivery of the same webhook (Paystack retries on timeout) lands
      // on a tx whose status is already "success" and the update returns null,
      // skipping the credit block. Without this, retries would double-credit.
      const tx = await Transaction.findOneAndUpdate(
        {
          reference: event.data.reference,
          status: { $in: ["pending", "processing"] },
        },
        {
          $set: {
            status: "success",
            paystackReference: event.data.reference,
            "metadata.webhook": event,
          },
        },
        { returnDocument: "after" }
      );

      if (tx) {
        // Atomically credit the user
        const user = await User.findByIdAndUpdate(
          tx.userId,
          { $inc: { balance: amount, totalDeposited: amount } },
          { returnDocument: "after" }
        );

        if (user) {
          // Back-fill balance snapshot
          await Transaction.updateOne(
            { _id: tx._id },
            {
              $set: {
                balanceBefore: user.balance - amount,
                balanceAfter: user.balance,
              },
            }
          );

          void logAudit({
            userId: tx.userId,
            action: "deposit.success",
            resource: "transaction",
            resourceId: tx.reference,
            details: { amount, source: "webhook" },
            req,
          });

          sendDepositConfirmation(
            user.email,
            user.firstName,
            amount,
            user.currency,
            tx.method,
            tx.reference,
            user.balance
          ).catch(() => {});
        }
      }
    }

    if (event.event === "transfer.success") {
      await Transaction.findOneAndUpdate(
        {
          reference: event.data.reference,
          type: "withdrawal",
          status: { $ne: "success" },
        },
        { $set: { status: "success" } }
      );
    }

    if (
      event.event === "transfer.failed" ||
      event.event === "transfer.reversed"
    ) {
      // Idempotent: the filter `status: { $nin: [success, failed] }` means a
      // duplicate "transfer.reversed" webhook lands on an already-failed tx,
      // returns null, and the refund block is skipped. The user is never
      // double-refunded even under aggressive Paystack retries.
      const tx = await Transaction.findOneAndUpdate(
        {
          reference: event.data.reference,
          type: "withdrawal",
          status: { $nin: ["success", "failed"] },
        },
        {
          $set: {
            status: "failed",
            failureReason: event.event,
          },
        },
        { returnDocument: "after" }
      );

      if (tx) {
        // Refund the user atomically
        await User.findByIdAndUpdate(tx.userId, {
          $inc: {
            balance: tx.amount,
            totalWithdrawn: -tx.amount,
          },
        });

        void logAudit({
          userId: tx.userId,
          action: "withdraw.reject",
          resource: "transaction",
          resourceId: tx.reference,
          details: { reason: event.event },
          req,
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[paystack/webhook]", err);
    // Always return 200 to Paystack to prevent retries for non-transient errors
    return NextResponse.json({ received: true });
  }
}
