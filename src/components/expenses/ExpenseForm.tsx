/**
 * My Expenses - Personal Expense Tracker
 * Copyright (c) 2026 Sushovan Mukherjee <me@sushovan.in>
 * Defineway Technologies Private Limited
 * Licensed under the MIT License
 */
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { createExpenseSchema, type CreateExpenseInput } from "@/lib/validation/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  PROJECT_PHASES,
} from "@/lib/utils/constants";
import type { Account, Category, ExpenseWithRelations } from "@/types";
import { Loader2 } from "lucide-react";

interface ExpenseFormProps {
  defaultValues?: Partial<ExpenseWithRelations>;
  expenseId?: string;
  mode: "create" | "edit";
}

export function ExpenseForm({ defaultValues, expenseId, mode }: ExpenseFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ["accounts"],
    queryFn: () => fetch("/api/bff/accounts").then((r) => r.json()),
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => fetch("/api/bff/categories").then((r) => r.json()),
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateExpenseInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createExpenseSchema) as any,
    defaultValues: defaultValues
      ? {
          description: defaultValues.description,
          payeeName: defaultValues.payeeName,
          date: defaultValues.date
            ? format(new Date(defaultValues.date), "yyyy-MM-dd'T'HH:mm")
            : format(new Date(), "yyyy-MM-dd'T'HH:mm"),
          billedAmount: Number(defaultValues.billedAmount),
          paidAmount: Number(defaultValues.paidAmount),
          paymentMethod: defaultValues.paymentMethod,
          paymentStatus: defaultValues.paymentStatus,
          notes: defaultValues.notes ?? "",
          invoiceNumber: defaultValues.invoiceNumber ?? "",
          taxAmount: defaultValues.taxAmount
            ? Number(defaultValues.taxAmount)
            : undefined,
          projectPhase: defaultValues.projectPhase ?? "",
          categoryId: defaultValues.categoryId ?? "",
          accountId: defaultValues.accountId ?? "",
          vendorPhone: defaultValues.vendorPhone ?? "",
          vendorEmail: defaultValues.vendorEmail ?? "",
          tags: defaultValues.tags?.map((t) => t.tag.name) ?? [],
        }
      : {
          date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
          paidAmount: 0,
          paymentStatus: "UNPAID",
          tags: [],
        },
  });

  const mutation = useMutation({
    mutationFn: async (data: CreateExpenseInput) => {
      const url =
        mode === "create"
          ? "/api/bff/expenses"
          : `/api/bff/expenses/${expenseId}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          date: new Date(data.date).toISOString(),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save expense");
      }

      return res.json();
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(
        mode === "create" ? "Expense added successfully" : "Expense updated"
      );
      router.push(`/expenses/${saved.id}`);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const billedAmount = watch("billedAmount") ?? 0;
  const paidAmount = watch("paidAmount") ?? 0;
  const pendingAmount = Math.max(0, Number(billedAmount) - Number(paidAmount));

  return (
    <form onSubmit={handleSubmit((data) => mutation.mutate(data as CreateExpenseInput))} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 space-y-1">
            <Label htmlFor="description">Description *</Label>
            <Input id="description" placeholder="e.g. Ceramic floor tiles for master bedroom" {...register("description")} />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="payeeName">Payee / Business Name *</Label>
            <Input id="payeeName" placeholder="e.g. ABC Tiles Pvt Ltd" {...register("payeeName")} />
            {errors.payeeName && <p className="text-sm text-destructive">{errors.payeeName.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="date">Date *</Label>
            <Input id="date" type="datetime-local" {...register("date")} />
            {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="invoiceNumber">Invoice / Bill Number</Label>
            <Input id="invoiceNumber" placeholder="e.g. INV-2024-001" {...register("invoiceNumber")} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="projectPhase">Room / Phase</Label>
            <Select
              defaultValue={defaultValues?.projectPhase ?? undefined}
              onValueChange={(v: string | null) => setValue("projectPhase", v ?? undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select room..." />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_PHASES.map((phase) => (
                  <SelectItem key={phase} value={phase}>{phase}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="billedAmount">Billed Amount (₹) *</Label>
            <Input id="billedAmount" type="number" step="0.01" min="0" placeholder="0.00" {...register("billedAmount", { valueAsNumber: true })} />
            {errors.billedAmount && <p className="text-sm text-destructive">{errors.billedAmount.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="paidAmount">Paid Amount (₹)</Label>
            <Input id="paidAmount" type="number" step="0.01" min="0" placeholder="0.00" {...register("paidAmount", { valueAsNumber: true })} />
            {errors.paidAmount && <p className="text-sm text-destructive">{errors.paidAmount.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>Pending Amount (₹)</Label>
            <div className="flex items-center h-10 px-3 rounded-md border bg-muted text-muted-foreground font-mono text-sm">
              ₹{pendingAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="taxAmount">Tax / GST (₹)</Label>
            <Input id="taxAmount" type="number" step="0.01" min="0" placeholder="0.00" {...register("taxAmount", { valueAsNumber: true })} />
          </div>

          <div className="space-y-1">
            <Label>Payment Method *</Label>
            <Select
              defaultValue={defaultValues?.paymentMethod}
              onValueChange={(v: string | null) => v && setValue("paymentMethod", v as CreateExpenseInput["paymentMethod"])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select method..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.paymentMethod && <p className="text-sm text-destructive">{errors.paymentMethod.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>Payment Status *</Label>
            <Select
              defaultValue={defaultValues?.paymentStatus ?? "UNPAID"}
              onValueChange={(v: string | null) => v && setValue("paymentStatus", v as CreateExpenseInput["paymentStatus"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Payment Account *</Label>
            <Select
              defaultValue={defaultValues?.accountId ?? undefined}
              onValueChange={(v: string | null) => v && setValue("accountId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select account..." />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    <div className="flex flex-col">
                      <span>{account.name}</span>
                      <span className="text-xs text-muted-foreground capitalize">
                        {account.type.toLowerCase()}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.accountId && <p className="text-sm text-destructive">{errors.accountId.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>Category *</Label>
            <Select
              defaultValue={defaultValues?.categoryId ?? undefined}
              onValueChange={(v: string | null) => v && setValue("categoryId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2">
                      {cat.color && (
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                      )}
                      {cat.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categoryId && <p className="text-sm text-destructive">{errors.categoryId.message}</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Additional Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="vendorPhone">Vendor Phone</Label>
            <Input id="vendorPhone" type="tel" placeholder="+91 98765 43210" {...register("vendorPhone")} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="vendorEmail">Vendor Email</Label>
            <Input id="vendorEmail" type="email" placeholder="vendor@example.com" {...register("vendorEmail")} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="warrantyUntil">Warranty Until</Label>
            <Input id="warrantyUntil" type="datetime-local" {...register("warrantyUntil")} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="installDate">Installation Date</Label>
            <Input id="installDate" type="datetime-local" {...register("installDate")} />
          </div>

          <div className="md:col-span-2 space-y-1">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes..."
              rows={3}
              {...register("notes")}
            />
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || mutation.isPending}>
          {(isSubmitting || mutation.isPending) && (
            <Loader2 className="mr-2 w-4 h-4 animate-spin" />
          )}
          {mode === "create" ? "Add Expense" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
