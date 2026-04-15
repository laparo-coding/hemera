<!-- cspell:words nachbereitung ergebnisse vorbereitung -->
# Specification: User Course Management (Spec 027)

## Goal

Improve the user-facing course participation flow by restructuring where the four
post-booking phases are displayed. Move **Nachbereitung Seminar** and
**Verhandlungsergebnis** out of the course detail page (`/my-courses/[bookingId]`) and
surface the cross-phase journey on the main **Dashboard** (`/dashboard`) as a 4-step
overall stepper:

1. **Vorbereitung Seminar**
2. **Seminarveranstaltung**
3. **Nachbereitung Seminar**
4. **Verhandlungsergebnis**

## Background

Currently all four participation phases (Vorbereitung, Zusammenfassung, Nachbereitung,
Ergebnis) are rendered on `/my-courses/[bookingId]` via the `CourseParticipationStepper`
component. The dashboard (`/dashboard`) only shows course cards with anchor-link buttons
(`#vorbereitung`, `#nachbereitung`, `#ergebnisse`) that deep-link into the detail page.

User testing revealed two usability problems:

1. Users do not discover Nachbereitung and Ergebnis because they are buried inside the
   course detail page, only visible for completed courses.
2. The sequential dependency between the three phases is not obvious — users attempt
   Ergebnis before completing Vorbereitung.

## Scope

### In Scope

1. **Remove Nachbereitung and Ergebnis from `/my-courses/[bookingId]`**
   - Remove `<DebriefingSection />` rendering from the course detail page.
   - Remove `<ResultsSection />` rendering from the course detail page.
   - Keep `<PreparationSection />` on the course detail page (unchanged).
   - Keep `<TestimonialSectionMyCourses />` on the course detail page (unchanged).

2. **Add a sequential progress component to `/dashboard`**
   - For each booking that has a `CourseParticipation`, display the four phases as a
     **MUI Stepper** directly on the dashboard.
   - The stepper must indicate:
     - **Completed** steps (checkmark icon, success color from design tokens)
     - **Active/current** step (highlighted, actionable)
     - **Locked** steps (greyed out / disabled, with a lock icon or visual hint that
       the previous step must be completed first)
   - Each step links to the corresponding content/form:
     - Vorbereitung Seminar → `/my-courses/[bookingId]/vorbereitung`
     - Seminarveranstaltung → `/my-courses/[bookingId]/seminarveranstaltung`
     - Nachbereitung Seminar → `/my-courses/[bookingId]/nachbereitung`
     - Verhandlungsergebnis → `/my-courses/[bookingId]/verhandlungsergebnis`
   - Group the stepper per course booking within the existing dashboard sections
     ("Nächstes Seminar", "Abgeschlossene Seminare").

3. **Update the `CourseParticipationStepper` component**
   - The previous 4-step overall stepper (Vorbereitung → Zusammenfassung →
     Nachbereitung → Ergebnis) on the detail page is replaced by a 5-step preparation
     substep stepper (4 preparation substeps + Zusammenfassung).
   - A new dashboard-specific stepper variant shows the four cross-phase steps
     (Vorbereitung Seminar, Seminarveranstaltung, Nachbereitung Seminar,
     Verhandlungsergebnis).

4. **Remove stale deep-link buttons from `CourseCard`**
   - Remove the `#nachbereitung` and `#ergebnisse` action buttons from the dashboard
     `CourseCard` component — replaced by the new stepper.

### Out of Scope

- No changes to the Prisma data model beyond the fields specified in Amendment E
  (`resultDate`, `resultNegotiationPartner`).
- No API changes beyond the Amendment E save/load flow and the dashboard response
  extension that includes `participationStatus`.
- Zusammenfassung (Summary) phase — stays exclusively on the detail page.
- Admin-side views.

## Design Component

Use a **MUI `<Stepper>`** in horizontal orientation as a timeline:

```
┌─────────────────────────────────────────────────┐
│  Dein Fortschritt                               │
│                                                 │
│  ✅ Vorbereitung ─ ● Seminarveranstaltung ─ ○ Nachbereitung ─ ○ Ergebnis │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Step States:**
| State | Icon | Color | Interaction |
|-------|------|-------|-------------|
| Completed | `CheckCircle` | `colors.statusHealthy` | Link to review |
| Active | `RadioButtonChecked` | `primary` | Link/button to start |
| Locked | `Lock` | `text.disabled` | Disabled, tooltip explains prerequisite |

## Affected Files

| File | Change |
|------|--------|
| `app/my-courses/[bookingId]/page.tsx` | Remove `<DebriefingSection />` and `<ResultsSection />` rendering |
| `app/my-courses/[bookingId]/DebriefingSection.tsx` | Legacy file retained temporarily; replaced by `components/participation/DebriefingVideoCatalog.tsx` for the new Nachbereitung page |
| `app/my-courses/[bookingId]/ResultsSection.tsx` | Legacy file retained temporarily; no longer rendered on the detail page |
| `components/participation/CourseParticipationStepper.tsx` | Replace with 5-step preparation substep variant for detail page |
| `components/dashboard/CourseCard.tsx` | Remove `#nachbereitung` and `#ergebnisse` buttons |
| `components/dashboard/CourseProgressStepper.tsx` | **NEW** — 4-step sequential progress component |
| `app/my-courses/[bookingId]/seminarveranstaltung/page.tsx` | **NEW** — Seminar event page route with curriculum display |
| `components/UserDashboard.tsx` | Integrate `CourseProgressStepper` per booking |

## Amendment A: Rename "Vorbereitung" → "Vorbereitung Seminar"

All user-facing occurrences of the label **"Vorbereitung"** on the course detail page
(`/my-courses/[bookingId]`) must be renamed to **"Vorbereitung Seminar"**:

| Location | Current Text | New Text |
|----------|-------------|----------|
| `PreparationSection.tsx` — section heading (`<Typography>`) | Vorbereitung | Vorbereitung Seminar |
| `PreparationSection.tsx` — CTA button | Vorbereitung starten | Vorbereitung Seminar starten |
| `CourseParticipationStepper.tsx` — step label in `allSteps` array | Vorbereitung | Vorbereitung Seminar |

The dashboard stepper (`CourseProgressStepper`) also uses "Vorbereitung Seminar" as its
first step label.

## Amendment B: Preparation Substeps in Detail-Page Stepper

The current implementation renders **one** "Vorbereitung" step in the vertical MUI
Stepper that contains all preparation inputs as a single form. This must be changed so
that **each preparation question and the Lebenslauf upload becomes its own numbered step**
in the existing vertical stepper design (connected by the gray MUI connector line).

### Current (single step)

```
1. Vorbereitung          ← one step containing all fields as a single form
   │  - Absicht (preparationIntent)
   │  - Erwartete Ergebnisse (desiredResults)
   │  - Vorgesetzter (lineManagerProfile)
   │  - Lebenslauf (ResumeUploader)
2. Zusammenfassung
```

### Target (four substeps)

```
1. Seminar-Absicht        ← preparationIntent field
│
2. Erwartete Ergebnisse   ← desiredResults field
│
3. Dein Vorgesetzter      ← lineManagerProfile field
│
4. Lebenslauf             ← ResumeUploader component (optional)
│
5. Zusammenfassung        ← video asset list (unchanged)
```

### Substep Definitions

| # | Label | Field / Component | Required | Description |
|---|-------|-------------------|----------|-------------|
| 1 | Seminar-Absicht | `preparationIntent` (textarea) | No | "Was ist deine Absicht für dieses Seminar?" |
| 2 | Erwartete Ergebnisse | `desiredResults` (textarea) | No | "Welche Ergebnisse erwartest du nach dem Seminar?" |
| 3 | Dein Vorgesetzter | `lineManagerProfile` (textarea) | No | "Beschreibe deinen Vorgesetzten" |
| 4 | Lebenslauf | `ResumeUploader` | No | Upload-Bereich für den Lebenslauf |
| 5 | Zusammenfassung | `SummaryAssetList` | — | Video-Assets (unchanged) |

### Behaviour

- Each substep is individually completable via a **"Weiter"** button.
- Completing substep *n* advances the stepper to substep *n+1*.
- Users may skip optional substeps (all preparation fields are optional) by clicking
  "Überspringen" or directly clicking "Weiter" with an empty field.
- The **overall** `ParticipationStatus` transitions to `SUMMARY` only when the user
  advances past the last preparation substep (step 4 → step 5).
- Substep progress should be persisted: if a user fills step 1 and leaves, returning
  should resume at step 2 (derive from which fields already have values).
- Each substep shows **only** its own field — no scrolling through a long form.

### ParticipationStatus Enum and Step Mapping

```ts
enum ParticipationStatus {
  PREPARATION,
  SUMMARY,
  DEBRIEFING,
  RESULT,
  COMPLETE,
}
```

- Detail page preparation substep 1 → `PREPARATION`
- Detail page preparation substep 2 → `PREPARATION`
- Detail page preparation substep 3 → `PREPARATION`
- Detail page preparation substep 4 → `PREPARATION`
- Advancing from preparation substep 4 to Zusammenfassung → `SUMMARY`
- Completing Zusammenfassung / entering Seminarveranstaltung → `DEBRIEFING`
- Completing Nachbereitung / entering Verhandlungsergebnis → `RESULT`
- Completing Verhandlungsergebnis → `COMPLETE`

### Substep Resume Logic

The resume index is derived server-side from persisted field values using a
first-empty-field rule.

```ts
function getPreparationResumeIndex(input: {
  preparationIntent: string | null;
  desiredResults: string | null;
  lineManagerProfile: string | null;
  hasResume: boolean;
}): number {
  if (input.preparationIntent == null) return 0;
  if (input.desiredResults == null) return 1;
  if (input.lineManagerProfile == null) return 2;
  if (!input.hasResume) return 3;
  return 4;
}
```

- All fields empty → resume at substep 1
- `preparationIntent` filled, `desiredResults` empty → resume at substep 2
- All three text fields filled, résumé missing → resume at substep 4
- Empty string `""` means skipped but visited; `null` means not visited yet
- The client receives the derived index and renders that step as active

### Affected Files (additional)

| File | Change |
|------|--------|
| `app/my-courses/[bookingId]/PreparationSection.tsx` | Break `PreparationStepContent` into individual step renderers; rename heading + button |
| `components/participation/CourseParticipationStepper.tsx` | Expand `allSteps` from 2 entries to 5 entries (4 preparation substeps + Zusammenfassung); adjust `getStepIndex()` and step completion logic |

## Amendment C: Move Testimonial to Dashboard with Flyout

The testimonial call-to-action currently lives on the course detail page
(`/my-courses/[bookingId]`) inside `<TestimonialSectionMyCourses>`. This must be moved
to the **user dashboard** so participants encounter it more prominently.

### Changes

1. **Remove `<TestimonialSectionMyCourses>` from `/my-courses/[bookingId]/page.tsx`.**
   The testimonial section no longer renders on the course detail page.

2. **Add an "Erfahrungsbericht" button to the `CourseCard` component** (dashboard tile).
   - Visible for **all** section types (`NEXT_SEMINAR`, `UPCOMING`, `COMPLETED`) — users
     can write their experience report at any time, not only after course completion.
   - Not shown for `NO_SHOW` cards (user did not attend).
   - Placed alongside the existing primary action button ("Vorbereitung" / "Details").
   - Label: **"Erfahrungsbericht"** with a `RateReview` icon.
   - Variant: `outlined` to visually distinguish from the primary action button.

3. **Clicking the button opens a flyout (MUI `Drawer`)** anchored to the right side.
   - The drawer renders the existing `TestimonialForm` component (from
     `components/testimonial/TestimonialForm`).
   - If a testimonial already exists for the booking, it is shown in read mode with an
     "Bearbeiten" option — same logic as the current `TestimonialSectionMyCourses`.
   - The drawer closes on successful submission or on explicit close (X button / backdrop click).

4. **Pass required data through `CourseCard` props.**
  - Use the existing `courseTitle` prop from `CourseCard` (no new prop required).
   - Add `userProfile: { firstName, lastName, imageUrl?, city? }` prop — sourced from
     the dashboard data fetch in `UserDashboard.tsx`.

### Wireframe

```
┌──────────────────────────────────────────────────────────┐
│  🎓 Gehaltsverhandlung Intensiv                         │
│     📅 15.03.2026  ⏰ 09:00 - 17:00  📍 Hamburg        │
│     📄 Rechnung herunterladen                           │
│                                                         │
│                    [ Details ]  [ Erfahrungsbericht ]   │
└──────────────────────────────────────────────────────────┘

         Click "Erfahrungsbericht" →

                              ┌──────────────────────────┐
                              │  ✕  Erfahrungsbericht    │
                              │                          │
                              │  Teile deine Erfahrung   │
                              │  mit diesem Kurs.        │
                              │                          │
                              │  ┌──────────────────┐    │
                              │  │ Dein Bericht...  │    │
                              │  │                  │    │
                              │  └──────────────────┘    │
                              │                          │
                              │  Namensanzeige: [▼]      │
                              │                          │
                              │  [ Absenden ]            │
                              └──────────────────────────┘
```

### Affected Files (additional)

| File | Change |
|------|--------|
| `app/my-courses/[bookingId]/page.tsx` | Remove `<TestimonialSectionMyCourses>` rendering |
| `app/my-courses/[bookingId]/TestimonialSectionMyCourses.tsx` | Keep file (reuse form logic), or extract shared parts |
| `components/dashboard/CourseCard.tsx` | Add `courseName`, `userProfile` props; add "Erfahrungsbericht" button for COMPLETED cards |
| `components/dashboard/TestimonialDrawer.tsx` | **NEW** — MUI Drawer wrapping `TestimonialForm` with fetch/display/edit logic |
| `components/UserDashboard.tsx` | Pass `userProfile` data to `CourseCard` |

## Amendment D: Rename "Nachbereitung" → "Nachbereitung Seminar" + Video Catalog Page

### Rename

All user-facing occurrences of **"Nachbereitung"** must be renamed to
**"Nachbereitung Seminar"**:

| Location | Current Text | New Text |
|----------|-------------|----------|
| `DebriefingSection.tsx` — heading | Nachbereitung | Nachbereitung Seminar |
| `CourseCard.tsx` — dashboard button (if any) | Nachbereitung | Nachbereitung Seminar |
| Dashboard stepper (`CourseProgressStepper`) — step label | Nachbereitung | Nachbereitung Seminar |

### Navigation

The **"Nachbereitung Seminar"** button/step on the dashboard navigates to a dedicated
page at `/my-courses/[bookingId]/nachbereitung` (new route). This replaces the previous
anchor-link approach (`#nachbereitung`).

### Video Catalog Page

The new page `/my-courses/[bookingId]/nachbereitung` displays **all videos that were
recorded with the signed-in user** for that specific course/booking. The layout follows a
**video catalog** design:

```
┌─────────────────────────────────────────────────────────────────┐
│  Nachbereitung Seminar                                         │
│  Gehaltsverhandlung Intensiv                                   │
│                                                                │
│  ┌────────────────────────────────┐  ┌─────────────────────────┤
│  │  ▶ [    Mux Player     ]      │  │  ▶ [   Mux Player    ]  │
│  │     16:9 aspect ratio         │  │     16:9 aspect ratio   │
│  │                               │  │                         │
│  ├────────────────────────────────┤  ├─────────────────────────┤
│  │  1. Rollenspiel Einstieg      │  │  2. Gehaltsargumente    │
│  │  Dauer: 12:34                 │  │  Dauer: 08:45           │
│  │  ✓ Angesehen                  │  │                         │
│  └────────────────────────────────┘  └─────────────────────────┘
│                                                                │
│  ┌────────────────────────────────┐  ┌─────────────────────────┤
│  │  ▶ [    Mux Player     ]      │  │  ▶ [   Mux Player    ]  │
│  │     16:9 aspect ratio         │  │     16:9 aspect ratio   │
│  ├────────────────────────────────┤  ├─────────────────────────┤
│  │  3. Abschlussgespräch         │  │  4. Feedback-Runde      │
│  │  Dauer: 15:20                 │  │  Dauer: 06:12           │
│  └────────────────────────────────┘  └─────────────────────────┘
│                                                                │
│  [ ← Zurück zum Dashboard ]                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Design Component

- **Layout**: Responsive CSS Grid — 2 columns on desktop (`md` and up), 1 column on mobile.
- **Each video card** (`Paper` / `Card`):
  - Embedded **`MuxPlayer`** from `@mux/mux-player-react` (dynamic import, `ssr: false`)
    with `accentColor={colors.bronze}`, 16:9 aspect ratio.
  - Title, optional description, duration (if available from Mux metadata).
  - "✓ Angesehen" badge once the user has started playback (same tracking as
    `SummaryAssetList`).
- **Video playback**: Inline — each video is playable directly from its card, no modal
  or separate player page needed.
- **Back link**: "Zurück zum Dashboard" button at the bottom.

### Data Source

Videos are sourced from the existing `ParticipationSummaryOverride` model — these are
booking-specific video recordings that the admin has assigned to individual participants.
If no overrides exist, fall back to `CourseSummaryAsset` records for the course (same
resolution logic as `getResolvedSummaryAssets` in `lib/db/courseParticipation`).

The existing API route `GET /api/my-courses/[bookingId]/summary` already provides the
resolved asset list — reuse it for the Nachbereitung page.

### Affected Files

| File | Change |
|------|--------|
| `app/my-courses/[bookingId]/nachbereitung/page.tsx` | **NEW** — Server Component page that loads booking context |
| `components/participation/DebriefingVideoCatalog.tsx` | **NEW** — Client Component video catalog grid with MuxPlayer cards |
| `app/my-courses/[bookingId]/DebriefingSection.tsx` | Legacy file retained temporarily; deprecated in favor of `components/participation/DebriefingVideoCatalog.tsx` |
| `components/dashboard/CourseProgressStepper.tsx` | Update step label; step links to `/my-courses/[bookingId]/nachbereitung` |

## Amendment E: Rename "Ergebnis" → "Verhandlungsergebnis" + Result Form Page

### Rename

All user-facing occurrences of **"Ergebnis"** must be renamed to
**"Verhandlungsergebnis"**:

| Location | Current Text | New Text |
|----------|-------------|----------|
| `ResultsSection.tsx` — heading | Teilnahme bestätigt | Verhandlungsergebnis |
| Dashboard stepper (`CourseProgressStepper`) — step label | Ergebnis | Verhandlungsergebnis |
| `CourseParticipationStepper.tsx` — step label in `allSteps` | Ergebnis | Verhandlungsergebnis |

### Navigation

The **"Verhandlungsergebnis"** button/step on the dashboard navigates to a dedicated
page at `/my-courses/[bookingId]/verhandlungsergebnis` (new route).

### Page Layout

The page copies the layout of the **Vorbereitung** page (`PreparationSection`) — a
`Paper` container with sequential form fields, each with a colored label, inside a
vertical flow. Three fields in order:

#### Field 1 — Date Picker: "Wann hast du dein Gehaltsgespräch geführt?"

- MUI `StaticDatePicker` (from `@mui/x-date-pickers`) with inline month view.
- Displays the month calendar directly in the page layout (no separate text input).
- Label: **"Wann hast du dein Gehaltsgespräch geführt?"**
- Persisted to Prisma model field `resultDate` (`DateTime?`).

#### Field 2 — Choice Selector: "Mit wem hast du verhandelt?"

- Uses the same **Card-based selector** pattern as `MaterialTypeSelector` on
  `/admin/course-material/new` — clickable cards with hover/focus states, one selection
  at a time.
- Label: **"Mit wem hast du verhandelt?"**
- Three options:

| Key | Label |
|-----|-------|
| `DIRECT_MANAGER` | Mit meiner Führungskraft |
| `SKIP_LEVEL_MANAGER` | Mit der Führungskraft meiner Führungskraft |
| `HR_DEPARTMENT` | Mit der Personalabteilung |

- Each option is a `Card` with `CardActionArea`, vertically stacked (single column).
- Selected card shows a highlighted border (`colors.marsala`) and filled background
  (`colors.beige`).
- Persisted to Prisma model field `resultNegotiationPartner`
  (`String?` — stores the key, e.g. `"DIRECT_MANAGER"`).

#### Field 3 — Text Input: "Was war das Verhandlungsergebnis?"

- Multiline `<textarea>` with the same styling as the Vorbereitung text fields
  (no border, `colors.lightGray` background, `borderRadius: 8px`, min-height 240px).
- Label: **"Was war das Verhandlungsergebnis?"**
- Persisted to the existing Prisma field `resultOutcome` (`String?`).

### Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│  Verhandlungsergebnis                                       │
│  Gehaltsverhandlung Intensiv                                │
│                                                             │
│  Wann hast du dein Gehaltsgespräch geführt?                 │
│  ┌───────────────────────────────────────────┐              │
│  │  ◄  April 2026  ►                        │              │
│  │  Mo Di Mi Do Fr Sa So                     │              │
│  │   1  2  3  4  5  6  7                     │              │
│  │   8  9 10 11 12 13 14                     │              │
│  │  15 16 17 18 19 20 21                     │              │
│  │  22 23 24 25 26 27 28                     │              │
│  │  29 30                                    │              │
│  └───────────────────────────────────────────┘              │
│                                                             │
│  Mit wem hast du verhandelt?                                │
│  ┌─────────────────────────────────────────────┐            │
│  │  ● Mit meiner Führungskraft          [✓]    │  ← selected│
│  └─────────────────────────────────────────────┘            │
│  ┌─────────────────────────────────────────────┐            │
│  │  ○ Mit der Führungskraft meiner FK          │            │
│  └─────────────────────────────────────────────┘            │
│  ┌─────────────────────────────────────────────┐            │
│  │  ○ Mit der Personalabteilung                │            │
│  └─────────────────────────────────────────────┘            │
│                                                             │
│  Was war das Verhandlungsergebnis?                          │
│  ┌─────────────────────────────────────────────┐            │
│  │  Beschreibe das Ergebnis deiner             │            │
│  │  Gehaltsverhandlung...                      │            │
│  │                                             │            │
│  └─────────────────────────────────────────────┘            │
│                                                             │
│  [ Verhandlungsergebnis speichern ]                         │
│                                                             │
│  [ ← Zurück zum Dashboard ]                                │
└─────────────────────────────────────────────────────────────┘
```

### Prisma Schema Changes

Add two new nullable fields to the `CourseParticipation` model:

```prisma
resultDate               DateTime?  @map("result_date")
resultNegotiationPartner String?    @map("result_negotiation_partner")
```

The existing `resultOutcome` field is reused for the free-text result. `resultDate`
remains nullable for existing records. No index is required for the current user-facing
scope. Validation is handled in the server action before the DB helper is called.

### Affected Files

| File | Change |
|------|--------|
| `app/my-courses/[bookingId]/verhandlungsergebnis/page.tsx` | **NEW** — Server Component page |
| `components/participation/NegotiationResultForm.tsx` | **NEW** — Client Component with DatePicker + choice cards + textarea |
| `prisma/schema.prisma` | Add `resultDate`, `resultNegotiationPartner` to `CourseParticipation` |
| `lib/db/courseParticipation.ts` | Add save/load helpers for the new fields |
| `app/api/my-courses/[bookingId]/result/route.ts` | Existing result endpoint remains for legacy result fields |
| `app/my-courses/[bookingId]/ResultsSection.tsx` | Legacy file retained temporarily; no longer rendered on the detail page |
| `components/dashboard/CourseProgressStepper.tsx` | Update step label to "Verhandlungsergebnis"; link to new route |

## Amendment F: Seminarveranstaltung Route with Curriculum Display

The route `/my-courses/[bookingId]/seminarveranstaltung` is a dedicated seminar event
page for the booked course. It corresponds to the affected-files entry
"Seminar event page route with curriculum display".

### Content

- Page title: **"Seminarveranstaltung"**
- Subtitle: course title from `Booking.course.title`
- Event date and time from `Booking.course.startDate`, `startTime`, `endTime`
- Location details from `Booking.course.location`
- Curriculum display from `Booking.course.curriculum`

### Curriculum Display Definition

- Daily agenda grouped by curriculum day
- Session objectives and learning outcomes from each curriculum module/topic
- Materials or attachments if they are already part of the curriculum payload

### Layout Notes

- Desktop: single centered content column with header, back link, then curriculum blocks
- Mobile: same structure with stacked spacing and full-width curriculum sections
- Primary CTA placement: back navigation above the page title

### Allowed Interactions

- Read agenda and curriculum topics
- Follow the back link to the booking detail page
- No attendance marking, calendar export, virtual-room join, print/share, or material download is required in this scope unless already available via the curriculum component

## Acceptance Criteria

- [ ] Nachbereitung and Ergebnis sections no longer appear on `/my-courses/[bookingId]`.
- [ ] Dashboard shows a stepper per booking with 4 sequential steps.
- [ ] Seminarveranstaltung step is shown between Vorbereitung Seminar and Nachbereitung Seminar.
- [ ] Nachbereitung step is visually locked until Vorbereitung status is `SUMMARY` or later.
- [ ] Verhandlungsergebnis step is visually locked until Nachbereitung is marked as `DEBRIEFING` or later.
- [ ] Completed steps show a green checkmark using `statusHealthy` design token.
- [ ] Active step is clickable and navigates to the relevant content.
- [ ] Locked steps show a lock icon and cannot be clicked.
- [ ] All user-facing labels use informal German ("Du"/"Dein").
- [ ] Existing unit tests for dashboard and my-courses pages still pass.
- [ ] Section heading reads "Vorbereitung Seminar" (not "Vorbereitung").
- [ ] CTA button reads "Vorbereitung Seminar starten" (not "Vorbereitung starten").
- [ ] Detail-page stepper shows 5 numbered steps (4 preparation substeps + Zusammenfassung).
- [ ] Each preparation substep displays only its own field.
- [ ] Substep progress is derived from persisted field values (resume at the correct step).
- [ ] Clicking "Weiter" on a substep advances to the next numbered step.
- [ ] All substeps are optional — users can advance with empty fields.
- [ ] Testimonial section no longer appears on `/my-courses/[bookingId]`.
- [ ] All course cards on the dashboard (except NO_SHOW) show an "Erfahrungsbericht" button.
- [ ] Clicking "Erfahrungsbericht" opens a right-side MUI Drawer with the testimonial form.
- [ ] Existing testimonials are displayed in the drawer with edit option.
- [ ] Drawer closes on successful submission, X button, or backdrop click.
- [ ] "Nachbereitung" is renamed to "Nachbereitung Seminar" in all user-facing locations.
- [ ] Dashboard "Nachbereitung Seminar" step links to `/my-courses/[bookingId]/nachbereitung`.
- [ ] Nachbereitung page displays a video catalog grid (2 columns desktop, 1 column mobile).
- [ ] Each video card embeds a MuxPlayer that is playable inline.
- [ ] Page includes a "Zurück zum Dashboard" back link.
- [ ] Video data is loaded from the existing summary asset resolution logic.
- [ ] "Ergebnis" is renamed to "Verhandlungsergebnis" in all user-facing locations.
- [ ] Dashboard "Verhandlungsergebnis" step links to `/my-courses/[bookingId]/verhandlungsergebnis`.
- [ ] Verhandlungsergebnis page copies the Vorbereitung layout (Paper container, sequential fields).
- [ ] Field 1 is a DatePicker showing the full month calendar, labeled "Wann hast du dein Gehaltsgespräch geführt?".
- [ ] Field 2 is a card-based choice selector (MaterialTypeSelector pattern) with 3 options for negotiation partner.
- [ ] Field 3 is a multiline textarea labeled "Was war das Verhandlungsergebnis?".
- [ ] All three fields persist to `CourseParticipation` (`resultDate`, `resultNegotiationPartner`, `resultOutcome`).
- [ ] Prisma migration adds `resultDate` and `resultNegotiationPartner` columns.
- [ ] Page includes a "Zurück zum Dashboard" back link.
