/**
 * My Expenses - Personal Expense Tracker
 * Copyright (c) 2026 Sushovan Mukherjee <me@sushovan.in>
 * Defineway Technologies Private Limited
 * Licensed under the MIT License
 */
import { Header } from "@/components/layout/Header";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";

export default function NewExpensePage() {
  return (
    <>
      <Header
        title="Add Expense"
        description="Record a new expense for your flat renovation"
      />
      <ExpenseForm mode="create" />
    </>
  );
}
