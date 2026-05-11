import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Promotion } from "@/models/Promotion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/promotions
 * Public endpoint — returns all active promotions for the promotions page.
 */
export async function GET() {
  try {
    await connectDB();
    const now = new Date();
    const promos = await Promotion.find({
      status: "active",
      startsAt: { $lte: now },
      expiresAt: { $gt: now },
    })
      .sort({ createdAt: -1 })
      .select("-createdBy -__v")
      .lean();

    return NextResponse.json({ promos });
  } catch (err) {
    console.error("[api/promotions]", err);
    // Return empty array on error so the page still renders
    return NextResponse.json({ promos: [] });
  }
}
