import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import {
  PaymentConfig,
  DEFAULT_PROVIDERS,
  type DepositProviderId,
  type IDepositProvider,
} from "@/models/PaymentConfig";
import { requireAdmin } from "@/lib/adminAuth";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function ensureConfig() {
  await connectDB();
  let cfg = await PaymentConfig.findOne({ key: "payment" });
  if (!cfg) {
    cfg = await PaymentConfig.create({
      key: "payment",
      activeProvider: "paystack",
      providers: DEFAULT_PROVIDERS,
    });
  }
  return cfg;
}

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const cfg = await ensureConfig();
  return NextResponse.json({ config: cfg });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const body = await req.json();
  const cfg = await ensureConfig();

  if (body.activeProvider) {
    cfg.activeProvider = body.activeProvider as DepositProviderId;
  }

  if (Array.isArray(body.providers)) {
    cfg.providers = body.providers as IDepositProvider[];
  } else if (body.updateProvider) {
    const { id, patch } = body.updateProvider as {
      id: DepositProviderId;
      patch: Partial<IDepositProvider>;
    };
    const idx = cfg.providers.findIndex((p) => p.id === id);
    if (idx >= 0) {
      cfg.providers[idx] = { ...cfg.providers[idx], ...patch };
    } else {
      cfg.providers.push({ id, label: id, enabled: false, ...patch });
    }
  }

  cfg.updatedBy = auth.user._id;
  await cfg.save();

  void logAudit({
    userId: auth.user._id,
    adminId: auth.user._id,
    action: "admin.payment_config.update",
    resource: "PaymentConfig",
    details: body,
    req,
  });

  return NextResponse.json({ config: cfg });
}
