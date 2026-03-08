/**
 * My Expenses - Personal Expense Tracker
 * Copyright (c) 2026 Sushovan Mukherjee <me@sushovan.in>
 * Defineway Technologies Private Limited
 * Licensed under the MIT License
 */
"use client";

import { use } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { Header } from "@/components/layout/Header";
import { ExpenseStatusBadge } from "@/components/expenses/ExpenseStatusBadge";
import { ReceiptUpload } from "@/components/receipts/ReceiptUpload";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Trash2, AlertTriangle } from "lucide-react";
import { useState } from "react";
import type { ExpenseWithRelations } from "@/types";
import { PAYMENT_METHOD_LABELS } from "@/lib/utils/constants";
import Link from "next/link";

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 py-2.5 border-b last:border-0">
      <span className="text-sm text-muted-foreground w-40 shrink-0">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

export default function ExpenseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: expense, isLoading } = useQuery<ExpenseWithRelations>({
    queryKey: ["expense", id],
    queryFn: async () => {
      const res = await fetch(`/api/bff/expenses/${id}`);
      if (!res.ok) throw new Error("Failed to load expense");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/bff/expenses/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Expense deleted");
      router.push("/expenses");
    },
    onError: () => toast.error("Failed to delete expense"),
  });

  const formatAmount = (amount: unknown) =>
    `₹${Number(amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (isLoading) {
    return (
      <>
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-64" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardContent className="pt-6 space-y-3">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Skeleton key={j} className="h-5 w-full" />
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </>
    );
  }

  if (!expense) return null;

  return (
    <>
      <Header
        title={expense.description}
        description={`Added ${format(new Date(expense.createdAt), "dd MMM yyyy")}`}
        action={
          <div className="flex gap-2">
            <Link href={`/expenses/${id}/edit`}>
              <Button variant="outline" size="sm" className="gap-2">
                <Pencil className="w-4 h-4" /> Edit
              </Button>
            </Link>
            <Button
              variant="destructive"
              size="sm"
              className="gap-2"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="w-4 h-4" /> Delete
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Summary amounts */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground mb-1">Billed</p>
                <p className="text-xl font-bold font-mono">{formatAmount(expense.billedAmount)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground mb-1">Paid</p>
                <p className="text-xl font-bold font-mono text-green-600">{formatAmount(expense.paidAmount)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground mb-1">Pending</p>
                <p className="text-xl font-bold font-mono text-destructive">{formatAmount(expense.pendingAmount)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment Details</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailRow label="Status" value={<ExpenseStatusBadge status={expense.paymentStatus} />} />
              <DetailRow label="Payment Method" value={PAYMENT_METHOD_LABELS[expense.paymentMethod]} />
              <DetailRow label="Account" value={
                <div className="flex items-center gap-2">
                  <span>{expense.account.name}</span>
                  <Badge variant="outline" className="text-xs capitalize">
                    {expense.account.type.toLowerCase()}
                  </Badge>
                </div>
              } />
              <DetailRow label="Date" value={format(new Date(expense.date), "dd MMM yyyy, hh:mm a")} />
              <DetailRow label="Invoice Number" value={expense.invoiceNumber} />
              {expense.taxAmount && (
                <DetailRow label="Tax / GST" value={formatAmount(expense.taxAmount)} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">More Information</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailRow label="Payee" value={expense.payeeName} />
              <DetailRow label="Category" value={
                <div className="flex items-center gap-2">
                  {expense.category.color && (
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: expense.category.color }} />
                  )}
                  {expense.category.name}
                </div>
              } />
              <DetailRow label="Room / Phase" value={expense.projectPhase} />
              <DetailRow label="Vendor Phone" value={expense.vendorPhone} />
              <DetailRow label="Vendor Email" value={expense.vendorEmail} />
              <DetailRow label="Install Date" value={expense.installDate ? format(new Date(expense.installDate), "dd MMM yyyy") : null} />
              <DetailRow label="Warranty Until" value={expense.warrantyUntil ? format(new Date(expense.warrantyUntil), "dd MMM yyyy") : null} />
              {expense.tags.length > 0 && (
                <DetailRow label="Tags" value={
                  <div className="flex flex-wrap gap-1">
                    {expense.tags.map((et) => (
                      <Badge key={et.tagId} variant="secondary" className="text-xs">{et.tag.name}</Badge>
                    ))}
                  </div>
                } />
              )}
              {expense.notes && (
                <div className="py-2.5">
                  <p className="text-sm text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm whitespace-pre-wrap">{expense.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Receipts panel */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Receipts & Attachments</CardTitle>
            </CardHeader>
            <CardContent>
              <ReceiptUpload
                expenseId={expense.id}
                receipts={expense.receipts}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete confirmation */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete Expense
            </DialogTitle>
            <DialogDescription>
              This will permanently delete &ldquo;{expense.description}&rdquo; and all its receipts. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
