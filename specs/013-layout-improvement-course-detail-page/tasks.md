# Tasks: Course Detail Page Layout Improvement

**Input**: Design documents from `/specs/013-layout-improvement-course-detail-page/`  
**Prerequisites**: plan.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓, quickstart.md ✓

## Execution Flow (main)

```
1. Load plan.md from feature directory
   → SUCCESS: TypeScript 5.x, Next.js 15.5.6, React 18+, MUI v5, Mux, Prisma
2. Load optional design documents:
   → data-model.md: 1 entity change (Course.heroVideoPlaybackId)
   → contracts/: 8 component contracts
   → research.md: 8 technical decisions
   → quickstart.md: verification scenarios
3. Generate tasks by category:
   → Setup: 3 tasks (migration, design tokens, folder structure)
   → Tests: 7 tasks (component tests + E2E)
   → Core: 8 tasks (components + barrel export)
   → Integration: 2 tasks (layout + page update)
   → Polish: 2 tasks (accessibility + performance)
4. Apply task rules:
   → Component tests [P] (different files)
   → Component implementations [P] (different files)
   → Page integration sequential (shared context)
5. Total: 22 tasks generated
6. Validation: All contracts have tests ✓
```

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- All paths relative to repository root

---

## Phase 3.1: Setup

- [x] **T001** Add `heroVideoPlaybackId` field to Course model in `prisma/schema.prisma`
  - Add field: `heroVideoPlaybackId String? @map("hero_video_playback_id")`
  - Run: `npx prisma migrate dev --name add_hero_video_playback_id`
  - Run: `npx prisma generate`

- [x] **T002** Create design tokens module in `lib/design-tokens.ts`
  - Export colors: cream, petrol, gold, sage, white
  - Export typography: heading (Playfair Display), body (Inter)
  - Export spacing: sectionPy, containerMaxWidth
  - Export courseLevelColors with A/B/C mapping
  - Follow contract in `specs/013-.../contracts/design-tokens.md`

- [x] **T003** Create component folder structure
  - Create `components/course-detail/` directory
  - Create `components/course-detail/index.ts` barrel export (empty initially)
  - Create `tests/components/course-detail/` directory

---

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

- [x] **T004** [P] Component test CourseHeroSection in `tests/components/course-detail/CourseHeroSection.spec.tsx`
  - Test: Renders title with h1 tag
  - Test: Shows Mux player when heroVideoPlaybackId provided
  - Test: Shows fallback image when heroVideoPlaybackId is null
  - Test: Displays level badge with correct color
  - Test: CTA button calls onBookingClick

- [x] **T005** [P] Component test CourseOverviewSection in `tests/components/course-detail/CourseOverviewSection.spec.tsx`
  - Test: Renders description text
  - Test: Displays learning objectives as list
  - Test: Shows instructor name

- [x] **T006** [P] Component test CurriculumSection in `tests/components/course-detail/CurriculumSection.spec.tsx`
  - Test: Renders accordion for each module
  - Test: First accordion expanded by default
  - Test: Topics displayed in table format
  - Test: Time format "HH:MM - HH:MM"

- [x] **T007** [P] Component test DatesPricingSection in `tests/components/course-detail/DatesPricingSection.spec.tsx`
  - Test: Formats price with "inkl. 19% MwSt."
  - Test: Formats date in German locale
  - Test: Displays location name and city
  - Test: CTA links to /checkout

- [x] **T008** [P] Component test TestimonialsSection in `tests/components/course-detail/TestimonialsSection.spec.tsx`
  - Test: Renders testimonial cards
  - Test: Shows quote with icon
  - Test: Displays author name and role
  - Test: Shows success indicator

- [x] **T009** [P] Component test BookingCTA in `tests/components/course-detail/BookingCTA.spec.tsx`
  - Test: Primary variant has gold background
  - Test: Secondary variant has petrol outline
  - Test: Banner variant is full-width
  - Test: Links to correct checkout URL
  - Test: Displays price when provided

- [x] **T010** [P] E2E test course detail page in `tests/e2e/course-detail.spec.ts`
  - Test: Page loads with hero section
  - Test: All sections visible on scroll
  - Test: Booking CTA navigates to checkout
  - Test: Mobile responsive layout at 375px
  - Test: Page meets performance budget (LCP < 2s)

---

## Phase 3.3: Core Implementation (ONLY after tests are failing)

- [x] **T011** [P] Implement CourseHeroSection in `components/course-detail/CourseHeroSection.tsx`
  - Dynamic import MuxPlayer with SSR disabled
  - Fallback to Image when no video
  - Title overlay with Playfair Display
  - Level badge with courseLevelColors
  - Primary BookingCTA button
  - Follow contract in `specs/013-.../contracts/components.md`

- [x] **T012** [P] Implement CourseOverviewSection in `components/course-detail/CourseOverviewSection.tsx`
  - Description with Typography
  - Learning objectives bullet list
  - Instructor display
  - Secondary CTA at section end

- [x] **T013** [P] Implement CurriculumSection in `components/course-detail/CurriculumSection.tsx`
  - MUI Accordion with expand/collapse
  - Table inside AccordionDetails
  - Placeholder curriculum data hardcoded
  - Paper styling with elevation

- [x] **T014** [P] Implement DatesPricingSection in `components/course-detail/DatesPricingSection.tsx`
  - Price formatting with VAT suffix
  - German date locale formatting
  - Location display
  - Primary CTA with price

- [x] **T015** [P] Implement TestimonialsSection in `components/course-detail/TestimonialsSection.tsx`
  - Card grid layout (1/3 columns)
  - Petrol background section
  - Quote icon styling
  - Placeholder testimonials hardcoded
  - Success indicator text

- [x] **T016** [P] Implement BookingCTA in `components/course-detail/BookingCTA.tsx`
  - Three variants: primary, secondary, banner
  - Link to /checkout?course={slug}
  - Optional price display
  - Design token colors

- [x] **T017** [P] Implement CourseDetailSkeleton in `components/course-detail/CourseDetailSkeleton.tsx`
  - Skeleton for all sections
  - Match final layout dimensions
  - Prevent CLS during load

- [x] **T018** Update barrel export in `components/course-detail/index.ts`
  - Export all components from Phase 3.3

---

## Phase 3.4: Integration

- [x] **T019** Implement CourseDetailLayout in `components/course-detail/CourseDetailLayout.tsx`
  - Orchestrate all sections
  - Full-width Box for Hero and Testimonials
  - Container for Overview, Curriculum, DatesPricing
  - Pass course data to child components
  - Add to barrel export

- [x] **T020** Update course page in `app/courses/[id]/page.tsx`
  - Import CourseDetailLayout from course-detail
  - Update getCourseBySlug to include heroVideoPlaybackId
  - Replace existing CourseDetail with CourseDetailLayout
  - Keep legacy CourseDetail.tsx for rollback

---

## Phase 3.5: Polish

- [x] **T021** Accessibility audit and fixes
  - Verify WCAG 2.1 AA compliance
  - Add aria-labels to interactive elements
  - Ensure keyboard navigation works
  - Test with screen reader

- [x] **T022** Performance validation
  - Run Lighthouse audit (target: Mobile > 90)
  - Verify LCP < 2s with video
  - Check bundle size impact
  - Optimize images with next/image

---

## Dependencies

```
T001 (migration) → T011 (hero needs heroVideoPlaybackId field)
T002 (tokens) → T011-T017 (all components use design tokens)
T003 (folders) → T004-T010 (tests need folder structure)
T004-T010 (tests) → T011-T018 (TDD: tests before implementation)
T011-T018 (components) → T019 (layout needs components)
T019 (layout) → T020 (page needs layout)
T020 (page) → T021-T022 (polish needs working page)
```

## Parallel Execution Examples

### Batch 1: Setup (sequential)
```bash
# Execute T001, T002, T003 in order
```

### Batch 2: All Tests (parallel)
```
Task: "Component test CourseHeroSection in tests/components/course-detail/CourseHeroSection.spec.tsx"
Task: "Component test CurriculumSection in tests/components/course-detail/CurriculumSection.spec.tsx"
Task: "Component test DatesPricingSection in tests/components/course-detail/DatesPricingSection.spec.tsx"
Task: "Component test TestimonialsSection in tests/components/course-detail/TestimonialsSection.spec.tsx"
Task: "Component test BookingCTA in tests/components/course-detail/BookingCTA.spec.tsx"
Task: "E2E test course detail page in tests/e2e/course-detail.spec.ts"
```

### Batch 3: All Components (parallel)
```
Task: "Implement CourseHeroSection in components/course-detail/CourseHeroSection.tsx"
Task: "Implement CourseOverviewSection in components/course-detail/CourseOverviewSection.tsx"
Task: "Implement CurriculumSection in components/course-detail/CurriculumSection.tsx"
Task: "Implement DatesPricingSection in components/course-detail/DatesPricingSection.tsx"
Task: "Implement TestimonialsSection in components/course-detail/TestimonialsSection.tsx"
Task: "Implement BookingCTA in components/course-detail/BookingCTA.tsx"
Task: "Implement CourseDetailSkeleton in components/course-detail/CourseDetailSkeleton.tsx"
```

### Batch 4: Integration (sequential)
```bash
# Execute T019, T020 in order
```

---

## Validation Checklist

- [x] All component contracts have corresponding tests (T004-T009)
- [x] All components have implementation tasks (T011-T017)
- [x] E2E test covers user scenarios (T010)
- [x] All tests come before implementation (TDD order)
- [x] Parallel tasks are truly independent (different files)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task

---

## Notes

- **Legacy Component**: Keep `components/CourseDetail.tsx` for rollback capability
- **Placeholder Content**: Curriculum and testimonials use hardcoded data (no CMS integration in this feature)
- **Mux Integration**: Already available from Feature 016 - no new dependencies needed
- **Design Tokens**: Create centralized module to replace inline color definitions across components
