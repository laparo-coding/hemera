# Tasks: Dashboard Redesign in Feminine Premium Design

**Input**: Design documents from `/specs/011-redesign-dashboard-in/`  
**Prerequisites**: plan.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓, quickstart.md ✓

## Execution Flow (main)

```
1. Load plan.md → ✓ Tech stack: TypeScript, React 18+, Next.js 14+, MUI v5+
2. Load design documents:
   → data-model.md: Design tokens (colors, typography, dimensions, statusColors)
   → contracts/: Visual contracts for colors, typography, structure, a11y
   → research.md: Design decisions, component hierarchy
   → quickstart.md: Verification checklist
3. Generate tasks by category:
   → Setup: Define design tokens in component
   → Core: Style each section (greeting, stats, bookings, empty, loading)
   → Verification: Run tests, execute quickstart
4. Apply task rules:
   → Same file (UserDashboard.tsx) = sequential (no [P])
   → Verification tasks after implementation
5. Number tasks (T001-T012)
6. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`

- All styling tasks modify the same file → sequential (no [P])
- Verification tasks can run in parallel [P]
- Include exact file paths

## Files to Modify

| File                           | Purpose                              |
| ------------------------------ | ------------------------------------ |
| `components/UserDashboard.tsx` | Main component - all styling changes |
| `app/dashboard/page.tsx`       | Page wrapper - cream background      |

---

## Phase 3.1: Setup

- [x] **T001** Add design token constants to `components/UserDashboard.tsx`
  - Add `colors` object: cream (#FBF5DD), petrol (#16404D), gold (#DDA853), sage (#A6CDC6), white
    (#FFFFFF)
  - Add `statusColors` object for PAID, PENDING, FAILED states
  - Place constants at top of file after imports
  - Reference: `specs/011-redesign-dashboard-in/data-model.md` Design Tokens section

## Phase 3.2: Core Implementation

### Dashboard Container & Page

- [x] **T002** Style main dashboard container in `components/UserDashboard.tsx`
  - Change outer Box bgcolor to `colors.cream`
  - Set minHeight to '100vh'
  - Add responsive padding: `p: { xs: 2, sm: 3, md: 4 }`
  - Preserve `data-testid='user-dashboard'`

- [x] **T003** Add cream background wrapper in `app/dashboard/page.tsx`
  - Wrap UserDashboard in Box with `bgcolor: '#FBF5DD'` and `minHeight: '100vh'`

### Greeting Section

- [x] **T004** Style greeting heading in `UserDashboardClerk` component
  - Apply Playfair Display: `fontFamily: '"Playfair Display", serif'`
  - Set fontSize: `{ xs: '1.75rem', sm: '2rem', md: '2.5rem' }`
  - Set fontWeight: 700
  - Set color to `colors.petrol`
  - Preserve `data-testid='dashboard-title'`

- [x] **T005** Style greeting subtitle
  - Set fontFamily: '"Inter", sans-serif'
  - Set color to `colors.petrol` with opacity 0.8
  - Set fontSize: '1rem'

### Statistics Cards

- [x] **T006** Style statistics cards in `StatsCards` memoized component
  - Replace Card with Paper component
  - Add elevation={0} to Paper
  - Add borderRadius: '16px'
  - Add boxShadow: '0 4px 24px rgba(22, 64, 77, 0.08)'
  - Add border: '1px solid rgba(22, 64, 77, 0.1)'
  - Style icons with `sx={{ color: colors.petrol, fontSize: 32 }}`
  - Style value Typography: fontWeight: 700, fontSize: '1.5rem', color: colors.petrol
  - Style label Typography: fontSize: '0.875rem', color: colors.petrol, opacity: 0.7

### Bookings Section

- [x] **T007** Style bookings section container in `BookingsList` component
  - Replace outer Card with Paper
  - Add borderRadius: '16px'
  - Add boxShadow: '0 4px 24px rgba(22, 64, 77, 0.08)'
  - Style section header "Meine Buchungen" with Playfair Display
  - Preserve `data-testid='courses-card'`

### Empty State

- [x] **T008** Style empty state in `BookingsList` component
  - Change empty state icon color to `colors.sage`
  - Update headline to "Beginne deine Lernreise"
  - Update message to encouraging, empowering text
  - Style CTA button:
    - bgcolor: colors.gold
    - color: colors.petrol
    - fontWeight: 600
    - textTransform: 'none'
    - borderRadius: '8px'
    - '&:hover': { bgcolor: '#C99545' }

### Booking Cards & Status Chips

- [x] **T009** Style individual booking cards and status chips
  - Style booking Card with borderRadius: '12px'
  - Style Chip component for PAID status:
    - bgcolor: 'rgba(166, 205, 198, 0.15)'
    - border: `1px solid ${colors.sage}`
    - color: colors.petrol
  - Style Chip for PENDING status:
    - bgcolor: 'rgba(221, 168, 83, 0.15)'
    - border: `1px solid ${colors.gold}`
    - color: colors.petrol
  - Update `getStatusColor` to return custom sx objects instead of MUI color names

### Loading State

- [x] **T010** Style loading skeleton in loading state section
  - Set Skeleton sx.bgcolor to 'rgba(166, 205, 198, 0.2)' (sage tinted)
  - Change animation from 'wave' to 'pulse' if needed
  - Wrap loading section in Box with bgcolor: colors.cream

### E2E Variant

- [x] **T011** Apply same design tokens to `UserDashboardE2E` component
  - Add colors constant (same as Clerk variant)
  - Style outer Box with bgcolor: colors.cream
  - Style h4 heading with Playfair Display, colors.petrol
  - Style metric Cards with premium shadow and border-radius
  - Preserve all data-testid attributes

---

## Phase 3.3: Verification

- [x] **T012** [P] Run existing unit tests

  ```bash
  npm run test -- --testPathPattern=dashboard
  ```

  - All tests must pass
  - No test should reference removed/changed test IDs

- [x] **T013** [P] Run existing E2E tests

  ```bash
  npm run test:e2e -- --grep dashboard
  ```

  - Verify dashboard still functional
  - Check all data-testid selectors work

- [x] **T014** [P] Execute visual verification checklist
  - Follow `specs/011-redesign-dashboard-in/quickstart.md`
  - Check all 8 sections (background, greeting, stats, bookings, empty, loading, responsive)
  - Document any deviations

- [x] **T015** Run Prettier and ESLint

  ```bash
  npm run lint
  npm run format
  ```

  - Fix any formatting issues
  - Ensure no new warnings

---

## Dependencies

```
T001 (tokens) → T002-T011 (all styling tasks)
T002-T011 (sequential, same file) → T012-T015 (verification)
T012-T015 can run in parallel [P]
```

## Parallel Execution Example

After T001-T011 are complete, run verification tasks together:

```bash
# Terminal 1
npm run test -- --testPathPattern=dashboard

# Terminal 2
npm run test:e2e -- --grep dashboard

# Terminal 3
# Manual: Follow quickstart.md checklist in browser
```

## Task Completion Criteria

| Task      | Success Criteria                                   |
| --------- | -------------------------------------------------- |
| T001      | Colors object defined, no TypeScript errors        |
| T002-T003 | Cream background visible on dashboard              |
| T004-T005 | Greeting uses Playfair Display in petrol           |
| T006      | Stats cards have white bg, shadow, rounded corners |
| T007      | Bookings section has premium Paper styling         |
| T008      | Empty state has sage icon, gold CTA button         |
| T009      | Status chips use brand colors, not MUI defaults    |
| T010      | Skeletons are sage-tinted                          |
| T011      | E2E variant matches Clerk variant styling          |
| T012-T013 | All tests pass                                     |
| T014      | All quickstart checklist items verified            |
| T015      | No lint errors, code formatted                     |

## Notes

- **No [P] on T002-T011**: All modify `UserDashboard.tsx` - must be sequential
- **Preserve test IDs**: All `data-testid` attributes must remain unchanged
- **Commit after each task**: Enables easy rollback if needed
- **Font loading**: Playfair Display and Inter already configured in `lib/fonts.ts`

## Validation Checklist

_GATE: Verified before declaring tasks complete_

- [x] All design tokens from data-model.md have corresponding tasks
- [x] All visual contracts have verification in T014
- [x] Tests come before polish (TDD maintained via existing tests)
- [x] Sequential tasks for same file (UserDashboard.tsx)
- [x] Each task specifies exact file path
- [x] All data-testid attributes preserved
