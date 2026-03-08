/**
 * My Expenses - Personal Expense Tracker
 * Copyright (c) 2026 Sushovan Mukherjee <me@sushovan.in>
 * Defineway Technologies Private Limited
 * Licensed under the MIT License
 */
import { NextResponse, type NextRequest } from "next/server";
import { validateJwtGuard } from "@/lib/middleware/auth-guard";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const createReceiptSchema = z.object({
  expenseId: z.string().cuid(),
  fileName: z.string().max(200),
  originalName: z.string().max(500),
  filePath: z.string().max(500),
  thumbnailPath: z.string().max(500).nullable().optional(),
  mimeType: z.string().max(100),
  sizeBytes: z.number().int().min(1),
});

export async function POST(req: NextRequest) {
  const guard = await validateJwtGuard(req);
  if (!guard.valid) return guard.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = createReceiptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 422 });
  }

  // Verify expense belongs to this user
  const expense = await prisma.expense.findFirst({
    where: { id: parsed.data.expenseId, userId: guard.payload.sub },
  });

  if (!expense) {
    return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  }

  const receipt = await prisma.receipt.create({
    data: {
      expenseId: parsed.data.expenseId,
      fileName: parsed.data.fileName,
      originalName: parsed.data.originalName,
      filePath: parsed.data.filePath,
      thumbnailPath: parsed.data.thumbnailPath ?? null,
      mimeType: parsed.data.mimeType,
      sizeBytes: parsed.data.sizeBytes,
    },
  });

  return NextResponse.json(receipt, { status: 201 });
}
