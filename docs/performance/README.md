# Performance Best Practices

This document describes performance optimization patterns used in Hemera Academy.

## Core Web Vitals Targets

| Metric | Target  | Description              |
| ------ | ------- | ------------------------ |
| FCP    | < 1.8s  | First Contentful Paint   |
| LCP    | < 2.5s  | Largest Contentful Paint |
| CLS    | < 0.1   | Cumulative Layout Shift  |
| TTI    | < 3.8s  | Time to Interactive      |
| TBT    | < 200ms | Total Blocking Time      |

## Implementation Patterns

### 1. Deferred Loading for Non-Essential Scripts

Use Next.js dynamic imports with `ssr: false` for monitoring/analytics:

```tsx
import dynamic from 'next/dynamic';

const MonitoringInit = dynamic(() => import('@/components/MonitoringInit'), { ssr: false });
```

**Benefits**:

- Scripts load after React hydration
- No blocking of main thread during initial render
- Rollbar/analytics don't impact FCP/LCP

### 2. Loading States with Skeleton UI

Always provide skeleton states in `app/loading.tsx`:

```tsx
import { Box, Skeleton } from '@mui/material';

export default function Loading() {
  return (
    <Box>
      <Skeleton variant='rectangular' height={400} />
      {/* Match your page structure */}
    </Box>
  );
}
```

**Benefits**:

- Prevents CLS by reserving space
- Better perceived performance
- Matches expected layout dimensions

### 3. Webpack Cache Optimization

For production builds, use memory cache to avoid serialization warnings:

```js
// next.config.mjs
webpack: (config, { dev }) => {
  if (!dev) {
    config.cache = { type: 'memory' };
  }
  return config;
};
```

### 4. Bundle Analysis

Analyze bundles periodically:

```bash
ANALYZE=true npm run build
```

Watch for:

- Unexpectedly large chunks
- Duplicate dependencies
- Missing tree-shaking

## Lighthouse CI

The `.lighthouserc.json` defines automated performance budgets:

```bash
# Run locally
npx lhci autorun

# Or via CI
# See .github/workflows/lighthouse-ci.yml
```

### Budget Assertions

| Metric                   | Warn   | Error  |
| ------------------------ | ------ | ------ |
| first-contentful-paint   | 1800ms | -      |
| largest-contentful-paint | -      | 2500ms |
| cumulative-layout-shift  | -      | 0.1    |
| total-blocking-time      | 200ms  | -      |
| interactive              | 3800ms | -      |

## Component Guidelines

### SSR-First for Critical Content

Keep these components server-rendered:

- Navigation (immediate interactivity)
- Hero section (LCP element)
- Above-fold content

### Client-Only for Interactive Features

Use `'use client'` only when necessary:

- User interactions (onClick, onChange)
- Browser APIs (localStorage, geolocation)
- Third-party widgets

### Lazy Load Below-Fold

For content below the initial viewport:

```tsx
import dynamic from 'next/dynamic';

const Testimonials = dynamic(() => import('./Testimonials'), {
  loading: () => <TestimonialsSkeleton />,
});
```

## Monitoring

### WebVitals Tracking

WebVitals are automatically sent to `/api/monitoring/web-vitals` via:

- `lib/monitoring/web-vitals.ts`
- Clerk analytics integration

### Rollbar Integration

Rollbar loads after initial paint via deferred import in `components/Providers.tsx`.

## Testing

### E2E Performance Tests

Located in `tests/e2e/performance.spec.ts`:

- FCP measurement
- Navigation interactivity
- CTA responsiveness
- Lazy loading validation
- CLS prevention

### Running Tests

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Lighthouse CI
npx lhci autorun
```

## Resources

- [Web Vitals](https://web.dev/vitals/)
- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
