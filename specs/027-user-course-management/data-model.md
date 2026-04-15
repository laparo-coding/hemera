# Data Model: User Course Management (Spec 027)

**Date**: 2026-04-04 | **Plan**: [plan.md](plan.md)

## Entity Changes

### CourseParticipation (MODIFY — 2 new fields)

No new entities. Two fields added to the existing `CourseParticipation` model.

| Field | Type | DB Column | Required | Description |
|-------|------|-----------|----------|-------------|
| `resultDate` | `DateTime?` | `result_date` | No | Date the negotiation conversation took place (interpreted as UTC; Prisma `DateTime` maps to PostgreSQL `TIMESTAMP(3)` which does not store timezone info) |
| `resultNegotiationPartner` | `String?` | `result_negotiation_partner` | No | Who the user negotiated with (enum key as string, max 30 chars validated in app layer) |

**Prisma addition**:
```prisma
model CourseParticipation {
  // ... existing fields ...
  resultDate               DateTime?  @map("result_date")
  resultNegotiationPartner String?    @map("result_negotiation_partner")
}
```

**Negotiation partner values** (stored as string, validated in application layer):
| Key | Label (German) |
|-----|----------------|
| `DIRECT_MANAGER` | Mit meiner Führungskraft |
| `SKIP_LEVEL_MANAGER` | Mit der Führungskraft meiner Führungskraft |
| `HR_DEPARTMENT` | Mit der Personalabteilung |

**Decision**: Store as `String?` rather than a Prisma `enum` because:
- Only 3 values, unlikely to be referenced in complex queries
- Application-layer validation via TypeScript union type is sufficient
- Avoids a migration-heavy enum addition for a single field
- **Data-integrity note**: Direct database access or out-of-band updates can bypass application-layer TypeScript union validation; such access must be avoided or coupled with DB-level validation/guardrails

## Data Integrity Risks

The `course_participations.result_negotiation_partner` column remains a nullable string.
Direct database writes can therefore store invalid values unless they go through the
application validation layer. If direct DB writes become part of operations, add a DB-level
CHECK constraint restricting the column to `NULL`, `DIRECT_MANAGER`,
`SKIP_LEVEL_MANAGER`, or `HR_DEPARTMENT`.

### Existing fields reused

| Field | Model | Reused For |
|-------|-------|------------|
| `preparationIntent` | CourseParticipation | Substep 1 — Seminar-Absicht |
| `desiredResults` | CourseParticipation | Substep 2 — Erwartete Ergebnisse |
| `lineManagerProfile` | CourseParticipation | Substep 3 — Dein Vorgesetzter |
| `resultOutcome` | CourseParticipation | Verhandlungsergebnis textarea |
| `status` | CourseParticipation | Dashboard stepper state derivation |

### No new entities

The spec explicitly states: "Changes to the Prisma data model or API endpoints" are out of scope
except for the two fields above (Amendment E). No new models, relations, or indexes required.

## State Machine

### ParticipationStatus (existing enum — unchanged)

```
PREPARATION → SUMMARY → DEBRIEFING → RESULT → COMPLETE
```

### Dashboard Stepper State Mapping

> **Testing phase:** All steps are always clickable — no locking logic active.
> The table below shows the *visual state* derivation from `participationStatus`.
> Locked behavior will be reintroduced post-testing.

| ParticipationStatus | Vorbereitung Seminar | Seminarveranstaltung | Nachbereitung Seminar | Verhandlungsergebnis |
|---------------------|----------------------|----------------------|------------------------|----------------------|
| PREPARATION | ● Active | ○ Available | ○ Available | ○ Available |
| SUMMARY | ✅ Completed | ● Active | ○ Available | ○ Available |
| DEBRIEFING | ✅ Completed | ✅ Completed | ● Active | ○ Available |
| RESULT | ✅ Completed | ✅ Completed | ✅ Completed | ● Active |
| COMPLETE | ✅ Completed | ✅ Completed | ✅ Completed | ✅ Completed |
| (no participation) | ● Active | ○ Available | ○ Available | ○ Available |

### Detail Page Substep Derivation

Substep progress is derived from field values (see research.md #4):

```
preparationIntent = null  → Substep 0 (Seminar-Absicht)
preparationIntent != null, desiredResults = null → Substep 1 (Erwartete Ergebnisse)
desiredResults != null, lineManagerProfile = null → Substep 2 (Dein Vorgesetzter)
lineManagerProfile != null, no resume → Substep 3 (Lebenslauf)
all filled or skipped → Substep 4 (Zusammenfassung)
```

"Skipped" = field saved as empty string `""` (distinguishes from `null` = not visited).

## Validation Rules

| Field | Rule |
|-------|------|
| `resultDate` | Nullable; when set, must be a valid date; must not be in the future (compared against server time in UTC); round-trip validated (reject semantic rollover dates like Feb 30) |
| `resultNegotiationPartner` | Nullable; when set, must be one of: `DIRECT_MANAGER`, `SKIP_LEVEL_MANAGER`, `HR_DEPARTMENT`; max 30 chars |
| `resultOutcome` | Max 2000 chars (existing VarChar constraint) |
| `preparationIntent` | Max 2000 chars (existing) |
| `desiredResults` | Max 2000 chars (existing) |
| `lineManagerProfile` | Max 2000 chars (existing) |

## Migration

**Migration name**: `add_result_date_and_negotiation_partner`

```sql
ALTER TABLE "course_participations"
ADD COLUMN "result_date" TIMESTAMP(3),
ADD COLUMN "result_negotiation_partner" TEXT;
```

Both fields are nullable — no data backfill needed. Migration is safe for zero-downtime deployment.

> **Note**: Prisma maps `String?` to PostgreSQL `TEXT` by default. A max-length constraint of 30 chars
> for `resultNegotiationPartner` is enforced in the application layer (TypeScript union type + validation),
> not via a `VARCHAR(50)` column. This is consistent with the project’s existing approach for enum-like string fields.
