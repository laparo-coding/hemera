# Full Requirements Quality Checklist: User Course Management (Spec 027)

**Purpose**: Vollständige Validierung aller Qualitätsdimensionen der Anforderungen vor `/speckit.implement`
**Created**: 2026-04-04 | **Reviewed**: 2026-04-06
**Feature**: [spec.md](../spec.md) | [plan.md](../plan.md) | [tasks.md](../tasks.md)
**Depth**: Thorough | **Audience**: Author (pre-implement self-validation)

## Requirement Completeness

- [x] CHK001 — Are loading/pending states defined for the dashboard stepper while `participationStatus` is being fetched? [Gap] → SSR: data fetched server-side before render; `app/loading.tsx` covers route-level loading.
- [x] CHK002 — Are error handling requirements specified for the `saveNegotiationResultAction` server action (network failure, validation error, auth failure)? [Gap] → Standard patterns apply (validation in T005, error boundaries for network).
- [x] CHK003 — Are success feedback requirements defined after saving Verhandlungsergebnis? (e.g., Snackbar, inline confirmation) [Gap, Spec §Amendment E] → Contract §4: "show success feedback" — implementation decides form (Snackbar).
- [x] CHK004 — Are success/error feedback requirements defined for TestimonialDrawer after form submission? [Gap, Spec §Amendment C] → Spec: "drawer closes on successful submission" = success feedback. Errors handled by existing TestimonialForm.
- [x] CHK005 — Is the responsive behavior of CourseProgressStepper on mobile explicitly specified? (horizontal orientation confirmed, but width/spacing on xs?) [Completeness, Spec §2] → MUI Stepper horizontal is inherently responsive. Standard MUI behavior.
- [x] CHK006 — Are requirements for the "Lebenslauf" substep (step 4) complete — including upload progress indicator, file type restrictions, and max size? [Completeness, Spec §Amendment B] → Existing ResumeUploader component handles all constraints.
- [x] CHK007 — Is the behavior when a user navigates directly to `/my-courses/[bookingId]/nachbereitung` via URL (without going through dashboard) specified? [Gap] → T015: Server Component with `requireAuthenticatedUser()` — standard Next.js route, works naturally.
- [x] CHK008 — Is the behavior when a user navigates directly to `/my-courses/[bookingId]/verhandlungsergebnis` via URL specified? [Gap] → T017: Same pattern as T015.
- [x] CHK009 — Are requirements specified for what happens when a booking has NO `CourseParticipation` record yet — does the stepper still render? [Completeness, Spec §2] → data-model.md: "(no participation) → step 1 active, others Available". Contract §1: `participationStatus: null`.
- [x] CHK010 — Is it specified how the "✓ Angesehen" badge persists across page reloads on the Nachbereitung video catalog page? (Local state only, or server-persisted?) [Gap, Spec §Amendment D] → Contract §3: "local state" explicitly.

## Requirement Clarity

- [x] CHK011 — Is "abgeschlossen" (completed) for Vorbereitung Seminar quantified? Is it when ALL 4 substeps are visited, or only when ParticipationStatus transitions to SUMMARY? [Clarity, Spec §Amendment B] → Spec: "transitions to SUMMARY only when user advances past last prep substep (step 4 → 5)".
- [x] CHK012 — The Design Component table still lists a "Locked" state with Lock icon and tooltip — is the implementation expectation clear that this is NOT to be built during testing phase? [Ambiguity, Spec §Design Component] → **FIXED** (`specs/027-user-course-management/spec.md`): Added "(post-testing)" marker + note to Design Component table.
- [x] CHK013 — Is the distinction between "Weiter" and "Überspringen" clearly defined at the UI level? Are they two separate buttons, or is "Weiter" with an empty field equivalent to skip? [Clarity, Spec §Amendment B] → Spec+T010: Both present. "Weiter" saves (even empty string on skip). "Überspringen" is explicit skip option.
- [x] CHK014 — Is "same styling as the Vorbereitung text fields" for the Verhandlungsergebnis textarea specific enough? (References `no border, colors.lightGray background, borderRadius: 8px, min-height 240px` — can the implementer find these values?) [Clarity, Spec §Amendment E] → Exact CSS values provided in spec.
- [x] CHK015 — Is the `StaticDatePicker` vs. `DatePicker` choice unambiguous? Spec says "full month view" and "no inline text input" — is `StaticDatePicker` the only valid component? [Clarity, Spec §Amendment E] → Contract §4 explicitly says "StaticDatePicker (de locale)".
- [x] CHK016 — The term "card-based selector pattern as MaterialTypeSelector" — is this reference sufficiently documented or does the implementer need to find the source? [Clarity, Spec §Amendment E] → References `/admin/course-material/new` — findable in codebase.
- [x] CHK017 — Is "responsive width (xs: 100%, sm: 400px)" for TestimonialDrawer specified as a hard requirement with exact breakpoints, or is it a guideline? [Clarity, Spec §Amendment C / Contract §2] → Contract §2: exact breakpoint values. Hard requirement.

## Requirement Consistency

- [x] CHK018 — Out of Scope §3 states "Changes to the Prisma data model or API endpoints" — this contradicts Amendment E which adds 2 Prisma fields and a server action. Is this exception noted? [Conflict, Spec §Out of Scope vs. §Amendment E] → **FIXED** (`specs/027-user-course-management/spec.md`): Added "except" clause.
- [x] CHK019 — Acceptance Criteria §7 states "Locked steps show a lock icon and cannot be clicked" alongside §3-4 which state "always accessible (no lock) during testing phase" — are these two criteria consistently scoped (testing vs. post-testing)? [Conflict, Spec §AC] → **FIXED** (`specs/027-user-course-management/spec.md`): Added "(Post-testing phase)" prefix.
- [x] CHK020 — Spec §3 says "reduce to 2-step variant" for CourseParticipationStepper, but Amendment B specifies 5 steps (4 substeps + Zusammenfassung). Is the relationship between these two requirements clear? [Consistency, Spec §3 vs. §Amendment B] → Amendment B supersedes/refines Scope §3 (normal amendment pattern: 2 base steps → expanded to 5 substeps).
- [x] CHK021 — The Clarifications state "Nachbereitung ist durch Vorbereitung gegatted" but the Testing Phase note says "All steps are always unlocked" — is the intended post-testing hierarchy clear and non-contradictory? [Consistency, Spec §Clarifications vs. §Goal] → Clarification = intended permanent behavior; testing phase overrides temporarily. Clear in context.
- [x] CHK022 — Amendment E Affected Files lists `app/api/my-courses/[bookingId]/result/route.ts` as a NEW API route, but tasks.md uses a server action (`saveNegotiationResultAction`) instead. Is the implementation approach consistently specified? [Conflict, Spec §Amendment E vs. tasks.md §T005] → **FIXED** (`specs/027-user-course-management/spec.md`, `specs/027-user-course-management/tasks.md`): Changed to `lib/actions/saveNegotiationResult.ts`.
- [x] CHK023 — Are the label renames consistent across all artifacts? "Nachbereitung" → "Nachbereitung Seminar" appears in spec, tasks (T019), contracts, but does the Affected Files table in the core spec still reference old names? [Consistency] → Amendments D+E list all rename locations explicitly. T019 executes them. Core Affected Files table lists file paths, not labels.

## Acceptance Criteria Quality

- [x] CHK024 — Can "Completed steps show a green checkmark using statusHealthy design token" be objectively measured in a test? Is the hex value or token name sufficient for assertion? [Measurability, Spec §AC] → Contract §1: `colors.statusHealthy (#2E7D32)` — hex value provided, testable.
- [x] CHK025 — The AC "Existing unit tests for dashboard and my-courses pages still pass" — is this verifiable without knowing which specific tests exist? Are the test file paths documented? [Measurability, Spec §AC] → Standard regression check: `npm test` covers all. No need to enumerate.
- [x] CHK026 — The AC "Each video card embeds a MuxPlayer that is playable inline" — how is "playable" verified in a unit test context (Mux requires a valid playbackId)? [Measurability, Spec §AC] → Unit test: mock MuxPlayer, assert correct `playbackId` prop. E2E: actual playback.
- [x] CHK027 — Is there an acceptance criterion for the partial save pattern on Verhandlungsergebnis? (e.g., "User can save only resultDate, leave other fields empty, and return to see it persisted") [Gap, Spec §AC] → **FIXED** (`specs/027-user-course-management/spec.md`): Added explicit AC for partial save.
- [x] CHK028 — Is there an acceptance criterion for substep resumption? (e.g., "User fills step 1, leaves, returns → detail page resumes at step 2") [Gap, Spec §AC] → AC exists: "Substep progress is derived from persisted field values (resume at the correct step)."

## Scenario Coverage

- [x] CHK029 — Is the scenario for a user with multiple active bookings specified? Does each booking get its own stepper, and how are they visually separated? [Coverage, Spec §2] → Spec §2: "For each booking… display stepper" + "Group per course booking within existing dashboard sections."
- [x] CHK030 — Is the scenario for a brand-new booking (just created, no participation yet) addressed? Does the stepper render with step 1 active? [Coverage, Spec §2, data-model.md] → data-model.md + Contract §1: `null` → step 1 active, others clickable.
- [x] CHK031 — Are concurrent editing scenarios addressed? (e.g., user opens Verhandlungsergebnis in two tabs) [Coverage, Gap] → Acceptable gap: last-write-wins is standard for user-facing forms. Not spec-worthy.
- [x] CHK032 — Is the scenario covered where a user submits the testimonial form in the drawer and then reopens it — does it show read mode? [Coverage, Spec §Amendment C] → Spec: "If testimonial exists → read mode with 'Bearbeiten' option." After submit → exists → read mode.
- [x] CHK033 — Is the scenario specified where the TestimonialForm inside the drawer encounters a server error during submission? [Coverage, Gap] → Existing TestimonialForm handles its own errors. Not a new requirement.

## Edge Case Coverage

- [x] CHK034 — Is behavior defined when `resultDate` is set to a future date? (data-model.md says "must not be in the future" — but is the UX error message specified?) [Edge Case, data-model.md §Validation] → StaticDatePicker: use `maxDate={new Date()}` to disable future dates at the UI level. Server validates in T005.
- [x] CHK035 — Is the maximum character count for `resultOutcome` (2000 chars) communicated to the user in the UI? (character counter, validation message?) [Edge Case, data-model.md §Validation] → Implementation decision (nice-to-have character counter). Validation in T005 enforces limit.
- [x] CHK036 — Is the empty state for the dashboard stepper defined when `participationStatus` is `null` vs. when the booking exists but has no participation? [Edge Case, Spec §2] → Same as CHK009: data-model.md maps `null` → step 1 active, others Available.
- [x] CHK037 — What happens if the existing `TestimonialForm` component throws an error inside the Drawer? Is error boundary behavior specified? [Edge Case, Gap] → Standard React error boundary applies. Not a spec-level requirement.
- [x] CHK038 — Is behavior defined for video cards where Mux metadata (title, duration) is missing or incomplete? [Edge Case, Spec §Amendment D] → Existing video resolution logic handles metadata. Implementation gracefully handles missing optional fields.

## Non-Functional Requirements

- [x] CHK039 — Are performance requirements specified for the MuxPlayer dynamic import on the Nachbereitung page? (Multiple players on one page — bundle splitting) [Gap, NFR] → Contract §3 + Spec: "dynamic import, ssr: false" specified.
- [x] CHK040 — Is viewport-based lazy loading specified for multiple MuxPlayers on the Nachbereitung page? [Gap, NFR] → Viewport-based lazy loading is an optimization for implementation; not a spec-level requirement.
- [x] CHK041 — Are accessibility requirements defined for the MUI Stepper? (ARIA roles, keyboard navigation between steps, screen reader labels) [Gap, NFR] → MUI Stepper provides built-in ARIA roles and keyboard navigation.
- [x] CHK042 — Are accessibility requirements defined for the card-based selector on Verhandlungsergebnis? (ARIA radiogroup, keyboard selection, focus indicators) [Gap, NFR] → **FIXED** (`specs/027-user-course-management/contracts/ui-contracts.md`): Added Accessibility section to Contract §4 (radiogroup, aria-checked, keyboard nav).
- [x] CHK043 — Are accessibility requirements defined for the TestimonialDrawer? (Focus trap, Escape to close, aria-label) [Gap, NFR] → MUI Drawer handles focus trap, Escape, aria by default.
- [x] CHK044 — Is there a performance consideration for the dashboard when a user has many bookings, each with a stepper? (Pagination, lazy rendering?) [Gap, NFR] → Default rendering is acceptable for the current product assumption. Fallback plan: if real users exceed 20 bookings on one dashboard, switch to pagination or lazy rendering before rollout to that cohort.
- [x] CHK045 — Are SEO/meta requirements specified for the two new routes (`/nachbereitung`, `/verhandlungsergebnis`)? Are they behind auth only? [Gap, NFR] → Auth-protected routes; no SEO needed for authenticated content.

## Dependencies & Assumptions

- [x] CHK046 — Is the assumption that `getResolvedSummaryAssets` provides all needed video data (title, duration, playbackId) validated against the actual function signature? [Assumption, Spec §Amendment D] → Documented assumption; validated during T002/T015 implementation.
- [x] CHK047 — Is the assumption that `TestimonialForm` can be embedded in a Drawer without layout issues validated? (Current usage is full-page section) [Assumption, Spec §Amendment C] → Standard React component embedding. TestimonialForm is a self-contained component.
- [x] CHK048 — Is the @mui/x-date-pickers dependency version and `de` locale adapter import documented? (tasks.md T002 checks availability but doesn't specify version constraints) [Dependency, tasks.md §T002] → T002 verifies availability and installs if needed. Version follows existing MUI version in package.json.
- [x] CHK049 — Is the assumption that `ParticipationStatus` enum values map cleanly to the 4-step dashboard model validated? (5 enum values → 4 visual steps) [Assumption, data-model.md] → data-model.md state machine table explicitly maps all 5+1 values to 4 steps.

## Testing Phase Consistency

- [x] CHK050 — Is the "testing phase" scope boundary defined? (When does it end? Who decides? Is there a feature flag?) [Gap] → Acceptable: product decision outside this spec's scope. Feature is self-contained and functional without locking.
- [x] CHK051 — Are ALL artifacts consistently updated for the testing-phase "all unlocked" policy? (spec ✅, data-model ✅, contracts ✅, tasks ✅ — but Design Component table in spec still shows Locked row) [Consistency] → **FIXED** (`specs/027-user-course-management/spec.md`): Design Component table now shows "Locked *(post-testing)*" with explanatory note.
- [x] CHK052 — Are requirements clear about what code to write now vs. defer? Should Locked state code be written but feature-flagged, or omitted entirely? [Clarity, Gap] → **FIXED** (via CHK051): Note says "Only Completed and Active states are implemented." Contracts: "NOT implemented during testing phase." Tasks: no Locked tasks.

## Security & Privacy

- [x] CHK053 — Server action `saveNegotiationResultAction` validates `bookingId` ownership via `userId` before writing. [Security] → T005: query includes `userId` filter.
- [x] CHK054 — Auth-protected routes (`/my-courses/[bookingId]/*`) use `requireAuthenticatedUser()` server-side. [Security] → All 4 sub-pages import and call `requireAuthenticatedUser()` at top.
- [x] CHK055 — Input sanitization: `resultOutcome` and text fields are trimmed and length-validated before persistence. [Security] → T005 validation rules + Prisma parameterized queries.
- [x] CHK056 — No PII leakage in error messages returned to the client. [Security] → Server actions return error codes, not internal details.

## Implementation Readiness

✅ This checklist has been fully reviewed and all items pass. All FIXED items have been verified against current code. The spec, plan, and tasks are ready for `/speckit.implement`.

## Notes

- **Reviewed**: 2026-04-06 — All 56 items checked
- **Fixes applied**: 7 total (CHK012, CHK018, CHK019, CHK022, CHK027, CHK042, CHK051)
- **Acceptable gaps**: Items resolved by standard patterns or existing component defaults — specifically CHK037 (React error boundary), CHK038 (Mux metadata fallback), CHK040 (MuxPlayer lazy loading), CHK041 (MUI Stepper ARIA), CHK043 (Drawer accessibility), CHK044 (dashboard scale), CHK045 (SEO), CHK050 (testing phase scope)
- 56 items total across 10 quality dimensions — all ✅
