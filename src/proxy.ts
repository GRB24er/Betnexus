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

// Routes that require admin role (super-admin only)
const ADMIN_ROUTES = ["/admin"];
// Routes that require sub-admin (or admin) role
const SUBADMIN_ROUTES = ["/subadmin"];

// Routes that should redirect to /home if already authenticated
const AUTH_ROUTES = ["/login", "/register"];

const SESSION_COOKIE = "betnexus_session";

export async function proxy(req: NextRequest) {
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
      payload = null;
    }
  }

  const isAuthenticated = !!payload?.sub;
  const role = payload?.role;
  const isAdmin = role === "admin";
  const isSubadmin = role === "subadmin";

  if (AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
    if (isAuthenticated) {
      if (isAdmin) return NextResponse.redirect(new URL("/admin", req.url));
      if (isSubadmin)
        return NextResponse.redirect(new URL("/subadmin", req.url));
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  // Admin routes — admin only. Sub-admins must not see super-admin data.
  if (ADMIN_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (!isAdmin) {
      if (isSubadmin) return NextResponse.redirect(new URL("/subadmin", req.url));
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  // Sub-admin routes — sub-admin OR admin
  if (SUBADMIN_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (!isSubadmin && !isAdmin) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

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
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};
