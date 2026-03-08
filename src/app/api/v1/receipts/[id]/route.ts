/**
 * My Expenses - Personal Expense Tracker
 * Copyright (c) 2026 Sushovan Mukherjee <me@sushovan.in>
 * Defineway Technologies Private Limited
 * Licensed under the MIT License
 */
import { NextResponse, type NextRequest } from "next/server";
import { validateJwtGuard } from "@/lib/middleware/auth-guard";
import { prisma } from "@/lib/db/prisma";
import { deleteFile } from "@/lib/utils/file";
import { join } from "path";
import { getUploadsDir } from "@/lib/utils/file";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await validateJwtGuard(req);
  if (!guard.valid) return guard.response;

  const { id } = await params;

  const receipt = await prisma.receipt.findFirst({
    where: { id },
    include: { expense: { select: { userId: true } } },
  });

  if (!receipt || receipt.expense.userId !== guard.payload.sub) {
    return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
  }

  const uploadsDir = getUploadsDir();
  await deleteFile(join(uploadsDir, receipt.filePath));
  if (receipt.thumbnailPath) {
    await deleteFile(join(uploadsDir, receipt.thumbnailPath));
  }

  await prisma.receipt.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
