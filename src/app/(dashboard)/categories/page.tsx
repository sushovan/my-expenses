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
  CardTitle,
} from "@/components/ui/card";
import { PlusCircle, Tag, Loader2 } from "lucide-react";
import {
  createCategorySchema,
  type CreateCategoryInput,
} from "@/lib/validation/schemas";
import { DEFAULT_CATEGORIES } from "@/lib/utils/constants";
import type { Category } from "@/types";

function CategoryCard({
  category,
  onEdit,
}: {
  category: Category;
  onEdit: (cat: Category) => void;
}) {
  return (
    <button
      onClick={() => onEdit(category)}
      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent hover:text-accent-foreground transition-colors w-full text-left"
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0 text-sm font-bold"
        style={{ backgroundColor: category.color ?? "#8B7355" }}
      >
        {category.icon ?? category.name[0]}
      </div>
      <span className="text-sm font-medium truncate">{category.name}</span>
    </button>
  );
}

function CategoryForm({
  defaultValues,
  onSuccess,
  categoryId,
}: {
  defaultValues?: Partial<Category>;
  onSuccess: () => void;
  categoryId?: string;
}) {
  const queryClient = useQueryClient();
  const isEdit = !!categoryId;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateCategoryInput>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      color: defaultValues?.color ?? "#8B7355",
      icon: defaultValues?.icon ?? "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: CreateCategoryInput) => {
      const url = isEdit
        ? `/api/bff/categories/${categoryId}`
        : "/api/bff/categories";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save category");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success(isEdit ? "Category updated" : "Category created");
      onSuccess();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4 pt-2">
      <div className="space-y-1">
        <Label>Category Name *</Label>
        <Input placeholder="e.g. Flooring" {...register("name")} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-1">
        <Label>Color</Label>
        <div className="flex items-center gap-3">
          <Input type="color" className="w-14 h-10 p-1 cursor-pointer" {...register("color")} />
          <Input placeholder="#8B7355" className="flex-1" {...register("color")} />
        </div>
        {errors.color && <p className="text-sm text-destructive">{errors.color.message}</p>}
      </div>

      <div className="space-y-1">
        <Label>Icon (emoji)</Label>
        <Input placeholder="e.g. 🏠" {...register("icon")} />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting || mutation.isPending}>
        {(isSubmitting || mutation.isPending) && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
        {isEdit ? "Save Changes" : "Create Category"}
      </Button>
    </form>
  );
}

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => fetch("/api/bff/categories").then((r) => r.json()),
  });

  const seedMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(
        DEFAULT_CATEGORIES.map((cat) =>
          fetch("/api/bff/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(cat),
          })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Default categories added");
    },
    onError: () => toast.error("Failed to seed categories"),
  });

  const handleEdit = (cat: Category) => {
    setEditCategory(cat);
    setShowDialog(true);
  };

  return (
    <>
      <Header
        title="Categories"
        description="Organize your expenses by renovation category"
        action={
          <div className="flex gap-2">
            {categories.length === 0 && (
              <Button
                variant="outline"
                onClick={() => seedMutation.mutate()}
                disabled={seedMutation.isPending}
              >
                {seedMutation.isPending ? <Loader2 className="mr-2 w-4 h-4 animate-spin" /> : null}
                Add Defaults
              </Button>
            )}
            <Button
              className="gap-2"
              onClick={() => { setEditCategory(null); setShowDialog(true); }}
            >
              <PlusCircle className="w-4 h-4" />
              Add Category
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <p className="text-muted-foreground">Loading categories...</p>
      ) : categories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
            <Tag className="w-10 h-10 text-muted-foreground" />
            <CardTitle className="text-base">No categories yet</CardTitle>
            <CardDescription>
              Add categories or use the defaults for flat renovation
            </CardDescription>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending}>
                Add Defaults
              </Button>
              <Button onClick={() => setShowDialog(true)}>Add Custom</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
          {categories.map((cat) => (
            <CategoryCard key={cat.id} category={cat} onEdit={handleEdit} />
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editCategory ? "Edit Category" : "Add Category"}
            </DialogTitle>
          </DialogHeader>
          <CategoryForm
            defaultValues={editCategory ?? undefined}
            categoryId={editCategory?.id}
            onSuccess={() => setShowDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
