/**
 * My Expenses - Personal Expense Tracker
 * Copyright (c) 2026 Sushovan Mukherjee <me@sushovan.in>
 * Defineway Technologies Private Limited
 * Licensed under the MIT License
 */
import { NextResponse, type NextRequest } from "next/server";
import { validateJwtGuard } from "@/lib/middleware/auth-guard";
import { prisma } from "@/lib/db/prisma";
import { updateAccountSchema } from "@/lib/validation/schemas";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await validateJwtGuard(req);
  if (!guard.valid) return guard.response;

  const { id } = await params;

  const existing = await prisma.account.findFirst({
    where: { id, userId: guard.payload.sub },
  });
  if (!existing) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = updateAccountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 422 });
  }

  const account = await prisma.account.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(account);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await validateJwtGuard(req);
  if (!guard.valid) return guard.response;

  const { id } = await params;

  const existing = await prisma.account.findFirst({
    where: { id, userId: guard.payload.sub },
    include: { _count: { select: { expenses: true } } },
  });

  if (!existing) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  if (existing._count.expenses > 0) {
    return NextResponse.json(
      { error: "Cannot delete account with existing expenses. Deactivate it instead." },
      { status: 409 }
    );
  }

  await prisma.account.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
