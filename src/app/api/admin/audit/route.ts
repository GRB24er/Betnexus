import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { AuditLog } from "@/models/AuditLog";
import { requireAdmin } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") || 1));
  const limit = Math.min(100, Number(req.nextUrl.searchParams.get("limit") || 50));
  const action = req.nextUrl.searchParams.get("action");
  const userId = req.nextUrl.searchParams.get("userId");

  await connectDB();

  const query: Record<string, unknown> = {};
  if (action) query.action = action;
  if (userId) query.userId = userId;

  const [logs, total] = await Promise.all([
    AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("userId", "firstName lastName email")
      .populate("adminId", "firstName lastName email")
      .lean(),
    AuditLog.countDocuments(query),
  ]);

  return NextResponse.json({ logs, total, page, pages: Math.ceil(total / limit) });
}
