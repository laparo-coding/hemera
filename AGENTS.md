# Repository Guidelines

## Project Structure & Module Organization

- `app/` holds the Next.js App Router surface (landing page, auth flows, bookings, admin panels, API
  routes under `app/api/*`).
- `components/` provides reusable UI framed around course, booking, monitoring, and admin features.
- `lib/` is the domain core: database adapters (`lib/db/prisma.ts`), service orchestration, schema
  validation, analytics, monitoring, and utility helpers.
- `prisma/` contains the Prisma schema, migrations, and seed scripts; `.env.local` drives the target
  Postgres instance.
- `tests/` mirrors product layers: `unit/`, `contracts/` (API/behavioral), and `e2e/` (Playwright).
- `docs/`, `specs/`, and `plans/` codify the specs-first workflow and ops guidance; automation lives
  in `scripts/`.

## Build, Test, and Development Commands

```bash
# Launch dev server with video sync helper
npm run dev

# Type-safe production build with env + migrations gate
npm run build

# Run the production server (after build)
npm run start

# Quality gates
npm run lint      # Biome lints & formats
npm run typecheck # tsc --noEmit
npm run test      # Jest unit + contract suite
npm run test:e2e  # Playwright UI/E2E suite
npm run db:migrate # Prisma migrations against local env
```

## Coding Style & Naming Conventions

- **Indentation**: 2 spaces (Biome-enforced), LF endings, 80 char line width.
- **File naming**: App routes follow the directory-as-route convention (e.g., `app/courses/[slug]`),
  React components are `PascalCase.tsx`, tests are `*.spec.ts`.
- **Function/variable naming**: camelCase for functions/constants, UPPER_SNAKE for env toggles.
- **Linting**: Biome handles lint + format (`npm run lint`, `npm run format`). Jest/Playwright configs
  live at repo root for deterministic imports.

## Testing Guidelines

- **Frameworks**: Jest (unit + contract) with `ts-jest` ESM preset, Playwright for E2E/UX, Prisma
  Testcontainers for DB-heavy specs.
- **Test files**: `tests/unit/**/*.spec.ts`, `tests/contracts/**/*.spec.ts`, and
  `tests/e2e/**/*.spec.ts` (Playwright auto-discovers).
- **Running tests**: `npm run test`, `npm run test:contracts`, `npm run test:e2e`, or targeted
  `npx playwright test tests/e2e/dashboard.spec.ts`.
- **Coverage**: Jest collects V8 coverage for `lib/**`; Playwright stores traces/videos on failure.

## Commit & Pull Request Guidelines

- **Commit format**: Conventional prefixes with scope + PR reference, e.g.,
  `docs: remove obsolete ESLint migration plan (#398)` or
  `feat(019): Complete OpenAPI-Postman implementation (#399)`.
- **PR process**: Specs-first workflow (spec → plan → tasks) must be followed; monitor every deploy
  workflow live per constitution. Wait for Qodo PR Agent reviews, fix all 🔴 compliance issues, and
  note branch cleanup in the PR.
- **Branch naming**: Align with spec IDs (`021-learning-path`, etc.) and delete merged branches per
  `docs/ops/branch-hygiene.md` after production deploy.

---

## 🎯 Repository Overview

Hemera is a specs-first Next.js platform for the Hemera Academy, delivering course discovery,
bookings, and admin tooling backed by Stripe payments, Clerk auth, and Prisma/Postgres data.

**Key responsibilities:**

- Serve a premium marketing site and academy landing experience with SEO metadata.
- Orchestrate bookings, prerequisite learning paths, and PRE_BOOKED approval workflows.
- Provide admin dashboards, monitoring, and automated quality gates for deployments.

---

## 🏗️ Architecture Overview

### System Context

```
Prospective Student → Next.js App (app/*) → Prisma Client → Vercel Postgres
                                      ↓
                           Stripe / Clerk / Loops / Rollbar
```

### Key Components

- **App Router surfaces (`app/`):** Route groups for public academy pages, protected dashboards,
and API handlers (`app/api/*`) that expose booking, payment, monitoring, and health endpoints.
- **Domain services (`lib/`):** Course, booking, and learning-path orchestration (`lib/api`,
`lib/services`, `lib/analytics`) plus env, monitoring, and middleware utilities.
- **Data access (`prisma/`, `lib/db/prisma.ts`):** Prisma 7 client with Accelerate in production and
a pg adapter fallback for CI/local flows; seeds and migrations align with specs-first deliverables.
- **Quality + Ops (`tests/`, `docs/`, `scripts/`):** Jest + Playwright suites, ops runbooks, and task
scripts that enforce deploy readiness and tooling automation.

### Data Flow

1. Visitor hits a Next.js route (e.g., `app/courses/[slug]`) or API endpoint under `app/api/*`.
2. Server actions/services call Prisma helpers (for courses, bookings, participations) via
   `lib/api/*` and `lib/db/prisma`.
3. Domain services integrate with Clerk (auth), Stripe (checkout/webhooks), Rollbar (error logging),
   and Loops (transactional emails) using secrets from `.env.local`.
4. Responses render React components or JSON payloads; monitoring hooks log request IDs and build
   metadata (`app/api/health/route.ts`).

---

## 📁 Project Structure [Partial Directory Tree]

```
hemera/
├── app/                     # Next.js App Router pages, layouts, and API routes
│   ├── academy/             # Public academy flows
│   ├── admin/               # Protected admin dashboards
│   ├── api/                 # Route handlers (bookings, checkout, health, stripe, etc.)
│   └── (auth|courses|dashboard|locations|my-courses)/
├── components/             # UI building blocks (landing, booking, monitoring, payment)
├── lib/                    # Domain logic: actions, analytics, api, auth, db, monitoring
├── prisma/                 # Prisma schema, migrations, seed.ts, local dev db
├── scripts/                # Maintenance + ops scripts (migrations, seeds, diagnostics)
├── docs/                   # Developer, ops, monitoring, and feature documentation
├── specs/                  # Specs-first feature folders (001-021 ...)
├── tests/                  # unit/, contracts/, e2e/ suites w/ Playwright helpers
├── public/                 # Static assets served by Next.js
└── types/, cspell.config.*, biome.json, jest.config.ts, playwright.config.ts
```

### Key Files to Know

| File | Purpose | When You'd Touch It |
|------|---------|---------------------|
| `app/page.tsx` | Landing page fetching featured courses | Update marketing hero or data mapping |
| `app/api/health/route.ts` | Health endpoint exposing build/version metadata | Monitor uptime probes or add diagnostics |
| `lib/api/courses.ts` | Server-side course data access helpers | Modify fetching, availability, curriculum logic |
| `lib/db/prisma.ts` | Prisma client factory (Accelerate vs pg adapter) | Adjust DB connection strategy or close hooks |
| `lib/env.ts` | Centralized env schema/validation | Add new env vars or tighten validation |
| `prisma/schema.prisma` | Data model + relations | Introduce fields/entities before running migrations |
| `scripts/deploy-migrations.mjs` | Build gate ensuring DB migrations are applied | Update migration rollout before `npm run build` |
| `tests/setup.ts` | Jest global hooks (DB cleanup, env toggles) | Extend test fixtures or teardown logic |
| `playwright.config.ts` | E2E runner config (workers, retries, env) | Calibrate E2E reliability or base URL |
| `docs/ops/branch-hygiene.md` | Branch cleanup process | Reference after merges/deploys |
| `README.md` | Specs-first workflow + ops guardrails | Onboard newcomers or adjust workflow narrative |

---

## 🔧 Technology Stack

### Core Technologies

- **Language:** TypeScript 5.9 (strict ESM) for both React UI and Node scripts.
- **Framework:** Next.js 16 App Router with React 19 for hybrid SSR/ISR and API routes.
- **Database:** Vercel Postgres via Prisma 7.5.0 (Accelerate in prod, pg adapter locally/Testcontainers).
- **Styling/UI:** MUI 7, Emotion 11, custom theme tokens (`lib/theme.ts`, `components/ThemeRegistry`).

### Key Libraries

- **Clerk (`@clerk/nextjs`):** Authentication + user profiles across app/admin areas.
- **Stripe (`@stripe/stripe-js`, `stripe`):** Checkout + webhooks for paid courses.
- **Playwright + Jest:** High-signal E2E and unit/contract verification.
- **Rollbar / web-vitals / next-video:** Monitoring, performance analytics, and video asset support.
- **Loops SDK:** Transactional email automation for learning-path workflows.

### Development Tools

- **Biome:** Unified formatter/linter (indent, quotes, imports).
- **Prisma CLI:** Schema generation, migrations, and seeds.
- **Husky + lint-staged:** Pre-commit enforcement for Biome + cspell.

---

## 🌐 External Dependencies

### Required Services

- **Clerk:** Auth provider; requires `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`.
- **Stripe:** Payments/webhooks; `scripts/check-stripe-key.mjs` validates keys before deployments.
- **Vercel Postgres:** Primary data store, accessed via Prisma (`DATABASE_URL`, optional
  `PRISMA_ACCELERATE_URL`).
- **Rollbar:** Error monitoring toggled by `NEXT_PUBLIC_ROLLBAR_ENABLED`.
- **Loops.so:** Transactional emails for PRE_BOOKED notifications (`LOOPS_API_KEY`).

### Optional Integrations

- **Vercel Protection bypass tokens:** Used by Playwright via `x-vercel-protection-bypass` header.
- **Mux / next-video:** Managed video assets if marketing pages require streaming.

### Environment Variables

```bash
# Authentication & monitoring
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_DISABLE_CLERK=0|1
NEXT_PUBLIC_ROLLBAR_ENABLED=0|1

# Database
DATABASE_URL=postgres://...
PRISMA_ACCELERATE_URL=https://...
PGSSL=true|false

# Email + workflows
LOOPS_API_KEY=loops_xxx
E2E_TEST=0|1  # toggles mocks/fixtures for tests
```

---

## 🔄 Common Workflows

### Specs-first Feature Delivery

1. Draft feature spec under `specs/<id-slug>/spec.md`.
2. Produce `plan.md` and `tasks.md` before writing code.
3. Implement app/lib/prisma changes following tasks; keep docs updated (`docs/features/*`).
4. Run quality gates (`npm run lint`, `npm run typecheck`, `npm run test:all`, `npm run build`).
5. Open PR, monitor automated reviews/deploys, document branch cleanup post-merge.

**Code path:** `specs/*` → `plans/` → implementation in `app/*` + `lib/*` + `prisma/*`.

### PRE_BOOKED Learning Path Review

1. User books an intermediate/advanced course without prerequisites → booking flagged PRE_BOOKED via
   `lib/services/learning-path` and persisted through Prisma.
2. Loops sends admin/customer emails from templates listed in README.
3. Admin reviews pending bookings at `/admin/bookings/pending` (feature TODO for UI) and updates via
   API routes under `app/api/admin/*`.

**Code path:** `app/checkout/*` → `lib/api/courses & bookings` → `app/api/bookings`.

---

## 📈 Performance & Scale

### Performance Considerations

- Playwright `performance.spec.ts` guards Core Web Vitals; server analytics live in
  `lib/analytics/request-analytics.ts` with test-friendly schedulers.
- `next-video` + MUI theme tokenization keep landing visuals optimized by default.

### Monitoring

- Build metadata derived from `instrumentation.ts` + `lib/buildInfo.ts` and surfaced via
  `/api/health` for uptime probes.
- Rollbar + custom monitoring components (`components/monitoring`, `lib/monitoring`) log runtime
  errors; `docs/monitoring/` provides escalation steps.

---

## 🚨 Things to Be Careful About

### 🔒 Security Considerations

- Sensitive env files (real secret-bearing files like `.env.local`, `.env.production`, `.env`) are ignored and must never contain real secrets committed to the repository. Example/placeholder files that contain NO real secrets (for example `.env.example` or `.env.local.example`) are allowed to be committed and should contain only placeholder values or explanatory comments.
  - Do not commit real tokens, private keys, or credentials in any `.env*` file.
  - Use committed example files to document required variables and formats only (placeholders or commented guidance).
- Stripe + Clerk secrets must be present before running DB migrations or E2E flows; `scripts/db-*`
  guard destructive commands (`db:reset` disabled by default).
- Request logging assigns IDs (`lib/utils/request-id.ts`) so correlate API + frontend traces without
  leaking PII; avoid logging user payloads verbatim.
- Rollbar and Loops calls are retried but should not block checkout; handle fallbacks gracefully.

*Update to last commit: c500c1743f34f39d027c8001d82f242f533f289b*
