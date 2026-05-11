import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { Transaction } from "@/models/Transaction";
import { PaymentConfig, DEFAULT_PROVIDERS } from "@/models/PaymentConfig";
import {
  badRequest,
  getCurrentUser,
  serverError,
  unauthorized,
} from "@/lib/auth";
import { generateReference } from "@/lib/reference";
import { rateLimit, PAYMENT_RATE_LIMIT } from "@/lib/rateLimit";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";

const initSchema = z.object({
  amount: z.number().positive(),
  providerId: z.string().min(1),
  payerNumber: z.string().optional(),
  payerAccount: z.string().optional(),
  payerWallet: z.string().optional(),
  note: z.string().optional(),
});

const PROVIDER_TO_METHOD: Record<string, string> = {
  korapay: "card",
  paystack: "card",
  mtn_momo: "mtn_momo",
  telecel_cash: "telecel_cash",
  btc: "btc",
  usdt_trc20: "usdt_trc20",
  eth: "btc",
  bank_transfer: "bank_transfer",
};

export async function POST(req: NextRequest) {
  try {
    const limited = await rateLimit(req, PAYMENT_RATE_LIMIT);
    if (limited) return limited;

    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const body = await req.json();
    const parsed = initSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid deposit data", parsed.error.issues);
    }

    const { amount, providerId, payerNumber, payerAccount, payerWallet, note } =
      parsed.data;

    await connectDB();

    let cfg = await PaymentConfig.findOne({ key: "payment" });
    if (!cfg) {
      cfg = await PaymentConfig.create({
        key: "payment",
        activeProvider: "paystack",
        providers: DEFAULT_PROVIDERS,
      });
    }

    const provider = cfg.providers.find((p) => p.id === providerId);
    if (!provider || !provider.enabled) {
      return badRequest("Selected provider is not available");
    }

    if (provider.minAmount && amount < provider.minAmount) {
      return badRequest(
        `Minimum deposit is ${provider.minAmount} for ${provider.label}`
      );
    }
    if (provider.maxAmount && amount > provider.maxAmount) {
      return badRequest(
        `Maximum deposit is ${provider.maxAmount} for ${provider.label}`
      );
    }

    const reference = generateReference("DEP");
    const method = (PROVIDER_TO_METHOD[providerId] ?? "internal") as
      | "mtn_momo"
      | "telecel_cash"
      | "btc"
      | "usdt_trc20"
      | "bank_transfer"
      | "card"
      | "internal";

    await Transaction.create({
      userId: user._id,
      type: "deposit",
      status: "pending",
      amount,
      currency: user.currency,
      method,
      reference,
      accountNumber: payerNumber || payerAccount,
      cryptoAddress: payerWallet,
      balanceBefore: user.balance,
      balanceAfter: user.balance,
      metadata: {
        providerId,
        providerLabel: provider.label,
        depositAddress: provider.walletAddress,
        bankName: provider.bankName,
        accountName: provider.accountName,
        accountNumber: provider.accountNumber,
        momoNumber: provider.momoNumber,
        momoName: provider.momoName,
        note,
      },
    });

    void logAudit({
      userId: user._id,
      action: "deposit.init",
      resource: "transaction",
      resourceId: reference,
      details: { amount, providerId },
      req,
    });

    return NextResponse.json({
      reference,
      providerId,
      providerLabel: provider.label,
      walletAddress: provider.walletAddress,
      walletNetwork: provider.walletNetwork,
      bankName: provider.bankName,
      accountName: provider.accountName,
      accountNumber: provider.accountNumber,
      momoNumber: provider.momoNumber,
      momoName: provider.momoName,
      instructions: provider.instructions,
      manualVerification: true,
    });
  } catch (err) {
    console.error("[deposit/initialize]", err);
    return serverError(
      err instanceof Error ? err.message : "Deposit initialization failed"
    );
  }
}
