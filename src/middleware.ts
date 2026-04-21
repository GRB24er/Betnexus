import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Routes that require authentication
const PROTECTED_ROUTES = [
  "/account",
  "/deposit",
  "/withdraw",
  "/bets",
  "/promotions",
];

// Routes that require admin role
const ADMIN_ROUTES = ["/admin"];

// Routes that should redirect to /home if already authenticated
const AUTH_ROUTES = ["/login", "/register"];

const SESSION_COOKIE = "betnexus_session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = req.cookies.get(SESSION_COOKIE)?.value;

  // Verify JWT at the edge
  let payload: { sub?: string; role?: string } | null = null;
  if (token) {
    try {
      const secret = process.env.JWT_SECRET;
      if (secret) {
        const { payload: p } = await jwtVerify(
          token,
          new TextEncoder().encode(secret)
        );
        payload = p as { sub?: string; role?: string };
      }
    } catch {
      // Invalid or expired token — treat as unauthenticated
      payload = null;
    }
  }

  const isAuthenticated = !!payload?.sub;
  const isAdmin = payload?.role === "admin";

  // Redirect authenticated users away from login/register
  if (AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  // Protect admin routes
  if (ADMIN_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  // Protect user routes
  if (PROTECTED_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     * - public folder files
     * - API routes (protected at the handler level)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};
