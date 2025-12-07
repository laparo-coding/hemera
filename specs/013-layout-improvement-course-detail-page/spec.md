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

- ✅ **In Scope**:
  - Course detail page layout redesign
  - Course information presentation
  - Curriculum display
  - Date and pricing presentation
  - Booking CTA styling
  - Testimonials section
  - Responsive design for all breakpoints
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
- Booking CTA is fixed or easily accessible
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
5. Display hero image or pattern background in cream/petrol

**Success Criteria**:

- Hero section renders with premium styling
- Level indicator matches course type
- Typography hierarchy is clear
- Mobile and desktop layouts optimized

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

1. Display curriculum organized by modules/sessions
2. Show module titles with expand/collapse functionality
3. List topics covered in each module
4. Include time estimates per module
5. Apply premium Paper component styling

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
3. Display price prominently with VAT information
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
3. Show ratings or success indicators
4. Rotate testimonials or show selected highlights

**Success Criteria**:

- Testimonials feel authentic and relatable
- Professional titles add credibility
- Layout integrates seamlessly with design system
- Content builds trust and confidence

### FR-006: Booking CTA Section

**Description**: Primary call-to-action for course booking  
**Actors**: All visitors  
**Preconditions**: User viewing course details  
**Main Flow**:

1. Display prominent booking button with gold background
2. Show next available date inline with CTA
3. Include secondary link to view all dates
4. Maintain existing booking flow integration

**Success Criteria**:

- CTA is visible on all screen sizes
- Button follows Hemera design system (gold, petrol text)
- Click initiates existing booking flow
- Loading states provide feedback

### FR-007: Navigation and Breadcrumbs

**Description**: Context navigation for course detail pages  
**Actors**: All visitors  
**Preconditions**: User on course detail page  
**Main Flow**:

1. Show breadcrumb navigation (Home → Courses → [Course Name])
2. Include link back to landing page course section
3. Provide next/previous course navigation
4. Maintain premium navigation design from landing page

**Success Criteria**:

- Breadcrumbs help orientation
- Navigation follows design system
- Mobile navigation is optimized
- Back navigation maintains context

### FR-008: Responsive Layout

**Description**: Optimized layouts for all device sizes  
**Actors**: All visitors  
**Preconditions**: Course page loaded  
**Main Flow**:

1. Desktop: Two-column layout with sidebar for dates/CTA
2. Tablet: Single column with stacked sections
3. Mobile: Vertical stack with fixed CTA
4. Maintain readability and hierarchy across breakpoints

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

### Color Palette (From 010-layout-improvement)

```css
--cream: #fbf5dd; /* Background */
--petrol: #16404d; /* Primary text, headings */
--gold: #e8b65c; /* CTAs, accents */
--sage: #bec7be; /* Secondary accents, borders */
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
