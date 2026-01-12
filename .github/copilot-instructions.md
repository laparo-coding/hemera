# hemera Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-12-07

## Communication Style

- **Language**: German (informal "Du" instead of formal "Sie")
- All user-facing text, labels, messages, and notifications use informal German
- Example: "Dein Kurs", "Lade deinen Lebenslauf hoch", "Deine Buchung"

## Active Technologies
- TypeScript 5+ with Next.js 15.5.6 (App Router) + React 18+, Material-UI v5, Clerk (auth), Prisma (ORM), Rollbar (monitoring) (014-create-an-admin)
- PostgreSQL with Prisma ORM for course data and enrollment relationships (014-create-an-admin)
- TypeScript 5+, Next.js 15.5.6 (App Router), React 18+ + MUI v5, Clerk (auth), Prisma (ORM), React Leaflet, Leafle (015-course-locations)
- TypeScript 5.x with Next.js 15.5.6 (App Router) + React 18, Material-UI v5, Clerk auth, Prisma ORM, Mux video SDK/API, Rollbar monitoring (016-course-assignments)
- PostgreSQL via Prisma models (course participation, documents, summary assets) (016-course-assignments)
- TypeScript 5.x, Next.js 15.5.6 (App Router), React 18+ + Material-UI v5, @mux/mux-player-react, Prisma ORM, Clerk (auth) (013-layout-improvement-course-detail-page)
- PostgreSQL via Prisma (Course model extension: `heroVideoPlaybackId`) (013-layout-improvement-course-detail-page)

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
- 013-layout-improvement-course-detail-page: Added TypeScript 5.x, Next.js 15.5.6 (App Router), React 18+ + Material-UI v5, @mux/mux-player-react, Prisma ORM, Clerk (auth)
- 016-course-assignments: Added TypeScript 5.x with Next.js 15.5.6 (App Router) + React 18, Material-UI v5, Clerk auth, Prisma ORM, Mux video SDK/API, Rollbar monitoring
- 015-course-locations: Added TypeScript 5+, Next.js 15.5.6 (App Router), React 18+ + MUI v5, Clerk (auth), Prisma (ORM), React Leaflet, Leafle

  skeleton, webpack cache fix)

## PR Review Process

- **QODO Code Suggestions**: Always review and consider implementing QODO PR code suggestions
  (qodo-code-review, qodo-merge bot comments) after opening a pull request. These automated
  suggestions often improve code quality, error handling, and test coverage.

### Constitutional Requirement: Qodo Error Review

**After every PR is opened, you MUST:**

1. **Wait for Qodo bot comments** - Look for comments from `qodo-code-review[bot]` and 
   `qodo-free-for-open-source-projects[bot]`
2. **Read PR Compliance Guide** - Check for 🔴 (red) security/compliance issues
3. **Read PR Code Suggestions** - Review improvement suggestions
4. **Fix all 🔴 issues** - Red compliance issues must be fixed before merge
5. **Implement high-impact suggestions** - Especially security and error handling improvements

**Qodo issues to always fix:**
- 🔴 Security Compliance issues (injection, data exposure, etc.)
- 🔴 Error Handling issues (generic errors, sensitive logging)
- 🔴 Data validation issues (missing input validation)

**How to check Qodo review:**
```bash
# Get PR comments with Qodo reviews
gh pr view <PR_NUMBER> --comments

# Or use the GitHub MCP tool:
mcp_github_github_pull_request_read with method="get_comments"
```

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
