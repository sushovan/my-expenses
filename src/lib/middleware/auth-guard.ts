/**
 * My Expenses - Personal Expense Tracker
 * Copyright (c) 2026 Sushovan Mukherjee <me@sushovan.in>
 * Defineway Technologies Private Limited
 * Licensed under the MIT License
 */
import { NextResponse, type NextRequest } from "next/server";
import { verifyAccessToken, type AccessTokenPayload } from "@/lib/auth/jwt";

/**
 * Validates the Bearer JWT on Internal API routes (/api/v1/*).
 * Only the BFF layer should call these routes — they are not meant for browser access.
 */
export async function validateJwtGuard(
  req: NextRequest
): Promise<
  | { valid: true; payload: AccessTokenPayload }
  | { valid: false; response: NextResponse }
> {
  const authHeader = req.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return {
      valid: false,
      response: NextResponse.json(
        { error: "Missing authorization header" },
        { status: 401 }
      ),
    };
  }

  const token = authHeader.slice(7);

  try {
    const payload = await verifyAccessToken(token);
    return { valid: true, payload };
  } catch {
    return {
      valid: false,
      response: NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      ),
    };
  }
}
