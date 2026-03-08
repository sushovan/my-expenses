/**
 * My Expenses - Personal Expense Tracker
 * Copyright (c) 2026 Sushovan Mukherjee <me@sushovan.in>
 * Defineway Technologies Private Limited
 * Licensed under the MIT License
 */
import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { internalApi, ApiError } from "@/lib/bff/client";
import { validateCsrf } from "@/lib/middleware/csrf";

async function requireAuth() {
  const session = await getSession();
  if (!session.isLoggedIn) return null;
  return session;
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const csrf = validateCsrf(req);
  if (!csrf.valid) return NextResponse.json({ error: "CSRF validation failed" }, { status: 403 });

  const { id } = await params;
  try {
    const data = await internalApi.delete(`/receipts/${id}`);
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
