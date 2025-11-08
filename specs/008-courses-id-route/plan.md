# Plan: Courses [id] route

## Goal

Implement a dynamic Next.js route `/courses/[id]` that renders course details from the database.

## Steps

1. Verify data model (Prisma: Course)
2. Create `app/courses/[id]/page.tsx` with dynamic fetch
3. E2E test: `tests/e2e/courses-id.spec.ts` validates routing and rendering
4. API hardening: error handling for invalid IDs
5. UI: Material UI Card for course details

## Quality gates

- TypeScript, ESLint, Prettier, E2E test, build

## Constitution check

- Test-first, error handling, auth (if protected), quality gates
