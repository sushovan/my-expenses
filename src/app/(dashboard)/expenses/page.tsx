/**
 * My Expenses - Personal Expense Tracker
 * Copyright (c) 2026 Sushovan Mukherjee <me@sushovan.in>
 * Defineway Technologies Private Limited
 * Licensed under the MIT License
 */
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { ExpenseList } from "@/components/expenses/ExpenseList";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export default function ExpensesPage() {
  return (
    <>
      <Header
        title="Expenses"
        description="All your renovation expenses in one place"
        action={
          <Link href="/expenses/new">
            <Button className="gap-2">
              <PlusCircle className="w-4 h-4" />
              Add Expense
            </Button>
          </Link>
        }
      />
      <ExpenseList />
    </>
  );
}
