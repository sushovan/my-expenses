/**
 * My Expenses - Personal Expense Tracker
 * Copyright (c) 2026 Sushovan Mukherjee <me@sushovan.in>
 * Defineway Technologies Private Limited
 * Licensed under the MIT License
 */
import { NextResponse, type NextRequest } from "next/server";
import { validateJwtGuard } from "@/lib/middleware/auth-guard";
import { prisma } from "@/lib/db/prisma";
import { createExpenseSchema, expenseFiltersSchema } from "@/lib/validation/schemas";
import type { PaginatedResponse, ExpenseSummary } from "@/types";
import type { Prisma } from "@/generated/prisma";

export async function GET(req: NextRequest) {
  const guard = await validateJwtGuard(req);
  if (!guard.valid) return guard.response;

  const { searchParams } = new URL(req.url);
  const params = Object.fromEntries(searchParams.entries());

  const parsed = expenseFiltersSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid filter parameters" }, { status: 400 });
  }

  const {
    search,
    categoryId,
    accountId,
    paymentStatus,
    paymentMethod,
    projectPhase,
    dateFrom,
    dateTo,
    page,
    pageSize,
    sortBy,
    sortOrder,
  } = parsed.data;

  const where: Prisma.ExpenseWhereInput = {
    userId: guard.payload.sub,
    ...(search && {
      OR: [
        { description: { contains: search } },
        { payeeName: { contains: search } },
        { invoiceNumber: { contains: search } },
        { notes: { contains: search } },
      ],
    }),
    ...(categoryId && { categoryId }),
    ...(accountId && { accountId }),
    ...(paymentStatus && { paymentStatus }),
    ...(paymentMethod && { paymentMethod }),
    ...(projectPhase && { projectPhase }),
    ...(dateFrom || dateTo ? {
      date: {
        ...(dateFrom && { gte: new Date(dateFrom) }),
        ...(dateTo && { lte: new Date(dateTo) }),
      },
    } : {}),
  };

  const [total, expenses] = await Promise.all([
    prisma.expense.count({ where }),
    prisma.expense.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder },
      include: {
        category: { select: { id: true, name: true, color: true, icon: true } },
        account: { select: { id: true, name: true, type: true } },
        _count: { select: { receipts: true } },
      },
    }),
  ]);

  const data: ExpenseSummary[] = expenses.map((e) => ({
    id: e.id,
    description: e.description,
    payeeName: e.payeeName,
    date: e.date,
    billedAmount: e.billedAmount,
    paidAmount: e.paidAmount,
    pendingAmount: e.pendingAmount,
    paymentMethod: e.paymentMethod,
    paymentStatus: e.paymentStatus,
    projectPhase: e.projectPhase,
    invoiceNumber: e.invoiceNumber,
    createdAt: e.createdAt,
    category: e.category,
    account: e.account,
    receiptCount: e._count.receipts,
  }));

  const response: PaginatedResponse<ExpenseSummary> = {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };

  return NextResponse.json(response);
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

  const parsed = createExpenseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 422 });
  }

  const {
    description,
    payeeName,
    date,
    billedAmount,
    paidAmount,
    paymentMethod,
    paymentStatus,
    notes,
    invoiceNumber,
    taxAmount,
    projectPhase,
    warrantyUntil,
    installDate,
    purchaseDate,
    vendorPhone,
    vendorEmail,
    categoryId,
    accountId,
    tags,
  } = parsed.data;

  const pendingAmount = Number(billedAmount) - Number(paidAmount);

  // Upsert tags
  const tagConnects = await Promise.all(
    tags.map((name) =>
      prisma.tag.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  );

  const expense = await prisma.expense.create({
    data: {
      description,
      payeeName,
      date: new Date(date),
      billedAmount,
      paidAmount,
      pendingAmount,
      paymentMethod,
      paymentStatus,
      notes,
      invoiceNumber,
      taxAmount,
      projectPhase,
      warrantyUntil: warrantyUntil ? new Date(warrantyUntil) : null,
      installDate: installDate ? new Date(installDate) : null,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
      vendorPhone,
      vendorEmail,
      categoryId,
      accountId,
      userId: guard.payload.sub,
      tags: {
        create: tagConnects.map((tag) => ({ tagId: tag.id })),
      },
    },
    include: {
      category: true,
      account: true,
      receipts: true,
      tags: { include: { tag: true } },
    },
  });

  return NextResponse.json(expense, { status: 201 });
}
