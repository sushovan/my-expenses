/**
 * My Expenses - Personal Expense Tracker
 * Copyright (c) 2026 Sushovan Mukherjee <me@sushovan.in>
 * Defineway Technologies Private Limited
 * Licensed under the MIT License
 */
import { NextResponse, type NextRequest } from "next/server";
import { loginSchema } from "@/lib/validation/schemas";
import { verifyAppCredentials } from "@/lib/auth/password";
import {
  signAccessToken,
  generateRefreshToken,
  hashToken,
  getAccessTokenExpiry,
  getRefreshTokenExpiry,
} from "@/lib/auth/jwt";
import { createSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import {
  checkRateLimit,
  LOGIN_RATE_LIMIT,
} from "@/lib/middleware/rate-limit";

export async function POST(req: NextRequest) {
  // Rate limit login attempts
  const rateLimit = checkRateLimit(req, "login", LOGIN_RATE_LIMIT);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(rateLimit.retryAfterMs / 1000)),
        },
      }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 400 }
    );
  }

  const { username, password } = parsed.data;

  let valid = false;
  try {
    valid = await verifyAppCredentials(username, password);
  } catch (err) {
    console.error("Auth configuration error:", err);
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // Ensure the single app user exists in DB (upsert on first login)
  const appUsername = process.env.APP_USERNAME!;
  const appPasswordHash = process.env.APP_PASSWORD_HASH!;

  const user = await prisma.user.upsert({
    where: { username: appUsername },
    update: {},
    create: { username: appUsername, passwordHash: appPasswordHash },
  });

  // Create session record with hashed tokens
  const accessToken = await signAccessToken(user.id, "temp");
  const refreshToken = generateRefreshToken();

  const session = await prisma.session.create({
    data: {
      userId: user.id,
      accessTokenHash: hashToken(accessToken),
      refreshTokenHash: hashToken(refreshToken),
      accessExpiresAt: getAccessTokenExpiry(),
      refreshExpiresAt: getRefreshTokenExpiry(),
      userAgent: req.headers.get("user-agent") ?? undefined,
      ipAddress:
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined,
    },
  });

  // Re-sign with correct sessionId
  const finalAccessToken = await signAccessToken(user.id, session.id);
  await prisma.session.update({
    where: { id: session.id },
    data: { accessTokenHash: hashToken(finalAccessToken) },
  });

  // Store only session ID in the browser cookie (never the JWT)
  await createSession(session.id, user.id);

  return NextResponse.json({ success: true });
}
