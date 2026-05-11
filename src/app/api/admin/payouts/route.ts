import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { PayoutRequest } from "@/models/PayoutRequest";
import { User } from "@/models/User";
import { requireAdmin } from "@/lib/adminAuth";
import { logAudit } from "@/lib/audit";
import type { AuditAction } from "@/models/AuditLog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  await connectDB();
  const status = req.nextUrl.searchParams.get("status");
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  const payouts = await PayoutRequest.find(filter)
    .populate("subadminId", "firstName lastName email commissionRate referralCode")
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();
  return NextResponse.json({ payouts });
}

const patchSchema = z.object({
  id: z.string().min(1),
  action: z.enum(["approve", "reject", "mark_paid"]),
  rejectionReason: z.string().optional(),
  txReference: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  await connectDB();
  const pr = await PayoutRequest.findById(parsed.data.id);
  if (!pr) return NextResponse.json({ error: "Not found" }, { status: 404 });

  switch (parsed.data.action) {
    case "approve":
      pr.status = "approved";
      pr.processedBy = auth.user._id;
      pr.processedAt = new Date();
      break;
    case "reject":
      pr.status = "rejected";
      pr.rejectionReason = parsed.data.rejectionReason;
      pr.processedBy = auth.user._id;
      pr.processedAt = new Date();
      break;
    case "mark_paid": {
      pr.status = "paid";
      pr.processedBy = auth.user._id;
      pr.processedAt = new Date();
      pr.txReference = parsed.data.txReference;
      const sa = await User.findById(pr.subadminId);
      if (sa) {
        sa.commissionPaidOut = (sa.commissionPaidOut || 0) + pr.amount;
        await sa.save();
      }
      break;
    }
  }
  await pr.save();

  void logAudit({
    userId: pr.subadminId,
    adminId: auth.user._id,
    action: `admin.payout.${parsed.data.action}` as AuditAction,
    resource: "PayoutRequest",
    resourceId: pr._id.toString(),
    req,
  });

  return NextResponse.json({ payout: pr });
}
