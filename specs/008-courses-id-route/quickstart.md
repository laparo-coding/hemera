# Quickstart: `/courses/[id]` route

1. Verify Prisma model `Course` in `prisma/schema.prisma`
2. Create file `app/courses/[id]/page.tsx`
3. Fetch course data via Prisma and render in a Material UI Card
4. Implement error handling for invalid IDs (`notFound()`)
5. Write Playwright E2E test: `tests/e2e/courses-id.spec.ts`
6. Verify quality gates: lint, typecheck, build, test
