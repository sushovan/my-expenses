/**
 * My Expenses - Personal Expense Tracker
 * Copyright (c) 2026 Sushovan Mukherjee <me@sushovan.in>
 * Defineway Technologies Private Limited
 * Licensed under the MIT License
 */
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff, KeyRound, Info } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

function PasswordField({
  id,
  label,
  placeholder,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  placeholder?: string;
  error?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          className="pr-10"
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow((prev) => !prev)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          tabIndex={-1}
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export default function SettingsPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(changePasswordSchema) as any,
  });

  const onSubmit = async (data: ChangePasswordForm) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/bff/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        toast.error(json.error ?? "Failed to change password");
      } else {
        toast.success("Password changed successfully");
        reset();
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Header
        title="Settings"
        description="Manage your application preferences"
      />

      <div className="grid gap-6 max-w-2xl">
        {/* Change Password */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-muted-foreground" />
              <CardTitle className="text-base">Change Password</CardTitle>
            </div>
            <CardDescription>
              Update your login password. The new password will take effect
              immediately without requiring a server restart.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <PasswordField
                id="currentPassword"
                label="Current Password"
                placeholder="Enter your current password"
                error={errors.currentPassword?.message}
                {...register("currentPassword")}
              />
              <PasswordField
                id="newPassword"
                label="New Password"
                placeholder="At least 8 characters"
                error={errors.newPassword?.message}
                {...register("newPassword")}
              />
              <PasswordField
                id="confirmPassword"
                label="Confirm New Password"
                placeholder="Re-enter new password"
                error={errors.confirmPassword?.message}
                {...register("confirmPassword")}
              />
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                {isSubmitting ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Separator />

        {/* About */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-muted-foreground" />
              <CardTitle className="text-base">About</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">My Expenses</span> — Personal Expense Tracker
            </p>
            <p>
              Built by{" "}
              <a
                href="mailto:me@sushovan.in"
                className="text-foreground hover:underline"
              >
                Sushovan Mukherjee
              </a>
            </p>
            <p>Defineway Technologies Private Limited</p>
            <p className="pt-1">
              <a
                href="mailto:me@sushovan.in"
                className="hover:underline"
              >
                me@sushovan.in
              </a>
            </p>
            <p className="pt-1 text-xs">
              Licensed under the{" "}
              <span className="font-medium text-foreground">MIT License</span>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
