# Data Model: Performance Optimization

**Date**: 2025-12-03  
**Feature**: 012-performance-improvement  
**Source**: Next.js Official Documentation (Context7)

---

## Overview

This feature focuses on component loading optimization rather than data model changes. No database
schema modifications required.

---

## Conceptual Entities

### 1. Loading Priority

Describes how components are categorized for loading order.

| Attribute  | Type   | Description                            |
| ---------- | ------ | -------------------------------------- |
| level      | enum   | Critical, High, Normal, Low            |
| loadTiming | string | immediate, afterLoad, onIdle, onScroll |
| chunkName  | string | Webpack chunk identifier               |

**Priority Levels**:

- **Critical**: In initial bundle (navigation, hero, fonts)
- **High**: Immediately after critical (auth state, user menu)
- **Normal**: On idle or interaction (course listings, testimonials)
- **Low**: On scroll or delayed (Rollbar, footer widgets)

### 2. Component Classification

Maps existing components to their loading priority.

| Component      | Location                    | Priority | Load Strategy             |
| -------------- | --------------------------- | -------- | ------------------------- |
| Navigation     | components/navigation/      | Critical | SSR + initial bundle      |
| Hero           | components/landing/Hero.tsx | Critical | SSR + initial bundle      |
| UserMenu       | components/navigation/      | High     | Dynamic import            |
| Features       | components/landing/         | Normal   | Dynamic import + Suspense |
| Testimonials   | components/landing/         | Normal   | Lazy on scroll            |
| MonitoringInit | components/monitoring/      | Low      | strategy="lazyOnload"     |
| Footer         | components/landing/         | Low      | Lazy on scroll            |

### 3. Script Loading Strategies (Next.js)

| Strategy            | Timing                 | Use Case                        |
| ------------------- | ---------------------- | ------------------------------- |
| `beforeInteractive` | Before page hydration  | Critical scripts (anti-flicker) |
| `afterInteractive`  | After page hydration   | Default - most scripts          |
| `lazyOnload`        | Browser idle time      | Analytics, monitoring           |
| `worker`            | Web Worker (Partytown) | Heavy third-party scripts       |

### 4. Performance Budget

Configuration for Lighthouse CI thresholds.

| Metric | Budget | Failure Threshold |
| ------ | ------ | ----------------- |
| FCP    | 1800ms | 2500ms            |
| LCP    | 2500ms | 4000ms            |
| TTI    | 3800ms | 5000ms            |
| CLS    | 0.1    | 0.25              |
| TBT    | 200ms  | 600ms             |

---

## Configuration Files

### lighthouserc.js (new)

```javascript
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000/'],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'first-contentful-paint': ['warn', { maxNumericValue: 1800 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 200 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
```

### next.config.mjs (modifications)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Enable webpack memory optimizations (Next.js 15+)
    webpackMemoryOptimizations: true,
    // CSS chunking is enabled by default
    cssChunking: true,
    // MUI is already auto-optimized by Next.js - no need to add here!
  },
};

// Optional: Bundle analyzer for development
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);
```

**Key Finding**: MUI packages (`@mui/material`, `@mui/icons-material`) are already auto-optimized by
Next.js without configuration.

---

## State Transitions

### Rollbar Initialization State

```
[Uninitialized] → [Buffering] → [Active]
     ↓               ↓            ↓
  Page Load    lazyOnload     Errors Sent
```

1. **Uninitialized**: Before Script component mounts
2. **Buffering**: Error boundaries catch errors, queue for later
3. **Active**: Rollbar SDK loaded via `strategy="lazyOnload"`, queued errors sent

---

## No Database Changes

This feature does not require:

- Prisma schema modifications
- Database migrations
- New tables or columns
- Data model changes

All changes are frontend/build configuration only.
