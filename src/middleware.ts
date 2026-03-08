/**
 * My Expenses - Personal Expense Tracker
 * Copyright (c) 2026 Sushovan Mukherjee <me@sushovan.in>
 * Defineway Technologies Private Limited
 * Licensed under the MIT License
 */
import { NextResponse, type NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import type { SessionData } from "@/lib/auth/session";

const SESSION_COOKIE_NAME = "expenses_session";

function getSessionOptions() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return {
    password: secret,
    cookieName: SESSION_COOKIE_NAME,
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "strict" as const,
    },
  };
}

const PUBLIC_PATHS = new Set(["/login", "/api/bff/auth/login"]);

const INTERNAL_API_PREFIXES = ["/api/v1/"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Block direct browser access to internal API — must come from BFF (via server-to-server)
  // In production you'd use a private network; here we ensure it's never exposed in the browser
  if (INTERNAL_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    const origin = req.headers.get("origin");

    // If request comes with an Origin header (i.e., from a browser), block it
    if (origin) {
      return NextResponse.json(
        { error: "This endpoint is not publicly accessible" },
        { status: 403 }
      );
    }

    // Allow server-to-server calls (no Origin header)
    return NextResponse.next();
  }

  // Allow public paths without auth
  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  // Allow static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check session for all other routes
  const res = NextResponse.next();
  let session: SessionData & { isLoggedIn: boolean };

  try {
    session = await getIronSession<SessionData>(req, res, getSessionOptions());
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (!session.isLoggedIn) {
    // API routes return 401; page routes redirect to login
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
