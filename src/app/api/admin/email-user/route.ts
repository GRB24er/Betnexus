import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { requireAdmin } from "@/lib/adminAuth";
import { sendAdminMessageEmail } from "@/lib/email";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";

const schema = z.object({
  userId: z.string().optional(),
  email: z.string().email().optional(),
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(10000),
});

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.issues },
      { status: 400 }
    );
  }

  await connectDB();

  let target = parsed.data.userId
    ? await User.findById(parsed.data.userId)
    : parsed.data.email
      ? await User.findOne({ email: parsed.data.email.toLowerCase() })
      : null;

  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await sendAdminMessageEmail(
    target.email,
    target.firstName,
    parsed.data.subject,
    parsed.data.body
  );

  void logAudit({
    userId: target._id,
    adminId: auth.user._id,
    action: "admin.email_user",
    resource: "User",
    resourceId: target._id.toString(),
    details: { subject: parsed.data.subject },
    req,
  });

  return NextResponse.json({ ok: true, sentTo: target.email });
}
