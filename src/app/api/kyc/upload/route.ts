import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { KYCDocument } from "@/models/KYC";
import { User } from "@/models/User";
import {
  getCurrentUser,
  unauthorized,
  badRequest,
  serverError,
} from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * POST /api/kyc/upload
 * Stores KYC documents as base64 data URIs in MongoDB.
 * Safe for Vercel serverless — no filesystem writes.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const docType = formData.get("docType") as string | null;

    if (!file || !docType) {
      return badRequest("File and document type are required");
    }

    const validDocTypes = [
      "national_id",
      "passport",
      "drivers_license",
      "utility_bill",
      "selfie",
    ];
    if (!validDocTypes.includes(docType)) {
      return badRequest("Invalid document type");
    }

    const safeExt = ALLOWED_TYPES[file.type];
    if (!safeExt) {
      return badRequest("Invalid file type. Allowed: JPEG, PNG, WebP, PDF");
    }

    if (file.size > MAX_SIZE) {
      return badRequest("File too large. Maximum 10MB");
    }

    await connectDB();

    const existing = await KYCDocument.findOne({
      userId: user._id,
      docType,
      status: "pending",
    });
    if (existing) {
      return badRequest(
        "You already have a pending document of this type. Please wait for review."
      );
    }

    // Convert file to base64 data URI — safe for serverless environments
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");
    const dataUri = `data:${file.type};base64,${base64}`;
    const fileName = `${user._id}_${docType}_${Date.now()}.${safeExt}`;

    const kycDoc = await KYCDocument.create({
      userId: user._id,
      docType,
      fileName,
      fileUrl: dataUri,
      fileSize: file.size,
      mimeType: file.type,
      status: "pending",
    });

    await User.findByIdAndUpdate(user._id, { kycStatus: "pending" });

    await logAudit({
      userId: user._id,
      action: "user.kyc_submit",
      resource: "KYCDocument",
      resourceId: kycDoc._id.toString(),
      details: { docType, fileName },
      req,
    });

    return NextResponse.json({
      document: {
        id: kycDoc._id,
        docType: kycDoc.docType,
        status: kycDoc.status,
        createdAt: kycDoc.createdAt,
      },
    });
  } catch (err) {
    console.error("[kyc/upload]", err);
    return serverError("KYC upload failed");
  }
}
