/**
 * My Expenses - Personal Expense Tracker
 * Copyright (c) 2026 Sushovan Mukherjee <me@sushovan.in>
 * Defineway Technologies Private Limited
 * Licensed under the MIT License
 */
import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { internalApi, ApiError } from "@/lib/bff/client";
import { validateCsrf } from "@/lib/middleware/csrf";
import { checkRateLimit, UPLOAD_RATE_LIMIT } from "@/lib/middleware/rate-limit";
import {
  ensureUploadDirs,
  generateSafeFilename,
  verifyMimeType,
  validateFileSize,
  generateThumbnail,
  getUploadsDir,
} from "@/lib/utils/file";
import { writeFile } from "fs/promises";
import { join } from "path";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const csrf = validateCsrf(req);
  if (!csrf.valid) {
    return NextResponse.json({ error: "CSRF validation failed" }, { status: 403 });
  }

  const rl = checkRateLimit(req, "upload", UPLOAD_RATE_LIMIT);
  if (!rl.success) {
    return NextResponse.json({ error: "Upload rate limit exceeded" }, { status: 429 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const expenseId = formData.get("expenseId") as string | null;

  if (!file || !expenseId) {
    return NextResponse.json(
      { error: "file and expenseId are required" },
      { status: 400 }
    );
  }

  if (!validateFileSize(file.size)) {
    return NextResponse.json(
      { error: `File size exceeds maximum allowed (${process.env.MAX_FILE_SIZE_MB ?? 10}MB)` },
      { status: 413 }
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const mimeCheck = verifyMimeType(buffer, file.type);
  if (!mimeCheck.valid) {
    return NextResponse.json(
      { error: "File type not allowed. Upload images or PDFs only." },
      { status: 415 }
    );
  }

  await ensureUploadDirs();

  const safeFileName = generateSafeFilename(file.name);
  const uploadsDir = getUploadsDir();
  const filePath = join(uploadsDir, safeFileName);

  await writeFile(filePath, buffer);

  const thumbnailRelPath = await generateThumbnail(
    filePath,
    safeFileName,
    mimeCheck.detectedMime ?? file.type
  );

  try {
    const data = await internalApi.post("/receipts", {
      expenseId,
      fileName: safeFileName,
      originalName: file.name,
      filePath: safeFileName,
      thumbnailPath: thumbnailRelPath,
      mimeType: mimeCheck.detectedMime ?? file.type,
      sizeBytes: file.size,
    });
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
