# hemera Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-01-15

## Communication Style

- **Language**: German (informal "Du" instead of formal "Sie")
- All user-facing text, labels, messages, and notifications use informal German
- Example: "Dein Kurs", "Lade deinen Lebenslauf hoch", "Deine Buchung"

## Active Technologies
- TypeScript 5.x with Next.js 15.5.6 (App Router) + React 18, Material-UI v5, Clerk auth, Prisma ORM, Rollbar monitoring (017-testimonial-management)
- PostgreSQL via Prisma models (Testimonial entity with admin approval workflow) (017-testimonial-management)
- TypeScript 5+ with Next.js 15.5.6 (App Router) + React 18+, Material-UI v5, Clerk (auth), Prisma (ORM), Rollbar (monitoring) (014-create-an-admin)
- PostgreSQL with Prisma ORM for course data and enrollment relationships (014-create-an-admin)
- TypeScript 5+, Next.js 15.5.6 (App Router), React 18+ + MUI v5, Clerk (auth), Prisma (ORM), React Leaflet, Leafle (015-course-locations)
- TypeScript 5.x with Next.js 15.5.6 (App Router) + React 18, Material-UI v5, Clerk auth, Prisma ORM, Mux video SDK/API, Rollbar monitoring (016-course-assignments)
- PostgreSQL via Prisma models (course participation, documents, summary assets) (016-course-assignments)
- Docker Compose 3.8+, Bash scripts + Docker Desktop, PostgreSQL 16, Prisma ORM (existing) (020-docker-postgres)
- PostgreSQL 16 via Docker container with optional persistent volumes (020-docker-postgres)
- TypeScript 5.x, Next.js 15.5.6 (App Router), React 18+ + Prisma ORM, Material-UI v5, Clerk auth, Loops.so SDK (new), Rollbar (021-learning-path)
- PostgreSQL via Prisma (existing schema extension) (021-learning-path)
- TypeScript 5.9, Next.js 16, React 19 + Jest, Playwright, @testing-library/react, Rollbar (022-test-coverage)
- PostgreSQL via Prisma 7.3 (022-test-coverage)

- TypeScript 5.x, Next.js 15.5.6, React 18+ + MUI v5+, Clerk (auth), Rollbar (monitoring), Prisma
  (ORM)

## Project Structure

```
src/
tests/
```

## Commands

npm test npm run lint

## Code Style

TypeScript 5.x, Next.js 15.5.6, React 18+: Follow standard conventions

## Database Naming Convention

All database tables and columns follow PostgreSQL naming standards with Prisma mapping:

| Layer | Convention | Example |
|-------|------------|---------|
| Prisma Models | PascalCase | `User`, `Course`, `Booking` |
| Prisma Fields | camelCase | `userId`, `createdAt`, `isPublished` |
| DB Tables | snake_case plural | `users`, `courses`, `bookings` |
| DB Columns | snake_case | `user_id`, `created_at`, `is_published` |

**Rules:**
- Use `@@map("table_name")` on every model to define the database table name
- Use `@map("column_name")` on fields where Prisma name differs from DB column
- Default currency is `EUR` (not USD)
- Always include `createdAt` and `updatedAt` timestamps on entities
- Use `cuid()` for primary key IDs

## Performance Guidelines

- **Deferred Loading**: Use `dynamic(() => import(...), { ssr: false })` for non-essential scripts
  (Rollbar, analytics)
- **Skeleton UI**: Provide `app/loading.tsx` for route groups to prevent CLS
- **SSR-First**: Keep Navigation, Hero, above-fold content server-rendered
- **Lazy Loading**: Use dynamic imports with loading states for below-fold content
- **Bundle Analysis**: Run `ANALYZE=true npm run build` periodically
- **Lighthouse CI**: Budgets defined in `.lighthouserc.json` (FCP < 1.8s, LCP < 2.5s, CLS < 0.1)

See `docs/performance/README.md` for detailed patterns.

## Recent Changes
- 022-test-coverage: Added TypeScript 5.9, Next.js 16, React 19 + Jest, Playwright, @testing-library/react, Rollbar
- 021-learning-path: Added TypeScript 5.x, Next.js 15.5.6 (App Router), React 18+ + Prisma ORM, Material-UI v5, Clerk auth, Loops.so SDK (new), Rollbar
- 020-docker-postgres: Added Docker Compose 3.8+, Bash scripts + Docker Desktop, PostgreSQL 16, Prisma ORM (existing)

## PR Review Process

- **CodeRabbit Reviews**: Always review and consider implementing CodeRabbit PR suggestions
  after opening a pull request. These automated suggestions improve code quality, error handling,
  security, and test coverage.

### Constitutional Requirement: CodeRabbit Review

**After every PR is opened, you MUST:**

1. **Wait for CodeRabbit comments** - Look for comments from `coderabbitai[bot]`
2. **Read the Walkthrough** - Understand the high-level summary of changes
3. **Review inline suggestions** - Check code comments for improvements
4. **Fix critical issues** - Security and error handling issues must be fixed before merge
5. **Implement high-impact suggestions** - Especially security, performance, and TypeScript improvements

**Issues to always fix:**
- 🔴 Security issues (injection, data exposure, auth bypasses)
- 🔴 Error Handling issues (unhandled exceptions, missing try/catch)
- 🔴 Type Safety issues (any types, missing validations)

**CodeRabbit commands in PR comments:**
```bash
# Trigger a new review
@coderabbitai review

# Resolve all comments
@coderabbitai resolve

# Ask a question about the code
@coderabbitai How does this function handle edge cases?

# Show help
@coderabbitai help
```

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
