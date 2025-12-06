# hemera Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-12-03

## Active Technologies

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

- 012-performance-improvement: Performance optimizations (deferred MonitoringInit, loading.tsx
  skeleton, webpack cache fix)
- 011-redesign-dashboard-in: Dashboard redesign with premium feminine design
- 010-layout-improvement: Premium feminine landing page and navigation

## PR Review Process

- **QODO Code Suggestions**: Always review and consider implementing QODO PR code suggestions
  (qodo-code-review, qodo-merge bot comments) after opening a pull request. These automated
  suggestions often improve code quality, error handling, and test coverage.

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
