# Tasks: 006-observability-monitoring-baseline

Legend: [P] = can run in parallel (different files, no dependency)

Feature directory: `specs/006-observability-monitoring-baseline/` Sources involved:
`lib/monitoring/*`, `lib/utils/*`, `middleware.ts`, `app/**/*`

Context considered: plan.md (required), research.md (available). No contracts/ or data-model.md
exist yet → create tests/contracts directly in repo under `tests/`.

## Phase 3.1 – Setup

- [ ] T001 Align env flags for monitoring • Ensure consistent use of `ROLLBAR_SERVER_ACCESS_TOKEN`,
  `NEXT_PUBLIC_ROLLBAR_CLIENT_ACCESS_TOKEN`, `NEXT_PUBLIC_ENABLE_WEB_VITALS`,
  `NEXT_PUBLIC_DISABLE_ROLLBAR` across: - `lib/monitoring/rollbar-official.ts` -
  `lib/monitoring/rollbar.ts` - `lib/monitoring/instrumentation.ts` -
  `components/ErrorBoundary.tsx` • Add short env docs section stub to `docs/observability.md`
  (created/updated later in T017).

- [x] T006 Create `lib/observability/logger.ts` with JSON logger and redact helper
- [x] T007 Create `middleware.ts` request-id propagation (respect existing `x-request-id`)
- [x] T008 Create `lib/observability/request-context.ts` to read headers() and expose
  `getRequestId()`
- [x] T009 Rollbar init wrappers present: see `lib/monitoring/rollbar*.ts` (guarded by env and
  sampling)
- [x] T010 Add minimal Web Vitals handler hook in `app/layout.tsx` (no-op by default)

- [ ] T002 [P] Enforce no console.error usage • Update ESLint config to disallow `console.error`
  (allow `console.warn` only) and wire to CI via `npm run lint:ci`. • Add a quick unit test that
  fails if `console.error` is called in production mode.

## Phase 3.2 – Tests first (TDD) — MUST FAIL before Phase 3.3

- [x] T011 Add/align `docs/monitoring/deployment-monitoring-setup.md` with env vars, sampling,
  privacy safeguards, and runbook (how to find errors by requestId)
- [ ] T012 Update `README.md` badges/section with observability notes

## Phase 3.2 – Tests first (TDD) — MUST FAIL before Phase 3.3

- [x] T003 [P] Contract: Request-ID propagation and response headers • Create
  `tests/contracts/request-id.contract.spec.ts` • Assert: server always returns canonical
  `X-Request-ID`; inbound `x-request-id` is preserved as `externalRequestId` only; header
  present on responses (e.g., `/api/health`).

- [x] T004 [P] Contract: Privacy/Consent default OFF (no PII) • Create
  `tests/contracts/privacy-consent.contract.spec.ts` • Assert: without explicit consent, no
  user-identifying fields (email, name, userId) appear in structured logs or Rollbar payload
  contexts.

- [ ] T005 [P] Contract: Web Vitals gating • Create `tests/contracts/web-vitals.contract.spec.ts` •
  Assert: With `NODE_ENV=production` and `NEXT_PUBLIC_ENABLE_WEB_VITALS=true`, vitals send on
  public pages only; with flag unset or on private routes, no vitals are emitted.

- [ ] T006 [P] Integration: Structured JSON logging with requestId • Create
  `tests/integration/logging-json.spec.ts` • Assert: log output includes `level`, `message`,
  `timestamp`, and `requestId` (when request context available).

- [ ] T007 [P] Integration: Rollbar enabled/disabled behavior • Create
  `tests/integration/rollbar-enabled-disabled.spec.ts` • Assert: with token set, an intentional
  server error reports to Rollbar (mock transport); without token, app runs and no external
  calls are attempted.

## Phase 3.3 – Core implementation (only after tests are red)

- [ ] T008 [P] Canonical vs. external request-id semantics • Files: `middleware.ts`,
  `lib/utils/request-id.ts` • Generate canonical UUID for each request; store inbound
  `x-request-id` as `externalRequestId`; attach canonical `X-Request-ID` to all responses.

- [ ] T009 [P] Rollbar context correlation • Files: `lib/monitoring/rollbar.ts`,
  `lib/utils/api-logger.ts` • Attach `requestId` and `externalRequestId` to Rollbar
  scope/context for all error/info events.

- [ ] T010 [P] Error-first sampling defaults • Files: `lib/monitoring/rollbar.ts`,
  `lib/monitoring/rollbar-official.ts` • Configure sampling: 100% errors, ~5% non-errors;
  overridable via env (document variable names).

- [ ] T011 [P] PII redaction helper • File: `lib/utils/redact.ts` (new) and integrate into
  `lib/utils/api-logger.ts` • Redact common PII-like keys (email, name) by default; add unit
  coverage.

- [ ] T012 Web Vitals handler (public-only, prod-gated) • Files: `app/layout.tsx` (client boundary)
  and/or `app/_app`-equivalent hook • Implement vitals capture only when
  `NEXT_PUBLIC_ENABLE_WEB_VITALS=true` and page is public.

## Phase 3.4 – Integration and docs

- [ ] T013 Add `X-Request-ID` to API response helpers and audit routes • File:
  `lib/utils/api-response.ts` and check `app/api/**/route.ts` • Ensure all API responses include
  header using existing helper.

- [ ] T014 Retention policy documentation and settings • File: `docs/observability.md` • Document
  30/14/7 day defaults and how to configure provider-side retention.

## Phase 3.5 – Polish

- [ ] T015 [P] Docs: Observability runbook • File: `docs/observability.md` • Include env flags,
  sampling, privacy, request-id correlation, and "how to find errors by requestId".

- [ ] T016 [P] README: Observability section • File: `README.md` • Add short overview and link to
  `docs/observability.md`.

- [ ] T017 [P] Quality gates • Ensure lint, typecheck, unit/contract/e2e tests run green in CI.

## Dependencies

- Phase 3.2 tests (T003–T007) MUST be written and failing before Phase 3.3 implementation
  (T008–T012).
- T008 blocks T009 and T013 (request-id must be canonical to correlate and to set headers
  consistently).
- T011 can run in parallel but must complete before final docs (T015) to describe behavior
  accurately.
- Implementation before polish (T015–T017).

## Parallel execution examples

Example 1 — run contract tests in parallel:

```
/tasks run T003
/tasks run T004
/tasks run T005
```

Example 2 — implement independent items in parallel:

```
/tasks run T010
/tasks run T011
```

Example 3 — run focused npm tests locally (optional):

```
# Contract suite
npm run test -- tests/contracts/request-id.contract.spec.ts
npm run test -- tests/contracts/privacy-consent.contract.spec.ts
npm run test -- tests/contracts/web-vitals.contract.spec.ts

# Integration
npm run test -- tests/integration/logging-json.spec.ts
npm run test -- tests/integration/rollbar-enabled-disabled.spec.ts
```

## Notes

- [P] tasks must not touch the same file concurrently.
- Keep changes minimal and commit after each task.
- Use environment gating to avoid network telemetry in development by default.

## Additional follow-ups

- [ ] T018 [P] Contract: ErrorBoundary + unhandled rejections • Create tests to assert React error
  boundary and unhandled promise rejections are captured without PII when consent is off.
- [ ] T019 Align env flags (client/provider) tests • Add unit tests to verify consistent behavior of
  `ROLLBAR_ENABLED`/`NEXT_PUBLIC_DISABLE_ROLLBAR` and consent flags across server/client
  providers.
- [ ] T020 Public-route heuristic for vitals/analytics • Add tests and implementation notes to
  ensure vitals/analytics only on public pages.
