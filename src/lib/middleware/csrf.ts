/**
 * My Expenses - Personal Expense Tracker
 * Copyright (c) 2026 Sushovan Mukherjee <me@sushovan.in>
 * Defineway Technologies Private Limited
 * Licensed under the MIT License
 */
import type { NextRequest } from "next/server";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Validates CSRF protection for state-mutating requests (POST, PUT, PATCH, DELETE).
 * Uses Origin/Referer header validation combined with SameSite=Strict cookies.
 * This double-check ensures protection even if browser SameSite enforcement is bypassed.
 */
export function validateCsrf(req: NextRequest): { valid: boolean; reason?: string } {
  const method = req.method.toUpperCase();

  if (SAFE_METHODS.has(method)) {
    return { valid: true };
  }

  const host = req.headers.get("host");
  if (!host) {
    return { valid: false, reason: "Missing Host header" };
  }

  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");

  if (origin) {
    try {
      const originUrl = new URL(origin);
      if (originUrl.host !== host) {
        return {
          valid: false,
          reason: `Origin mismatch: ${origin} vs host ${host}`,
        };
      }
      return { valid: true };
    } catch {
      return { valid: false, reason: "Invalid Origin header" };
    }
  }

  // Fall back to Referer check if Origin is absent (e.g. some older browsers)
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      if (refererUrl.host !== host) {
        return {
          valid: false,
          reason: `Referer mismatch: ${referer} vs host ${host}`,
        };
      }
      return { valid: true };
    } catch {
      return { valid: false, reason: "Invalid Referer header" };
    }
  }

  // No Origin or Referer — reject in production, allow in development for tooling
  if (process.env.NODE_ENV === "production") {
    return { valid: false, reason: "No Origin or Referer header present" };
  }
  return { valid: true };
}
