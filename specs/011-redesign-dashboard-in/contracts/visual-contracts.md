# Visual Contracts: Dashboard Redesign

**Feature**: 011-redesign-dashboard-in  
**Date**: 2. Dezember 2025

## Overview

This feature has no API changes. These contracts define **visual expectations** that can be
validated through visual regression testing and accessibility checks.

## Color Contract

```typescript
// tests/contracts/dashboard-colors.contract.ts
interface DashboardColorContract {
  background: '#FBF5DD'; // Cream
  primaryText: '#16404D'; // Petrol
  accentColor: '#DDA853'; // Gold
  secondaryColor: '#A6CDC6'; // Sage
  cardBackground: '#FFFFFF'; // White
}
```

## Typography Contract

```typescript
// tests/contracts/dashboard-typography.contract.ts
interface DashboardTypographyContract {
  headingFont: 'Playfair Display, serif';
  bodyFont: 'Inter, sans-serif';
  greetingSize: { xs: '1.75rem'; sm: '2rem'; md: '2.5rem' };
  sectionHeaderSize: '1.25rem';
  statsValueSize: '1.5rem';
  statsLabelSize: '0.875rem';
}
```

## Component Structure Contract

```typescript
// tests/contracts/dashboard-structure.contract.ts
interface DashboardStructureContract {
  // Required data-testid attributes (must be preserved)
  testIds: {
    dashboard: 'user-dashboard';
    title: 'dashboard-title';
    metrics: 'dashboard-metrics';
    coursesCard: 'courses-card';
    userRole: 'user-role';
  };

  // Stats cards (4 required)
  statsCards: {
    totalBookings: { icon: 'SchoolOutlined'; label: 'Gesamte Buchungen' };
    confirmedBookings: { icon: 'CheckCircleOutlined'; label: 'Bestätigte Buchungen' };
    pendingPayments: { icon: 'PendingOutlined'; label: 'Ausstehende Zahlungen' };
    totalSpent: { icon: 'AttachMoneyOutlined'; label: 'Gesamtausgaben' };
  };
}
```

## Accessibility Contract

```typescript
// tests/contracts/dashboard-a11y.contract.ts
interface DashboardAccessibilityContract {
  // WCAG 2.1 AA color contrast requirements
  colorContrast: {
    textOnCream: '>= 4.5:1'; // Petrol on cream
    textOnGold: '>= 4.5:1'; // Petrol on gold buttons
    textOnWhite: '>= 4.5:1'; // Petrol on white cards
  };

  // Semantic structure
  headingHierarchy: ['h1', 'h6']; // Dashboard uses h1 for greeting, h6 for sections
  landmarkRoles: ['main'];

  // Interactive elements
  focusIndicator: '2px solid #16404D';
  buttonMinSize: '44px';
}
```

## Responsive Layout Contract

```typescript
// tests/contracts/dashboard-responsive.contract.ts
interface DashboardResponsiveContract {
  breakpoints: {
    xs: { statsColumns: 1; padding: 16 };
    sm: { statsColumns: 2; padding: 24 };
    md: { statsColumns: 4; padding: 32 };
  };

  maxWidth: 1200;
  containerCentered: true;
}
```

## Status Indicator Contract

```typescript
// tests/contracts/dashboard-status.contract.ts
interface BookingStatusContract {
  PAID: {
    chipColor: 'sage-tinted';
    label: 'Bezahlt';
    icon: 'CheckCircleOutlined';
  };
  PENDING: {
    chipColor: 'gold-tinted';
    label: 'Ausstehend';
    icon: 'PendingOutlined';
  };
  FAILED: {
    chipColor: 'rose-tinted';
    label: 'Fehlgeschlagen';
    icon: 'ErrorOutlined';
  };
}
```

## Empty State Contract

```typescript
// tests/contracts/dashboard-empty-state.contract.ts
interface EmptyStateContract {
  icon: 'SchoolOutlined';
  iconColor: '#A6CDC6'; // Sage
  headline: 'Beginne deine Lernreise';
  message: string; // Encouraging, empowering text
  ctaText: 'Kurse entdecken';
  ctaHref: '/courses';
  ctaStyle: {
    backgroundColor: '#DDA853'; // Gold
    textColor: '#16404D'; // Petrol
  };
}
```

## Loading State Contract

```typescript
// tests/contracts/dashboard-loading.contract.ts
interface LoadingStateContract {
  skeletonColor: 'rgba(166, 205, 198, 0.2)'; // Sage with opacity
  skeletonAnimation: 'pulse';
  spinnerColor: '#16404D'; // Petrol

  skeletonElements: {
    titleSkeleton: { width: 200; height: 40 };
    statsCardSkeleton: { count: 4 };
    bookingsRowSkeleton: { count: 3 };
  };
}
```

## Test Scenarios

### Visual Regression Tests

1. **Dashboard with bookings** - Screenshot comparison
2. **Dashboard empty state** - Screenshot comparison
3. **Dashboard loading state** - Screenshot comparison
4. **Dashboard on mobile viewport** - Screenshot comparison

### Functional Tests (Unchanged)

All existing E2E tests must continue to pass:

- `tests/e2e/dashboard.spec.ts` - Booking display, stats calculation
- `tests/integration/dashboard.test.ts` - API integration
