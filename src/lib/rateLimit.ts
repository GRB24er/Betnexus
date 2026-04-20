import { NextRequest, NextResponse } from "next/server";
import { cacheIncr } from "./redis";

type RateLimitConfig = {
  windowSeconds: number;
  maxRequests: number;
  keyPrefix?: string;
};

function getClientIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function rateLimit(
  req: NextRequest,
  config: RateLimitConfig = { windowSeconds: 60, maxRequests: 30 }
): Promise<NextResponse | null> {
  const ip = getClientIP(req);
  const key = `rl:${config.keyPrefix || "api"}:${ip}`;

  try {
    const count = await cacheIncr(key, config.windowSeconds);
    if (count > config.maxRequests) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(config.windowSeconds),
            "X-RateLimit-Limit": String(config.maxRequests),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }
  } catch {
    // If Redis is down, allow the request through
  }
  return null;
}

export const AUTH_RATE_LIMIT: RateLimitConfig = {
  windowSeconds: 900,
  maxRequests: 10,
  keyPrefix: "auth",
};

export const PAYMENT_RATE_LIMIT: RateLimitConfig = {
  windowSeconds: 60,
  maxRequests: 5,
  keyPrefix: "payment",
};

export const BET_RATE_LIMIT: RateLimitConfig = {
  windowSeconds: 10,
  maxRequests: 5,
  keyPrefix: "bet",
};
