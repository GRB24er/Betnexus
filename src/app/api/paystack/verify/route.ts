import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Transaction } from "@/models/Transaction";
import { User } from "@/models/User";
import { getCurrentUser, serverError, unauthorized } from "@/lib/auth";
import { fromMinorUnit, verifyTransaction } from "@/lib/paystack";

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

    if (tx.status === "success") {
      return NextResponse.json({ status: "success", transaction: tx });
    }

    const verification = await verifyTransaction(reference);
    const data = verification.data;

    if (data.status === "success") {
      const freshUser = await User.findById(user._id);
      if (!freshUser) return unauthorized();

      const amount = fromMinorUnit(data.amount);
      const before = freshUser.balance;
      freshUser.balance = before + amount;
      freshUser.totalDeposited += amount;
      await freshUser.save();

      tx.status = "success";
      tx.balanceBefore = before;
      tx.balanceAfter = freshUser.balance;
      tx.paystackReference = data.reference;
      tx.metadata = { ...tx.metadata, paystack: data };
      await tx.save();

      return NextResponse.json({
        status: "success",
        transaction: tx,
        balance: freshUser.balance,
      });
    }

    if (data.status === "failed" || data.status === "abandoned") {
      tx.status = "failed";
      tx.failureReason = `Paystack status: ${data.status}`;
      await tx.save();
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
