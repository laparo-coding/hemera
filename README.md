# Hemera – Specs-first Workspace

This repository is currently in a planning/documentation phase. Features are defined and refined
under `specs/` using a specs-first workflow. Implementation follows a structured approach with
automated code review and quality assurance through Qodo PR Agent integration.

Note: The API field `price` uses integer cents (EUR) in this codebase. Example: `9999` equals `€99.99`.

## Prerequisites

- **Node.js**: >= 20.0.0 (see `engines` in package.json, `.nvmrc` for pinned version)
- **npm**: >= 9.0.0

Run `nvm use` to switch to the correct Node version automatically.

## Workflow

1. Specify a feature in `specs/<###-slug>/spec.md`.
2. Plan the implementation in `plan.md` (no code changes; no `tasks.md` created yet).
3. Generate tasks (`tasks.md`) for the feature (separate step).
4. Implement strictly following the tasks and constitution.

See `.github/prompts/*.prompt.md` and `.specify/templates/*` for automation guidance.

## Quality Gates (Docs)

Automated checks run on pull requests and on main:

- Markdown lint: `.markdownlint.jsonc`
- Spell check (cspell): `.cspell.json`
- Link check (lychee): `.lychee.toml`

Workflows live in `.github/workflows/` and are tuned to be helpful but not noisy. If a check fails,
address the reported issues or amend the configuration where appropriate.

## Deployment Pipeline

Structured CI/CD pipeline enforces constitutional quality gates:

### Quality Gates (Code)

All deployments must pass:

- TypeScript compilation (`npx tsc --noEmit`)
- Prettier formatting (`npm run format:check`)
- ESLint validation (`npm run lint:ci`)
- Unit tests (`npm test`)
- Build verification (`npm run build`)

### Deployment Process

- **Pull Requests**: Automatic preview deployment to Vercel with unique URL
- **Main Branch**: Production deployment to Vercel after all quality gates pass
- **Post-Deployment**: E2E tests run against live production environment
- **Rollback**: Immediate rollback capability for failed deployments

See `.github/workflows/deploy.yml` for complete pipeline configuration.

### Live Monitoring (Constitutional Requirement)

All Deploy workflows (Preview and Production) MUST be actively monitored using the official GitHub
Actions VS Code extension:

- Keep the workflow run view open and follow logs until completion
- Verify final status and collect the deployment URL
- Review artifacts (e.g., Playwright report) when present

Failure to monitor constitutes a process violation per the constitution
(`.specify/memory/constitution.md`).

## Ops / Runbooks

- Branch Hygiene: `docs/ops/branch-hygiene.md`
- Route Cleanup & Redirects: `docs/ops/route-cleanup-redirects.md`
- Linear MCP Server: `docs/ops/linear-mcp.md`

## Structure

- `specs/001-...` – Database/Auth/UI baseline (plan-only enforced)
- `specs/002-...` – Public SEO pages
- `specs/003-...` – Protected area shell
- `specs/004-...` – Bookings basics
- `specs/005-...` – Access segmentation middleware
- `specs/006-...` – Observability baseline
- `specs/007-public-academy` – Public academy info and bookable courses

## Notes

- Constitution is in `/.specify/memory/constitution.md`.
- Keep documentation in English.
- Use Material Design (MUI) when UI work begins.
- Stripe integration for secure payment processing and course enrollment.
- All payment flows must use Stripe test mode during development.

## Local Development Tips

- Ensure valid Clerk keys are set in your local env file for authentication flows. Example for
  `.env.local`:
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY`
  - `CLERK_SECRET_KEY=YOUR_SECRET_KEY`

  Do not commit real keys. `.gitignore` already excludes `.env*` files.

## Learning Path & Email Notifications (021)

The Learning Path feature uses [Loops.so](https://loops.so/) for transactional emails.

### Required Environment Variables

```bash
# .env.local
LOOPS_API_KEY=loops_xxxxx  # Get from Loops.so Dashboard → API
```

### Transactional Email Templates

Create the following templates in your Loops.so dashboard:

| Template ID | Purpose | Variables |
|-------------|---------|-----------|
| `prerequisite-review` | Admin notification for PRE_BOOKED booking | `customerName`, `courseTitle`, `adminUrl` |
| `booking-rejected` | Customer rejection notice | `firstName`, `courseTitle` |

### Feature Behavior

- **PRE_BOOKED Status**: Applied when unqualified users book INTERMEDIATE/ADVANCED courses
- **Admin Review**: Pending bookings visible at `/admin/bookings/pending`
- **Silent Failure**: Email failures are logged to Rollbar but don't block booking flow

## Tests & Troubleshooting

- Jest not exiting? Check for open handles:
  - Run tests with `--detectOpenHandles` to identify hanging timers/handles.
  - This repo had a global auto-cleanup interval in `lib/analytics/request-analytics.ts`. It is
    disabled in test/E2E environments and can be explicitly stopped via
    `stopRequestAnalyticsScheduler()`.
  - If you introduce global timers, ensure they are gated during tests (`NODE_ENV === 'test'` or
    `JEST_WORKER_ID`) or cleaned up in a teardown.
  - Database/containers: If you use Testcontainers, ensure proper teardown (`afterAll`) and call
    `closeDb()` from `lib/db/prisma` after DB tests for clean pool shutdown.

## Prisma v7 Setup

- Uses `prisma-client-js` generator (standard Prisma Client in `node_modules/@prisma/client`).
- Import Prisma types/enums via `@prisma/client`.
- Always use the shared client `prisma` from `lib/db/prisma` with `@prisma/adapter-pg`.
- Close resources in scripts/tests with `closeDb()`.
- Optional SSL: set `PGSSL=true` to enable SSL for the pg Pool.

<!-- chore: trigger production deploy 2025-10-29T17:43:30Z -->
