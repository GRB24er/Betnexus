import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { LiveStream } from "@/models/LiveStream";
import { requireAdmin } from "@/lib/adminAuth";
import { logAudit } from "@/lib/audit";
import type { AuditAction } from "@/models/AuditLog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  sourceType: z.enum(["hls", "youtube", "twitch", "mp4", "iframe"]),
  sourceUrl: z.string().min(1).max(2000),
  thumbnail: z.string().optional(),
  league: z.string().optional(),
  active: z.boolean().optional(),
  premium: z.boolean().optional(),
  accessFee: z.number().min(0).optional(),
});

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  await connectDB();
  const streams = await LiveStream.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json({ streams });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid stream", details: parsed.error.issues },
      { status: 400 }
    );
  }
  await connectDB();
  const stream = await LiveStream.create({
    ...parsed.data,
    createdBy: auth.user._id,
  });
  void logAudit({
    userId: auth.user._id,
    adminId: auth.user._id,
    action: "admin.stream.create",
    resource: "LiveStream",
    resourceId: stream._id.toString(),
    req,
  });
  return NextResponse.json({ stream });
}

const patchSchema = z.object({
  id: z.string().min(1),
  action: z.enum(["update", "activate", "deactivate", "delete"]),
  patch: z.record(z.string(), z.unknown()).optional(),
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
  const stream = await LiveStream.findById(parsed.data.id);
  if (!stream)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  switch (parsed.data.action) {
    case "update": {
      const patch = parsed.data.patch || {};
      for (const [k, v] of Object.entries(patch)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (stream as any)[k] = v;
      }
      break;
    }
    case "activate":
      stream.active = true;
      break;
    case "deactivate":
      stream.active = false;
      break;
    case "delete":
      await LiveStream.deleteOne({ _id: stream._id });
      void logAudit({
        userId: auth.user._id,
        adminId: auth.user._id,
        action: "admin.stream.delete",
        resource: "LiveStream",
        resourceId: stream._id.toString(),
        req,
      });
      return NextResponse.json({ ok: true });
  }
  await stream.save();
  void logAudit({
    userId: auth.user._id,
    adminId: auth.user._id,
    action: `admin.stream.${parsed.data.action}` as AuditAction,
    resource: "LiveStream",
    resourceId: stream._id.toString(),
    req,
  });
  return NextResponse.json({ stream });
}
