/**
 * My Expenses - Personal Expense Tracker
 * Copyright (c) 2026 Sushovan Mukherjee <me@sushovan.in>
 * Defineway Technologies Private Limited
 * Licensed under the MIT License
 */
import { getIronSession, type IronSession } from "iron-session";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";

export interface SessionData {
  sessionId: string;
  userId: string;
  isLoggedIn: boolean;
}

const SESSION_SECRET = process.env.SESSION_SECRET;
const SESSION_COOKIE_NAME = "expenses_session";

function getSessionOptions() {
  if (!SESSION_SECRET) {
    throw new Error("SESSION_SECRET environment variable is not set");
  }
  if (SESSION_SECRET.length < 32) {
    throw new Error("SESSION_SECRET must be at least 32 characters");
  }
  return {
    password: SESSION_SECRET,
    cookieName: SESSION_COOKIE_NAME,
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "strict" as const,
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    },
  };
}

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, getSessionOptions());
}

export async function getSessionFromRequest(
  req: NextRequest,
  res: NextResponse
): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(req, res, getSessionOptions());
}

export async function createSession(
  sessionId: string,
  userId: string
): Promise<void> {
  const session = await getSession();
  session.sessionId = sessionId;
  session.userId = userId;
  session.isLoggedIn = true;
  await session.save();
}

export async function destroySession(): Promise<void> {
  const session = await getSession();
  session.destroy();
}
