# Research: User Course Management (Spec 027)

**Date**: 2026-04-04 | **Plan**: [plan.md](plan.md) | **Spec**: [spec.md](spec.md)

## Research 1: MUI Stepper — Sequential Progress on Dashboard

**Decision**: Use MUI `<Stepper orientation="horizontal">` with custom `StepIconComponent` for
the 4-step dashboard progress indicator (Vorbereitung Seminar → Seminarveranstaltung → Nachbereitung Seminar → Verhandlungsergebnis).

**Rationale**:
- The existing `CourseParticipationStepper` already uses MUI Stepper — consistent pattern
- Horizontal orientation works well as a timeline showing progression across course phases
- Custom `StepIconComponent` allows CheckCircle (completed), RadioButtonChecked (active), RadioButtonUnchecked (available)
- `StepConnector` provides the connecting line between steps
- `nonLinear` prop is NOT needed — steps are strictly sequential
- `activeStep` index controls which step is highlighted

**Alternatives considered**:
- Vertical Stepper: Rejected — horizontal timeline better conveys temporal progression across weeks
- Custom CSS-only progress bar: Rejected — MUI Stepper handles accessibility (ARIA) out of the box
- Timeline component: Rejected — overkill for 4 steps, stepper is simpler

**Implementation pattern**:
```tsx
<Stepper activeStep={activeStepIndex} orientation="horizontal">
  {steps.map((step, index) => (
    <Step key={step.key} completed={index < activeStepIndex}>
      <StepLabel StepIconComponent={CustomStepIcon}>
        {step.label}
      </StepLabel>
    </Step>
  ))}
</Stepper>
```

## Research 2: MUI Drawer — Testimonial Flyout

**Decision**: Use MUI `<Drawer anchor="right" variant="temporary">` for the testimonial form flyout.

**Rationale**:
- Right-anchored drawer matches the spec wireframe
- `temporary` variant provides backdrop click to close
- Existing `TestimonialForm` component can be embedded directly
- Drawer handles mobile responsiveness (full-width on small screens via `sx`)

**Alternatives considered**:
- MUI Dialog/Modal: Rejected — spec explicitly calls for a "Drawer" pattern, not a centered modal
- Sheet/Bottom drawer on mobile: Could be added later as enhancement, but right drawer is usable on all sizes
- Inline expansion on card: Rejected — too much content for inline display

**Key props**:
- `anchor="right"` — spec wireframe
- `PaperProps={{ sx: { width: { xs: '100%', sm: 400 } } }}` — responsive width
- `onClose` handles backdrop click and X button

## Research 3: @mui/x-date-pickers — Full Month Calendar

**Decision**: Use `<StaticDatePicker>` from `@mui/x-date-pickers` for the Verhandlungsergebnis
date field, providing a full embedded month calendar without a text input.

**Rationale**:
- `StaticDatePicker` renders the calendar grid directly (no popover trigger needed)
- Spec explicitly requires "full month view" with no inline text input
- Supports `LocalizationProvider` with `AdapterDateFns` and `de` locale
- `StaticDatePicker` renders in desktop mode by default (no popover), making it ideal for inline calendar display

**Alternatives considered**:
- Standard `DatePicker`: Rejected — shows a text field by default, calendar only opens on click
- DesktopDatePicker: Same issue — requires a trigger
- Custom calendar component: Rejected — unnecessary when MUI provides StaticDatePicker

**Dependency check**: `@mui/x-date-pickers` already in package.json (used elsewhere in admin).
Need to verify `date-fns` adapter is available. If not, `dayjs` adapter is the lighter alternative.

## Research 4: Substep Persistence Strategy

**Decision**: Derive substep progress from existing `CourseParticipation` field values — no new
database columns needed.

**Rationale**:
- The 4 preparation substeps map to existing fields:
  1. `preparationIntent` → Seminar-Absicht
  2. `desiredResults` → Erwartete Ergebnisse
  3. `lineManagerProfile` → Dein Vorgesetzter
  4. Resume document → `ParticipationDocument` exists
- A user who filled `preparationIntent` but not `desiredResults` → resume at step 2
- Logic: scan fields in order, first `null` field = current substep
- All fields are optional — "Weiter" with empty field simply advances without persisting

**Derivation function**:
```ts
function getCurrentSubstep(participation: CourseParticipation, hasResume: boolean): number {
  if (participation.preparationIntent == null) return 0; // Step 1 (null = not visited)
  if (participation.desiredResults == null) return 1;     // Step 2
  if (participation.lineManagerProfile == null) return 2;  // Step 3
  if (!hasResume) return 3;                               // Step 4
  return 4;                                               // All done → Zusammenfassung
}
```

**Edge case**: User skips a step → field remains null, but the substep is marked as "visited".
Solution: Save even empty string `""` on "Weiter" click to distinguish "skipped" from "not yet seen".
Then derivation checks for `null` (not visited) vs `""` (skipped) vs a real value (completed).

> **Note**: Use loose `== null` checks (catches both `null` and `undefined`) instead of falsy
> checks (`!field`) to avoid conflating empty strings (skipped) with null (not yet visited).

**Alternatives considered**:
- New `currentSubstep` integer column: Rejected — adds migration complexity for data derivable from existing fields
- LocalStorage: Rejected — not persistent across devices, violates server-first principle

## Research 5: Mux Player Dynamic Import

**Decision**: Use `dynamic(() => import('@mux/mux-player-react'), { ssr: false })` consistent
with the existing `SummaryAssetList` pattern.

**Rationale**:
- Mux Player is a client-only web component — must not render during SSR
- Existing `SummaryAssetList` component already uses this exact pattern (proven)
- The DebriefingVideoCatalog reuses the same data resolution (`getResolvedSummaryAssets`)
- `accentColor={colors.bronze}` matches existing video player styling

**Data source**: The existing API route `GET /api/my-courses/[bookingId]/summary` provides
the resolved asset list. Reuse directly — no new API endpoint needed.

## Research 6: Card-Based Choice Selector

**Decision**: Build `NegotiationPartnerSelector` using the same `Card` + `CardActionArea` pattern
as `MaterialTypeSelector` in `/admin/course-material/new`.

**Rationale**:
- Spec explicitly references this pattern: "Uses the same Card-based selector pattern"
- MUI `Card` with `CardActionArea` provides accessible click handling, focus states, and ripple
- Selected state: `border: 2px solid colors.marsala`, `bgcolor: colors.beige`
- Single-select via controlled state (`useState<string | null>`)

**Alternatives considered**:
- Radio button group: Rejected — spec explicitly requires card-based UI, not standard radio
- ToggleButtonGroup: Less visual impact, doesn't match the wireframe
- Custom chips: Not as prominent as full cards

## Research 7: Dashboard Stepper Data Requirements

**Decision**: Extend the dashboard booking API response to include `participationStatus` so
the `CourseProgressStepper` can determine step states without an additional API call.

**Rationale**:
- Currently `UserDashboard` fetches bookings from `/api/dashboard/bookings` which returns `hasParticipation: boolean`
- The stepper needs `participationStatus` (PREPARATION, SUMMARY, DEBRIEFING, RESULT, COMPLETE) to determine which of the 4 dashboard steps is active/available/completed
- Adding `participationStatus` to the existing API response is a minimal change
- Canonical ordering for comparisons: `PREPARATION=0`, `SUMMARY=1`, `DEBRIEFING=2`, `RESULT=3`, `COMPLETE=4`
- Step mapping:
  - Vorbereitung Seminar: Completed if status ≥ SUMMARY
  - Seminarveranstaltung: Active if status = SUMMARY, Completed if status ≥ DEBRIEFING
  - Nachbereitung Seminar: Active if status = DEBRIEFING, Completed if status ≥ RESULT
  - Verhandlungsergebnis: Active if status = RESULT, Completed if status = COMPLETE

**Implementation note**: If client and server both compare statuses, use a shared helper
such as `compareParticipationStatus(status, threshold)` instead of ad-hoc string ordering.

**Alternatives considered**:
- Separate API call per booking for participation details: Rejected — N+1 problem on dashboard
- Client-side status computation: Rejected — status is server-authoritative
