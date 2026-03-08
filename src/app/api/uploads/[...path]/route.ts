/**
 * My Expenses - Personal Expense Tracker
 * Copyright (c) 2026 Sushovan Mukherjee <me@sushovan.in>
 * Defineway Technologies Private Limited
 * Licensed under the MIT License
 */
import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { join, normalize, resolve } from "path";
import { getUploadsDir } from "@/lib/utils/file";

/**
 * Auth-gated file serving route.
 * Receipts are stored outside /public and only served to authenticated users.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { path } = await params;
  const uploadsDir = getUploadsDir();

  // Prevent path traversal attacks
  const requestedPath = normalize(join(uploadsDir, ...path));
  const resolvedUploads = resolve(uploadsDir);
  const resolvedRequest = resolve(requestedPath);

  if (!resolvedRequest.startsWith(resolvedUploads + "/") &&
      resolvedRequest !== resolvedUploads) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const fileStat = await stat(resolvedRequest);
    if (!fileStat.isFile()) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Determine content type from extension
    const ext = resolvedRequest.split(".").pop()?.toLowerCase() ?? "";
    const contentTypeMap: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      pdf: "application/pdf",
      tiff: "image/tiff",
      heic: "image/heic",
      heif: "image/heif",
    };
    const contentType = contentTypeMap[ext] ?? "application/octet-stream";

    // Stream the file as response
    const stream = createReadStream(resolvedRequest);
    const chunks: Uint8Array[] = [];

    await new Promise<void>((resolve, reject) => {
      stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on("end", () => resolve());
      stream.on("error", reject);
    });

    const fileBuffer = Buffer.concat(chunks);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(fileStat.size),
        "Cache-Control": "private, max-age=3600",
        "Content-Disposition": "inline",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
