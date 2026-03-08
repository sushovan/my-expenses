/**
 * My Expenses - Personal Expense Tracker
 * Copyright (c) 2026 Sushovan Mukherjee <me@sushovan.in>
 * Defineway Technologies Private Limited
 * Licensed under the MIT License
 */
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Verifies against the single-user credentials stored in environment variables.
 * This avoids database dependency for the auth check in personal use mode.
 */
export async function verifyAppCredentials(
  username: string,
  password: string
): Promise<boolean> {
  const appUsername = process.env.APP_USERNAME;
  const appPasswordHash = process.env.APP_PASSWORD_HASH;

  if (!appUsername || !appPasswordHash) {
    throw new Error(
      "APP_USERNAME and APP_PASSWORD_HASH must be set in environment"
    );
  }

  if (username !== appUsername) return false;
  return verifyPassword(password, appPasswordHash);
}
