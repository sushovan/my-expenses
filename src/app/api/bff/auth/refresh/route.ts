/**
 * My Expenses - Personal Expense Tracker
 * Copyright (c) 2026 Sushovan Mukherjee <me@sushovan.in>
 * Defineway Technologies Private Limited
 * Licensed under the MIT License
 */
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  signAccessToken,
  generateRefreshToken,
  hashToken,
  getAccessTokenExpiry,
  getRefreshTokenExpiry,
} from "@/lib/auth/jwt";
import { prisma } from "@/lib/db/prisma";

export async function POST() {
  const session = await getSession();

  if (!session.isLoggedIn || !session.sessionId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const sessionRecord = await prisma.session.findFirst({
    where: {
      id: session.sessionId,
      revoked: false,
      refreshExpiresAt: { gt: new Date() },
    },
  });

  if (!sessionRecord) {
    return NextResponse.json(
      { error: "Session expired. Please log in again." },
      { status: 401 }
    );
  }

  // Rotate: issue new access + refresh token pair
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

  return NextResponse.json({ success: true });
}
