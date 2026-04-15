# UI Contracts: User Course Management (Spec 027)

**Date**: 2026-04-04 | **Plan**: [plan.md](plan.md)

## Shared Types

The following types are referenced across multiple contracts:

- **`ParticipationStatus`**: `'PREPARATION' | 'SUMMARY' | 'DEBRIEFING' | 'RESULT' | 'COMPLETE'` — defined in `components/dashboard/CourseProgressStepper.tsx` and derived from the Prisma `CourseParticipation` model.
- **`ResolvedSummaryAsset`**: `{ id: string; title: string; description: string | null; muxPlaybackId: string; muxAssetId: string; sortOrder: number; source: SummaryAssetSource }` — defined in `lib/db/courseParticipation.ts`, resolved from `SummaryAsset` joined with Mux metadata.

## 1. CourseProgressStepper (NEW)

**Path**: `components/dashboard/CourseProgressStepper.tsx`
**Type**: Client Component (`'use client'`)

### Props Interface

```typescript
interface CourseProgressStepperProps {
  bookingId: string;
  participationStatus: ParticipationStatus | null; // null = no participation yet
  courseStartDate?: string | null; // ISO date string for computing timeline dates
}
```

### Step Configuration

```typescript
type DashboardStepKey = 'VORBEREITUNG' | 'SEMINARVERANSTALTUNG' | 'NACHBEREITUNG' | 'VERHANDLUNGSERGEBNIS';

interface DashboardStep {
  key: DashboardStepKey;
  number: number;
  label: string;
  hrefTemplate: string; // navigation target (replace {bookingId})
  completedAt: ParticipationStatus[]; // statuses where this step is completed
  activeAt: ParticipationStatus[];    // statuses where this step is active
  timelineLabel: string;              // label relative to course start date
}

const DASHBOARD_STEPS: DashboardStep[] = [
  {
    key: 'VORBEREITUNG',
    number: 1,
    label: 'Vorbereitung Seminar',
    hrefTemplate: '/my-courses/{bookingId}/vorbereitung',
    completedAt: ['SUMMARY', 'DEBRIEFING', 'RESULT', 'COMPLETE'],
    activeAt: ['PREPARATION'],
    timelineLabel: 'Spätestens eine Woche vorher',
  },
  {
    key: 'SEMINARVERANSTALTUNG',
    number: 2,
    label: 'Seminarveranstaltung',
    hrefTemplate: '/my-courses/{bookingId}/seminarveranstaltung',
    completedAt: ['DEBRIEFING', 'RESULT', 'COMPLETE'],
    activeAt: ['SUMMARY'],
    timelineLabel: 'Seminardatum',
  },
  {
    key: 'NACHBEREITUNG',
    number: 3,
    label: 'Nachbereitung Seminar',
    hrefTemplate: '/my-courses/{bookingId}/nachbereitung',
    completedAt: ['RESULT', 'COMPLETE'],
    activeAt: ['DEBRIEFING'],
    timelineLabel: 'Einige Tage danach',
  },
  {
    key: 'VERHANDLUNGSERGEBNIS',
    number: 4,
    label: 'Verhandlungsergebnis',
    hrefTemplate: '/my-courses/{bookingId}/verhandlungsergebnis',
    completedAt: ['COMPLETE'],
    activeAt: ['RESULT'],
    timelineLabel: 'Spätestens 8 Wochen danach',
  },
];
```

### Step Icon Contract

| State | Icon | Color |
|-------|------|-------|
| Completed | `Check` (inside numbered circle) | `colors.statusHealthy` (#2E7D32) |
| Active | `RadioButtonChecked` | `theme.palette.primary.main` |
| Available | `RadioButtonUnchecked` | `theme.palette.text.secondary` |
| Locked (post-testing) | `Lock` | `theme.palette.text.disabled` |

> **Testing phase:** All steps render as clickable (Active or Available). Locked state is
> defined for post-testing but NOT implemented during the current testing phase.

### Render Contract

- Heading: "Dein Fortschritt" (`<Typography variant="subtitle1">`)
- MUI `<Stepper orientation="horizontal" activeStep={computedIndex}>`
- Active/Available steps render as a `<Link>` navigating to the step URL
- Completed step renders as a reviewable link
- Each step shows a `timelineLabel` below the step icon
- (Post-testing) Locked step renders as disabled with tooltip "Vorheriger Schritt muss abgeschlossen werden"

### Test Assertions

```
- renders 4 steps with correct labels
- shows step 1 active when participationStatus is PREPARATION
- shows step 1 completed + step 2 active when participationStatus is SUMMARY
- shows all completed when participationStatus is COMPLETE
- all steps are clickable (testing phase — no locked state)
- active step links to correct URL
- participationStatus null → step 1 active, other steps still clickable
```

---

## 2. TestimonialDrawer (NEW)

**Path**: `components/dashboard/TestimonialDrawer.tsx`
**Type**: Client Component (`'use client'`)

### Props Interface

```typescript
interface TestimonialDrawerProps {
  open: boolean;
  onClose: () => void;
  bookingId: string;
  courseName: string;
  userProfile: {
    firstName: string | null;
    lastName: string | null;
    imageUrl?: string;
    city?: string;
  };
}
```

### Render Contract

- MUI `<Drawer anchor="right">` with responsive width (`xs: 100%, sm: 400px`)
- Header: "Erfahrungsbericht" with close (X) button
- Body: Embeds existing `<TestimonialForm>` component
- If testimonial exists for booking → read mode with "Bearbeiten" option
- onClose fires on: backdrop click, X button, successful form submission

### Test Assertions

```
- renders drawer when open=true
- does not render when open=false
- shows TestimonialForm inside drawer
- calls onClose on backdrop click
- calls onClose on X button click
- passes courseName and userProfile to form
```

---

## 3. DebriefingVideoCatalog (NEW)

**Path**: `components/participation/DebriefingVideoCatalog.tsx`
**Type**: Client Component (`'use client'`)

### Props Interface

```typescript
interface DebriefingVideoCatalogProps {
  assets: ResolvedSummaryAsset[];
  courseTitle: string;
}
```

### Render Contract

- Heading: "Nachbereitung Seminar" + course title subtitle
- CSS Grid: 2 columns on `md+`, 1 column on `xs`/`sm`
- Each video card (`<Paper>`):
  - `MuxPlayer` (dynamic import, `ssr: false`, `accentColor={colors.bronze}`, 16:9 aspect)
  - Title, optional description
- Current scope does not persist or display a watched-state badge across sessions
- Back link: "Zurück zum Dashboard" at bottom

### Test Assertions

```
- renders grid with correct number of video cards
- renders course title as subtitle
- renders back link pointing to /dashboard
- each card shows title
- empty assets array shows fallback message
```

---

## 4. NegotiationResultForm (NEW)

**Path**: `components/participation/NegotiationResultForm.tsx`
**Type**: Client Component (`'use client'`)

### Props Interface

```typescript
type NegotiationPartner = 'DIRECT_MANAGER' | 'SKIP_LEVEL_MANAGER' | 'HR_DEPARTMENT';

interface NegotiationResultFormProps {
  bookingId: string;
  initialValues?: {
    resultDate: Date | null;
    resultNegotiationPartner: NegotiationPartner | null;
    resultOutcome: string | null;
  };
  saveAction: (params: {
    bookingId: string;
    resultDate?: string | null;
    resultNegotiationPartner?: string | null;
    resultOutcome?: string | null;
  }) => Promise<{ success: boolean; error?: { code?: string; message: string } }>;
}
```

`resultDate` is managed in the UI as `Date | null` by `StaticDatePicker` and converted
to a `yyyy-MM-dd` string before `saveAction` is called.

### Field Contract

| # | Label | Component | Persisted Field |
|---|-------|-----------|-----------------|
| 1 | Wann hast du dein Gehaltsgespräch geführt? | `StaticDatePicker` (de locale) | `resultDate` |
| 2 | Mit wem hast du verhandelt? | Card selector (3 options) | `resultNegotiationPartner` |
| 3 | Was war das Verhandlungsergebnis? | Multiline textarea | `resultOutcome` |

### Card Selector Options

| Key | Label |
|-----|-------|
| `DIRECT_MANAGER` | Mit meiner Führungskraft |
| `SKIP_LEVEL_MANAGER` | Mit der Führungskraft meiner Führungskraft |
| `HR_DEPARTMENT` | Mit der Personalabteilung |

### Accessibility

- Card selector uses `role="radiogroup"` with `aria-label="Mit wem hast du verhandelt?"`
- Each card has `role="radio"` with `aria-checked` reflecting selection state
- Keyboard: Arrow keys to navigate, Space/Enter to select

### Render Contract

- `<Paper>` container matching Vorbereitung layout
- Sequential fields in vertical flow
- Save button: "Verhandlungsergebnis speichern"
- Back link: "Zurück zum Dashboard"
- Success: save via server action → show success feedback

### Test Assertions

```
- renders all 3 fields
- date picker shows calendar grid (not text input)
- card selector shows 3 options
- clicking a card selects it (highlighted border)
- textarea accepts input
- submit calls save action with correct data
- renders initial values when provided
- back link points to /dashboard
```

---

## 5. CourseParticipationStepper (MODIFY)

**Path**: `components/participation/CourseParticipationStepper.tsx`

### Changed Step Configuration

**Before**: 4 steps (Vorbereitung, Zusammenfassung, Nachbereitung, Ergebnis)
**After**: 5 steps (4 preparation substeps + Zusammenfassung)

```typescript
const allSteps: StepDefinition[] = [
  { key: 'PREP_INTENT', label: 'Seminar-Absicht', ... },
  { key: 'PREP_RESULTS', label: 'Erwartete Ergebnisse', ... },
  { key: 'PREP_MANAGER', label: 'Dein Vorgesetzter', ... },
  { key: 'PREP_RESUME', label: 'Lebenslauf', ... },
  { key: 'SUMMARY', label: 'Zusammenfassung', ... },
];
```

### Substep Behaviour

- Each substep shows ONLY its own field
- "Weiter" button advances to next substep (saves current field value, even if empty string)
- "Überspringen" = "Weiter" with empty value
- Step completion derived from field value: `null` → not visited, `""` → skipped, value → completed

---

## 6. CourseCard (MODIFY)

**Path**: `components/dashboard/CourseCard.tsx`

### Props Changes

```typescript
interface CourseCardProps {
  // ... existing props unchanged ...
  participationStatus: ParticipationStatus | null; // NEW — for stepper
  // Note: existing courseTitle prop is forwarded as courseName to TestimonialDrawer
  userProfile: {               // NEW — for testimonial drawer
    firstName: string | null;
    lastName: string | null;
    imageUrl?: string;
    city?: string;
  };
}
```

### Button Changes

- **Remove**: `#nachbereitung` and `#ergebnisse` deep-link buttons
- **Add**: "Erfahrungsbericht" button (`variant="outlined"`, `RateReview` icon)
  - Visibility is based on `CourseCardProps.sectionType`, not `ParticipationStatus`
  - Visible for: `COMPLETED`
  - Hidden for: `NEXT_SEMINAR`, `UPCOMING`, `NO_SHOW`
  - Opens `TestimonialDrawer`

---

## 7. Dashboard API Extension

**Endpoint**: `GET /api/dashboard/bookings` (or wherever dashboard data is fetched)

### Response Change

Add `participationStatus` to each booking object:

```typescript
interface DashboardBooking {
  // ... existing fields ...
  participationStatus: ParticipationStatus | null; // NEW
}
```

This enables the `CourseProgressStepper` to render correct step states without an additional fetch.
