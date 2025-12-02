# Implementation Plan: Premium Feminine Layout for Hemera Academy

**Branch**: `010-layout-improvement` | **Date**: December 1, 2025 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/010-layout-improvement/spec.md`

## Execution Flow (/plan command scope)

```
1. Load feature spec from Input path
   → SUCCESS: Feature spec loaded
2. Fill Technical Context
   → Project Type: Web (Next.js frontend)
   → Structure Decision: Existing Next.js App Router structure
3. Fill the Constitution Check section
   → SUCCESS: Material-UI, Testing, Code Quality verified
4. Evaluate Constitution Check section
   → PASS: No violations detected
5. Execute Phase 0 → research.md
   → SUCCESS: Design patterns and typography researched
6. Execute Phase 1 → data-model.md, quickstart.md
   → SUCCESS: Theme configuration and component updates defined
7. Re-evaluate Constitution Check section
   → PASS: Design complies with constitution
8. Plan Phase 2 → Task generation approach described
9. STOP - Ready for /tasks command
```

## Summary

**Primary Requirement**: Transformation of the functional tech layout to a premium, feminine design
in interior design style for Hemera Academy (premium courses for salary negotiation).

**Technical Approach**:

- Material-UI theme customization with new color palette (#FBF5DD, #A6CDC6, #16404D, #DDA853)
- Premium typography (Playfair Display for headlines, Inter for body)
- **One-page concept**: All information on the homepage
- Course progression with dates directly at courses (A → B → C)
- All texts in German with informal "Du" form

## Technical Context

**Language/Version**: TypeScript 5+, React 18+, Next.js 14+ (App Router) **Primary Dependencies**:
Material-UI (MUI) v5+, Emotion, Next/Font **Storage**: N/A (purely visual changes) **Testing**: Jest
for unit tests, Playwright for E2E **Target Platform**: Web (Desktop & Mobile, responsive) **Project
Type**: Web (Next.js App Router) **Performance Goals**: LCP < 2.5s, CLS < 0.1, FID < 100ms (Core Web
Vitals) **Constraints**: WCAG AA compliance, keep Material Design base, German/informal "Du"
**Scale/Scope**: Homepage (one-page), global theme, navigation

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Gate                                | Status  | Notes                                          |
| ----------------------------------- | ------- | ---------------------------------------------- |
| Material-UI Integration (V.)        | ✅ PASS | Theme customization follows MUI best practices |
| Component Testing (V.)              | ✅ PASS | Visual regression tests planned                |
| Accessibility Standards (V.)        | ✅ PASS | WCAG AA contrasts will be validated            |
| TypeScript Strict Mode (II.)        | ✅ PASS | All theme types type-safe                      |
| Prettier Integration (II.)          | ✅ PASS | Formatting preserved                           |
| Quality Gates (II.)                 | ✅ PASS | CI/CD pipeline unchanged                       |
| Feature Development Workflow (III.) | ✅ PASS | Spec-first, then implementation                |

**No violations detected.**

## Project Structure

### Documentation (this feature)

```
specs/010-layout-improvement/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (Theme configuration)
├── quickstart.md        # Phase 1 output
├── contracts/           # Component contracts
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```
lib/
├── theme.ts             # MUI Theme - PRIMARY MODIFICATION
└── fonts.ts             # NEW: Font configuration

app/
├── globals.css          # CSS Variables - MODIFICATION
├── page.tsx             # Homepage (One-Page) - MAJOR MODIFICATION
└── layout.tsx           # Root Layout - MINOR MODIFICATION

components/
├── ThemeRegistry.tsx    # Theme Provider - MINOR MODIFICATION
├── navigation/          # Navigation - MODIFICATION
└── landing/             # NEW: Landing page components
    ├── HeroSection.tsx
    ├── ConceptSection.tsx
    ├── CourseProgressionSection.tsx  # With dates
    └── CTASection.tsx

public/
└── images/              # NEW: Stock photos
    └── hero/
```

**Structure Decision**: Existing Next.js App Router structure. One-page concept on homepage with
landing components.

## Phase 0: Outline & Research

### Research Tasks

1. **Premium Typography Fonts** - Google Fonts for elegance and readability
2. **WCAG Contrast Validation** - Color palette against AA standards
3. **Interior Design UI Patterns** - Analysis of martinkempdesign.com
4. **MUI Theme Customization** - Best practices
5. **Next/Font Optimization** - Performant font loading

**Output**: research.md with all findings

## Phase 1: Design & Contracts

### Theme Configuration (data-model.md)

- Color palette definition
- Typography hierarchy (German texts, informal "Du")
- Spacing system (generous whitespace)
- Shadow adjustments
- Component overrides

### Component Contracts

- **HeroSection**: Core message, CTAs (German, informal "Du")
- **ConceptSection**: Hemera philosophy
- **CourseProgressionSection**: 3 courses with dates (A → B → C)
- **CTASection**: Call-to-action

**Output**: data-model.md, quickstart.md, component contracts

## Phase 2: Task Planning Approach

**Task Generation Strategy**:

1. **Foundation Tasks (Parallel)**:
   - Theme configuration
   - Font configuration
   - CSS variables

2. **Component Tasks**:
   - HeroSection
   - ConceptSection
   - CourseProgressionSection (with dates)
   - CTASection

3. **Integration Tasks**:
   - Homepage as one-page
   - Adjust navigation

4. **Validation Tasks**:
   - WCAG contrast tests
   - Language/informal "Du" check
   - Performance tests

**Estimated Output**: 20-24 numbered tasks

## Progress Tracking

**Phase Status**:

- [x] Phase 0: Research complete
- [x] Phase 1: Design complete
- [x] Phase 2: Task planning complete
- [ ] Phase 3: Tasks generated
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:

- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none)

---

_Based on Constitution v1.10.0_
