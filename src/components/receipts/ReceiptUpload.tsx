/**
 * My Expenses - Personal Expense Tracker
 * Copyright (c) 2026 Sushovan Mukherjee <me@sushovan.in>
 * Defineway Technologies Private Limited
 * Licensed under the MIT License
 */
"use client";

import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Camera,
  FileUp,
  Loader2,
  Trash2,
  FileText,
  Eye,
} from "lucide-react";
import type { Receipt } from "@/types";

interface ReceiptUploadProps {
  expenseId: string;
  receipts: Receipt[];
}

function ReceiptThumbnail({ receipt }: { receipt: Receipt }) {
  const isImage = receipt.mimeType.startsWith("image/");
  const thumbnailSrc = receipt.thumbnailPath
    ? `/api/uploads/${receipt.thumbnailPath}`
    : isImage
      ? `/api/uploads/${receipt.filePath}`
      : null;

  return (
    <div className="relative group rounded-lg border overflow-hidden bg-muted w-28 h-28">
      {thumbnailSrc && isImage ? (
        <Image
          src={thumbnailSrc}
          alt={receipt.originalName}
          fill
          className="object-cover"
          unoptimized
        />
      ) : (
        <div className="flex flex-col items-center justify-center h-full gap-1 p-2">
          <FileText className="w-8 h-8 text-muted-foreground" />
          <span className="text-xs text-muted-foreground text-center truncate w-full">
            {receipt.originalName}
          </span>
        </div>
      )}

      {/* Overlay actions */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        <a
          href={`/api/uploads/${receipt.filePath}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded bg-white/20 hover:bg-white/40 text-white transition"
          onClick={(e) => e.stopPropagation()}
        >
          <Eye className="w-4 h-4" />
        </a>
      </div>

      {/* File size */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-xs px-1.5 py-0.5 text-center">
        {(receipt.sizeBytes / 1024).toFixed(0)} KB
      </div>
    </div>
  );
}

export function ReceiptUpload({ expenseId, receipts }: ReceiptUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [isDragging, setIsDragging] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("expenseId", expenseId);

      const res = await fetch("/api/bff/receipts", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Upload failed");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense", expenseId] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Receipt uploaded");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (receiptId: string) => {
      const res = await fetch(`/api/bff/receipts/${receiptId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense", expenseId] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Receipt removed");
    },
    onError: () => toast.error("Failed to remove receipt"),
  });

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => uploadMutation.mutate(file));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        }`}
      >
        {uploadMutation.isPending ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Uploading...</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-3">
              Drag & drop files here, or use the buttons below
            </p>
            <div className="flex gap-2 justify-center flex-wrap">
              {/* Camera capture — opens camera on mobile */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => cameraInputRef.current?.click()}
                className="gap-2"
              >
                <Camera className="w-4 h-4" />
                Take Photo
              </Button>

              {/* File picker */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2"
              >
                <FileUp className="w-4 h-4" />
                Upload File
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mt-2">
              JPG, PNG, WEBP, PDF, HEIC — max 10MB
            </p>
          </>
        )}
      </div>

      {/* Hidden inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Uploaded receipts */}
      {receipts.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2">
            {receipts.length} attachment{receipts.length !== 1 ? "s" : ""}
          </p>
          <div className="flex flex-wrap gap-3">
            {receipts.map((receipt) => (
              <div key={receipt.id} className="relative">
                <ReceiptThumbnail receipt={receipt} />
                <button
                  onClick={() => deleteMutation.mutate(receipt.id)}
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/80 transition z-10"
                  title="Remove receipt"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
            {uploadMutation.isPending && (
              <Skeleton className="w-28 h-28 rounded-lg" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
