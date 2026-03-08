/**
 * My Expenses - Personal Expense Tracker
 * Copyright (c) 2026 Sushovan Mukherjee <me@sushovan.in>
 * Defineway Technologies Private Limited
 * Licensed under the MIT License
 */
import { NextResponse } from "next/server";
import { getSession, destroySession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function POST() {
  const session = await getSession();

  if (session.isLoggedIn && session.sessionId) {
    // Revoke the session in DB so the JWT is permanently invalidated
    await prisma.session
      .update({
        where: { id: session.sessionId },
        data: { revoked: true },
      })
      .catch(() => {
        // Session may already be gone — ignore
      });
  }

  await destroySession();

  return NextResponse.json({ success: true });
}
