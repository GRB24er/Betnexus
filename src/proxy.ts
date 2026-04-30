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

// Routes that require super-admin role
const ADMIN_ROUTES = ["/admin"];

// Routes that require sub-admin role (or super admin, who can preview)
const SUBADMIN_ROUTES = ["/subadmin"];

// Routes that should redirect to /home if already authenticated
const AUTH_ROUTES = ["/login", "/register"];

const SESSION_COOKIE = "betnexus_session";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const secret = process.env.JWT_SECRET;

  // Fail closed: if JWT_SECRET is missing or too weak, refuse to make any
  // authentication decisions instead of silently allowing every request through.
  if (!secret || secret.length < 32) {
    const isProtected =
      [...PROTECTED_ROUTES, ...ADMIN_ROUTES, ...SUBADMIN_ROUTES].some((r) =>
        pathname.startsWith(r)
      );
    if (isProtected) {
      return NextResponse.json(
        { error: "Server misconfigured: JWT_SECRET" },
        { status: 503 }
      );
    }
    return NextResponse.next();
  }

  // Verify JWT at the edge
  let payload: { sub?: string; role?: string } | null = null;
  if (token) {
    try {
      const { payload: p } = await jwtVerify(
        token,
        new TextEncoder().encode(secret)
      );
      payload = p as { sub?: string; role?: string };
    } catch {
      // Invalid or expired token — treat as unauthenticated
      payload = null;
    }
  }

  const isAuthenticated = !!payload?.sub;
  const isAdmin = payload?.role === "admin";
  const isSubAdmin = payload?.role === "subadmin";

  // Redirect authenticated users away from login/register.
  // Sub-admins land on /subadmin, super admins on /admin, users on home.
  if (AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
    if (isAuthenticated) {
      const dest = isAdmin ? "/admin" : isSubAdmin ? "/subadmin" : "/";
      return NextResponse.redirect(new URL(dest, req.url));
    }
    return NextResponse.next();
  }

  // Protect super-admin routes
  if (ADMIN_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (!isAdmin) {
      // A sub-admin who lands on /admin is sent to their own dashboard.
      return NextResponse.redirect(new URL(isSubAdmin ? "/subadmin" : "/", req.url));
    }
    return NextResponse.next();
  }

  // Protect sub-admin routes
  if (SUBADMIN_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (!isSubAdmin && !isAdmin) {
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
