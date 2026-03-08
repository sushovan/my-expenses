/**
 * My Expenses - Personal Expense Tracker
 * Copyright (c) 2026 Sushovan Mukherjee <me@sushovan.in>
 * Defineway Technologies Private Limited
 * Licensed under the MIT License
 */
"use client";

import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "recharts";
import type { DashboardSummary } from "@/types";
import { PAYMENT_METHOD_LABELS } from "@/lib/utils/constants";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const formatAmount = (v: number) =>
  `₹${v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function ReportsPage() {
  const { data, isLoading } = useQuery<DashboardSummary>({
    queryKey: ["dashboard"],
    queryFn: () => fetch("/api/bff/dashboard").then((r) => r.json()),
  });

  if (isLoading) {
    return (
      <>
        <Header title="Reports" />
        <div className="space-y-6">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        title="Reports"
        description="Spending analysis for your flat renovation"
      />

      <div className="space-y-6">
        {/* Category breakdown table */}
        {data && data.byCategory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Spending by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={[...data.byCategory].sort((a, b) => b.total - a.total).slice(0, 10)}
                    layout="vertical"
                    margin={{ left: 10, right: 20 }}
                  >
                    <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                    />
                    <YAxis
                      type="category"
                      dataKey="categoryName"
                      tick={{ fontSize: 11 }}
                      width={110}
                    />
                    <Tooltip formatter={(v: unknown) => formatAmount(Number(v))} />
                    <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                      {data.byCategory.map((entry, i) => (
                        <Cell
                          key={entry.categoryId}
                          fill={entry.color ?? `hsl(${i * 45}, 60%, 50%)`}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Count</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">%</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...data.byCategory]
                        .sort((a, b) => b.total - a.total)
                        .map((cat) => (
                          <TableRow key={cat.categoryId}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {cat.color && (
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: cat.color }}
                                  />
                                )}
                                <span className="text-sm">{cat.categoryName}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right text-sm">{cat.count}</TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              {formatAmount(cat.total)}
                            </TableCell>
                            <TableCell className="text-right text-sm text-muted-foreground">
                              {data.totalBilled > 0
                                ? `${((cat.total / data.totalBilled) * 100).toFixed(1)}%`
                                : "0%"}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Monthly trend */}
        {data && data.byMonth.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Monthly Spending Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
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
                  <Bar
                    dataKey="total"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Payment method */}
        {data && data.byPaymentMethod.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">By Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={data.byPaymentMethod}
                      dataKey="total"
                      nameKey="method"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                        label={({ method, percent }: { method?: string; percent?: number }) =>
                          (percent ?? 0) > 0.05
                            ? `${PAYMENT_METHOD_LABELS[(method ?? "OTHER") as keyof typeof PAYMENT_METHOD_LABELS]} ${((percent ?? 0) * 100).toFixed(0)}%`
                            : ""
                        }
                      labelLine={false}
                    >
                      {data.byPaymentMethod.map((_, i) => (
                        <Cell key={i} fill={`hsl(${i * 60}, 65%, 52%)`} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: unknown, _n: unknown, props: { payload?: { method?: string } }) => [
                        formatAmount(Number(v)),
                        PAYMENT_METHOD_LABELS[(props?.payload?.method ?? "OTHER") as keyof typeof PAYMENT_METHOD_LABELS],
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Method</TableHead>
                        <TableHead className="text-right">Count</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...data.byPaymentMethod]
                        .sort((a, b) => b.total - a.total)
                        .map((item) => (
                          <TableRow key={item.method}>
                            <TableCell className="text-sm">
                              {PAYMENT_METHOD_LABELS[item.method]}
                            </TableCell>
                            <TableCell className="text-right text-sm">{item.count}</TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              {formatAmount(item.total)}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
