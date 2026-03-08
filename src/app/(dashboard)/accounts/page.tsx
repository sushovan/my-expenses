/**
 * My Expenses - Personal Expense Tracker
 * Copyright (c) 2026 Sushovan Mukherjee <me@sushovan.in>
 * Defineway Technologies Private Limited
 * Licensed under the MIT License
 */
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Header } from "@/components/layout/Header";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  PlusCircle,
  Wallet,
  AlertCircle,
  Building2,
  HandCoins,
  Loader2,
} from "lucide-react";
import {
  createAccountSchema,
  type CreateAccountInput,
} from "@/lib/validation/schemas";
import { ACCOUNT_TYPE_LABELS } from "@/lib/utils/constants";
import type { Account } from "@/types";

const ACCOUNT_TYPE_ICONS = {
  ASSET: Building2,
  LIABILITY: AlertCircle,
  CASH: HandCoins,
};

const ACCOUNT_TYPE_COLORS = {
  ASSET: "bg-blue-50 border-blue-200 text-blue-700",
  LIABILITY: "bg-red-50 border-red-200 text-red-700",
  CASH: "bg-green-50 border-green-200 text-green-700",
};

function AccountCard({
  account,
  onEdit,
}: {
  account: Account;
  onEdit: (account: Account) => void;
}) {
  const Icon = ACCOUNT_TYPE_ICONS[account.type];
  return (
    <Card
      className={`cursor-pointer hover:shadow-md transition-shadow ${!account.isActive ? "opacity-50" : ""}`}
      onClick={() => onEdit(account)}
    >
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center border ${ACCOUNT_TYPE_COLORS[account.type]}`}
          >
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm truncate">{account.name}</p>
              {!account.isActive && (
                <Badge variant="secondary" className="text-xs">Inactive</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {ACCOUNT_TYPE_LABELS[account.type]}
              {account.bankName && ` · ${account.bankName}`}
            </p>
            {account.notes && (
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {account.notes}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AccountForm({
  defaultValues,
  onSuccess,
  accountId,
}: {
  defaultValues?: Partial<Account>;
  onSuccess: () => void;
  accountId?: string;
}) {
  const queryClient = useQueryClient();
  const isEdit = !!accountId;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateAccountInput>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      type: defaultValues?.type,
      bankName: defaultValues?.bankName ?? "",
      notes: defaultValues?.notes ?? "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: CreateAccountInput) => {
      const url = isEdit
        ? `/api/bff/accounts/${accountId}`
        : "/api/bff/accounts";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save account");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast.success(isEdit ? "Account updated" : "Account created");
      onSuccess();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4 pt-2">
      <div className="space-y-1">
        <Label>Account Name *</Label>
        <Input placeholder="e.g. My Axis Bank Savings" {...register("name")} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-1">
        <Label>Account Type *</Label>
        <Select
          defaultValue={defaultValues?.type}
          onValueChange={(v: string | null) => v && setValue("type", v as CreateAccountInput["type"])}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type..." />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(ACCOUNT_TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
      </div>

      <div className="space-y-1">
        <Label>Bank Name</Label>
        <Input placeholder="e.g. Axis Bank" {...register("bankName")} />
      </div>

      <div className="space-y-1">
        <Label>Notes</Label>
        <Textarea placeholder="Any notes..." rows={2} {...register("notes")} />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting || mutation.isPending}>
        {(isSubmitting || mutation.isPending) && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
        {isEdit ? "Save Changes" : "Create Account"}
      </Button>
    </form>
  );
}

export default function AccountsPage() {
  const [showDialog, setShowDialog] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);

  const { data: accounts = [], isLoading } = useQuery<Account[]>({
    queryKey: ["accounts"],
    queryFn: () => fetch("/api/bff/accounts").then((r) => r.json()),
  });

  const grouped = {
    ASSET: accounts.filter((a) => a.type === "ASSET"),
    LIABILITY: accounts.filter((a) => a.type === "LIABILITY"),
    CASH: accounts.filter((a) => a.type === "CASH"),
  };

  const handleEdit = (account: Account) => {
    setEditAccount(account);
    setShowDialog(true);
  };

  return (
    <>
      <Header
        title="Payment Accounts"
        description="Manage your bank accounts, wallets, and liabilities"
        action={
          <Button
            className="gap-2"
            onClick={() => { setEditAccount(null); setShowDialog(true); }}
          >
            <PlusCircle className="w-4 h-4" />
            Add Account
          </Button>
        }
      />

      {isLoading ? (
        <p className="text-muted-foreground">Loading accounts...</p>
      ) : accounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
            <Wallet className="w-10 h-10 text-muted-foreground" />
            <CardTitle className="text-base">No accounts yet</CardTitle>
            <CardDescription>Add your first payment account to get started</CardDescription>
            <Button onClick={() => setShowDialog(true)}>Add Account</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {(["ASSET", "LIABILITY", "CASH"] as const).map((type) => {
            const list = grouped[type];
            if (list.length === 0) return null;
            return (
              <div key={type}>
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {ACCOUNT_TYPE_LABELS[type]}
                  </h2>
                  <Separator className="flex-1" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {list.map((account) => (
                    <AccountCard key={account.id} account={account} onEdit={handleEdit} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editAccount ? "Edit Account" : "Add Account"}
            </DialogTitle>
          </DialogHeader>
          <AccountForm
            defaultValues={editAccount ?? undefined}
            accountId={editAccount?.id}
            onSuccess={() => setShowDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
