/**
 * My Expenses - Personal Expense Tracker
 * Copyright (c) 2026 Sushovan Mukherjee <me@sushovan.in>
 * Defineway Technologies Private Limited
 * Licensed under the MIT License
 */
import { PrismaClient } from "@/generated/prisma";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { resolve } from "path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getDbUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL environment variable is not set");

  // libSQL needs an absolute file path for local SQLite
  if (url.startsWith("file:./") || url.startsWith("file:../")) {
    const relativePath = url.replace(/^file:/, "");
    const absolutePath = resolve(process.cwd(), relativePath);
    return `file:${absolutePath}`;
  }

  return url;
}

function createPrismaClient(): PrismaClient {
  const dbUrl = getDbUrl();
  const adapter = new PrismaLibSql({ url: dbUrl });

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
