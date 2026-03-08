/**
 * My Expenses - Personal Expense Tracker
 * Copyright (c) 2026 Sushovan Mukherjee <me@sushovan.in>
 * Defineway Technologies Private Limited
 * Licensed under the MIT License
 */
import { NextResponse, type NextRequest } from "next/server";
import { validateJwtGuard } from "@/lib/middleware/auth-guard";
import { prisma } from "@/lib/db/prisma";
import { updateExpenseSchema } from "@/lib/validation/schemas";
import { deleteFile } from "@/lib/utils/file";
import { join } from "path";
import { getUploadsDir } from "@/lib/utils/file";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await validateJwtGuard(req);
  if (!guard.valid) return guard.response;

  const { id } = await params;

  const expense = await prisma.expense.findFirst({
    where: { id, userId: guard.payload.sub },
    include: {
      category: true,
      account: true,
      receipts: true,
      tags: { include: { tag: true } },
    },
  });

  if (!expense) {
    return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  }

  return NextResponse.json(expense);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await validateJwtGuard(req);
  if (!guard.valid) return guard.response;

  const { id } = await params;

  const existing = await prisma.expense.findFirst({
    where: { id, userId: guard.payload.sub },
  });

  if (!existing) {
    return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = updateExpenseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 422 });
  }

  const updateData = parsed.data;
  const billedAmount = updateData.billedAmount ?? Number(existing.billedAmount);
  const paidAmount = updateData.paidAmount ?? Number(existing.paidAmount);
  const pendingAmount = billedAmount - paidAmount;

  // Build tag updates separately if provided
  let tagUpdate: { deleteMany: Record<string, never>; create: { tagId: string }[] } | undefined;
  if (updateData.tags) {
    const tagRecords = await Promise.all(
      updateData.tags.map((name: string) =>
        prisma.tag.upsert({ where: { name }, update: {}, create: { name } })
      )
    );
    tagUpdate = {
      deleteMany: {},
      create: tagRecords.map((t) => ({ tagId: t.id })),
    };
  }

  const { tags: _tags, ...scalarUpdateData } = updateData;

  const expense = await prisma.expense.update({
    where: { id },
    data: {
      ...scalarUpdateData,
      pendingAmount,
      ...(updateData.date && { date: new Date(updateData.date) }),
      ...(updateData.warrantyUntil !== undefined && {
        warrantyUntil: updateData.warrantyUntil ? new Date(updateData.warrantyUntil) : null,
      }),
      ...(updateData.installDate !== undefined && {
        installDate: updateData.installDate ? new Date(updateData.installDate) : null,
      }),
      ...(updateData.purchaseDate !== undefined && {
        purchaseDate: updateData.purchaseDate ? new Date(updateData.purchaseDate) : null,
      }),
      ...(tagUpdate && { tags: tagUpdate }),
    },
    include: {
      category: true,
      account: true,
      receipts: true,
      tags: { include: { tag: true } },
    },
  });

  return NextResponse.json(expense);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await validateJwtGuard(req);
  if (!guard.valid) return guard.response;

  const { id } = await params;

  const expense = await prisma.expense.findFirst({
    where: { id, userId: guard.payload.sub },
    include: { receipts: true },
  });

  if (!expense) {
    return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  }

  // Delete associated receipt files from disk
  const uploadsDir = getUploadsDir();
  await Promise.all(
    expense.receipts.map(async (receipt) => {
      await deleteFile(join(uploadsDir, receipt.filePath));
      if (receipt.thumbnailPath) {
        await deleteFile(join(uploadsDir, receipt.thumbnailPath));
      }
    })
  );

  await prisma.expense.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
