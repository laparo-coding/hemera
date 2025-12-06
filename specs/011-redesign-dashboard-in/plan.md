# Implementation Plan: Dashboard Redesign in Feminine Premium Design

**Branch**: `011-redesign-dashboard-in` | **Date**: 2. Dezember 2025 | **Spec**:
[spec.md](./spec.md)  
**Input**: Feature specification from `/specs/011-redesign-dashboard-in/spec.md`

## Execution Flow (/plan command scope)

```
1. Load feature spec from Input path → ✓ Loaded spec.md
2. Fill Technical Context → ✓ No NEEDS CLARIFICATION (design tokens established)
3. Fill Constitution Check → ✓ All gates passed
4. Evaluate Constitution Check → ✓ No violations
5. Execute Phase 0 → ✓ research.md created
6. Execute Phase 1 → ✓ data-model.md, contracts/, quickstart.md, agent context updated
7. Re-evaluate Constitution Check → ✓ Still passing
8. Plan Phase 2 → ✓ Task generation approach described
9. STOP → Ready for /tasks command
```

## Summary

Redesign the `/dashboard` page to match the established Hemera feminine premium design system. Apply
consistent design tokens (cream background, petrol text, gold accents, sage secondary), premium
typography (Playfair Display for headings, Inter for body), and elevated card styling (16px
border-radius, subtle shadows) to the existing dashboard components without changing business logic.

## Technical Context

**Language/Version**: TypeScript 5+, React 18+, Next.js 14+ (App Router)  
**Primary Dependencies**: Material-UI (MUI) v5+, Emotion, Clerk (auth), Next/Font  
**Storage**: N/A (visual redesign only)  
**Testing**: Jest, Playwright (existing tests must pass)  
**Target Platform**: Web (responsive: mobile, tablet, desktop)  
**Project Type**: Web application (Next.js monolith)  
**Performance Goals**: No performance regression, maintain current render times  
**Constraints**: Must preserve all `data-testid` attributes for E2E tests  
**Scale/Scope**: 1 component file (UserDashboard.tsx), 1 page file (dashboard/page.tsx)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Gate                               | Status | Notes                                  |
| ---------------------------------- | ------ | -------------------------------------- |
| I. Test-First Development          | ✓ PASS | Existing tests preserved, no new logic |
| II. Code Quality & Formatting      | ✓ PASS | Prettier/ESLint compliance maintained  |
| III. Feature Development Workflow  | ✓ PASS | Spec → Plan → Tasks flow followed      |
| IV. Authentication & Security      | ✓ PASS | No auth changes                        |
| V. Component Architecture          | ✓ PASS | MUI integration, theme consistency     |
| VI. Error Handling & Observability | ✓ PASS | Existing Rollbar integration preserved |
| VII. Stripe Integration            | N/A    | No payment changes                     |

## Project Structure

### Documentation (this feature)

```
specs/011-redesign-dashboard-in/
├── plan.md              # This file ✓
├── research.md          # Phase 0 output ✓
├── data-model.md        # Phase 1 output ✓
├── quickstart.md        # Phase 1 output ✓
├── contracts/           # Phase 1 output ✓
│   └── visual-contracts.md
└── tasks.md             # Phase 2 output (via /tasks command)
```

### Source Code (files to modify)

```
components/
└── UserDashboard.tsx    # Main component - apply design tokens

app/
└── dashboard/
    └── page.tsx         # Page wrapper - add cream background container
```

**Structure Decision**: Next.js App Router monolith with components at repository root. This feature
modifies existing files only, no new files created.

## Phase 0: Outline & Research

**Completed**: See [research.md](./research.md)

Key decisions:

- Reuse design tokens from 010-layout-improvement
- Style existing components without logic changes
- Map booking statuses to brand colors
- Mobile-first responsive approach

## Phase 1: Design & Contracts

**Completed**: See [data-model.md](./data-model.md) and [contracts/](./contracts/)

Key outputs:

- Design token constants defined
- Visual contracts for colors, typography, spacing
- Component hierarchy documented
- Quickstart verification checklist created
- Agent context updated via `update-agent-context.sh copilot`

## Phase 2: Task Planning Approach

_This section describes what the /tasks command will do - DO NOT execute during /plan_

**Task Generation Strategy**:

1. **Design Token Setup** [P]
   - Define colors, typography, dimensions constants in UserDashboard.tsx
2. **Container Styling** [P]
   - Apply cream background to main container
   - Set max-width and responsive padding

3. **Greeting Section Styling**
   - Apply Playfair Display to heading
   - Set petrol color and opacity for subtitle

4. **Stats Cards Styling** [P]
   - Apply white Paper background with shadow
   - Style icons in petrol
   - Format labels and values

5. **Bookings Section Styling**
   - Style section header
   - Apply Paper container styling

6. **Empty State Styling**
   - Sage-colored icon
   - Encouraging message
   - Gold CTA button

7. **Booking Card Styling**
   - Outlined card with proper spacing
   - Status chip with brand colors

8. **Loading State Styling**
   - Sage-tinted skeletons
   - Petrol spinner

9. **E2E Variant Styling**
   - Apply same tokens to UserDashboardE2E component

10. **Verification**
    - Run existing tests
    - Execute quickstart checklist
    - Verify responsive behavior

**Ordering Strategy**:

- [P] = Parallelizable tasks (independent styling sections)
- Dependencies: Token setup must complete first
- Test verification at end

**Estimated Output**: 10-12 focused tasks in tasks.md

## Complexity Tracking

_No complexity deviations - straightforward styling application_

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| None      | N/A        | N/A                                  |

## Progress Tracking

**Phase Status**:

- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - approach described)
- [x] Phase 3: Tasks generated (/tasks command)
- [x] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:

- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none needed)

---

_Based on Constitution v1.10.0 - See `.specify/memory/constitution.md`_
