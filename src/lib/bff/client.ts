/**
 * My Expenses - Personal Expense Tracker
 * Copyright (c) 2026 Sushovan Mukherjee <me@sushovan.in>
 * Defineway Technologies Private Limited
 * Licensed under the MIT License
 */
import { getSession } from "@/lib/auth/session";
import {
  signAccessToken,
  generateRefreshToken,
  hashToken,
  getAccessTokenExpiry,
  getRefreshTokenExpiry,
} from "@/lib/auth/jwt";
import { prisma } from "@/lib/db/prisma";

/**
 * Resolves or refreshes the JWT for the current session and returns an
 * Authorization header value for calls to the Internal API.
 */
async function getAuthorizationHeader(): Promise<string> {
  const session = await getSession();

  if (!session.isLoggedIn || !session.sessionId) {
    throw new Error("Not authenticated");
  }

  const sessionRecord = await prisma.session.findFirst({
    where: {
      id: session.sessionId,
      revoked: false,
      refreshExpiresAt: { gt: new Date() },
    },
  });

  if (!sessionRecord) {
    throw new Error("Session not found or expired");
  }

  // Check if access token is still valid (with 30-second buffer)
  const accessExpiry = new Date(sessionRecord.accessExpiresAt);
  const bufferMs = 30 * 1000;

  if (accessExpiry.getTime() - Date.now() > bufferMs) {
    // Access token still valid — re-sign it (we store hash, not raw token)
    const accessToken = await signAccessToken(
      sessionRecord.userId,
      session.sessionId
    );
    return `Bearer ${accessToken}`;
  }

  // Rotate: generate new access + refresh token pair
  const newAccessToken = await signAccessToken(
    sessionRecord.userId,
    session.sessionId
  );
  const newRefreshToken = generateRefreshToken();

  await prisma.session.update({
    where: { id: session.sessionId },
    data: {
      accessTokenHash: hashToken(newAccessToken),
      refreshTokenHash: hashToken(newRefreshToken),
      accessExpiresAt: getAccessTokenExpiry(),
      refreshExpiresAt: getRefreshTokenExpiry(),
    },
  });

  return `Bearer ${newAccessToken}`;
}

const INTERNAL_BASE = `http://localhost:${process.env.PORT ?? 3000}/api/v1`;

/**
 * HTTP client for BFF → Internal API calls.
 * Automatically attaches the JWT Authorization header.
 */
export const internalApi = {
  async get<T>(path: string): Promise<T> {
    const authHeader = await getAuthorizationHeader();
    const res = await fetch(`${INTERNAL_BASE}${path}`, {
      headers: { Authorization: authHeader },
      cache: "no-store",
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(res.status, body.error ?? "Internal API error");
    }
    return res.json() as Promise<T>;
  },

  async post<T>(path: string, body: unknown): Promise<T> {
    const authHeader = await getAuthorizationHeader();
    const res = await fetch(`${INTERNAL_BASE}${path}`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new ApiError(res.status, errBody.error ?? "Internal API error");
    }
    return res.json() as Promise<T>;
  },

  async put<T>(path: string, body: unknown): Promise<T> {
    const authHeader = await getAuthorizationHeader();
    const res = await fetch(`${INTERNAL_BASE}${path}`, {
      method: "PUT",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new ApiError(res.status, errBody.error ?? "Internal API error");
    }
    return res.json() as Promise<T>;
  },

  async patch<T>(path: string, body: unknown): Promise<T> {
    const authHeader = await getAuthorizationHeader();
    const res = await fetch(`${INTERNAL_BASE}${path}`, {
      method: "PATCH",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new ApiError(res.status, errBody.error ?? "Internal API error");
    }
    return res.json() as Promise<T>;
  },

  async delete<T>(path: string): Promise<T> {
    const authHeader = await getAuthorizationHeader();
    const res = await fetch(`${INTERNAL_BASE}${path}`, {
      method: "DELETE",
      headers: { Authorization: authHeader },
      cache: "no-store",
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new ApiError(res.status, errBody.error ?? "Internal API error");
    }
    return res.json() as Promise<T>;
  },
};

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}
