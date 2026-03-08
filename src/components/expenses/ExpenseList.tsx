/**
 * My Expenses - Personal Expense Tracker
 * Copyright (c) 2026 Sushovan Mukherjee <me@sushovan.in>
 * Defineway Technologies Private Limited
 * Licensed under the MIT License
 */
"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ExpenseStatusBadge } from "./ExpenseStatusBadge";
import {
  ChevronLeft,
  ChevronRight,
  Paperclip,
  Search,
} from "lucide-react";
import type { PaginatedResponse, ExpenseSummary } from "@/types";
import { PAYMENT_METHOD_LABELS } from "@/lib/utils/constants";

async function fetchExpenses(params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`/api/bff/expenses?${qs}`);
  if (!res.ok) throw new Error("Failed to fetch expenses");
  return res.json() as Promise<PaginatedResponse<ExpenseSummary>>;
}

export function ExpenseList() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [page, setPage] = useState(1);

  const queryParams: Record<string, string> = {
    page: String(page),
    pageSize: "20",
    ...(search && { search }),
    ...(status !== "all" && { paymentStatus: status }),
  };

  const { data, isLoading } = useQuery({
    queryKey: ["expenses", queryParams],
    queryFn: () => fetchExpenses(queryParams),
  });

  const formatAmount = (amount: unknown) =>
    `₹${Number(amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search expenses..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select
          value={status}
          onValueChange={(v: string | null) => {
            setStatus(v ?? "all");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="UNPAID">Unpaid</SelectItem>
            <SelectItem value="PART_PAID">Part Paid</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Description</TableHead>
              <TableHead>Payee</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Method</TableHead>
              <TableHead className="text-right">Billed</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Pending</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-8"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 10 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : data?.data.map((expense) => (
                  <TableRow
                    key={expense.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/expenses/${expense.id}`)}
                  >
                    <TableCell className="font-medium max-w-48 truncate">
                      {expense.description}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-32 truncate">
                      {expense.payeeName}
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {format(new Date(expense.date), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {expense.category.color && (
                          <div
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: expense.category.color }}
                          />
                        )}
                        <span className="text-sm truncate max-w-28">
                          {expense.category.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {PAYMENT_METHOD_LABELS[expense.paymentMethod]}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatAmount(expense.billedAmount)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-green-600">
                      {formatAmount(expense.paidAmount)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-destructive">
                      {formatAmount(expense.pendingAmount)}
                    </TableCell>
                    <TableCell>
                      <ExpenseStatusBadge status={expense.paymentStatus} />
                    </TableCell>
                    <TableCell>
                      {expense.receiptCount > 0 && (
                        <Badge variant="outline" className="gap-1 text-xs">
                          <Paperclip className="w-3 h-3" />
                          {expense.receiptCount}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
            {!isLoading && data?.data.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="text-center py-12 text-muted-foreground"
                >
                  No expenses found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {(page - 1) * 20 + 1}–
            {Math.min(page * 20, data.total)} of {data.total}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === data.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
