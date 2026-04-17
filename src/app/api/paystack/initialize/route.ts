import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { Transaction } from "@/models/Transaction";
import { badRequest, getCurrentUser, serverError, unauthorized } from "@/lib/auth";
import { initializeTransaction, toMinorUnit, type PaystackChannel } from "@/lib/paystack";
import { generateReference } from "@/lib/reference";

export const runtime = "nodejs";

const initSchema = z.object({
  amount: z.number().positive().min(1).max(1_000_000),
  method: z.enum(["mtn_momo", "telecel_cash", "btc", "usdt_trc20", "card"]),
  accountNumber: z.string().optional(),
  cryptoAddress: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const body = await req.json();
    const parsed = initSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid deposit data", parsed.error.issues);
    }

    const { amount, method, accountNumber, cryptoAddress } = parsed.data;

    await connectDB();
    const reference = generateReference("DEP");

    await Transaction.create({
      userId: user._id,
      type: "deposit",
      status: "pending",
      amount,
      currency: user.currency,
      method,
      reference,
      accountNumber,
      cryptoAddress,
      balanceBefore: user.balance,
      balanceAfter: user.balance,
      metadata: { initiatedAt: new Date().toISOString() },
    });

    const channels = resolveChannels(method);

    const paystack = await initializeTransaction({
      email: user.email,
      amount: toMinorUnit(amount),
      reference,
      currency: user.currency,
      channels,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL || ""}/deposit?reference=${reference}`,
      metadata: {
        userId: user._id.toString(),
        method,
        accountNumber,
        cryptoAddress,
      },
    });

    return NextResponse.json({
      reference,
      authorization_url: paystack.data.authorization_url,
      access_code: paystack.data.access_code,
    });
  } catch (err) {
    console.error("[paystack/initialize]", err);
    return serverError(
      err instanceof Error ? err.message : "Payment initialization failed"
    );
  }
}

function resolveChannels(
  method: "mtn_momo" | "telecel_cash" | "btc" | "usdt_trc20" | "card"
): PaystackChannel[] {
  switch (method) {
    case "mtn_momo":
    case "telecel_cash":
      return ["mobile_money"];
    case "card":
      return ["card"];
    case "btc":
    case "usdt_trc20":
      return ["bank_transfer", "card"];
  }
}
