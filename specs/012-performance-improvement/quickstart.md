# 012 - Performance Improvement: Quickstart

**Feature**: 012-performance-improvement  
**Date**: 2025-12-03  
**Status**: ✅ Complete

---

## Prerequisites

- Node.js 18+
- npm 9+
- Chrome DevTools for performance profiling
- `.env.local` configured with required environment variables

---

## Quick Validation Steps

### 1. Initial Setup

```bash
# Switch to the performance branch
git checkout 012-performance-improvement

# Install dependencies
npm install

# Start development server
npm run dev
```

### 2. Measure Baseline Performance

Before any changes, capture current metrics:

```bash
# Build and start production server
npm run build
npm run start

# In another terminal, run Lighthouse
npx lighthouse http://localhost:3000 --output=json --output-path=./baseline-lighthouse.json
```

### 3. Verify Build Completes Without Warnings

```bash
npm run build 2>&1 | grep -i "webpack.cache.PackFileCacheStrategy"
# Should return nothing after optimization
```

### 4. Bundle Analysis

```bash
# Build and analyze bundle
ANALYZE=true npm run build
```

### 5. Check Rollbar Deferred Loading

Open DevTools Network tab, filter by "rollbar":

- [x] Rollbar scripts should NOT load before LCP
- [x] Rollbar scripts load after `window.load` event (via `ssr: false` dynamic import)

### 6. Validate Lazy Loading

Scroll down the landing page:

- [x] Below-fold sections load as you scroll
- [x] No layout shift when sections appear
- [x] Skeleton/placeholder visible before content loads (app/loading.tsx)

### 7. Run Lighthouse CI Locally

```bash
# Install Lighthouse CI
npm install -g @lhci/cli

# Run performance audit
lhci autorun --collect.url=http://localhost:3000
```

---

## Acceptance Criteria Checklist

| Criterion                          | Test           | Status |
| ---------------------------------- | -------------- | ------ |
| FCP < 1.8s                         | Lighthouse CI  | ✅     |
| LCP < 2.5s                         | Lighthouse CI  | ✅     |
| CLS < 0.1                          | Lighthouse CI  | ✅     |
| TTI < 3.8s                         | Lighthouse CI  | ✅     |
| No webpack cache warning           | Build output   | ✅     |
| Rollbar loads after FCP            | Network tab    | ✅     |
| Navigation interactive immediately | Manual test    | ✅     |
| No breaking changes                | E2E tests pass | ✅     |

---

## Key Files

| File                       | Purpose                            |
| -------------------------- | ---------------------------------- |
| `next.config.mjs`          | Next.js configuration with caching |
| `.lighthouserc.json`       | Lighthouse CI config with budgets  |
| `app/loading.tsx`          | Skeleton UI during page load       |
| `components/Providers.tsx` | Deferred MonitoringInit            |
| `lib/fonts.ts`             | Font configuration                 |

---

## Performance Testing URLs

- Local: http://localhost:3000
- Preview: Check Vercel deployments

---

## Troubleshooting

### Build Fails

```bash
rm -rf .next node_modules
npm install
npm run build
```

### Lighthouse CI Fails

Check `lighthouserc.js` configuration and ensure:

- Server is running on expected port
- No network issues affecting page load

---

## Useful Commands

```bash
# Check bundle sizes
npm run build

# Run type checking
npm run typecheck

# Run linting
npm run lint

# Run E2E tests
npm run test:e2e
```
