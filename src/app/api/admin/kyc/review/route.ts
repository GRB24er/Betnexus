import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { KYCDocument } from "@/models/KYC";
import { User } from "@/models/User";
import { requireAdmin } from "@/lib/adminAuth";
import { logAudit } from "@/lib/audit";
import { sendKYCStatusEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const status = req.nextUrl.searchParams.get("status") || "pending";
  await connectDB();

  const docs = await KYCDocument.find({ status })
    .sort({ createdAt: 1 })
    .populate("userId", "firstName lastName email phone country")
    .lean();

  return NextResponse.json({ documents: docs, total: docs.length });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { documentId, action, note } = await req.json();
  if (!documentId || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "documentId and action (approve/reject) required" }, { status: 400 });
  }

  await connectDB();

  const doc = await KYCDocument.findById(documentId);
  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  doc.status = action === "approve" ? "approved" : "rejected";
  doc.reviewNote = note || undefined;
  doc.reviewedBy = auth.user._id;
  doc.reviewedAt = new Date();
  await doc.save();

  if (action === "approve") {
    const allDocs = await KYCDocument.find({ userId: doc.userId });
    const allApproved = allDocs.every((d) => d.status === "approved");
    if (allApproved) {
      await User.findByIdAndUpdate(doc.userId, {
        kycVerified: true,
        kycStatus: "approved",
      });
    }
  } else {
    await User.findByIdAndUpdate(doc.userId, { kycStatus: "rejected" });
  }

  const user = await User.findById(doc.userId);
  if (user) {
    sendKYCStatusEmail(
      user.email,
      user.firstName,
      action === "approve" ? "approved" : "rejected",
      note
    ).catch(() => {});
  }

  await logAudit({
    userId: doc.userId,
    action: action === "approve" ? "user.kyc_approve" : "user.kyc_reject",
    resource: "KYCDocument",
    resourceId: doc._id.toString(),
    details: { action, note },
    adminId: auth.user._id,
    req,
  });

  return NextResponse.json({ document: doc });
}
