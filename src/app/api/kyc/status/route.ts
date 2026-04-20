import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { KYCDocument } from "@/models/KYC";
import { getCurrentUser, unauthorized } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  await connectDB();

  const docs = await KYCDocument.find({ userId: user._id })
    .sort({ createdAt: -1 })
    .select("docType status reviewNote createdAt reviewedAt")
    .lean();

  return NextResponse.json({
    kycStatus: user.kycStatus,
    kycVerified: user.kycVerified,
    documents: docs,
  });
}
