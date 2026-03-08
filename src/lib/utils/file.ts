/**
 * My Expenses - Personal Expense Tracker
 * Copyright (c) 2026 Sushovan Mukherjee <me@sushovan.in>
 * Defineway Technologies Private Limited
 * Licensed under the MIT License
 */
import { randomUUID } from "crypto";
import { join, extname, basename } from "path";
import { mkdir, unlink } from "fs/promises";
import { existsSync } from "fs";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from "./constants";

// Magic bytes for MIME type verification (validates actual file content, not just extension)
const MAGIC_BYTES: Array<{
  mime: string;
  bytes: number[];
  offset?: number;
}> = [
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 },
  { mime: "application/pdf", bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  { mime: "image/tiff", bytes: [0x49, 0x49, 0x2a, 0x00] }, // Little-endian TIFF
  { mime: "image/tiff", bytes: [0x4d, 0x4d, 0x00, 0x2a] }, // Big-endian TIFF
];

export function getUploadsDir(): string {
  return process.env.UPLOADS_DIR
    ? join(process.cwd(), process.env.UPLOADS_DIR)
    : join(process.cwd(), "uploads");
}

export function getThumbnailsDir(): string {
  return join(getUploadsDir(), "thumbnails");
}

export async function ensureUploadDirs(): Promise<void> {
  const uploadsDir = getUploadsDir();
  const thumbsDir = getThumbnailsDir();
  if (!existsSync(uploadsDir)) await mkdir(uploadsDir, { recursive: true });
  if (!existsSync(thumbsDir)) await mkdir(thumbsDir, { recursive: true });
}

/**
 * Verifies MIME type by reading magic bytes from the buffer.
 * Falls back to declared MIME type if magic bytes match.
 */
export function verifyMimeType(
  buffer: Buffer,
  declaredMime: string
): { valid: boolean; detectedMime?: string } {
  if (!ALLOWED_MIME_TYPES.has(declaredMime)) {
    return { valid: false };
  }

  for (const magic of MAGIC_BYTES) {
    const offset = magic.offset ?? 0;
    const slice = buffer.slice(offset, offset + magic.bytes.length);
    const matches = magic.bytes.every((byte, i) => slice[i] === byte);
    if (matches) {
      return { valid: true, detectedMime: magic.mime };
    }
  }

  // HEIC/HEIF don't have simple magic bytes — allow if declared MIME matches
  if (
    declaredMime === "image/heic" ||
    declaredMime === "image/heif"
  ) {
    return { valid: true, detectedMime: declaredMime };
  }

  return { valid: false };
}

export function validateFileSize(sizeBytes: number): boolean {
  return sizeBytes <= MAX_FILE_SIZE_BYTES;
}

/**
 * Generates a safe, unique filename preserving only the extension.
 * Strips the original name to prevent path traversal.
 */
export function generateSafeFilename(originalName: string): string {
  const ext = extname(basename(originalName)).toLowerCase().slice(0, 10);
  const allowed = /^\.[a-z0-9]+$/;
  const safeExt = allowed.test(ext) ? ext : ".bin";
  return `${randomUUID()}${safeExt}`;
}

export async function deleteFile(filePath: string): Promise<void> {
  try {
    await unlink(filePath);
  } catch {
    // File may already be gone — log but don't throw
    console.error(`Could not delete file: ${filePath}`);
  }
}

/**
 * Generates a thumbnail from an image buffer using sharp.
 * Returns the thumbnail path, or null if the file is not an image.
 */
export async function generateThumbnail(
  sourcePath: string,
  fileName: string,
  mimeType: string
): Promise<string | null> {
  const imageTypes = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
    "image/tiff",
  ]);

  if (!imageTypes.has(mimeType)) return null;

  try {
    const sharp = (await import("sharp")).default;
    const thumbFileName = `thumb_${fileName.replace(extname(fileName), ".webp")}`;
    const thumbPath = join(getThumbnailsDir(), thumbFileName);

    await sharp(sourcePath)
      .resize(400, 400, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 75 })
      .toFile(thumbPath);

    return join("thumbnails", thumbFileName);
  } catch (err) {
    console.error("Thumbnail generation failed:", err);
    return null;
  }
}
