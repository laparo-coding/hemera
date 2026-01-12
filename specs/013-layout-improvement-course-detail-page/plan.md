# Implementation Plan: Course Detail Page Layout Improvement

**Branch**: `013-layout-improvement-course-detail-page` | **Date**: 2026-01-08 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/013-layout-improvement-course-detail-page/spec.md`

## Execution Flow (/plan command scope)

```
1. Load feature spec from Input path
   → SUCCESS: spec.md loaded with 8 clarifications
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Project Type: web (Next.js App Router)
   → Structure Decision: Existing Next.js structure
3. Fill the Constitution Check section
   → SUCCESS: All gates evaluated
4. Evaluate Constitution Check section below
   → No violations detected
   → Update Progress Tracking: Initial Constitution Check ✓
5. Execute Phase 0 → research.md
   → SUCCESS: research.md created with 8 decisions
6. Execute Phase 1 → contracts, data-model.md, quickstart.md
   → SUCCESS: All artifacts generated
7. Re-evaluate Constitution Check section
   → No new violations from design decisions
   → Update Progress Tracking: Post-Design Constitution Check ✓
8. Plan Phase 2 → Task generation approach defined (18 tasks)
9. STOP - Ready for /tasks command ✓
```

**IMPORTANT**: The /plan command STOPS at step 8. Phase 2+ executed by other commands.

## Summary

Redesign the course detail page (`/courses/[slug]`) with Hemera premium feminine design system. 
Key features: full-width layout, hero video via Mux, tabular curriculum display, multiple booking 
CTAs at strategic positions, testimonials with success indicators. Database extension required 
for `heroVideoPlaybackId` field. All styling uses existing design tokens from `lib/theme.ts`.

## Technical Context

**Language/Version**: TypeScript 5.x, Next.js 15.5.6 (App Router), React 18+  
**Primary Dependencies**: Material-UI v5, @mux/mux-player-react, Prisma ORM, Clerk (auth)  
**Storage**: PostgreSQL via Prisma (Course model extension: `heroVideoPlaybackId`)  
**Testing**: Jest (unit), Playwright (E2E), React Testing Library (components)  
**Target Platform**: Web (Desktop, Tablet, Mobile responsive)  
**Project Type**: web (frontend-focused, minimal backend changes)  
**Performance Goals**: FCP < 1.2s, LCP < 2s, Page load < 1.5s on 4G, Lighthouse Mobile > 90  
**Constraints**: WCAG 2.1 AA compliance, existing booking flow untouched, no breaking changes  
**Scale/Scope**: 3 course types, ~1000 monthly visitors, 1 page redesign with 6 sections

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Gate | Requirement | Status |
|------|-------------|--------|
| **Test-First Development** | Unit tests for new components before implementation | ✅ PASS |
| **Prettier/ESLint** | All code passes formatting and linting | ✅ PASS |
| **TypeScript Strict** | Full type safety for new components | ✅ PASS |
| **WCAG 2.1 AA** | Accessibility compliance for interactive elements | ✅ PASS |
| **Rollbar Integration** | Error tracking for video player failures | ✅ PASS |
| **Performance Targets** | FCP < 1.2s, LCP < 2s (lazy loading video) | ✅ PASS |
| **Clerk Integration** | Protected booking flow maintained | ✅ PASS (no changes) |
| **Stripe Integration** | Booking CTAs use existing payment flow | ✅ PASS (no changes) |
| **Design Token Usage** | Use theme.ts tokens, no hardcoded values | ✅ PASS |
| **GitHub Actions Deploy** | Changes deployed via workflow only | ✅ PASS |

**Initial Constitution Check**: PASS ✅

## Project Structure

### Documentation (this feature)

```
specs/013-layout-improvement-course-detail-page/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)

```
app/
├── courses/
│   └── [id]/
│       ├── page.tsx                    # Updated: Use new CourseDetailLayout
│       └── layout.tsx                  # Existing
│
components/
├── course-detail/                      # NEW: Feature folder
│   ├── index.ts                        # Barrel exports
│   ├── CourseDetailLayout.tsx          # Main layout container
│   ├── CourseHeroSection.tsx           # Hero with Mux video
│   ├── CourseOverviewSection.tsx       # Description + learning objectives
│   ├── CurriculumSection.tsx           # Tabular schedule with accordion
│   ├── DatesPricingSection.tsx         # Dates + pricing cards
│   ├── TestimonialsSection.tsx         # Success indicator testimonials
│   ├── BookingCTA.tsx                  # Reusable CTA component
│   └── CourseDetailSkeleton.tsx        # Loading state
├── CourseDetail.tsx                    # LEGACY: Keep until migration complete
│
lib/
├── design-tokens.ts                    # NEW: Shared design constants
│
prisma/
├── schema.prisma                       # UPDATE: Add heroVideoPlaybackId to Course
│
tests/
├── components/
│   └── course-detail/                  # NEW: Component tests
│       ├── CourseHeroSection.spec.tsx
│       ├── CurriculumSection.spec.tsx
│       ├── TestimonialsSection.spec.tsx
│       └── BookingCTA.spec.tsx
├── e2e/
│   └── course-detail.spec.ts           # NEW: E2E tests
```

**Structure Decision**: Next.js App Router with feature-based component organization. 
New components in `components/course-detail/` folder. Legacy `CourseDetail.tsx` preserved 
for rollback capability.

## Phase 0: Outline & Research

1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:

   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts

_Prerequisites: research.md complete_

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/bash/update-agent-context.sh copilot` **IMPORTANT**: Execute it exactly
     as specified above. Do not add or remove any arguments.
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/\*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach

_This section describes what the /tasks command will do - DO NOT execute during /plan_

**Task Generation Strategy**:

1. **Database Layer** (1 task):
   - Add `heroVideoPlaybackId` field to Course model
   - Create and apply Prisma migration
   - Update seed data with test playback IDs

2. **Design Tokens** (1 task):
   - Create `lib/design-tokens.ts` with centralized tokens
   - Export colors, typography, spacing, courseLevelColors

3. **Component Tests First** (6 parallel tasks) [P]:
   - `CourseHeroSection.spec.tsx` - video/fallback rendering
   - `CourseOverviewSection.spec.tsx` - description display
   - `CurriculumSection.spec.tsx` - accordion behavior
   - `DatesPricingSection.spec.tsx` - price/date formatting
   - `TestimonialsSection.spec.tsx` - card rendering
   - `BookingCTA.spec.tsx` - variant styling, navigation

4. **Component Implementation** (7 parallel tasks) [P]:
   - `CourseHeroSection.tsx` - Mux player integration
   - `CourseOverviewSection.tsx` - description/objectives
   - `CurriculumSection.tsx` - accordion with table
   - `DatesPricingSection.tsx` - pricing cards
   - `TestimonialsSection.tsx` - testimonial cards
   - `BookingCTA.tsx` - reusable CTA variants
   - `CourseDetailSkeleton.tsx` - loading state

5. **Layout Integration** (2 tasks):
   - `CourseDetailLayout.tsx` - orchestrate sections
   - Update `app/courses/[id]/page.tsx` to use new layout

6. **E2E Tests** (1 task):
   - `course-detail.spec.ts` - full page interaction tests

**Ordering Strategy**:

- TDD order: Tests (step 3) before implementation (step 4)
- Dependency order: Database (1) → Tokens (2) → Tests (3) → Components (4) → Integration (5) → E2E (6)
- Mark [P] for parallel execution within steps 3 and 4

**Estimated Output**: 18 tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation

_These phases are beyond the scope of the /plan command_

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking

_Fill ONLY if Constitution Check has violations that must be justified_

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |

## Progress Tracking

_This checklist is updated during execution flow_

**Phase Status**:

- [x] Phase 0: Research complete (/plan command) ✓ research.md created
- [x] Phase 1: Design complete (/plan command) ✓ data-model.md, contracts/, quickstart.md created
- [x] Phase 2: Task planning complete (/plan command - describe approach only) ✓ 18 tasks outlined
- [x] Phase 3: Tasks generated (/tasks command) ✓ 22 tasks in tasks.md
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:

- [x] Initial Constitution Check: PASS ✓ All 9 gates evaluated
- [x] Post-Design Constitution Check: PASS ✓ No new violations from design decisions

**Artifacts Generated**:

| Artifact | Status | Path |
|----------|--------|------|
| research.md | ✅ Complete | `specs/013-.../research.md` |
| data-model.md | ✅ Complete | `specs/013-.../data-model.md` |
| contracts/components.md | ✅ Complete | `specs/013-.../contracts/components.md` |
| contracts/design-tokens.md | ✅ Complete | `specs/013-.../contracts/design-tokens.md` |
| quickstart.md | ✅ Complete | `specs/013-.../quickstart.md` |
| tasks.md | ✅ Complete | `specs/013-.../tasks.md` |

---

**Next Step**: Run `/implement` command to execute tasks T001-T022.
- [ ] All NEEDS CLARIFICATION resolved
- [ ] Complexity deviations documented

---

_Based on Constitution v2.1.1 - See `/memory/constitution.md`_
