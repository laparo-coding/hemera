# hemera Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-01-15

## Communication Style

- **Language**: German (informal "Du" instead of formal "Sie")
- All user-facing text, labels, messages, and notifications use informal German
- Example: "Dein Kurs", "Lade deinen Lebenslauf hoch", "Deine Buchung"

## Active Technologies
- TypeScript 5.9, Next.js 16 (App Router), React 19
- Material-UI v5, Clerk auth, Prisma 7.3 ORM, PostgreSQL 16, Rollbar monitoring
- Vercel Blob storage (@vercel/blob), HTML sanitization (sanitize-html)
- Jest, Playwright, @testing-library/react
- Loops.so SDK (transactional emails), Mux video SDK/API
- React Leaflet (course locations)
- Docker Compose 3.8+ (local PostgreSQL)

## Project Structure

```
app/       # Next.js App Router pages, layouts, API routes
components/ # Reusable UI components
lib/       # Domain logic, services, utilities
prisma/   # Schema, migrations, seeds
tests/     # unit/, contracts/, e2e/
```

## Commands

npm test npm run lint

## Code Style

Follow standard TypeScript/Next.js/React conventions (see AGENTS.md for details)

## Database Naming Convention

All database tables and columns follow PostgreSQL naming standards with Prisma mapping:

| Layer | Convention | Example |
|-------|------------|----------|
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
- 026-course-material-integration: Vercel Blob storage, HTML sanitization, course material upload/management
- 024-admin-dashboard: Admin dashboard UI and management features
- 022-test-coverage: Jest + Playwright test infrastructure

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