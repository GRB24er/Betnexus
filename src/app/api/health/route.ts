import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { getRedis } from "@/lib/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CheckResult = { ok: boolean; latencyMs?: number; error?: string };

async function checkMongo(): Promise<CheckResult> {
  const start = Date.now();
  try {
    await connectDB();
    if (!mongoose.connection.db) {
      return { ok: false, error: "no db handle" };
    }
    await mongoose.connection.db.admin().ping();
    return { ok: true, latencyMs: Date.now() - start };
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : "mongo ping failed",
    };
  }
}

async function checkRedis(): Promise<CheckResult> {
  if (!process.env.REDIS_URL) {
    return { ok: true, error: "not configured" };
  }
  const start = Date.now();
  try {
    const pong = await getRedis().ping();
    return {
      ok: pong === "PONG",
      latencyMs: Date.now() - start,
    };
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : "redis ping failed",
    };
  }
}

export async function GET() {
  const [mongo, redis] = await Promise.all([checkMongo(), checkRedis()]);
  const ok = mongo.ok && redis.ok;

  return NextResponse.json(
    {
      status: ok ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      checks: { mongo, redis },
    },
    { status: ok ? 200 : 503 }
  );
}
