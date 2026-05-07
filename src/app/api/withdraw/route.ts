import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { Transaction } from "@/models/Transaction";
import { User } from "@/models/User";
import { badRequest, getCurrentUser, serverError, unauthorized } from "@/lib/auth";
import { generateReference } from "@/lib/reference";
import { rateLimit, PAYMENT_RATE_LIMIT } from "@/lib/rateLimit";
import { logAudit } from "@/lib/audit";
import { sendWithdrawalRequest } from "@/lib/email";
import { createNotification } from "@/lib/notifications";

export const runtime = "nodejs";

const withdrawSchema = z.object({
  amount: z.number().positive().min(10).max(500_000),
  method: z.enum(["mtn_momo", "telecel_cash", "btc", "usdt_trc20", "bank_transfer"]),
  accountNumber: z.string().optional(),
  accountName: z.string().optional(),
  cryptoAddress: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const limited = await rateLimit(req, PAYMENT_RATE_LIMIT);
    if (limited) return limited;

    const user = await getCurrentUser();
    if (!user) return unauthorized();

    if (!user.kycVerified) {
      return NextResponse.json(
        { error: "KYC verification is required before withdrawals" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = withdrawSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid withdrawal data", parsed.error.issues);
    }

    const { amount, method, accountNumber, accountName, cryptoAddress } =
      parsed.data;

    if (method === "mtn_momo" || method === "telecel_cash") {
      if (!accountNumber) {
        return badRequest("Account number is required for mobile money");
      }
    }
    if (method === "btc" || method === "usdt_trc20") {
      if (!cryptoAddress) {
        return badRequest("Crypto address is required");
      }
    }

    await connectDB();

    // Atomic balance deduction: only deduct if sufficient funds exist
    const fresh = await User.findOneAndUpdate(
      {
        _id: user._id,
        balance: { $gte: amount },
        kycVerified: true,
        status: "active",
      },
      { $inc: { balance: -amount, totalWithdrawn: amount } },
      { new: true }
    );

    if (!fresh) {
      const check = await User.findById(user._id);
      if (!check) return unauthorized();
      if (!check.kycVerified) {
        return NextResponse.json(
          { error: "KYC verification is required before withdrawals" },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }

    const balanceBefore = fresh.balance + amount;
    const reference = generateReference("WTH");

    const tx = await Transaction.create({
      userId: fresh._id,
      type: "withdrawal",
      status: "processing",
      amount,
      currency: fresh.currency,
      method,
      reference,
      accountNumber,
      accountName,
      cryptoAddress,
      balanceBefore,
      balanceAfter: fresh.balance,
      metadata: { requestedAt: new Date().toISOString() },
    });

    void logAudit({
      userId: fresh._id,
      action: "withdraw.request",
      resource: "transaction",
      resourceId: tx.reference,
      details: { amount, method },
      req,
    });

    sendWithdrawalRequest(
      fresh.email,
      fresh.firstName,
      amount,
      fresh.currency,
      method,
      reference
    ).catch(() => {});
    void createNotification({
      userId: fresh._id,
      type: "withdrawal",
      title: "Withdrawal Request Submitted",
      message: `Your withdrawal of ${fresh.currency} ${amount.toFixed(2)} via ${method.replace(/_/g, " ")} is being processed. Reference: ${reference}.`,
      metadata: { amount, method, reference },
    });

    return NextResponse.json({
      reference: tx.reference,
      status: tx.status,
      balance: fresh.balance,
    });
  } catch (err) {
    console.error("[withdraw]", err);
    return serverError("Withdrawal failed");
  }
}
