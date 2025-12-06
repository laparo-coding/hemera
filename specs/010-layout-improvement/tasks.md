# Tasks: Premium Feminine Layout for Hemera Academy

**Branch**: `010-layout-improvement` | **Date**: December 1, 2025  
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

---

## Execution Flow

```
1. Load plan from Input path
   → SUCCESS: Plan loaded
2. Verify prerequisites
   → SUCCESS: All gates passed
3. Group tasks by phase
   → Phase 3.1: Foundation (T001-T003)
   → Phase 3.2: Tests (T004-T011)
   → Phase 3.3: Components (T012-T016)
   → Phase 3.4: Integration (T017-T020)
   → Phase 3.5: Polish (T021-T024)
4. Generate implementation sequence
   → SUCCESS: Dependencies verified
```

---

## Phase 3.1: Foundation Setup

### T001: Font Configuration with next/font

**Goal**: Set up premium fonts (Playfair Display, Inter)

**Files**:

- `lib/fonts.ts` (NEW)
- `app/layout.tsx` (Modification)

**Acceptance Criteria**:

- [ ] Playfair Display for headlines (h1-h3)
- [ ] Inter for body text
- [ ] Fonts loaded via next/font (performance)
- [ ] CSS variables defined for fonts

**Dependencies**: None

---

### T002: CSS Variables for Color Palette

**Goal**: Define Hemera color palette as CSS variables

**Files**:

- `app/globals.css` (Modification)

**Acceptance Criteria**:

- [ ] `--hemera-cream: #FBF5DD`
- [ ] `--hemera-sage: #A6CDC6`
- [ ] `--hemera-petrol: #16404D`
- [ ] `--hemera-amber: #DDA853`
- [ ] Derived colors (light/dark variants)

**Dependencies**: None

---

### T003: MUI Theme Configuration

**Goal**: Create Material-UI theme with Hemera design

**Files**:

- `lib/theme.ts` (Modification)

**Acceptance Criteria**:

- [ ] Color palette from data-model.md
- [ ] Typography hierarchy (Playfair + Inter)
- [ ] Component overrides (Button, Card, AppBar)
- [ ] Spacing system for generous whitespace
- [ ] All text defaults to petrol color

**Dependencies**: T001, T002

---

## Phase 3.2: Test Setup (TDD)

### T004: Theme Unit Tests

**Goal**: Test theme configuration

**Files**:

- `tests/unit/lib/theme.test.ts` (NEW)

**Acceptance Criteria**:

- [ ] Color values correctly defined
- [ ] Typography styles present
- [ ] Component overrides applied

**Dependencies**: T003

---

### T005: WCAG Contrast Tests

**Goal**: Validate color contrasts

**Files**:

- `tests/unit/lib/contrast.test.ts` (NEW)

**Acceptance Criteria**:

- [ ] Petrol on cream ≥ 4.5:1
- [ ] Petrol on sage ≥ 4.5:1
- [ ] Petrol on amber ≥ 4.5:1
- [ ] All combinations AA compliant

**Dependencies**: T002

---

### T006: HeroSection Unit Tests

**Goal**: Test HeroSection component

**Files**:

- `tests/unit/components/landing/HeroSection.test.tsx` (NEW)

**Acceptance Criteria**:

- [ ] Headline renders (German)
- [ ] Subheadline renders (informal "Du")
- [ ] CTAs are clickable
- [ ] Aria labels present

**Dependencies**: T003

---

### T007: ConceptSection Unit Tests

**Goal**: Test ConceptSection component

**Files**:

- `tests/unit/components/landing/ConceptSection.test.tsx` (NEW)

**Acceptance Criteria**:

- [ ] Headline renders (German)
- [ ] Paragraphs render (informal "Du")
- [ ] Features display
- [ ] Section ID for anchor present

**Dependencies**: T003

---

### T008: CourseCard Unit Tests

**Goal**: Test CourseCard component

**Files**:

- `tests/unit/components/landing/CourseCard.test.tsx` (NEW)

**Acceptance Criteria**:

- [ ] Course title renders (German)
- [ ] Level badge displays (A/B/C)
- [ ] Badge color matches course (Sage/Petrol/Amber)
- [ ] Dates display (German format)
- [ ] CTA link to detail page works

**Dependencies**: T003

---

### T009: CourseProgressionSection Unit Tests

**Goal**: Test CourseProgressionSection component

**Files**:

- `tests/unit/components/landing/CourseProgressionSection.test.tsx` (NEW)

**Acceptance Criteria**:

- [ ] All 3 courses render (A, B, C)
- [ ] Order is correct (Beginner → Advanced → Masterclass)
- [ ] Progression visualization present
- [ ] Section ID for anchor present

**Dependencies**: T008

---

### T010: CTASection Unit Tests

**Goal**: Test CTASection component

**Files**:

- `tests/unit/components/landing/CTASection.test.tsx` (NEW)

**Acceptance Criteria**:

- [ ] Headline renders (German)
- [ ] Subtext renders (informal "Du")
- [ ] CTA button is clickable
- [ ] Sage background applied

**Dependencies**: T003

---

### T011: E2E Landing Page Tests

**Goal**: Test landing page integration

**Files**:

- `tests/e2e/landing-page.spec.ts` (NEW)

**Acceptance Criteria**:

- [ ] All sections render
- [ ] Anchor navigation works (#konzept, #kurse)
- [ ] Responsive layout (Desktop, Tablet, Mobile)
- [ ] Course detail links work
- [ ] Texts are in German with informal "Du"

**Dependencies**: T006-T010

---

## Phase 3.3: Component Implementation

### T012: HeroSection Implementation

**Goal**: Hero section with core message (German, informal "Du")

**Files**:

- `components/landing/HeroSection.tsx` (NEW)

**Acceptance Criteria**:

- [ ] Props per contract
- [ ] Playfair Display for headline
- [ ] Core message: "Überzeuge mit deinen vielschichtigen Kräften"
- [ ] CTAs with anchor links (#konzept, #kurse)
- [ ] Responsive (min-height 80vh)
- [ ] All texts German, informal "Du"

**Dependencies**: T003, T006

---

### T013: ConceptSection Implementation

**Goal**: Hemera concept and philosophy (German, informal "Du")

**Files**:

- `components/landing/ConceptSection.tsx` (NEW)

**Acceptance Criteria**:

- [ ] Props per contract
- [ ] Section ID: "konzept"
- [ ] creamDark background (#F5EDD0)
- [ ] Feature list with icons
- [ ] Highlight box for mission
- [ ] All texts German, informal "Du"

**Dependencies**: T003, T007

---

### T014: CourseCard Implementation

**Goal**: Course card with dates

**Files**:

- `components/landing/CourseCard.tsx` (NEW)

**Acceptance Criteria**:

- [ ] Props per contract
- [ ] Level badge with correct color:
  - Course A: Sage (#A6CDC6) + "Grundkurs"
  - Course B: Petrol (#16404D) + "Fortgeschrittene"
  - Course C: Amber (#DDA853) + "Masterclass"
- [ ] Date display (max. 3, German format)
- [ ] Fallback "Termine in Planung"
- [ ] CTA to course detail page

**Dependencies**: T003, T008

---

### T015: CourseProgressionSection Implementation

**Goal**: 3 courses with progression (A → B → C)

**Files**:

- `components/landing/CourseProgressionSection.tsx` (NEW)

**Acceptance Criteria**:

- [ ] Props per contract
- [ ] Section ID: "kurse"
- [ ] 3-column layout (Desktop)
- [ ] Progression arrows between cards
- [ ] Responsive stacking (Mobile: vertical)
- [ ] Headline: "Dein Weg zur erfolgreichen Verhandlung"

**Dependencies**: T014, T009

---

### T016: CTASection Implementation

**Goal**: Closing CTA with sage background

**Files**:

- `components/landing/CTASection.tsx` (NEW)

**Acceptance Criteria**:

- [ ] Props per contract
- [ ] Sage background (#A6CDC6)
- [ ] Centered text
- [ ] Large amber button
- [ ] All texts German, informal "Du"

**Dependencies**: T003, T010

---

## Phase 3.4: Integration

### T017: Landing Page Index Export

**Goal**: Barrel export for landing components

**Files**:

- `components/landing/index.ts` (NEW)

**Acceptance Criteria**:

- [ ] Export all landing components
- [ ] Export interfaces

**Dependencies**: T012-T016

---

### T018: Homepage as One-Page

**Goal**: Integrate all sections on homepage

**Files**:

- `app/page.tsx` (Modification)

**Acceptance Criteria**:

- [ ] HeroSection with core message
- [ ] ConceptSection with philosophy
- [ ] CourseProgressionSection with 3 courses + dates
- [ ] CTASection as closing
- [ ] Anchor navigation works
- [ ] All texts German, informal "Du"

**Dependencies**: T017

---

### T019: Navigation Adjustment

**Goal**: Navigation with Hemera design and anchor links

**Files**:

- `components/navigation/` (Modification)

**Acceptance Criteria**:

- [ ] Cream background (#FBF5DD)
- [ ] Petrol text (#16404D)
- [ ] Anchor links to #konzept and #kurse
- [ ] Mobile menu adjusted

**Dependencies**: T003

---

### T020: Course Data Integration

**Goal**: Load actual course data with dates

**Files**:

- `app/page.tsx` (Modification)

**Acceptance Criteria**:

- [ ] Load courses from database
- [ ] Dates for each course (max. 3)
- [ ] Fallback for missing dates
- [ ] German date formatting

**Dependencies**: T018

---

## Phase 3.5: Polish & Validation

### T021: Responsive Fine-Tuning

**Goal**: Mobile/Tablet optimization

**Files**:

- All landing components

**Acceptance Criteria**:

- [ ] Mobile: 1-column for courses
- [ ] Tablet: 2-columns for courses
- [ ] Desktop: 3-columns for courses
- [ ] Touch targets min. 48px
- [ ] No horizontal scrolling

**Dependencies**: T018

---

### T022: Performance Optimization

**Goal**: Meet Core Web Vitals

**Files**:

- Various

**Acceptance Criteria**:

- [ ] LCP < 2.5s
- [ ] CLS < 0.1
- [ ] FID < 100ms
- [ ] Images optimized (next/image)
- [ ] Fonts preloaded

**Dependencies**: T018

---

### T023: Accessibility Audit

**Goal**: WCAG AA Compliance

**Files**:

- All landing components

**Acceptance Criteria**:

- [ ] All contrasts ≥ 4.5:1
- [ ] Focus states visible
- [ ] Skip link present
- [ ] Semantic HTML
- [ ] Keyboard navigation

**Dependencies**: T018

---

### T024: Language and Tone Review

**Goal**: Validate German texts and informal "Du" form

**Files**:

- All landing components

**Acceptance Criteria**:

- [ ] All texts in German
- [ ] Informal "Du" consistently used
- [ ] No English remnants
- [ ] Spell check passed
- [ ] Tone is inviting and professional

**Dependencies**: T018

---

## Task Summary

| Phase | Tasks     | Description                    |
| ----- | --------- | ------------------------------ |
| 3.1   | T001-T003 | Foundation (Fonts, CSS, Theme) |
| 3.2   | T004-T011 | Tests (TDD)                    |
| 3.3   | T012-T016 | Components                     |
| 3.4   | T017-T020 | Integration (One-Page)         |
| 3.5   | T021-T024 | Polish & Validation            |

**Total**: 24 Tasks

---

## Dependency Graph

```
T001 (Fonts) ──┐
               ├──→ T003 (Theme) ──→ T004-T010 (Unit Tests) ──→ T012-T016 (Components)
T002 (CSS) ────┘                                                        │
                                                                        ▼
                                                              T017 (Index Export)
                                                                        │
                                                                        ▼
                                                              T018 (Homepage One-Page)
                                                                        │
                                              ┌─────────────────────────┼─────────────────────────┐
                                              ▼                         ▼                         ▼
                                    T019 (Navigation)          T020 (Course Data)         T011 (E2E Tests)
                                                                        │
                                              ┌─────────────────────────┼─────────────────────────┐
                                              ▼                         ▼                         ▼
                                    T021 (Responsive)          T022 (Performance)        T023 (A11y)
                                                                        │
                                                                        ▼
                                                              T024 (Language Review)
```

---

## Execution Notes

- **Language**: All texts in German
- **Addressing**: Consistently use informal "Du" form
- **One-Page**: No separate pages for concept or course calendar
- **Dates**: Display directly with courses, not in separate calendar
- **Course Structure**: A = Beginner, B = Advanced, C = Masterclass
- **Booking**: Done via existing course detail pages (not part of this spec)
