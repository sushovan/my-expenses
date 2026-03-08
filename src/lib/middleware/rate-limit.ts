/**
 * My Expenses - Personal Expense Tracker
 * Copyright (c) 2026 Sushovan Mukherjee <me@sushovan.in>
 * Defineway Technologies Private Limited
 * Licensed under the MIT License
 */
import type { NextRequest } from "next/server";

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

// In-memory sliding window store — resets on server restart (fine for personal use)
const store = new Map<string, RateLimitEntry>();

interface RateLimitOptions {
  /** Max requests allowed in the window */
  limit: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  retryAfterMs: number;
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export function checkRateLimit(
  req: NextRequest,
  key: string,
  options: RateLimitOptions
): RateLimitResult {
  const { limit, windowMs } = options;
  const ip = getClientIp(req);
  const storeKey = `${key}:${ip}`;
  const now = Date.now();

  const entry = store.get(storeKey);

  if (!entry || now - entry.windowStart >= windowMs) {
    store.set(storeKey, { count: 1, windowStart: now });
    return { success: true, remaining: limit - 1, retryAfterMs: 0 };
  }

  if (entry.count >= limit) {
    const retryAfterMs = windowMs - (now - entry.windowStart);
    return { success: false, remaining: 0, retryAfterMs };
  }

  entry.count += 1;
  return { success: true, remaining: limit - entry.count, retryAfterMs: 0 };
}

// Preset limits
export const LOGIN_RATE_LIMIT: RateLimitOptions = {
  limit: 5,
  windowMs: 15 * 60 * 1000, // 5 attempts per 15 minutes
};

export const API_RATE_LIMIT: RateLimitOptions = {
  limit: 200,
  windowMs: 60 * 1000, // 200 requests per minute
};

export const UPLOAD_RATE_LIMIT: RateLimitOptions = {
  limit: 20,
  windowMs: 60 * 1000, // 20 uploads per minute
};

// Cleanup stale entries every 10 minutes to prevent memory leak
if (typeof setInterval !== "undefined") {
  setInterval(
    () => {
      const now = Date.now();
      for (const [key, entry] of store.entries()) {
        if (now - entry.windowStart > 15 * 60 * 1000) {
          store.delete(key);
        }
      }
    },
    10 * 60 * 1000
  );
}
