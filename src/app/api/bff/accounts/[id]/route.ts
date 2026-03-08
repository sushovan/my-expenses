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
import { updateAccountSchema } from "@/lib/validation/schemas";

async function requireAuth() {
  const session = await getSession();
  if (!session.isLoggedIn) return null;
  return session;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const csrf = validateCsrf(req);
  if (!csrf.valid) return NextResponse.json({ error: "CSRF validation failed" }, { status: 403 });

  const { id } = await params;
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = updateAccountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  try {
    const data = await internalApi.patch(`/accounts/${id}`, parsed.data);
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
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
    const data = await internalApi.delete(`/accounts/${id}`);
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
