import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { PaymentConfig, DEFAULT_PROVIDERS } from "@/models/PaymentConfig";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  await connectDB();
  let cfg = await PaymentConfig.findOne({ key: "payment" });
  if (!cfg) {
    cfg = await PaymentConfig.create({
      key: "payment",
      activeProvider: "paystack",
      providers: DEFAULT_PROVIDERS,
    });
  }
  // Strip admin-only fields for public consumption
  const providers = cfg.providers
    .filter((p) => p.enabled)
    .map((p) => ({
      id: p.id,
      label: p.label,
      walletAddress: p.walletAddress,
      walletNetwork: p.walletNetwork,
      bankName: p.bankName,
      accountName: p.accountName,
      accountNumber: p.accountNumber,
      momoNumber: p.momoNumber,
      momoName: p.momoName,
      instructions: p.instructions,
      minAmount: p.minAmount,
      maxAmount: p.maxAmount,
      feePercent: p.feePercent,
    }));
  return NextResponse.json({
    activeProvider: cfg.activeProvider,
    providers,
  });
}
