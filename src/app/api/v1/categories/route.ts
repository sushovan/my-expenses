/**
 * My Expenses - Personal Expense Tracker
 * Copyright (c) 2026 Sushovan Mukherjee <me@sushovan.in>
 * Defineway Technologies Private Limited
 * Licensed under the MIT License
 */
import { NextResponse, type NextRequest } from "next/server";
import { validateJwtGuard } from "@/lib/middleware/auth-guard";
import { prisma } from "@/lib/db/prisma";
import { createCategorySchema } from "@/lib/validation/schemas";

export async function GET(req: NextRequest) {
  const guard = await validateJwtGuard(req);
  if (!guard.valid) return guard.response;

  const categories = await prisma.category.findMany({
    where: { userId: guard.payload.sub },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const guard = await validateJwtGuard(req);
  if (!guard.valid) return guard.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = createCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 422 });
  }

  try {
    const category = await prisma.category.create({
      data: { ...parsed.data, userId: guard.payload.sub },
    });
    return NextResponse.json(category, { status: 201 });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2002") {
      return NextResponse.json(
        { error: "A category with this name already exists" },
        { status: 409 }
      );
    }
    throw err;
  }
}
