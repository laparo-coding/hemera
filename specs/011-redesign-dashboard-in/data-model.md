# Data Model: Dashboard Redesign

**Feature**: 011-redesign-dashboard-in  
**Date**: 2. Dezember 2025  
**Status**: Complete

## Overview

This feature is a **visual redesign only** - no data model changes required. The existing entities
(User, Booking, Course) remain unchanged. This document captures the **design tokens** as the "data
model" for styling.

## Design Tokens (Constants)

### Color Palette

```typescript
const colors = {
  cream: '#FBF5DD', // Page background
  petrol: '#16404D', // Primary text, headings, icons
  gold: '#DDA853', // CTAs, accents, highlights
  sage: '#A6CDC6', // Secondary, success states
  white: '#FFFFFF', // Card backgrounds
} as const;
```

### Typography

```typescript
const typography = {
  heading: {
    fontFamily: '"Playfair Display", serif',
    fontWeight: 700,
  },
  body: {
    fontFamily: '"Inter", sans-serif',
    fontWeight: 400,
  },
  button: {
    fontFamily: '"Inter", sans-serif',
    fontWeight: 600,
    textTransform: 'none',
  },
} as const;
```

### Spacing & Dimensions

```typescript
const dimensions = {
  borderRadius: '16px',
  cardPadding: { xs: 3, sm: 4 }, // MUI spacing units
  containerMaxWidth: 1200,
  shadow: '0 4px 24px rgba(22, 64, 77, 0.08)',
} as const;
```

### Status Colors (Booking States)

```typescript
const statusColors = {
  PAID: {
    background: 'rgba(166, 205, 198, 0.15)', // Sage with opacity
    border: colors.sage,
    text: colors.petrol,
  },
  PENDING: {
    background: 'rgba(221, 168, 83, 0.15)', // Gold with opacity
    border: colors.gold,
    text: colors.petrol,
  },
  FAILED: {
    background: 'rgba(232, 180, 184, 0.15)', // Soft rose
    border: '#E8B4B8',
    text: '#8B4A50',
  },
} as const;
```

## Existing Entities (Unchanged)

### User (from Clerk)

- `id`: string
- `firstName`: string | null
- `lastName`: string | null
- `email`: string
- `publicMetadata.role`: 'user' | 'admin'

### Booking (from Prisma)

- `id`: string
- `courseId`: string
- `courseTitle`: string
- `coursePrice`: number (cents)
- `currency`: string
- `paymentStatus`: 'PENDING' | 'PAID' | 'FAILED'
- `createdAt`: Date

### DashboardStats (computed)

- `totalBookings`: number
- `confirmedBookings`: number
- `pendingPayments`: number
- `totalSpent`: number (cents)

## Component Hierarchy

```
UserDashboard
├── DashboardContainer (Box - cream bg)
│   ├── GreetingSection (Typography - Playfair)
│   │   ├── Greeting (h1)
│   │   └── Subtitle (body)
│   ├── StatsGrid (Grid - 4 columns)
│   │   ├── StatCard (Paper - white, shadow)
│   │   │   ├── Icon (petrol)
│   │   │   ├── Label (Inter, muted)
│   │   │   └── Value (Inter, bold)
│   │   └── ... (x4)
│   └── BookingsSection (Paper)
│       ├── SectionHeader (Playfair)
│       ├── EmptyState (if no bookings)
│       │   ├── Icon (sage)
│       │   ├── Message (encouraging)
│       │   └── CTA Button (gold)
│       └── BookingsList
│           └── BookingCard (Paper - outlined)
│               ├── CourseInfo
│               ├── Price
│               └── StatusChip (branded colors)
```

## Validation Rules

No validation changes - existing booking and user validation remains.

## State Transitions

No state transition changes - booking lifecycle remains:

```
PENDING → PAID (via Stripe webhook)
PENDING → FAILED (via Stripe webhook or timeout)
```
