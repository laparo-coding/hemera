# Tasks: 001-vercel-postgres-prisma-setup

Legend:

- [P] = parallelizable
- Output MUST keep docs/tests green (markdownlint, cspell, link-check)
- Follow TDD: write failing tests before implementation

## Phase 2 — Tests and Contracts First

1. [x] Contracts: Validate OpenAPI `contracts/openapi.yaml` with a linter (no changes to source).
       (Spectral pass)
2. [x] Tests: Create contract test skeletons (no runtime) under
       `specs/001-vercel-postgres-prisma-setup/contracts/tests/` that assert example shapes for:
   - GET `/api/health` returns `{ status: 'ok' }`
   - GET `/api/auth/providers` returns `{ providers: string[] }`
3. [x] Tests: Draft integration test plan (text-only) in `quickstart.md` to map acceptance scenarios
       to future Playwright flows.
4. [x] Data model tests: Create Prisma schema validation step placeholder (describe checks) under
       `data-model.md` (no code changes required).

## Phase 3 — App Scaffolding and Configuration

1. [x] Init Next.js App Router project structure with TypeScript and minimal scripts (no feature
       logic yet):
   - `package.json` (scripts: dev, build, start, lint, test)
   - `next.config.ts`, `tsconfig.json`, `.eslintrc.json` (lint compatible with markdownlint setup)
   - App dir: `app/page.tsx` (placeholder), `app/layout.tsx` (MUI theme provider scaffold)
2. [x] Add MUI baseline: install `@mui/material @mui/icons-material @emotion/react @emotion/styled`
       and create `theme.ts` with accessible defaults (WCAG 2.1 AA intent).
3. [x] Create health route to satisfy contract: `app/api/health/route.ts` with `{ status: 'ok' }`.
4. [x] Create `app/api/auth/providers/route.ts` (temporary static list) that returns providers from
       config (will be wired to NextAuth options later).
5. [x] Prepare environment handling:
   - Add `env.ts` helper to read/validate required envs (DATABASE_URL, NEXTAUTH_SECRET, etc.).
   - Respect `NEXT_PUBLIC_APP_URL` and per-env `NEXTAUTH_URL`.

## Phase 4 — Data Layer (Prisma + Postgres)

1. [x] Add `prisma/schema.prisma` with Postgres provider and models: `User`, `Account`,
       `VerificationToken` (no `Session`).
2. [x] Add `lib/db/prisma.ts` singleton client (guard against hot-reload leaks).
3. Migrations: run `prisma migrate dev` to generate baseline migrations. [X]
4. [x] Partial unique index for email: add raw SQL migration to enforce unique email where email IS
       NOT NULL per `research.md` appendix.
5. Seed: `prisma/seed.ts` minimal (no PII) to validate sign-in flows. [X]

## Phase 5 — Auth (NextAuth.js)

1. [x] Add NextAuth config `lib/auth/options.ts` supporting providers: Email, Google, Apple,
       Instagram; JWT sessions; link accounts via `(provider, providerAccountId)`.
2. [x] Add route `app/api/auth/[...nextauth]/route.ts` with `export const runtime = 'nodejs'` and
       NextAuth handler using `PrismaAdapter`.
3. [x] Implement `app/api/auth/providers/route.ts` to return active providers from NextAuth options
       (replace temporary static list).
4. [x] Protected page: add `app/protected/page.tsx` and guard via server-side session check;
       redirect unauthenticated users to sign-in.
5. Handle provider missing email: ensure adapter and callbacks create/link users via
   `(provider, providerAccountId)` without duplicates. (Covered by adapter + unique constraint;
   validate during E2E)
6. Magic link errors: user-friendly error page for invalid/expired email link. [X]

## Phase 6 — Preview DB per PR (Neon + Vercel)

1. Scripts: `scripts/preview/provision-db.js` to create schema per PR, run migrate + seed; log
   schema. [X]
2. Scripts: `scripts/preview/teardown-db.js` to drop preview schema and log verification. [X]
3. CI wiring: add GitHub Actions workflow calling preview scripts on `pull_request` open/synchronize
   and close/merged; uses secret `PREVIEW_DATABASE_URL`. [X]
4. Vercel env: use pooled DSN with `?sslmode=require` (no `schema` parameter in Vercel; app sets
   schema at runtime), document in `docs/ops/vercel.md`. [X]
5. Auto-detect preview schema on Vercel (`hemera_pr_<PR_ID>` via `VERCEL_ENV` +
   `VERCEL_GIT_PULL_REQUEST_ID`), with manual overrides (`PREVIEW_SCHEMA`/`PR_SCHEMA`). [X]

## Phase 7 — UI/A11y and Theming

1. [x] Apply MUI theme and layout to sign-in and protected pages; basic components align with
       Material patterns.
2. [x] A11y smoke test checklist added to `quickstart.md` (labels, color contrast, focus
       management).

## Phase 8 — Polishing and Validation

1. Replace temporary providers endpoint test stubs to hit real handler; update contract tests
   accordingly.
2. [x] Add basic logging around auth events and preview DB lifecycle.
3. Validate governance: run markdownlint, link-check, and cspell; fix any issues introduced.
4. Update `spec.md` checklist boxes once acceptance scenarios demonstrably pass (documentation-only
   change).
5. [x] Performance: run Lighthouse CI against preview deployment with budgets (fail on regression).
6. [x] Performance: Web Vitals goals and approach documented in `docs/ops/performance.md`.

## Notes

- All secrets remain out of VCS; use `.env.local` for dev and Vercel Project Env for preview/prod.
- Ensure `app/api/auth/[...nextauth]/route.ts` is Node runtime to satisfy Prisma/NextAuth
  constraints on Vercel.
- Prefer Neon integration for automatic DB provisioning in previews when available; scripts should
  be idempotent and safe.
