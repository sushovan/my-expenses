# My Expenses

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org)

A personal expense tracker built for tracking flat renovation costs. Features a multi-layer JWT + BFF security architecture, receipt uploads with camera capture, and detailed reporting.

**Author:** [Sushovan Mukherjee](mailto:me@sushovan.in) — [Defineway Technologies Private Limited](https://defineway.in)

---

## Features

- Track expenses with 13+ fields: description, category, payee, date, billed/paid/pending amounts, payment method, status, notes, and more
- Multiple payment accounts: bank accounts, cash, and liabilities (e.g. "Loan from Brother-in-Law")
- Receipt attachments: take a photo, scan a document, or upload any file
- Dashboard with summary cards and spending charts
- Filter and search expenses by category, status, date range, account
- Reports by category, month, payment method
- Change password from within the app (Settings page)
- Security: XSS, CSRF, rate limiting, JWT never exposed to browser

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: SQLite via Prisma ORM
- **Auth**: iron-session (session cookie) + jose (JWT) + bcryptjs
- **UI**: shadcn/ui + Tailwind CSS
- **Forms**: react-hook-form + Zod
- **Charts**: Recharts

## Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)

## Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Copy env template and fill in your values
cp .env.example .env.local

# 3. Run database migrations
pnpm db:migrate

# 4. Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with the credentials from your `.env.local`.

## Default Login

- **Username**: `admin`
- **Password**: `admin123`

> **Change the password immediately after first login** via Settings → Change Password in the sidebar.
>
> Or generate a new hash manually:
> ```bash
> node scripts/hash-password.mjs yournewpassword
> ```
> The script outputs the full `APP_PASSWORD_HASH="..."` line (with `$` signs escaped) — paste it directly into `.env.local` and restart.
>
> **Note:** Next.js 16 expands `$VAR` in env files, so bcrypt hashes must use `\$` instead of `$` (the script handles this automatically).

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | SQLite file path (e.g. `file:./prisma/dev.db`) |
| `JWT_SECRET` | Secret for signing JWTs (min 32 chars) |
| `SESSION_SECRET` | Secret for iron-session cookie (min 32 chars) |
| `APP_USERNAME` | Login username |
| `APP_PASSWORD_HASH` | bcrypt hash of login password |
| `UPLOADS_DIR` | Directory for receipt file storage |
| `MAX_FILE_SIZE_MB` | Max upload size in MB (default: 10) |

## Architecture

```
Browser (React UI)
    ↕  HTTPS + HttpOnly session cookie
BFF Layer (/api/bff/*)
    — session validation, rate limiting, CSRF protection
    ↕  Bearer JWT (server-to-server only)
Internal API (/api/v1/*)
    — JWT validation, business logic, Prisma queries
    ↕
SQLite Database + /uploads/ folder
```

JWT tokens are **never sent to the browser**. The browser holds only an encrypted session cookie. The BFF resolves the JWT server-side and attaches it to internal API calls.

## Database Scripts

```bash
pnpm db:migrate       # Apply migrations (dev)
pnpm db:studio        # Open Prisma Studio (visual DB browser)
pnpm db:reset         # Reset database (dev only — destructive!)
```

## Upgrading to Multi-User / PostgreSQL

1. Change `DATABASE_URL` to a PostgreSQL connection string in `.env.local`
2. Update `prisma/schema.prisma` datasource provider to `postgresql`
3. Add a user registration flow and remove the single-user env var auth
4. Run `pnpm db:migrate`

## Project Structure

```
src/
├── app/
│   ├── (auth)/login/          — login page
│   ├── (dashboard)/           — all protected pages
│   │   ├── page.tsx           — dashboard
│   │   ├── expenses/          — expense list, create, detail
│   │   ├── accounts/          — payment accounts
│   │   ├── categories/        — expense categories
│   │   ├── reports/           — spending reports
│   │   └── settings/          — change password
│   └── api/
│       ├── bff/               — browser-facing API (session auth)
│       └── v1/                — internal API (JWT auth)
├── components/
│   ├── ui/                    — shadcn/ui components
│   ├── expenses/              — expense-specific components
│   ├── receipts/              — receipt upload component
│   └── layout/                — sidebar, header
└── lib/
    ├── auth/                  — JWT + session helpers
    ├── bff/                   — BFF → internal API client
    ├── middleware/            — rate limit, CSRF, auth guard
    ├── validation/            — Zod schemas
    └── db/                    — Prisma client singleton
```

---

## License

MIT © 2026 [Sushovan Mukherjee](mailto:me@sushovan.in) — [Defineway Technologies Private Limited](https://defineway.in)
