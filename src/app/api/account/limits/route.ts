import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { getCurrentUser, unauthorized, badRequest, serverError } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";

const limitsSchema = z.object({
  depositLimit: z.number().positive().optional(),
  lossLimit: z.number().positive().optional(),
  sessionLimit: z.number().positive().optional(),
});

/**
 * GET /api/account/limits
 * Returns the current user's responsible gaming limits.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  return NextResponse.json({
    depositLimit: user.depositLimit ?? null,
    lossLimit: user.lossLimit ?? null,
    sessionLimit: user.sessionLimit ?? null,
  });
}

/**
 * PATCH /api/account/limits
 * Updates one or more responsible gaming limits for the current user.
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const body = await req.json();
    const parsed = limitsSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid limit values", parsed.error.issues);
    }

    const updates: Record<string, number | undefined> = {};
    if (parsed.data.depositLimit !== undefined)
      updates.depositLimit = parsed.data.depositLimit;
    if (parsed.data.lossLimit !== undefined)
      updates.lossLimit = parsed.data.lossLimit;
    if (parsed.data.sessionLimit !== undefined)
      updates.sessionLimit = parsed.data.sessionLimit;

    if (Object.keys(updates).length === 0) {
      return badRequest("No limits provided to update");
    }

    await connectDB();
    await User.findByIdAndUpdate(user._id, { $set: updates });

    void logAudit({
      userId: user._id,
      action: "user.limits_update",
      resource: "User",
      resourceId: user._id.toString(),
      details: updates,
      req,
    });

    return NextResponse.json({ success: true, updated: updates });
  } catch (err) {
    console.error("[account/limits]", err);
    return serverError("Failed to update limits");
  }
}
