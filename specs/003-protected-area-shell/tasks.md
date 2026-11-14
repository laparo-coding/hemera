# Tasks: Protected Area Shell

**Input**: Design documents from `/specs/003-protected-area-shell/` **Prerequisites**: plan.md ✅,
research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

## Execution Flow (main)

```
1. ✅ Loaded plan.md: Next.js 14.2.3, TypeScript, @clerk/nextjs, @mui/material
2. ✅ Loaded design documents:
   → data-model.md: ClerkUser, NavigationPermission entities
   → contracts/: Authentication, Role-based access, Component contracts
   → research.md: Clerk integration decisions, SSR architecture
   → quickstart.md: User/Admin auth flows, security validation
3. ✅ Generated tasks by category:
   → Setup: Clerk configuration, middleware setup
   → Tests: Authentication flows, role-based navigation
   → Core: Protected layout, navigation components
   → Integration: Middleware, error handling
   → Polish: Performance validation, E2E tests
4. ✅ Applied task rules:
   → Components marked [P] (different files)
   → Tests marked [P] (independent scenarios)
   → Middleware before components (auth dependency)
5. ✅ Tasks numbered T001-T018
6. ✅ Dependencies mapped
7. ✅ Parallel execution examples provided
```

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions

- **Web app structure**: Next.js App Router at repository root
- **Components**: `app/(protected)/`, `components/`
- **Middleware**: `middleware.ts` at root
- **Tests**: `tests/e2e/`, existing Playwright structure

## Phase 3.1: Setup & Configuration

- [x] T001 Configure Clerk environment variables in `.env.local`
- [x] T002 Install @clerk/nextjs dependency if not present
- [x] T003 [P] Configure TypeScript types for Clerk in `lib/types/auth.ts`

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

- [x] T004 [P] Authentication contract test in `tests/e2e/auth-protected-area.spec.ts`
- [x] T005 [P] Role permission contract test in `tests/e2e/role-based-navigation.spec.ts`
- [x] T006 [P] Protected layout component contract test in `tests/e2e/protected-layout.spec.ts`
- [x] T007 [P] Protected navigation component contract test in
  `tests/e2e/protected-navigation.spec.ts`
- [x] T008 [P] Middleware protection contract test in `tests/e2e/middleware-protection.spec.ts`

## Phase 3.3: Core Implementation (ONLY after tests are failing)

- [x] T009 Clerk middleware configuration in `middleware.ts`
- [x] T010 [P] Auth utility helpers in `lib/auth/helpers.ts`
- [x] T011 [P] Role permission utilities in `lib/auth/permissions.ts`
- [x] T012 [P] Protected layout component in `app/(protected)/layout.tsx`
- [x] T013 [P] Protected navigation component in `components/ProtectedNavigation.tsx`

## Phase 3.4: Protected Routes Implementation

- [x] T014 Dashboard page in `app/(protected)/dashboard/page.tsx`
- [x] T015 Courses page in `app/(protected)/courses/page.tsx`
- [x] T016 Admin page in `app/(protected)/admin/page.tsx`

## Phase 3.5: Integration & Error Handling

- [x] T017 Error boundary for auth failures in `components/AuthErrorBoundary.tsx`
- [x] T018 Sign-out handling and redirect logic
- [x] T019 Performance validation tests for TTFB <200ms and auth checks <100ms in
  `tests/e2e/performance.spec.ts`

## Dependencies

- **Setup first**: T001-T003 before all others
- **Tests before implementation**: T004-T008 before T009-T018
- **Middleware before components**: T009 before T012-T013
- **Auth utilities before components**: T010-T011 before T012-T013
- **Layout before pages**: T012 before T014-T016
- **Performance validation last**: T019 after T012-T018 (requires implementation to test)

## Parallel Execution Examples

### Phase 3.2: Contract Tests (All Parallel)

```bash
# Launch T004-T008 together:
Task: "Authentication contract test in tests/e2e/auth-protected-area.spec.ts"
Task: "Role permission contract test in tests/e2e/role-based-navigation.spec.ts"
Task: "Protected layout component contract test in tests/e2e/protected-layout.spec.ts"
Task: "Navigation component contract test in tests/e2e/protected-navigation.spec.ts"
Task: "Middleware protection contract test in tests/e2e/middleware-protection.spec.ts"
```

### Phase 3.3: Core Implementation (Utilities + Components)

```bash
# After T009 completes, launch T010-T013 together:
Task: "Auth utility helpers in lib/auth/helpers.ts"
Task: "Role permission utilities in lib/auth/permissions.ts"
Task: "Protected layout component in app/(protected)/layout.tsx"
Task: "Protected navigation component in components/ProtectedNavigation.tsx"
```

### Phase 3.4: Protected Pages (All Parallel)

```bash
# After T012 completes, launch T014-T016 together:
Task: "Dashboard page in app/(protected)/dashboard/page.tsx"
Task: "Courses page in app/(protected)/courses/page.tsx"
Task: "Admin page in app/(protected)/admin/page.tsx"
```

## Detailed Task Specifications

### T001: Configure Clerk Environment Variables

**File**: `.env.local` **Description**: Add required Clerk environment variables **Requirements**:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/protected/dashboard`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/protected/dashboard`

### T004: Authentication Contract Test

**File**: `tests/e2e/auth-protected-area.spec.ts` **Requirements**:

- Test unauthenticated redirect to `/sign-in`
- Test successful sign-in flow
- Test access to protected area after authentication
- Test sign-out functionality
- Must FAIL initially (no implementation exists)

### T009: Clerk Middleware Configuration

**File**: `middleware.ts` **Requirements**:

- Configure `clerkMiddleware` for route protection
- Protect all `/protected/*` routes
- Allow public access to `/`, `/sign-in`, `/sign-up`
- Implement auth error handling
- Follow research.md middleware contract

### T012: Protected Layout Component

**File**: `app/(protected)/layout.tsx` **Requirements**:

- Server Component with `auth()` check
- Redirect unauthenticated users to `/sign-in`
- Include `ProtectedNavigation` component
- Display user information and sign-out button
- Role-based navigation rendering
- Error boundary integration

### T019: Performance Validation Tests

**File**: `tests/e2e/performance.spec.ts` **Requirements**:

- TTFB measurement for protected routes (<200ms target)
- Auth check performance validation (<100ms target)
- Load testing for concurrent user sessions
- Memory usage monitoring during auth flows
- Network latency impact assessment
- Performance regression detection

### T013: Protected Navigation Component

**File**: `components/ProtectedNavigation.tsx` **Requirements**:

- MUI Tabs component
- Role-based tab visibility (user: Dashboard+Courses, admin: +Admin area)
- Active tab highlighting
- Navigation between sections
- User profile display with role information
- Sign-out button integration

## Contract Validation Requirements

Each test must validate the corresponding contract from `contracts/README.md`:

- **T004**: `AuthenticationContract` - Server Component authentication
- **T005**: `RolePermissionContract` - Role-based access validation
- **T006**: `ProtectedLayoutContract` - Layout component behavior
- **T007**: `ProtectedNavigationContract` - Navigation component behavior
- **T008**: `MiddlewareContract` - Route protection middleware

## Success Criteria

### Implementation Complete

- [ ] All tests pass (T004-T008)
- [ ] User can sign in and access protected area
- [ ] Role-based navigation works (user vs admin)
- [ ] Unauthenticated users redirected to sign-in
- [ ] Sign-out clears session and redirects
- [ ] Performance targets met (<200ms TTFB, <100ms auth checks)
- [ ] Error handling patterns work in dev and production modes

### Quickstart Validation

- [ ] All scenarios in `quickstart.md` pass
- [ ] User authentication flow works end-to-end
- [ ] Admin role access validated
- [ ] Security validation passes
- [ ] Error handling graceful

## Notes

- [P] tasks = different files, no dependencies
- Verify tests fail before implementing (TDD)
- Commit after each task completion
- Follow Server Component patterns (no client-side auth)
- Maintain security-first approach (SSR authentication)

## Task Generation Rules Applied

1. **From Contracts**: 5 contract test tasks [P] (T004-T008)
2. **From Data Model**: Auth utilities and role permissions (T010-T011)
3. **From Component Contracts**: Layout and navigation components (T012-T013)
4. **From Quickstart Scenarios**: E2E validation covered in contract tests
5. **From Research Decisions**: Middleware setup and SSR approach

## Validation Checklist ✅

- [x] All contracts have corresponding tests (T004-T008)
- [x] All components have implementation tasks (T012-T013)
- [x] All tests come before implementation (T004-T008 before T009-T018)
- [x] Parallel tasks truly independent (different files)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] Dependencies properly mapped
- [x] TDD approach maintained
