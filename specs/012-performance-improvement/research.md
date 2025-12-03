# 012 - Performance Improvement: Research

**Date**: 2025-12-03  
**Branch**: `012-performance-improvement`  
**Status**: ✅ Complete  
**Source**: Next.js Official Documentation (Context7)

---

## Research Topics

### 1. Next.js Dynamic Imports & Code Splitting

**Decision**: Use `next/dynamic` with `{ ssr: false }` for client-only deferred components

**Rationale** (from Next.js docs):

- Native Next.js solution, no additional dependencies
- Integrates with React Suspense for loading states
- Webpack automatically creates separate chunks
- SSR option allows control over server-side rendering
- Only child Client Components are lazy-loaded, not Server Components

**Best Practices** (Next.js Official):

```typescript
'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'

// Client Components - loaded in separate bundle
const ComponentA = dynamic(() => import('../components/A'))
// Load on demand - only when condition is met
const ComponentB = dynamic(() => import('../components/B'))
// Client-side only - skips SSR entirely
const ComponentC = dynamic(() => import('../components/C'), { ssr: false })

export default function ClientComponentExample() {
  const [showMore, setShowMore] = useState(false)

  return (
    <div>
      {/* Load immediately, but in a separate client bundle */}
      <ComponentA />

      {/* Load on demand, only when/if the condition is met */}
      {showMore && <ComponentB />}
      <button onClick={() => setShowMore(!showMore)}>Toggle</button>

      {/* Load only on the client side */}
      <ComponentC />
    </div>
  )
}
```

**With Loading Fallback**:

```typescript
import dynamic from 'next/dynamic'

const DynamicHeader = dynamic(() => import('../components/header'), {
  loading: () => <p>Loading...</p>,
})

export default function Home() {
  return <DynamicHeader />
}
```

---

### 2. Rollbar Deferred Loading Strategy

**Decision**: Initialize Rollbar after `window.onload` event using dynamic import with
`strategy="lazyOnload"`

**Rationale** (from Next.js docs):

- Scripts with `lazyOnload` are injected during browser idle time
- Load after all other page resources have been fetched
- Best for background or low-priority scripts like monitoring
- Ensures they don't impact initial page load performance

**Implementation Pattern** (Next.js Script Component):

```typescript
'use client'

import Script from 'next/script'

export default function MonitoringInit() {
  return (
    <Script
      src="https://rollbar.com/rollbar.js"
      strategy="lazyOnload"
      onLoad={() => {
        console.log('Rollbar has loaded')
      }}
    />
  )
}
```

**Alternative - Dynamic Import**:

```typescript
// In MonitoringInit.tsx
useEffect(() => {
  const initRollbar = async () => {
    const { initRollbarClient } = await import('@/lib/monitoring/rollbar-official');
    initRollbarClient();
  };

  if (document.readyState === 'complete') {
    initRollbar();
  } else {
    window.addEventListener('load', initRollbar);
  }
}, []);
```

---

### 3. optimizePackageImports (MUI Bundle Optimization)

**Decision**: Use `experimental.optimizePackageImports` for MUI - **Already auto-optimized by
Next.js!**

**Key Finding** (Next.js docs):

> The following packages are automatically optimized without configuration:
>
> - @mui/material
> - @mui/icons-material

**Rationale**:

- MUI is already in the default optimized packages list
- Ensures only actually-used modules are loaded
- Reduces bundle size without changing import syntax
- Works in both development and production

**No Configuration Needed** - but can add other packages:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['other-barrel-file-package'],
  },
};

module.exports = nextConfig;
```

**Alternative - Direct Imports** (for maximum optimization):

```typescript
// Instead of barrel imports:
import { TriangleIcon } from '@phosphor-icons/react';

// Use direct imports:
import { TriangleIcon } from '@phosphor-icons/react/dist/csr/Triangle';
```

---

### 4. Bundle Analysis

**Decision**: Install and use `@next/bundle-analyzer` to identify optimization opportunities

**Installation**:

```bash
npm i @next/bundle-analyzer
```

**Configuration** (next.config.js):

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {};

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);
```

**Usage**:

```bash
ANALYZE=true npm run build
```

Opens three browser tabs showing package size breakdowns.

---

### 5. Webpack Cache Warning Resolution

**Decision**: Configure webpack memory optimizations and CSS chunking

**Root Cause Analysis**:

- Warning appears for strings > 100KB in webpack cache
- Caused by large MUI emotion styles and bundled assets
- Large CSS strings or inlined content

**Solutions from Next.js docs**:

1. **Enable webpack memory optimizations** (Next.js 15+):

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    webpackMemoryOptimizations: true,
  },
};
```

2. **Configure CSS chunking**:

```javascript
const nextConfig = {
  experimental: {
    cssChunking: true, // default - merges CSS files
  },
};
```

3. **Use optimizePackageImports** (already default for MUI)

---

### 6. Critical CSS & Font Loading

**Decision**: Use `next/font` with `display: swap` and preload critical fonts

**Rationale** (Next.js docs):

- Next.js font optimization removes render-blocking fonts
- `display: swap` ensures text is visible during font load
- Fonts are automatically self-hosted

**Implementation** (already in lib/fonts.ts):

```typescript
import { Playfair_Display, Inter } from 'next/font/google';

export const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});
```

✅ **Already implemented correctly - no changes needed.**

---

### 7. Image Optimization

**Decision**: Use `next/image` with proper lazy loading and sizes

**Best Practices** (Next.js docs):

```typescript
import Image from 'next/image'
import ProfileImage from './profile.png'

export default function Page() {
  return (
    <Image
      src={ProfileImage}
      alt="Description"
      // width and height auto-provided from static import
      placeholder="blur" // Optional blur-up while loading
      loading="lazy" // Default - defers until near viewport
    />
  )
}
```

**Responsive Images**:

```typescript
<Image
  alt="Mountains"
  src={mountains}
  sizes="(max-width: 768px) 100vw,
         (max-width: 1200px) 50vw,
         33vw"
  style={{
    width: '100%',
    height: 'auto',
  }}
/>
```

---

### 8. Server Components Optimization

**Decision**: Keep non-interactive components as Server Components

**Rationale** (Next.js docs):

- Server Components reduce client JavaScript bundle
- Only mark interactive parts as Client Components
- Server Components automatically stream to client

**Pattern**:

```typescript
// app/layout.tsx - Server Component by default
import Search from './search'  // Client Component
import Logo from './logo'      // Server Component

export default function Layout({ children }) {
  return (
    <>
      <nav>
        <Logo />      {/* No JS sent to client */}
        <Search />    {/* Interactive, has 'use client' */}
      </nav>
      <main>{children}</main>
    </>
  )
}
```

---

### 9. Loading States & Suspense

**Decision**: Use `loading.tsx` files and Suspense boundaries

**Implementation** (Next.js docs):

```typescript
// app/dashboard/loading.tsx
export default function Loading() {
  return <LoadingSkeleton />
}
```

This enables:

- Partial prefetching for dynamic routes
- Immediate loading skeleton during navigation
- Better perceived performance

---

### 10. Script Loading Strategies

**Decision**: Use appropriate `strategy` for third-party scripts

**Options** (Next.js docs):

| Strategy            | Use Case                             |
| ------------------- | ------------------------------------ |
| `beforeInteractive` | Critical scripts (anti-flicker)      |
| `afterInteractive`  | Default - after page hydration       |
| `lazyOnload`        | Low priority (analytics, monitoring) |
| `worker`            | Offload to web worker (Partytown)    |

**Example for Rollbar**:

```typescript
import Script from 'next/script'

<Script
  src="https://rollbar.com/rollbar.js"
  strategy="lazyOnload"
/>
```

---

## Resolved Unknowns

| Unknown                      | Resolution                                   |
| ---------------------------- | -------------------------------------------- |
| Baseline measurement method  | Lighthouse CI in GitHub Actions              |
| Third-party scripts to defer | Only Rollbar (strategy="lazyOnload")         |
| Webpack cache warning        | webpackMemoryOptimizations + CSS chunking    |
| Font loading strategy        | next/font with swap + preload (already done) |
| Lazy loading approach        | next/dynamic with ssr: false                 |
| MUI optimization             | Auto-optimized by Next.js (no config needed) |

## Dependencies Identified

| Dependency            | Version  | Purpose                        |
| --------------------- | -------- | ------------------------------ |
| @lhci/cli             | ^0.13.x  | Lighthouse CI automation (dev) |
| @next/bundle-analyzer | latest   | Bundle size analysis (dev)     |
| next/dynamic          | built-in | Code splitting                 |
| next/font             | built-in | Font optimization              |
| next/script           | built-in | Script loading strategies      |

## Risk Assessment

| Risk                             | Mitigation                                      |
| -------------------------------- | ----------------------------------------------- |
| Rollbar errors lost during defer | Buffer errors until Rollbar init                |
| CLS from lazy-loaded content     | Use skeleton placeholders with fixed dimensions |
| Build time increase from chunks  | Monitor with CI, optimize if needed             |
| Breaking existing functionality  | Step-by-step deployment, E2E tests              |

---

## Key Insights from Research

1. **MUI is already optimized** - No need to add to `optimizePackageImports`
2. **Use `strategy="lazyOnload"`** for Rollbar instead of manual window.onload
3. **Enable `webpackMemoryOptimizations`** for cache warning fix
4. **Server Components** should remain default - only mark interactive as Client
5. **`loading.tsx`** provides free loading states for routes

---

## Research Resources

- [Next.js Lazy Loading](https://nextjs.org/docs/app/building-your-application/optimizing/lazy-loading)
- [Next.js Package Bundling](https://nextjs.org/docs/app/building-your-application/optimizing/package-bundling)
- [Next.js Scripts](https://nextjs.org/docs/app/building-your-application/optimizing/scripts)
- [Next.js Memory Usage](https://nextjs.org/docs/app/building-your-application/optimizing/memory-usage)

---

**Phase 0 Complete**: All research topics resolved with official Next.js documentation.
