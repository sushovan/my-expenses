/**
 * My Expenses - Personal Expense Tracker
 * Copyright (c) 2026 Sushovan Mukherjee <me@sushovan.in>
 * Defineway Technologies Private Limited
 * Licensed under the MIT License
 */
"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { Skeleton } from "@/components/ui/skeleton";
import type { ExpenseWithRelations } from "@/types";

export default function EditExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data: expense, isLoading } = useQuery<ExpenseWithRelations>({
    queryKey: ["expense", id],
    queryFn: async () => {
      const res = await fetch(`/api/bff/expenses/${id}`);
      if (!res.ok) throw new Error("Failed to load expense");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <>
        <div className="mb-6">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      </>
    );
  }

  if (!expense) return null;

  return (
    <>
      <Header
        title="Edit Expense"
        description={expense.description}
      />
      <ExpenseForm
        mode="edit"
        expenseId={id}
        defaultValues={expense}
      />
    </>
  );
}
