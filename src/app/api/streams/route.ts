import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { LiveStream } from "@/models/LiveStream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  await connectDB();
  const streams = await LiveStream.find({ active: true })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  return NextResponse.json({ streams });
}
