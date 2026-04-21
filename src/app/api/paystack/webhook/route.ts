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

      // Atomic: only process if still pending/processing (prevents double-credit)
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
        { new: true }
      );

      if (tx) {
        // Atomically credit the user
        const user = await User.findByIdAndUpdate(
          tx.userId,
          { $inc: { balance: amount, totalDeposited: amount } },
          { new: true }
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
      // Atomic: only reverse if not already succeeded
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
        { new: true }
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
