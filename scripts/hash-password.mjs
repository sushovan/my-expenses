#!/usr/bin/env node
/**
 * Utility script to generate a bcrypt hash for a password.
 * Usage: node scripts/hash-password.mjs yourpassword
 * Then paste the output into APP_PASSWORD_HASH in .env.local
 */
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const bcrypt = require("bcryptjs");

const password = process.argv[2];

if (!password) {
  console.error("Usage: node scripts/hash-password.mjs <password>");
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);
// Escape $ so Next.js dotenv does not expand bcrypt hash segments as variables
const escaped = hash.replace(/\$/g, "\\$");
console.log("\nPaste this line into .env.local:\n");
console.log(`APP_PASSWORD_HASH="${escaped}"`);
console.log();
