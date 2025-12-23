# hemera Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-12-07

## Active Technologies
- TypeScript 5+ with Next.js 15.5.6 (App Router) + React 18+, Material-UI v5, Clerk (auth), Prisma (ORM), Rollbar (monitoring) (014-create-an-admin)
- PostgreSQL with Prisma ORM for course data and enrollment relationships (014-create-an-admin)
- TypeScript 5+, Next.js 15.5.6 (App Router), React 18+ + MUI v5, Clerk (auth), Prisma (ORM), React Leaflet, Leafle (015-course-locations)

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
- 015-course-locations: Added TypeScript 5+, Next.js 15.5.6 (App Router), React 18+ + MUI v5, Clerk (auth), Prisma (ORM), React Leaflet, Leafle
- 014-create-an-admin: Added TypeScript 5+ with Next.js 15.5.6 (App Router) + React 18+, Material-UI v5, Clerk (auth), Prisma (ORM), Rollbar (monitoring)

- 012-performance-improvement: Performance optimizations (deferred MonitoringInit, loading.tsx
  skeleton, webpack cache fix)

## PR Review Process

- **QODO Code Suggestions**: Always review and consider implementing QODO PR code suggestions
  (qodo-code-review, qodo-merge bot comments) after opening a pull request. These automated
  suggestions often improve code quality, error handling, and test coverage.

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
