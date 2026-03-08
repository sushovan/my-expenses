/**
 * My Expenses - Personal Expense Tracker
 * Copyright (c) 2026 Sushovan Mukherjee <me@sushovan.in>
 * Defineway Technologies Private Limited
 * Licensed under the MIT License
 */
import { NextResponse, type NextRequest } from "next/server";
import { validateJwtGuard } from "@/lib/middleware/auth-guard";
import { prisma } from "@/lib/db/prisma";
import { format } from "date-fns";
import type { DashboardSummary } from "@/types";
import type { PaymentMethod } from "@/generated/prisma";

export async function GET(req: NextRequest) {
  const guard = await validateJwtGuard(req);
  if (!guard.valid) return guard.response;

  const userId = guard.payload.sub;

  const [expenses, categoryGroups, paymentMethodGroups, liabilityAccounts] =
    await Promise.all([
      prisma.expense.findMany({
        where: { userId },
        select: {
          billedAmount: true,
          paidAmount: true,
          pendingAmount: true,
          paymentStatus: true,
          date: true,
        },
      }),
      prisma.expense.groupBy({
        by: ["categoryId"],
        where: { userId },
        _sum: { billedAmount: true },
        _count: { id: true },
      }),
      prisma.expense.groupBy({
        by: ["paymentMethod"],
        where: { userId },
        _sum: { billedAmount: true },
        _count: { id: true },
      }),
      prisma.account.findMany({
        where: { userId, type: "LIABILITY" },
        include: {
          expenses: {
            select: { paidAmount: true, billedAmount: true },
          },
        },
      }),
    ]);

  const totalBilled = expenses.reduce(
    (sum, e) => sum + Number(e.billedAmount),
    0
  );
  const totalPaid = expenses.reduce((sum, e) => sum + Number(e.paidAmount), 0);
  const totalPending = expenses.reduce(
    (sum, e) => sum + Number(e.pendingAmount),
    0
  );

  const unpaidCount = expenses.filter((e) => e.paymentStatus === "UNPAID").length;
  const partPaidCount = expenses.filter((e) => e.paymentStatus === "PART_PAID").length;
  const paidCount = expenses.filter((e) => e.paymentStatus === "PAID").length;

  // Category summaries with names
  const categories = await prisma.category.findMany({
    where: { userId },
    select: { id: true, name: true, color: true },
  });
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  const byCategory = categoryGroups.map((g) => ({
    categoryId: g.categoryId,
    categoryName: categoryMap.get(g.categoryId)?.name ?? "Unknown",
    color: categoryMap.get(g.categoryId)?.color ?? null,
    total: Number(g._sum.billedAmount ?? 0),
    count: g._count.id,
  }));

  // Monthly summaries
  const monthMap = new Map<string, { total: number; count: number }>();
  for (const e of expenses) {
    const month = format(new Date(e.date), "yyyy-MM");
    const existing = monthMap.get(month) ?? { total: 0, count: 0 };
    monthMap.set(month, {
      total: existing.total + Number(e.billedAmount),
      count: existing.count + 1,
    });
  }
  const byMonth = Array.from(monthMap.entries())
    .map(([month, { total, count }]) => ({ month, total, count }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // Payment method summaries
  const byPaymentMethod = paymentMethodGroups.map((g) => ({
    method: g.paymentMethod as PaymentMethod,
    total: Number(g._sum.billedAmount ?? 0),
    count: g._count.id,
  }));

  // Total liability (what you owe to lenders)
  const liabilityTotal = liabilityAccounts.reduce((sum, account) => {
    const accountTotal = account.expenses.reduce(
      (s, e) => s + Number(e.billedAmount),
      0
    );
    return sum + accountTotal;
  }, 0);

  const summary: DashboardSummary = {
    totalBilled,
    totalPaid,
    totalPending,
    expenseCount: expenses.length,
    unpaidCount,
    partPaidCount,
    paidCount,
    byCategory,
    byMonth,
    byPaymentMethod,
    liabilityTotal,
  };

  return NextResponse.json(summary);
}
