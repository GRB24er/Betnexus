import crypto from "crypto";
import type { NextRequest } from "next/server";

type AnyReq = NextRequest | Request;

export function getClientIp(req: AnyReq): string {
  const h = req.headers;
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return (
    h.get("x-real-ip") ||
    h.get("cf-connecting-ip") ||
    h.get("x-vercel-forwarded-for") ||
    "unknown"
  );
}

export function getDeviceFingerprint(req: AnyReq): string {
  const h = req.headers;
  const ua = h.get("user-agent") || "";
  const accept = h.get("accept-language") || "";
  const platform = h.get("sec-ch-ua-platform") || "";
  const mobile = h.get("sec-ch-ua-mobile") || "";
  const cookieFp = h.get("x-device-fingerprint") || "";

  const raw = [ua, accept, platform, mobile, cookieFp].join("|");
  return crypto.createHash("sha256").update(raw).digest("hex").slice(0, 32);
}

export function getIdentity(req: AnyReq): {
  ip: string;
  deviceFingerprint: string;
} {
  return {
    ip: getClientIp(req),
    deviceFingerprint: getDeviceFingerprint(req),
  };
}
