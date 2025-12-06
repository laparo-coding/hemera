# Quickstart: Dashboard Redesign

**Feature**: 011-redesign-dashboard-in  
**Date**: 2. Dezember 2025

## Overview

This guide helps you verify the dashboard redesign matches the Hemera feminine premium design
system.

## Prerequisites

1. Dev server running: `npm run dev`
2. Browser at `http://localhost:3000/dashboard`
3. Either: Clerk configured OR `NEXT_PUBLIC_DISABLE_CLERK=1` for E2E mode

## Visual Verification Checklist

### 1. Page Background

- [ ] Full viewport has cream background (#FBF5DD)
- [ ] No white gaps or default backgrounds visible

### 2. Greeting Section

- [ ] "Willkommen zurück, [Name]!" in Playfair Display font
- [ ] Text color is petrol (#16404D)
- [ ] Subtitle text has slight opacity (0.8)

### 3. Statistics Cards (4 cards)

- [ ] Cards have white background
- [ ] Rounded corners (16px border-radius)
- [ ] Subtle shadow visible
- [ ] Icons are petrol colored
- [ ] Labels are slightly muted
- [ ] Values are bold

### 4. Bookings Section

- [ ] Section header in Playfair Display
- [ ] White Paper container with shadow

### 5. With Bookings

- [ ] Each booking in outlined card
- [ ] Course title is bold
- [ ] Date formatted in German locale
- [ ] Status chip uses brand colors:
  - Bezahlt: Sage-tinted background
  - Ausstehend: Gold-tinted background

### 6. Without Bookings (Empty State)

- [ ] Centered layout
- [ ] Icon in sage color
- [ ] Encouraging headline
- [ ] "Kurse entdecken" button in gold (#DDA853)
- [ ] Button text is petrol (#16404D)

### 7. Loading State

- [ ] Skeleton loaders have sage-tinted color
- [ ] Smooth pulse animation
- [ ] Layout matches final loaded state

### 8. Responsive (resize browser)

- [ ] Mobile: Single column stats
- [ ] Tablet: 2 column stats
- [ ] Desktop: 4 column stats
- [ ] Padding adjusts appropriately

## Accessibility Verification

### Color Contrast

- [ ] Text on cream background is readable
- [ ] Button text on gold background is readable
- [ ] Status chip text is readable

### Keyboard Navigation

- [ ] Tab through all interactive elements
- [ ] Focus indicators visible (petrol outline)
- [ ] "Kurse entdecken" button is focusable

### Screen Reader

- [ ] Heading hierarchy is logical (h1 → h6)
- [ ] Stats have meaningful labels
- [ ] Booking status is announced

## Test Commands

```bash
# Run existing tests (must still pass)
npm run test -- --testPathPattern=dashboard

# Run E2E tests
npm run test:e2e -- --grep dashboard

# Visual regression (if configured)
npm run test:visual -- dashboard
```

## Common Issues

### Issue: Fonts not loading

**Solution**: Check `lib/fonts.ts` includes Playfair Display and Inter

### Issue: Colors look different

**Solution**: Verify hex values match exactly:

- Cream: #FBF5DD
- Petrol: #16404D
- Gold: #DDA853
- Sage: #A6CDC6

### Issue: E2E mode showing simplified dashboard

**Solution**: The E2E variant (`UserDashboardE2E`) also needs styling updates

### Issue: Tests failing on data-testid

**Solution**: Ensure all `data-testid` attributes are preserved

## Comparison Reference

Compare your dashboard against:

1. Landing page (`/`) - Same cream background, typography
2. Sign-in page (`/sign-in`) - Same Paper card styling
3. Sign-up page (`/sign-up`) - Same button styling

## Approval Criteria

- [ ] Visual parity with landing page design system
- [ ] All existing tests pass
- [ ] No accessibility regressions
- [ ] Responsive on mobile, tablet, desktop
- [ ] Loading and empty states styled consistently
