/**
 * My Expenses - Personal Expense Tracker
 * Copyright (c) 2026 Sushovan Mukherjee <me@sushovan.in>
 * Defineway Technologies Private Limited
 * Licensed under the MIT License
 */
import { z } from "zod";

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  username: z
    .string()
    .min(1, "Username is required")
    .max(50)
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, _ and -"),
  password: z.string().min(1, "Password is required").max(200),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ─── Account ──────────────────────────────────────────────────────────────────

export const accountTypeSchema = z.enum(["ASSET", "LIABILITY", "CASH"]);

export const createAccountSchema = z.object({
  name: z.string().min(1, "Account name is required").max(100).trim(),
  type: accountTypeSchema,
  bankName: z.string().max(100).trim().optional(),
  notes: z.string().max(500).trim().optional(),
});


export const updateAccountSchema = createAccountSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;

// ─── Category ─────────────────────────────────────────────────────────────────

export const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(50).trim(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color")
    .optional(),
  icon: z.string().max(10).optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

// ─── Expense ──────────────────────────────────────────────────────────────────

export const paymentMethodSchema = z.enum([
  "UPI",
  "BANK_TRANSFER",
  "CASH",
  "CHEQUE",
  "CARD",
  "EMI",
  "OTHER",
]);

export const paymentStatusSchema = z.enum(["UNPAID", "PART_PAID", "PAID"]);

const expenseBaseSchema = z.object({
    description: z
      .string()
      .min(1, "Description is required")
      .max(300)
      .trim(),
    payeeName: z.string().min(1, "Payee name is required").max(150).trim(),
    date: z.string().min(1, "Date is required"),
    billedAmount: z.coerce
      .number()
      .min(0, "Amount cannot be negative")
      .max(100_000_000),
    paidAmount: z.coerce
      .number()
      .min(0, "Amount cannot be negative")
      .max(100_000_000)
      .default(0),
    paymentMethod: paymentMethodSchema,
    paymentStatus: paymentStatusSchema.default("UNPAID"),
    notes: z.string().max(2000).trim().optional(),
    invoiceNumber: z.string().max(100).trim().optional(),
    taxAmount: z.coerce
      .number()
      .min(0)
      .max(100_000_000)
      .optional(),
    projectPhase: z.string().max(100).trim().optional(),
    warrantyUntil: z.string().optional().nullable(),
    installDate: z.string().optional().nullable(),
    purchaseDate: z.string().optional().nullable(),
    vendorPhone: z
      .string()
      .max(20)
      .regex(/^[\d\s+\-()]*$/, "Invalid phone number")
      .optional(),
    vendorEmail: z.string().email().max(150).optional(),
    categoryId: z.string().cuid("Invalid category"),
    accountId: z.string().cuid("Invalid account"),
    tags: z.array(z.string().max(50).trim()).max(10).default([]),
  });

export const createExpenseSchema = expenseBaseSchema.refine(
  (data) => data.paidAmount <= data.billedAmount,
  {
    message: "Paid amount cannot exceed billed amount",
    path: ["paidAmount"],
  }
);

export const updateExpenseSchema = expenseBaseSchema.partial();

export const expenseFiltersSchema = z.object({
  search: z.string().max(200).optional(),
  categoryId: z.string().cuid().optional(),
  accountId: z.string().cuid().optional(),
  paymentStatus: paymentStatusSchema.optional(),
  paymentMethod: paymentMethodSchema.optional(),
  projectPhase: z.string().max(100).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z
    .enum(["date", "billedAmount", "paidAmount", "createdAt"])
    .default("date"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ExpenseFilters = z.infer<typeof expenseFiltersSchema>;
