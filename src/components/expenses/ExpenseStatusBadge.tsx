/**
 * My Expenses - Personal Expense Tracker
 * Copyright (c) 2026 Sushovan Mukherjee <me@sushovan.in>
 * Defineway Technologies Private Limited
 * Licensed under the MIT License
 */
import { Badge } from "@/components/ui/badge";
import type { PaymentStatus } from "@/types";

const STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  PAID: { label: "Paid", variant: "default" },
  PART_PAID: { label: "Part Paid", variant: "secondary" },
  UNPAID: { label: "Unpaid", variant: "destructive" },
};

export function ExpenseStatusBadge({ status }: { status: PaymentStatus }) {
  const config = STATUS_CONFIG[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
