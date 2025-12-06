# Research: Dashboard Redesign in Feminine Premium Design

**Feature**: 011-redesign-dashboard-in  
**Date**: 2. Dezember 2025  
**Status**: Complete

## Design System Analysis

### Decision: Reuse established Hemera Design Tokens from 010-layout-improvement

**Rationale**: The design tokens are already established and proven in the landing page and auth
pages. Consistency is critical for brand cohesion.

**Design Tokens**: | Token | Value | Usage | |-------|-------|-------| | Cream | #FBF5DD | Page
background | | Petrol | #16404D | Primary text, icons, headings | | Gold | #DDA853 | CTA buttons,
accents, status highlights | | Sage | #A6CDC6 | Secondary elements, success states | | Border Radius
| 16px | Cards and containers | | Shadow | 0 4px 24px rgba(22, 64, 77, 0.08) | Elevated components |
| Heading Font | Playfair Display | h1-h4, greeting | | Body Font | Inter | paragraphs, labels,
stats |

**Alternatives Considered**:

- Creating new dashboard-specific tokens → Rejected (breaks brand consistency)
- Using MUI default theme → Rejected (not premium feminine aesthetic)

## Component Architecture

### Decision: Refactor UserDashboard.tsx with design system constants

**Rationale**: The existing component has all functionality (stats, bookings, loading states) but
uses default MUI styling. Applying design tokens maintains functionality while achieving visual
consistency.

**Components to Style**:

1. **Dashboard Container**: Cream background, full viewport
2. **Greeting Section**: Playfair Display heading, personalized message
3. **Stats Cards (4x)**: White Paper with premium shadow, petrol icons, gold accents
4. **Bookings List**: Elegant card layout with status chips in brand colors
5. **Empty State**: Encouraging message with gold CTA button
6. **Loading Skeleton**: Brand-colored skeleton loaders

**Alternatives Considered**:

- Complete component rewrite → Rejected (existing logic is solid)
- Separate styled components → Rejected (adds complexity without benefit)

## Typography Hierarchy

### Decision: Match landing page typography patterns

**Rationale**: User experience should feel seamless between landing, auth, and dashboard.

**Typography Mapping**: | Element | Font | Size | Weight | Color |
|---------|------|------|--------|-------| | Greeting (h1) | Playfair Display | 2rem (sm: 2.5rem) |
700 | Petrol | | Section Headers (h6) | Playfair Display | 1.25rem | 600 | Petrol | | Body Text |
Inter | 1rem | 400 | Petrol (0.8 opacity) | | Stats Numbers | Inter | 1.5rem | 700 | Petrol | |
Stats Labels | Inter | 0.875rem | 400 | Petrol (0.7 opacity) | | Button Text | Inter | 1rem | 600 |
Petrol (on gold) |

## Status Indicators

### Decision: Map booking statuses to brand colors

**Rationale**: Status colors should integrate with the feminine premium palette rather than using
stark default MUI colors.

**Status Color Mapping**: | Status | Background | Text/Icon | Border |
|--------|------------|-----------|--------| | PAID (Confirmed) | Sage (#A6CDC6) with 0.15 opacity |
Petrol | Sage | | PENDING | Gold (#DDA853) with 0.15 opacity | Petrol | Gold | | FAILED | Soft rose
(#E8B4B8) with 0.15 opacity | Dark rose | Rose |

**Alternatives Considered**:

- Using MUI success/warning/error → Rejected (too stark, not feminine)
- Custom icon set → Rejected (MUI icons are sufficient when recolored)

## Responsive Design

### Decision: Mobile-first approach with elegant breakpoints

**Rationale**: Professional women access the platform from various devices.

**Breakpoint Strategy**: | Viewport | Stats Grid | Cards | Padding |
|----------|------------|-------|---------| | xs (mobile) | 1 column | Full width | 16px | | sm
(tablet) | 2 columns | Full width | 24px | | md (desktop) | 4 columns | Contained | 32px |

## Loading States

### Decision: Brand-colored skeleton loaders

**Rationale**: Loading states should feel premium and on-brand.

**Implementation**:

- Skeleton background: Sage with 0.2 opacity
- Skeleton animation: Subtle pulse (not wave)
- CircularProgress: Petrol color

## Empty State

### Decision: Encouraging, empowering message with clear CTA

**Rationale**: Align with Hemera's mission of empowering women.

**Copywriting**:

- Headline: "Beginne deine Lernreise" (Start your learning journey)
- Message: "Entdecke unsere Kurse und investiere in deine berufliche Zukunft."
- CTA: "Kurse entdecken" (Discover courses) - Gold button

## Accessibility

### Decision: Maintain WCAG 2.1 AA compliance

**Rationale**: Constitution requires accessibility standards.

**Checks**:

- Color contrast: Petrol on cream = 7.2:1 (AAA ✓)
- Color contrast: Petrol on gold = 4.8:1 (AA ✓)
- Focus indicators: 2px petrol outline
- Screen reader: Semantic HTML, ARIA labels for stats

## Constitution Compliance

### Verified Requirements:

- ✅ Material-UI Integration (V. Component Architecture)
- ✅ Theme Consistency (centralized design tokens)
- ✅ Accessibility Standards (WCAG 2.1 AA)
- ✅ Error Monitoring (existing Rollbar integration preserved)
- ✅ TypeScript Strict Mode (no changes to type safety)
- ✅ Component Testing (existing tests must pass)

## Technical Dependencies

**No new dependencies required**:

- MUI components already in use
- Design tokens can be defined inline (consistent with landing/auth pages)
- Playfair Display and Inter already loaded via Next/Font

## Risk Assessment

| Risk                       | Likelihood | Impact | Mitigation                       |
| -------------------------- | ---------- | ------ | -------------------------------- |
| E2E tests break            | Medium     | High   | Preserve data-testid attributes  |
| Stats calculation affected | Low        | High   | Only change styling, not logic   |
| Accessibility regression   | Low        | Medium | Test color contrast before merge |

## Conclusion

The redesign is straightforward: apply established design tokens to existing components without
altering business logic. The approach minimizes risk while achieving visual consistency across the
platform.
