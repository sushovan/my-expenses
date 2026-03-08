/**
 * My Expenses - Personal Expense Tracker
 * Copyright (c) 2026 Sushovan Mukherjee <me@sushovan.in>
 * Defineway Technologies Private Limited
 * Licensed under the MIT License
 */
import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import { resolve } from "path";
import { getSession } from "@/lib/auth/session";
import { verifyPassword, hashPassword } from "@/lib/auth/password";
import { validateCsrf } from "@/lib/middleware/csrf";
import { checkRateLimit, LOGIN_RATE_LIMIT } from "@/lib/middleware/rate-limit";
import { z } from "zod";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/**
 * Updates APP_PASSWORD_HASH in .env.local so the new password persists across
 * server restarts. Also updates process.env immediately so no restart is needed.
 */
async function persistNewPasswordHash(newHash: string): Promise<void> {
  const envPath = resolve(process.cwd(), ".env.local");
  try {
    const raw = await readFile(envPath, "utf-8");
    // Escape $ in bcrypt hashes to prevent Next.js dotenv variable expansion
    const escapedHash = newHash.replace(/\$/g, "\\$");
    const updated = raw.replace(
      /^APP_PASSWORD_HASH=.*/m,
      `APP_PASSWORD_HASH="${escapedHash}"`
    );
    await writeFile(envPath, updated, "utf-8");
  } catch {
    // .env.local may not exist in some deployment environments — skip file write
  }
  process.env.APP_PASSWORD_HASH = newHash;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const rateLimit = checkRateLimit(request, "change-pw", LOGIN_RATE_LIMIT);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait before trying again." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(rateLimit.retryAfterMs / 1000)) },
      }
    );
  }

  const csrf = validateCsrf(request);
  if (!csrf.valid) {
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  }

  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    const issues = parsed.error.issues;
    return NextResponse.json(
      { error: issues[0]?.message ?? "Validation failed" },
      { status: 400 }
    );
  }

  const { currentPassword, newPassword } = parsed.data;
  const currentHash = process.env.APP_PASSWORD_HASH;

  if (!currentHash) {
    return NextResponse.json(
      { error: "Server configuration error: APP_PASSWORD_HASH not set" },
      { status: 500 }
    );
  }

  const isCurrentValid = await verifyPassword(currentPassword, currentHash);
  if (!isCurrentValid) {
    return NextResponse.json(
      { error: "Current password is incorrect" },
      { status: 401 }
    );
  }

  const newHash = await hashPassword(newPassword);
  await persistNewPasswordHash(newHash);

  return NextResponse.json({ success: true, message: "Password changed successfully" });
}
