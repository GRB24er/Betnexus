import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/adminAuth";
import { logAudit } from "@/lib/audit";
import Settings from "@/models/Settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  await connectDB();

  // Get or create default settings
  let settings = await Settings.findOne({ key: "platform" });
  if (!settings) {
    settings = await Settings.create({ key: "platform" });
  }

  return NextResponse.json({ settings });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  await connectDB();
  const body = await req.json();

  // Whitelist allowed fields
  const allowed = [
    "platformName", "currency", "minDeposit", "maxDeposit",
    "minBet", "maxBet", "minWithdrawal", "maxWithdrawal",
    "maxPayout", "maxAccaLegs", "houseEdge", "withdrawalProcessingDays",
    "kycRequired", "kycThreshold", "referralBonus", "welcomeBonus",
    "maintenanceMode",
  ];

  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) {
      updates[key] = body[key];
    }
  }

  const settings = await Settings.findOneAndUpdate(
    { key: "platform" },
    { $set: updates },
    { new: true, upsert: true }
  );

  await logAudit({
    action: "admin.balance_adjust",
    userId: auth.user._id,
    resource: "settings",
    resourceId: settings._id,
    details: { changes: updates },
    ip: req.headers.get("x-forwarded-for") || "unknown",
  });

  return NextResponse.json({ settings, message: "Settings saved successfully" });
}
