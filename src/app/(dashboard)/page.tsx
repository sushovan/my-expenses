/**
 * My Expenses - Personal Expense Tracker
 * Copyright (c) 2026 Sushovan Mukherjee <me@sushovan.in>
 * Defineway Technologies Private Limited
 * Licensed under the MIT License
 */
"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  IndianRupee,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
} from "lucide-react";
import type { DashboardSummary } from "@/types";
import { PAYMENT_METHOD_LABELS } from "@/lib/utils/constants";

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  iconColor: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold font-mono mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconColor}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const formatAmount = (v: number) =>
  `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export default function DashboardPage() {
  const { data, isLoading } = useQuery<DashboardSummary>({
    queryKey: ["dashboard"],
    queryFn: () => fetch("/api/bff/dashboard").then((r) => r.json()),
  });

  if (isLoading) {
    return (
      <>
        <Header title="Dashboard" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </>
    );
  }

  const isEmpty = !data || data.expenseCount === 0;

  return (
    <>
      <Header
        title="Dashboard"
        description="Your flat renovation expense overview"
        action={
          <Link href="/expenses/new">
            <Button className="gap-2">
              <PlusCircle className="w-4 h-4" />
              Add Expense
            </Button>
          </Link>
        }
      />

      {isEmpty ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <IndianRupee className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-lg">No expenses yet</CardTitle>
            <p className="text-muted-foreground text-center max-w-xs">
              Start tracking your renovation costs by adding your first expense.
              Don&apos;t forget to set up your accounts and categories first!
            </p>
            <div className="flex gap-3">
              <Link href="/accounts">
                <Button variant="outline">Set Up Accounts</Button>
              </Link>
              <Link href="/expenses/new">
                <Button>Add First Expense</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Total Billed"
              value={formatAmount(data.totalBilled)}
              subtitle={`${data.expenseCount} expenses`}
              icon={IndianRupee}
              iconColor="bg-blue-100 text-blue-600"
            />
            <StatCard
              title="Total Paid"
              value={formatAmount(data.totalPaid)}
              subtitle={`${data.paidCount} paid`}
              icon={CheckCircle2}
              iconColor="bg-green-100 text-green-600"
            />
            <StatCard
              title="Pending"
              value={formatAmount(data.totalPending)}
              subtitle={`${data.unpaidCount + data.partPaidCount} due`}
              icon={Clock}
              iconColor="bg-orange-100 text-orange-600"
            />
            <StatCard
              title="Liability (Loans)"
              value={formatAmount(data.liabilityTotal)}
              subtitle="Amount borrowed"
              icon={AlertTriangle}
              iconColor="bg-red-100 text-red-600"
            />
          </div>

          {/* Status breakdown */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="rounded-xl border p-3 text-center">
              <p className="text-2xl font-bold text-destructive">{data.unpaidCount}</p>
              <p className="text-xs text-muted-foreground">Unpaid</p>
            </div>
            <div className="rounded-xl border p-3 text-center">
              <p className="text-2xl font-bold text-orange-500">{data.partPaidCount}</p>
              <p className="text-xs text-muted-foreground">Part Paid</p>
            </div>
            <div className="rounded-xl border p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{data.paidCount}</p>
              <p className="text-xs text-muted-foreground">Paid</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Monthly spend chart */}
            {data.byMonth.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Monthly Spending</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={data.byMonth} margin={{ left: -10 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v) => {
                          const [y, m] = v.split("-");
                          return `${m}/${y.slice(2)}`;
                        }}
                      />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        formatter={(v: unknown) => formatAmount(Number(v))}
                        labelFormatter={(label) => `Month: ${String(label)}`}
                      />
                      <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Category breakdown pie */}
            {data.byCategory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">By Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={data.byCategory}
                        dataKey="total"
                        nameKey="categoryName"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }: { name?: string; percent?: number }) =>
                          (percent ?? 0) > 0.05
                            ? `${(name ?? "").split(" ")[0]} ${((percent ?? 0) * 100).toFixed(0)}%`
                            : ""
                        }
                        labelLine={false}
                      >
                        {data.byCategory.map((entry, index) => (
                          <Cell
                            key={entry.categoryId}
                            fill={entry.color ?? `hsl(${index * 45}, 60%, 50%)`}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: unknown) => formatAmount(Number(v))} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Payment method breakdown */}
          {data.byPaymentMethod.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">By Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.byPaymentMethod
                    .sort((a, b) => b.total - a.total)
                    .map((item) => {
                      const pct = data.totalBilled > 0 ? (item.total / data.totalBilled) * 100 : 0;
                      return (
                        <div key={item.method} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>{PAYMENT_METHOD_LABELS[item.method]}</span>
                            <span className="text-muted-foreground font-mono">
                              {formatAmount(item.total)} · {pct.toFixed(1)}%
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </>
  );
}
