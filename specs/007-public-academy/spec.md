# Feature Specification: Public Area – Academy Information and Bookable Courses

**Feature Branch**: `007-public-academy`  
**Created**: 2025-10-01  
**Status**: Draft  
**Input**: User description: "In the public area of the website, information about the hemera
academy is listed. It includes courses that can be booked."

## Execution Flow (main)

```text
1. Parse user description from Input
   → If empty: ERROR "No feature description provided"
2. Extract key concepts from description
   → Identify: actors, actions, data, constraints
3. For each unclear aspect:
   → Mark with [NEEDS CLARIFICATION: specific question]
4. Fill User Scenarios & Testing section
   → If no clear user flow: ERROR "Cannot determine user scenarios"
5. Generate Functional Requirements
   → Each requirement must be testable
   → Mark ambiguous requirements
6. Identify Key Entities (if data involved)
7. Run Review Checklist
   → If any [NEEDS CLARIFICATION]: WARN "Spec has uncertainties"
   → If implementation details found: ERROR "Remove tech details"
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines

- ✅ Focus on WHAT and WHY (public information, course list, booking initiation)
- ❌ No technical details (no framework/API naming)
- 👥 Written for business stakeholders

### Section Requirements

- Mandatory: User Scenarios & Testing, Requirements
- Optional: Key Entities (relevant here)
- Remove sections that do not apply

### For AI Generation

- Clearly mark ambiguities (see [NEEDS CLARIFICATION])
- Do not guess prices/payment methods/locations — mark them
- Provide testable, measurable criteria

---

## Clarifications

### Session 2025-10-22

- Q: How should booking be performed for public course CTAs? → A: Internal booking frontend (own
  flow)
- Q: Should prices be displayed publicly and in what form? → A: Public, gross (incl. VAT)
- Q: How should localization/region for content/prices be handled? → A: Single locale (DE, EUR)
- Q: How should course availability be determined/displayed? → A: Internal capacities/inventory

### Session 2025-10-23

- Q: Where must booking be initiated? → A: Always on the course details page. The course list CTA
  links to the course details and MUST NOT start booking directly.
- Impact on spec: Acceptance scenarios updated; FR-005 refined to specify booking CTA location and
  to forbid direct booking from the list.

## User Scenarios & Testing (mandatory)

### Primary User Story

As an interested visitor, I want to read information about the hemera academy on the public website
and view available courses so that I can choose a suitable course and start a booking.

### Acceptance Scenarios

1. Given I am on the public academy section, When I open the course overview, Then I see a list of
   current courses with title, short description, duration/scope, start date/availability, price
   (gross incl. VAT), and a clear CTA to the course details page (no direct booking from the list).
2. Given a course has multiple upcoming dates/variants, When I open the course details page, Then I
   see a full description, learning objectives, target audience, prerequisites, dates/variants, and
   a booking CTA.
3. Given I am on the course details page, When I click "Jetzt buchen" (booking CTA in German UI),
   Then I am taken into the booking flow and a clear process starts (at least select a date/variant
   and start a booking request).
4. Given a course is sold out, When I view the course overview and the course details page, Then I
   see a visible badge "Ausgebucht" (sold out), the booking CTA is disabled or absent, and no direct
   booking is possible on either page.

### Edge Cases

- Keine Kurse verfügbar: Es wird ein Empty-State mit einem “Next best alternative”-Hinweis
  angezeigt.
- Kurs ausgebucht: Badge „Ausgebucht“ und keine direkte Buchungs-CTA; keine Warteliste unterstützt.
- Lokalisierung: Einsprachig (Sprache DE, Währung EUR); Multi-Locale vorerst außerhalb des Umfangs.
- Externer Buchungsflow: Außerhalb des Umfangs — Buchung erfolgt intern.

---

## Requirements (mandatory)

### Functional Requirements

- FR-001: The system MUST provide a public academy information area (overview, mission,
  contact/FAQ).
- FR-002: The system MUST display a public course list including at least title, short description,
  duration/scope, and availability/start date(s).
- FR-003: The system MUST provide a course details view with full description, learning objectives,
  target audience, prerequisites, dates/variants, and a booking CTA.
- FR-004: The system MUST display an appropriate empty state when no courses are available or only
  sold-out courses exist.
- FR-005: The system MUST provide a booking CTA on the course details page that initiates an
  internal booking process. The course list MUST NOT start the booking directly; its CTA links to
  the course details.
- FR-006: The system MUST clearly indicate when a course is sold out (UI label "Ausgebucht" in
  German) and prevent booking accordingly.
- FR-007: The system SHOULD offer a selectable option (e.g., date selection) for courses with
  multiple dates/variants before starting the booking.
- FR-008: The system MUST NOT include search or filter options in the initial release (out of scope
  for MVP).
- FR-009: The system SHOULD cover basic SEO content for the academy and course pages (title, meta
  description, human-readable URLs, structured data) without technical specification.
- FR-010: The system MUST consider basic accessibility (readable labels, keyboard navigation,
  contrasts).
- FR-011: The system MUST determine availability from internal capacity inventory and clearly
  represent at least "Verfügbar" (available) vs. "Ausgebucht" (sold out) for each date/variant
  (optionally "Wenige Plätze").
- FR-012: The system MUST display prices publicly as gross (incl. VAT), including currency and a tax
  notice.
- FR-013: The system MUST operate as single locale in the public area (language: DE, currency: EUR).

### Key Entities

- Academy info: headline, introduction, sections (e.g., mission, program, contact/FAQ).
- Course: title, short description, description, learning objectives, target audience,
  prerequisites, category/level, duration/scope, price (gross incl. VAT), currency,
  availability/status, media (image), SEO texts.
- Course date/variant: start date(s)/times, onsite/online, capacity_total, capacity_reserved,
  availability_status (derived from internal inventory), language.
- Booking CTA: target type: internal booking flow, target URL or process start parameters
  (internal).

### Defaults / Conventions

- Locale: language = DE, currency = EUR (public pages)
- Terminology: UI in German; status labels use “Verfügbar”, “Ausgebucht” and optionally “Wenige
  Plätze”.
- Frontend-Sprache: Deutsch (DE). Test-Konfigurationsdateien und technische Test-Artefakte dürfen
  Englisch sein.

---

## Scope Exclusions

- Waitlist for sold-out courses or dates is not supported in the initial scope.
- Search and filter options for the course list are not supported in the initial scope.

---

## Review & Acceptance Checklist

### Content Quality

- [ ] No implementation details
- [x] Focus on user and business value
- [x] Understandable for non-technical stakeholders
- [x] Mandatory sections filled

### Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers
- [x] Testability/clarity largely ensured
- [x] Success criteria recognizable (e.g., visible list, detail, booking CTA)
- [x] Scope clearly bounded (public, discovery + booking start)
- [x] Dependencies/assumptions marked (pricing, availability, localization)

---

## Execution Status

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [ ] Review checklist passed

---

## Clarify Session Report (2025-10-22)

### Questions asked and resolved

- Q1: Booking flow target for public CTAs? → Internal booking frontend (own flow)
- Q2: Price visibility and tax model? → Public pricing, gross (incl. VAT)
- Q3: Locale/region baseline? → Single locale (language DE, currency EUR)
- Q4: Availability source/model? → Derived from internal capacities/inventory
- Q5: Waitlist for sold-out courses/dates? → Not supported (no waitlist)

### Sections updated in this session

- Requirements: FR-005, FR-011, FR-012, FR-013
- User Scenarios: pricing and CTA language
- Edge Cases: localization note, external booking out-of-scope
- Key Entities: course price/currency; capacity-derived availability; booking CTA targets internal
  flow

### Coverage summary (requirements)

| ID     | Status    | Notes                                               |
| ------ | --------- | --------------------------------------------------- |
| FR-001 | Covered   | —                                                   |
| FR-002 | Covered   | —                                                   |
| FR-003 | Covered   | —                                                   |
| FR-004 | Covered   | —                                                   |
| FR-005 | Clarified | Internal booking flow confirmed                     |
| FR-006 | Covered   | —                                                   |
| FR-007 | Covered   | Optional pre-booking selection allowed              |
| FR-008 | Clarified | No filters/search in initial release (out of scope) |
| FR-009 | Covered   | —                                                   |
| FR-010 | Covered   | —                                                   |
| FR-011 | Clarified | Availability from internal capacities               |
| FR-012 | Clarified | Public prices are gross incl. VAT                   |
| FR-013 | Clarified | Single locale: DE/EUR                               |

### Open clarifications

None at this time.

## Clarify Session Report (2025-10-23)

### Questions asked and resolved (2025-10-23)

- Q1: Where must booking be initiated? → Always on the course details page. The course list CTA
  links to the course details and MUST NOT start booking directly.

### Sections updated in this session (2025-10-23)

- Requirements: FR-005 refined (CTA location on detail; list CTA must not start booking)
- Acceptance Scenarios: 1 updated (CTA points to details), 3 updated (booking starts from detail
  page)

### Open clarifications (2025-10-23)

None at this time.

### Suggested next question (Q5)

Should we support a waitlist when a course/date is sold out? If yes, what is the minimal viable flow
(CTA change, user inputs, consent), and how are notifications handled (manual vs. automated)?
