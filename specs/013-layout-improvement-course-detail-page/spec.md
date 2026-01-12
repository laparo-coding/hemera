# Feature Specification: Layout Improvement for Course Detail Page

**Feature Branch**: `013-layout-improvement-course-detail-page`  
**Created**: December 7, 2025  
**Status**: Draft  
**Parent Features**: 010-layout-improvement (Landing Page), 011-redesign-dashboard-in (Dashboard)

## Execution Flow (main)

```
1. Parse user description from Input
   → SUCCESS: Comprehensive description provided
2. Extract key concepts from description
   → Actors: Professional women exploring course details
   → Actions: View course information, understand content, book courses
   → Data: Course details, curriculum, dates, pricing, testimonials
   → Constraints: Apply Hemera design system, maintain booking functionality
3. For each unclear aspect:
   → All clarified through parent feature references
4. Fill User Scenarios & Testing section
   → SUCCESS: User flows defined
5. Generate Functional Requirements
   → SUCCESS: Requirements testable
6. Identify Key Entities
   → SUCCESS: Design entities identified
7. Run Review Checklist
   → SUCCESS: All checks passed
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines

- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

---

## Context & Objectives

### Current State

The course detail pages (`/courses/[slug]`) exist with functional booking capabilities but do not
follow the premium feminine design system established in features 010 and 011. The pages lack visual
coherence with the landing page and dashboard.

### Target State

Course detail pages that:

- Apply the Hemera premium feminine design system consistently
- Use established design tokens (cream, petrol, gold, sage)
- Follow the typography system (Playfair Display + Inter)
- Maintain all existing booking functionality
- Provide clear course information hierarchy
- Display course curriculum and learning objectives
- Show upcoming dates prominently
- Include social proof elements (testimonials, success stories)
- Optimize for conversion while maintaining premium aesthetic

### Core Message

**"Discover how this course empowers you to negotiate successfully with your multifaceted
strengths."**

### Scope Definition

---

## Clarifications

### Session 2026-01-08

- Q: How should the mobile booking CTA be positioned? → A: Keep current implementation (inline only, no fixed CTA)
- Q: What rating format should testimonials use? → A: Success indicator text (e.g., "Salary increase achieved")
- Q: How should VAT information be displayed with the price? → A: Price incl. VAT with hint "inkl. 19% MwSt."
- Q: How should curriculum modules display time information? → A: Tabular format with time slots (e.g., "09:00 - 09:20 Introduction")
- Q: Should prev/next course navigation be implemented? → A: No, only optimize course detail page, no additional navigation
- Q: Should video content be included in the hero section? → A: Yes, hero section plays video content via Mux
- Q: Should the course detail page use full width? → A: Yes, full-width layout
- Q: Should booking CTAs be placed at multiple positions? → A: Yes, CTAs in various sections for quick booking

---

- ✅ **In Scope**:
  - Course detail page layout redesign
  - Full-width page layout (edge-to-edge design)
  - Course information presentation
  - Curriculum display
  - Date and pricing presentation
  - Multiple booking CTAs throughout the page
  - Testimonials section
  - Responsive design for all breakpoints
  - Hero video player with autoplay (muted) via Mux
  - Database field `heroVideoPlaybackId` for Mux Playback ID
- ❌ **Out of Scope**:
  - Booking flow changes (already implemented)
  - Course content changes
  - New course features
  - Course management functionality

---

## User Scenarios

### Scenario 1: Course Exploration

**Actor**: Lisa, 38, Senior Manager exploring Grundkurs

**Goal**: Understand course content and decide if it matches her needs

**Context**: Arrived from landing page after clicking course card

**Steps**:

1. Views hero section with course title and key value proposition
2. Reads course overview describing what she will learn
3. Reviews detailed curriculum with module breakdown
4. Checks upcoming dates for scheduling
5. Reads testimonials from previous participants
6. Clicks booking CTA feeling confident about her decision

**Acceptance Criteria**:

- Course hero section displays within 1.5s
- Curriculum is scannable with clear module structure
- Dates are prominently displayed in premium design
- Booking CTA is visible and compelling
- Testimonials provide social proof and relatability

### Scenario 2: Comparison Shopping

**Actor**: Maria, 45, Executive comparing Fortgeschrittenen-Kurs with Masterclass

**Goal**: Determine which course level is appropriate for her experience

**Context**: Reviewing multiple course pages to compare

**Steps**:

1. Opens Fortgeschrittenen-Kurs detail page
2. Reviews prerequisites and target audience description
3. Examines curriculum depth and learning objectives
4. Navigates to Masterclass page for comparison
5. Identifies that Masterclass is more suitable
6. Books Masterclass directly

**Acceptance Criteria**:

- Prerequisites are clearly stated
- Target audience description helps with self-assessment
- Learning objectives are specific and measurable
- Navigation between courses is intuitive
- Course level differentiation is clear

### Scenario 3: Mobile Booking

**Actor**: Sarah, 32, Manager reviewing course on smartphone during commute

**Goal**: Quickly understand course value and book a spot

**Context**: Mobile device, limited time

**Steps**:

1. Scrolls through course page on mobile
2. Quickly scans key information (dates, price, curriculum)
3. Reads concise course description
4. Clicks mobile-optimized booking button
5. Completes booking flow seamlessly

**Acceptance Criteria**:

- Mobile layout is optimized for vertical scrolling
- Key information is above the fold
- Text is readable without zooming
- Booking CTA is inline and easily accessible (consistent with current implementation)
- Page loads within 2s on 4G connection

---

## Functional Requirements

### FR-001: Course Hero Section

**Description**: Premium hero section introducing the course  
**Actors**: All visitors  
**Preconditions**: Valid course slug in URL  
**Main Flow**:

1. Display course title in Playfair Display serif font
2. Show course level indicator (A/B/C) with color coding
3. Present key value proposition or tagline
4. Include course category (e.g., "Verhandlungstraining")
5. Display hero video or fallback image/pattern background in cream/petrol
6. Video autoplays muted with play/pause controls
7. On mobile: Show poster image, video loads on user interaction

**Video Requirements**:
- Provider: Mux (already integrated in project for Feature 016)
- Embedding: Mux Player SDK (@mux/mux-player-react)
- Autoplay: Yes, muted by default (browser policy compliant)
- Controls: Play/pause overlay, mute/unmute toggle
- Fallback: Static hero image if video unavailable or on slow connection
- Streaming: Adaptive Bitrate (HLS) via Mux
- Aspect Ratio: 16:9 or 21:9 (cinematic)
- Max Duration: 15-30 seconds (loop)
- Playback ID: From course data (new field `heroVideoPlaybackId`)

**Success Criteria**:

- Hero section renders with premium styling
- Video plays smoothly without blocking page load
- Level indicator matches course type
- Typography hierarchy is clear (text overlay on video)
- Mobile and desktop layouts optimized
- Fallback image displays if video fails to load

### FR-002: Course Overview Section

**Description**: Concise overview of what the course offers  
**Actors**: All visitors  
**Preconditions**: Course data available  
**Main Flow**:

1. Display 2-3 paragraph course description
2. Highlight key learning outcomes (3-5 bullet points)
3. Show target audience description
4. Include course duration and format information

**Success Criteria**:

- Description is scannable and engaging
- Learning outcomes use clear, benefit-focused language
- Target audience helps self-selection
- Information hierarchy guides reading flow

### FR-003: Curriculum Display

**Description**: Detailed module and topic breakdown  
**Actors**: All visitors  
**Preconditions**: Curriculum data structured  
**Main Flow**:

1. Display curriculum as tabular schedule with time slots
2. Format: "HH:MM - HH:MM [Thema]" (e.g., "09:00 - 09:20 Vorstellungsrunde")
3. Show module titles with expand/collapse functionality
4. Group topics by session/day if multiple days
5. Apply premium Paper component styling

**Example Format**:
```
09:00 - 09:20  Vorstellungsrunde
09:20 - 10:00  Vorbereitungen besprechen
10:00 - 10:15  Pause
10:15 - 12:00  Verhandlungstechniken
```

**Success Criteria**:

- Curriculum is comprehensive yet scannable
- Expandable sections improve information density
- Module structure is clear and logical
- Premium styling matches design system

### FR-004: Dates and Pricing Section

**Description**: Upcoming course dates with booking options  
**Actors**: All visitors  
**Preconditions**: Course schedule data available  
**Main Flow**:

1. Display upcoming dates in chronological order
2. Show format (online/in-person) and time for each date
3. Display price prominently with "inkl. 19% MwSt." hint
4. Include booking CTA for each available date
5. Show "Ausgebucht" (sold out) state when applicable

**Success Criteria**:

- Dates are easy to scan and compare
- Pricing is transparent and clear
- Booking CTAs are prominent with gold background
- Sold out dates are clearly marked

### FR-005: Testimonials Section

**Description**: Social proof from previous participants  
**Actors**: All visitors  
**Preconditions**: Testimonial content available  
**Main Flow**:

1. Display 2-4 testimonials with names and titles
2. Include photo placeholders with sage background
3. Show success indicator text per testimonial (e.g., "Gehaltserhöhung erreicht", "Beförderung erhalten")
4. Rotate testimonials or show selected highlights

**Success Criteria**:

- Testimonials feel authentic and relatable
- Professional titles add credibility
- Layout integrates seamlessly with design system
- Content builds trust and confidence

### FR-006: Multiple Booking CTAs

**Description**: Booking buttons strategically placed throughout the page for quick conversion  
**Actors**: All visitors  
**Preconditions**: User viewing course details  
**Main Flow**:

1. Display primary CTA in hero section (after video/title)
2. Place secondary CTA after curriculum section
3. Include CTA after testimonials section
4. Show final CTA at page bottom with pricing summary
5. All CTAs use consistent gold background styling
6. Each CTA shows next available date and price

**CTA Placement Strategy**:
| Position | Trigger | CTA Style |
|----------|---------|------------|
| Hero (below title) | Immediate interest | Primary (large) |
| After Curriculum | Convinced by content | Secondary (medium) |
| After Testimonials | Social proof convinced | Secondary (medium) |
| Page Bottom | Final decision point | Primary (large) with price summary |

**Success Criteria**:

- CTAs are visible at natural decision points
- User can book from any section without scrolling far
- All buttons follow Hemera design system (gold, petrol text)
- Click initiates existing booking flow
- Loading states provide feedback

### FR-007: Navigation (Keep Existing)

**Description**: Existing navigation behavior remains unchanged  
**Actors**: All visitors  
**Preconditions**: User on course detail page  
**Main Flow**:

1. Maintain existing browser back navigation
2. Keep existing header navigation from landing page
3. No new breadcrumb or prev/next course navigation

**Success Criteria**:

- Navigation follows existing patterns
- No breaking changes to current navigation flow
- Focus remains on course detail page styling only

### FR-008: Full-Width Responsive Layout

**Description**: Edge-to-edge layout optimized for all device sizes  
**Actors**: All visitors  
**Preconditions**: Course page loaded  
**Main Flow**:

1. Hero section: Full viewport width (edge-to-edge)
2. Content sections: Full width with max-width constraint for readability
3. Alternating section backgrounds (cream/white) for visual separation
4. Desktop: Wide content area, no sidebar
5. Tablet: Full width with appropriate padding
6. Mobile: Vertical stack with inline CTAs
7. Maintain readability and hierarchy across breakpoints

**Layout Structure**:
```
┌────────────────────────────────────────┐
│          HERO (Full Width + Video)     │
│          [Title] [Level Badge]         │
│          [CTA: Jetzt buchen]           │
├────────────────────────────────────────┤
│          OVERVIEW SECTION              │
│          (max-width: 1200px centered)  │
├────────────────────────────────────────┤
│          CURRICULUM SECTION            │
│          [CTA: Jetzt buchen]           │
├────────────────────────────────────────┤
│          DATES & PRICING               │
├────────────────────────────────────────┤
│          TESTIMONIALS                  │
│          [CTA: Jetzt buchen]           │
├────────────────────────────────────────┤
│          FINAL CTA + PRICE SUMMARY     │
└────────────────────────────────────────┘
```

**Success Criteria**:

- Layout adapts smoothly to viewport sizes
- Content remains readable on all devices
- CTAs accessible without excessive scrolling
- Images and typography scale appropriately

---

## Non-Functional Requirements

### NFR-001: Performance

- Course detail pages load within 1.5s on 4G connection
- Images lazy load below the fold
- First Contentful Paint (FCP) < 1.2s
- Largest Contentful Paint (LCP) < 2s

### NFR-002: Accessibility

- WCAG 2.1 AA compliance for all text contrast
- Keyboard navigation for all interactive elements
- Screen reader optimized content structure
- Focus states visible and consistent

### NFR-003: Design Consistency

- 100% adherence to Hemera design tokens
- Typography follows established hierarchy
- Spacing uses 8px grid system
- Components reuse existing patterns

### NFR-004: SEO Optimization

- Course pages have unique meta titles and descriptions
- Structured data markup for courses (schema.org)
- Semantic HTML5 structure
- Open Graph tags for social sharing

### NFR-005: Maintainability

- Course content manageable through existing CMS/database
- Components documented with Storybook (if applicable)
- Design tokens referenced from central theme file
- No hardcoded styling values

---

## Key Entities & Relationships

### Design Entities

**CourseDetailPage**

- Properties: slug, title, level, description, curriculum, dates, price
- Visual: Premium layout with Hemera design system
- Relationships: Contains multiple sections (hero, overview, curriculum, dates, testimonials)

**CourseHeroSection**

- Properties: title, level, tagline, backgroundImage
- Visual: Full-width hero with Playfair Display heading
- Styling: Cream background, petrol text, level badge

**CurriculumModule**

- Properties: moduleTitle, topics[], duration
- Visual: Expandable Paper component
- Styling: White background, subtle shadow, sage accents

**DateCard**

- Properties: date, time, format, price, availability
- Visual: Premium card with booking CTA
- Styling: White background, gold CTA, petrol text

**TestimonialCard**

- Properties: text, name, title, avatar
- Visual: Quote card with professional styling
- Styling: Sage background, Inter font

---

## Design System Reference

### Color Palette (From lib/theme.ts)

```css
--cream: #FBF5DD; /* Background */
--petrol: #16404D; /* Primary text, headings */
--gold: #DDA853; /* CTAs, accents */
--sage: #A6CDC6; /* Secondary accents, borders */
```

### Typography (From 010-layout-improvement)

- **Headings**: Playfair Display (serif)
- **Body**: Inter (sans-serif)
- **Hierarchy**: h1 (48px) → h2 (36px) → h3 (28px) → body (16px)

### Components

- **Paper**: White background, 16px border-radius, subtle shadow
- **Button**: Gold background, petrol text, hover effects
- **Card**: Consistent padding (24px), responsive spacing

---

## Success Metrics

### User Experience

- Time on course page > 2 minutes (engagement)
- Scroll depth > 75% (content consumption)
- Bounce rate < 40% (relevant traffic)

### Conversion

- Course-to-booking conversion rate > 15%
- CTA click-through rate > 25%
- Multi-page course comparison rate > 30%

### Technical

- Page load time < 1.5s
- Mobile performance score > 90 (Lighthouse)
- Zero accessibility violations (axe DevTools)

---

## Dependencies

### Upstream Dependencies

- **010-layout-improvement**: Design system, color palette, typography
- **011-redesign-dashboard-in**: Component patterns, styling approach
- Existing course data model and booking flow

### Downstream Dependencies

- None (styling-only feature)

---

## Risks & Mitigations

### Risk 1: Content Availability

**Description**: Course content (curriculum, testimonials) may not be ready  
**Impact**: High - Cannot launch without content  
**Mitigation**:

- Use placeholder content for development
- Work with content team to prepare materials in parallel
- Define content structure early

### Risk 2: Performance Regression

**Description**: Rich course pages may impact load times  
**Impact**: Medium - Could affect user experience  
**Mitigation**:

- Implement lazy loading for below-fold content
- Optimize images with Next.js Image component
- Monitor Core Web Vitals during development

### Risk 3: Mobile Usability

**Description**: Dense curriculum content may be hard to navigate on mobile  
**Impact**: Medium - Mobile users are significant portion  
**Mitigation**:

- Implement accordion/collapsible sections
- Test extensively on real devices
- Prioritize most important information above fold

---

## Review Checklist

- [x] User scenarios cover main use cases
- [x] Functional requirements are testable
- [x] Non-functional requirements are measurable
- [x] Dependencies identified
- [x] Risks documented with mitigations
- [x] Design system referenced correctly
- [x] Success metrics defined
- [x] Scope clearly bounded

---

## Approval

**Status**: Draft  
**Next Steps**:

1. Review with product team
2. Validate with design team
3. Create detailed tasks breakdown
4. Begin implementation planning

---

_This specification follows the Hemera feature specification template and inherits design decisions
from features 010 and 011._
