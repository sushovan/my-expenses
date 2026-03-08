/**
 * My Expenses - Personal Expense Tracker
 * Copyright (c) 2026 Sushovan Mukherjee <me@sushovan.in>
 * Defineway Technologies Private Limited
 * Licensed under the MIT License
 */
import type {
  Account,
  Category,
  Expense,
  Receipt,
  Tag,
  ExpenseTag,
  AccountType,
  PaymentMethod,
  PaymentStatus,
  ReceiptType,
} from "@/generated/prisma";

export type {
  Account,
  Category,
  Expense,
  Receipt,
  Tag,
  AccountType,
  PaymentMethod,
  PaymentStatus,
  ReceiptType,
};

// ─── Rich types with relations ────────────────────────────────────────────────

export type ExpenseWithRelations = Expense & {
  category: Category;
  account: Account;
  receipts: Receipt[];
  tags: (ExpenseTag & { tag: Tag })[];
};

export type ExpenseSummary = Pick<
  Expense,
  | "id"
  | "description"
  | "payeeName"
  | "date"
  | "billedAmount"
  | "paidAmount"
  | "pendingAmount"
  | "paymentMethod"
  | "paymentStatus"
  | "projectPhase"
  | "invoiceNumber"
  | "createdAt"
> & {
  category: Pick<Category, "id" | "name" | "color" | "icon">;
  account: Pick<Account, "id" | "name" | "type">;
  receiptCount: number;
};

// ─── API response wrappers ─────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiSuccessResponse<T> {
  data: T;
}

export interface ApiErrorResponse {
  error: string;
  details?: Record<string, string[]>;
}

// ─── Dashboard types ──────────────────────────────────────────────────────────

export interface DashboardSummary {
  totalBilled: number;
  totalPaid: number;
  totalPending: number;
  expenseCount: number;
  unpaidCount: number;
  partPaidCount: number;
  paidCount: number;
  byCategory: CategorySummary[];
  byMonth: MonthSummary[];
  byPaymentMethod: PaymentMethodSummary[];
  liabilityTotal: number;
}

export interface CategorySummary {
  categoryId: string;
  categoryName: string;
  color: string | null;
  total: number;
  count: number;
}

export interface MonthSummary {
  month: string; // "2026-03"
  total: number;
  count: number;
}

export interface PaymentMethodSummary {
  method: PaymentMethod;
  total: number;
  count: number;
}
