import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/mongodb";
import { Transaction } from "@/models/Transaction";
import { User } from "@/models/User";
import { fromMinorUnit } from "@/lib/paystack";

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

  if (!signature || computed !== signature) {
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
      const tx = await Transaction.findOne({ reference: event.data.reference });
      if (!tx || tx.status === "success") {
        return NextResponse.json({ received: true });
      }

      const user = await User.findById(tx.userId);
      if (!user) {
        return NextResponse.json({ received: true });
      }

      const amount = fromMinorUnit(event.data.amount);
      const before = user.balance;
      user.balance = before + amount;
      user.totalDeposited += amount;
      await user.save();

      tx.status = "success";
      tx.balanceBefore = before;
      tx.balanceAfter = user.balance;
      tx.paystackReference = event.data.reference;
      tx.metadata = { ...tx.metadata, webhook: event };
      await tx.save();
    }

    if (event.event === "transfer.success") {
      const tx = await Transaction.findOne({
        reference: event.data.reference,
        type: "withdrawal",
      });
      if (tx && tx.status !== "success") {
        tx.status = "success";
        await tx.save();
      }
    }

    if (event.event === "transfer.failed" || event.event === "transfer.reversed") {
      const tx = await Transaction.findOne({
        reference: event.data.reference,
        type: "withdrawal",
      });
      if (tx && tx.status !== "success") {
        const user = await User.findById(tx.userId);
        if (user) {
          user.balance += tx.amount;
          user.totalWithdrawn = Math.max(0, user.totalWithdrawn - tx.amount);
          await user.save();
        }
        tx.status = "failed";
        tx.failureReason = event.event;
        await tx.save();
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[paystack/webhook]", err);
    return NextResponse.json({ error: "Webhook handler error" }, { status: 500 });
  }
}
