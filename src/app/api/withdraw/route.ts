import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { Transaction } from "@/models/Transaction";
import { User } from "@/models/User";
import { badRequest, getCurrentUser, serverError, unauthorized } from "@/lib/auth";
import { generateReference } from "@/lib/reference";

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

    const fresh = await User.findById(user._id);
    if (!fresh) return unauthorized();

    if (fresh.balance < amount) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }

    const before = fresh.balance;
    fresh.balance = before - amount;
    fresh.totalWithdrawn += amount;
    await fresh.save();

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
      balanceBefore: before,
      balanceAfter: fresh.balance,
      metadata: { requestedAt: new Date().toISOString() },
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
