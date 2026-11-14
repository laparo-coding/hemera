# Tasks – Public Academy (007)

This list is generated from Phase 1 design and requirements.

## Contract Tests (API)

1. [ ] Add contract tests for GET /api/courses (schema validation against openapi.yaml)
2. [ ] Add contract tests for GET /api/courses/{id} (schema validation)
3. [ ] Add negative tests (404 for unknown id)

## Unit/Integration Tests

1. [ ] Unit test for availability calculation helper (capacity minus PAID|PENDING)
2. [ ] Unit test for price formatting (DE/EUR gross)
3. [ ] Component test for CourseDetail CTA states (available, sold out, already booked)
4. [ ] Component test for Course list card sold-out badge
5. [ ] API route test for /api/courses/{id} computes availableSpots correctly
6. [ ] Locale/Intl tests: DE/EUR formatting for prices and dates (FR-013)
7. [ ] Course list shows required fields: title, short description, duration/scope, availability
   (FR-002)
8. [ ] Course detail shows required fields: learning objectives, target audience, prerequisites,
   dates/variants (FR-003)

## E2E Tests

1. [x] Courses list shows sold-out badge and disabled CTA when availableSpots = 0
2. [x] Course detail shows disabled CTA with reason and sold-out badge
3. [ ] Booking CTA routes to internal flow `/bookings/new?courseId=...` (auth redirect covered)
4. [ ] Empty-State shown when no courses are available, including a next best alternative (FR-004)
5. [ ] When all courses are sold out, an appropriate message or empty-state is shown (FR-004)
6. [ ] No filters/search controls visible on the course list (FR-008)

## Observability & Error Handling

1. [ ] Replace any console.error in API routes with Rollbar structured logging
2. [ ] Ensure requestId propagation and userId context where available

## SEO & Accessibility

1. [ ] Validate JSON-LD schema on list and detail pages
2. [ ] Ensure headings structure and aria-disabled for CTA when disabled
3. [ ] Define measurable SEO acceptance: title + meta description set; JSON-LD passes validation
4. [ ] Accessibility acceptance: axe checks pass on list and detail; keyboard navigation over CTAs
   works

## CI/CD & Deployment

1. [ ] Ensure CI runs E2E against preview and production
2. [ ] Enforce Node 22.x in workflows
3. [ ] Confirm no manual CLI deployments; workflows only
4. [ ] Live Monitoring of Deploy workflows (Preview/Production) via GitHub Actions VS Code extension
   documented and enforced (Runbook link; acceptance includes log following, status
   verification, artifact review)

## Docs & Quickstart

1. [x] Create research.md
2. [x] Create data-model.md
3. [x] Create contracts/openapi.yaml
4. [x] Create quickstart.md
5. [x] Create plan.md

## Stretch (Post-MVP)

1. [ ] Multi-date/variant selection on detail page (UI + API)
2. [ ] Expose userBookingStatus in detail API (PAID/PENDING) for signed-in users
3. [ ] Public filters/search once MVP validated

## Public Academy Content

1. [ ] Implement public academy info pages (overview, mission, contact/FAQ) (FR-001)
2. [ ] Add stable data-testid to main sections for robust E2E checks
3. [ ] E2E: Public academy page loads and shows main sections (overview, mission, contact/FAQ)
4. [ ] Content review and link checks (all internal/external links reachable)
