# Component Contracts: Course Detail Page

**Feature**: 013-layout-improvement-course-detail-page  
**Date**: 2026-01-08

---

## CourseDetailLayout

**File**: `components/course-detail/CourseDetailLayout.tsx`  
**Type**: Server Component (container)

### Props
```typescript
interface CourseDetailLayoutProps {
  course: CourseWithDetails;
  children?: React.ReactNode;
}

interface CourseWithDetails {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  price: number;
  currency: string;
  startDate: Date | null;
  startTime: Date | null;
  endTime: Date | null;
  instructor: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  heroVideoPlaybackId: string | null;
  imageDetail: string | null;
  thumbnailUrl: string | null;
  location: {
    name: string;
    city: string;
  } | null;
}
```

### Responsibilities
- Orchestrate section layout (full-width vs contained)
- Pass data to child sections
- Apply page-level background colors

### Renders
- `CourseHeroSection`
- `CourseOverviewSection`
- `CurriculumSection`
- `DatesPricingSection`
- `TestimonialsSection`
- `BookingCTA` (final)

---

## CourseHeroSection

**File**: `components/course-detail/CourseHeroSection.tsx`  
**Type**: Client Component (video player)

### Props
```typescript
interface CourseHeroSectionProps {
  title: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  tagline?: string;
  heroVideoPlaybackId: string | null;
  fallbackImageUrl: string | null;
  onBookingClick: () => void;
}
```

### Behavior
- If `heroVideoPlaybackId` exists: Render Mux Player (autoplay, muted, loop)
- If null: Render fallback image or gradient background
- Display title overlay with Playfair Display font
- Show level badge (A/B/C with color coding)
- Primary booking CTA button

### Accessibility
- Video has `aria-hidden="true"` (decorative)
- Title is `<h1>` for SEO
- CTA button has clear focus state

---

## CourseOverviewSection

**File**: `components/course-detail/CourseOverviewSection.tsx`  
**Type**: Server Component

### Props
```typescript
interface CourseOverviewSectionProps {
  description: string;
  learningObjectives?: string[];
  instructor: string;
}
```

### Behavior
- Display formatted description (supports markdown/HTML)
- Show learning objectives as bullet list
- Display instructor name with optional photo
- Secondary CTA at section end

---

## CurriculumSection

**File**: `components/course-detail/CurriculumSection.tsx`  
**Type**: Client Component (accordion interaction)

### Props
```typescript
interface CurriculumSectionProps {
  modules: CurriculumModule[];
}

interface CurriculumModule {
  id: string;
  day: number;
  title: string;
  topics: CurriculumTopic[];
}

interface CurriculumTopic {
  id: string;
  timeRange: string;  // "09:00 - 09:20"
  title: string;
}
```

### Behavior
- Render MUI Accordion for each module/day
- First module expanded by default
- Table layout inside accordion for topics
- Paper styling with subtle elevation

### Note
MVP uses placeholder data hardcoded in component.

---

## DatesPricingSection

**File**: `components/course-detail/DatesPricingSection.tsx`  
**Type**: Server Component

### Props
```typescript
interface DatesPricingSectionProps {
  price: number;
  currency: string;
  startDate: Date | null;
  startTime: Date | null;
  endTime: Date | null;
  location: {
    name: string;
    city: string;
  } | null;
  courseId: string;
  courseSlug: string;
}
```

### Behavior
- Display price with "inkl. 19% MwSt." suffix
- Format date in German locale (e.g., "15. März 2026")
- Show time range (e.g., "09:00 - 17:00 Uhr")
- Display location name and city
- Primary CTA with price

---

## TestimonialsSection

**File**: `components/course-detail/TestimonialsSection.tsx`  
**Type**: Server Component

### Props
```typescript
interface TestimonialsSectionProps {
  testimonials: Testimonial[];
}

interface Testimonial {
  id: string;
  quote: string;
  authorName: string;
  authorRole: string;
  successIndicator: string;
}
```

### Behavior
- Grid layout (1 col mobile, 3 col desktop)
- Card for each testimonial with quote icon
- Display success indicator below quote
- Dark (petrol) background for contrast

### Note
MVP uses placeholder testimonials hardcoded in component.

---

## BookingCTA

**File**: `components/course-detail/BookingCTA.tsx`  
**Type**: Client Component

### Props
```typescript
interface BookingCTAProps {
  courseId: string;
  courseSlug: string;
  variant: 'primary' | 'secondary' | 'banner';
  price?: number;
  currency?: string;
  label?: string;
}
```

### Variants
| Variant | Style | Use Case |
|---------|-------|----------|
| `primary` | Gold filled button | Hero, Pricing section |
| `secondary` | Petrol outline button | After Overview |
| `banner` | Full-width gold background | Page footer |

### Behavior
- Links to `/checkout?course={slug}`
- Displays price if provided
- Tracks click events for analytics (future)

---

## CourseDetailSkeleton

**File**: `components/course-detail/CourseDetailSkeleton.tsx`  
**Type**: Server Component

### Props
None (loading state)

### Behavior
- Render skeleton for all sections
- Match final layout dimensions
- Prevent CLS during page load

---

## Barrel Export

**File**: `components/course-detail/index.ts`

```typescript
export { CourseDetailLayout } from './CourseDetailLayout';
export { CourseHeroSection } from './CourseHeroSection';
export { CourseOverviewSection } from './CourseOverviewSection';
export { CurriculumSection } from './CurriculumSection';
export { DatesPricingSection } from './DatesPricingSection';
export { TestimonialsSection } from './TestimonialsSection';
export { BookingCTA } from './BookingCTA';
export { CourseDetailSkeleton } from './CourseDetailSkeleton';
```
