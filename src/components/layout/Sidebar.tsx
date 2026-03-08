/**
 * My Expenses - Personal Expense Tracker
 * Copyright (c) 2026 Sushovan Mukherjee <me@sushovan.in>
 * Defineway Technologies Private Limited
 * Licensed under the MIT License
 */
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  Tag,
  BarChart3,
  LogOut,
  IndianRupee,
  PlusCircle,
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/accounts", label: "Accounts", icon: Wallet },
  { href: "/categories", label: "Categories", icon: Tag },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/bff/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Logout failed");
    }
  };

  return (
    <aside className="w-64 shrink-0 flex flex-col h-screen border-r bg-card">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shrink-0">
          <IndianRupee className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <p className="font-semibold text-sm leading-tight">My Expenses</p>
          <p className="text-xs text-muted-foreground leading-tight">Flat Renovation</p>
        </div>
      </div>

      <Separator />

      {/* Quick add */}
      <div className="px-3 py-3">
        <Link href="/expenses/new">
          <Button className="w-full gap-2" size="sm">
            <PlusCircle className="w-4 h-4" />
            Add Expense
          </Button>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/"
              ? pathname === "/"
              : pathname.startsWith(href);

          return (
            <Link key={href} href={href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </div>
            </Link>
          );
        })}
      </nav>

      <Separator />

      {/* Logout */}
      <div className="px-3 py-3">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive w-full transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>

      {/* Credits */}
      <div className="px-5 py-3 border-t">
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Built by{" "}
          <a
            href="mailto:me@sushovan.in"
            className="hover:text-foreground transition-colors"
          >
            Sushovan Mukherjee
          </a>
        </p>
        <p className="text-[10px] text-muted-foreground">
          Defineway Technologies Pvt. Ltd.
        </p>
      </div>
    </aside>
  );
}
