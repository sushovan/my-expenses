/**
 * My Expenses - Personal Expense Tracker
 * Copyright (c) 2026 Sushovan Mukherjee <me@sushovan.in>
 * Defineway Technologies Private Limited
 * Licensed under the MIT License
 */
import type { PaymentMethod, PaymentStatus, AccountType } from "@/types";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  UPI: "UPI",
  BANK_TRANSFER: "Bank Transfer",
  CASH: "Cash",
  CHEQUE: "Cheque",
  CARD: "Card",
  EMI: "EMI",
  OTHER: "Other",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  UNPAID: "Unpaid",
  PART_PAID: "Part Paid",
  PAID: "Paid",
};

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  UNPAID: "destructive",
  PART_PAID: "warning",
  PAID: "success",
};

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  ASSET: "Bank / Asset",
  LIABILITY: "Liability (Loan)",
  CASH: "Cash",
};

export const DEFAULT_CATEGORIES = [
  { name: "Civil / Masonry", color: "#8B7355" },
  { name: "Flooring", color: "#D4A853" },
  { name: "Electrical", color: "#F5A623" },
  { name: "Plumbing", color: "#4A90D9" },
  { name: "Painting", color: "#7ED321" },
  { name: "Carpentry / Furniture", color: "#9B59B6" },
  { name: "Tiles & Fixtures", color: "#E74C3C" },
  { name: "Doors & Windows", color: "#2ECC71" },
  { name: "Kitchen", color: "#E67E22" },
  { name: "Bathroom", color: "#1ABC9C" },
  { name: "Appliances", color: "#3498DB" },
  { name: "Labour / Contractor", color: "#95A5A6" },
  { name: "Interior Design", color: "#E91E63" },
  { name: "Miscellaneous", color: "#607D8B" },
];

export const PROJECT_PHASES = [
  "Kitchen",
  "Master Bedroom",
  "Bedroom 2",
  "Bedroom 3",
  "Living Room",
  "Dining Room",
  "Bathroom / WC",
  "Balcony",
  "Passage / Corridor",
  "Storage",
  "Entire Flat",
  "Other",
];

export const MAX_FILE_SIZE_BYTES = parseInt(
  process.env.MAX_FILE_SIZE_MB ?? "10"
) * 1024 * 1024;

export const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
  "image/tiff",
]);
