import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { connectDB } from "@/lib/mongodb";
import { KYCDocument } from "@/models/KYC";
import { User } from "@/models/User";
import { getCurrentUser, unauthorized, badRequest, serverError } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "kyc");

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

    const validTypes = [
      "national_id",
      "passport",
      "drivers_license",
      "utility_bill",
      "selfie",
    ];
    if (!validTypes.includes(docType)) {
      return badRequest("Invalid document type");
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
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

    await mkdir(UPLOAD_DIR, { recursive: true });

    const ext = file.name.split(".").pop() || "bin";
    const fileName = `${user._id}_${docType}_${Date.now()}.${ext}`;
    const filePath = path.join(UPLOAD_DIR, fileName);

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const kycDoc = await KYCDocument.create({
      userId: user._id,
      docType,
      fileName,
      fileUrl: `/uploads/kyc/${fileName}`,
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
