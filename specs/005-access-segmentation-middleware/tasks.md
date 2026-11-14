# Tasks: 005-access-segmentation-middleware

Branch: `005-access-segmentation-middleware`  
Scope: Centralize non-public access gating and noindex application via middleware and helpers.  
Note: Tests first; respect Node runtime for server checks.

## Pre-flight

- [ ] T000 Confirm protected patterns and public segments  
  Files: `specs/005-access-segmentation-middleware/plan.md`

## Tests first

- [ ] T001 E2E: unauthenticated redirect for protected routes [P]  
  Files: `tests/e2e/protected-redirect.spec.ts`  
  Assert: `/protected` redirects to sign-in; return URL preserved.
- [ ] T002 E2E: authenticated pass-through and noindex [P]  
  Files: `tests/e2e/protected-noindex.spec.ts`  
  Assert: Signed-in request to `/protected` returns 200 and includes `noindex` meta/headers.
- [ ] T003 Unit: header/meta helper sets noindex correctly [P]  
  Files: `tests/unit/noindex-helper.spec.ts`  
  Assert: helper composes expected header/meta for non-public pages.

## Implementation (make tests pass)

- [ ] T010 Implement route pattern configuration  
  Files: `app/lib/access-config.ts`
- [ ] T011 Implement middleware for access gating  
  Files: `middleware.ts`  
  Behavior: redirect unauthenticated; allow authenticated; avoid loops.
- [ ] T012 Implement noindex helper and integrate with protected layouts/pages  
  Files: `app/lib/robots.ts`, `app/(protected)/layout.tsx`
- [ ] T013 Admin API guard audit and fixes  
  Files: `app/api/admin/**/route.ts`  
  Scope: Ensure admin guard present. Suspects:
  - `app/api/admin/users/route.ts` (currently no auth/admin check)
  - `app/api/admin/courses/route.ts` (currently no auth/admin check)
  - `app/api/admin/analytics/route.ts` (review/guard)
  - `app/api/admin/errors/route.ts` (wrap with admin guard on GET/POST)

## Quality gates & docs

- [ ] T020 Docs: Update plan with patterns and behavior  
  Files: `specs/005-access-segmentation-middleware/plan.md`
- [ ] T021 CI docs gates pass (markdown lint, spelling DE/EN, link check)

## Done criteria

- Unauth is redirected from protected routes; auth users can access.
- Protected pages deliver `noindex`; public pages unaffected.
- Tests green; docs gates green.
