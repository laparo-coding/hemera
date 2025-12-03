# 012 - Performance Improvement: Quickstart

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- Chrome DevTools for performance profiling

### Initial Setup

```bash
# Switch to the performance branch
git checkout 012-performance-improvement

# Install dependencies
npm install

# Start development server
npm run dev
```

### Bundle Analysis

```bash
# Build and analyze bundle
ANALYZE=true npm run build
```

### Lighthouse Audit

1. Open Chrome DevTools
2. Go to Lighthouse tab
3. Select "Performance" category
4. Run audit on key pages:
   - `/` (Landing page)
   - `/dashboard` (Dashboard)
   - `/courses` (Course listing)

### Key Files

| File              | Purpose                    |
| ----------------- | -------------------------- |
| `next.config.mjs` | Next.js configuration      |
| `lib/fonts.ts`    | Font configuration         |
| `app/layout.tsx`  | Root layout with providers |
| `components/`     | UI components to optimize  |

### Performance Testing URLs

- Local: http://localhost:3000
- Preview: Check Vercel deployments

### Quick Wins Checklist

- [ ] Enable next/font for Google Fonts
- [ ] Add `loading="lazy"` to below-fold images
- [ ] Use dynamic imports for heavy components
- [ ] Check for unused CSS/JS

### Useful Commands

```bash
# Check bundle sizes
npm run build

# Run type checking
npm run typecheck

# Run linting
npm run lint
```
