/**
 * My Expenses - Personal Expense Tracker
 * Copyright (c) 2026 Sushovan Mukherjee <me@sushovan.in>
 * Defineway Technologies Private Limited
 * Licensed under the MIT License
 */
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { createHash, randomBytes } from "crypto";

export interface AccessTokenPayload extends JWTPayload {
  sub: string; // userId
  sessionId: string;
  role: "owner";
}

const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_TOKEN_EXPIRY = "15m";

function getSecret(): Uint8Array {
  if (!JWT_SECRET) throw new Error("JWT_SECRET environment variable is not set");
  return new TextEncoder().encode(JWT_SECRET);
}

export async function signAccessToken(
  userId: string,
  sessionId: string
): Promise<string> {
  return new SignJWT({ sessionId, role: "owner" } satisfies Omit<
    AccessTokenPayload,
    keyof JWTPayload
  >)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(getSecret());
}

export async function verifyAccessToken(
  token: string
): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify<AccessTokenPayload>(token, getSecret(), {
    algorithms: ["HS256"],
  });
  return payload;
}

export function generateRefreshToken(): string {
  return randomBytes(48).toString("hex");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function getAccessTokenExpiry(): Date {
  return new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
}

export function getRefreshTokenExpiry(): Date {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
}
