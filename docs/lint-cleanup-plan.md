# ESLint Warnings Cleanup Plan

**Current Status**: 240 warnings (down from 341) **Target**: < 100 warnings **Strategy**: Split work
into 6 parallel PRs for different coding agents

## Progress Summary

| Phase       | Description               | Warnings   | Status             |
| ----------- | ------------------------- | ---------- | ------------------ |
| Phase 0     | ESLint 9 Migration        | 341        | ✅ PR #130         |
| Phase 1     | Transitive deps cleanup   | 337        | ✅ PR #131         |
| Phase 2     | Browser globals + Husky   | 307        | ✅ PR #132         |
| Phase 3     | Unused vars + case blocks | 259        | ✅ PR #136         |
| Phase 4     | Type refinement basics    | 240        | ✅ PR #138         |
| **Phase 5** | **Parallel cleanup**      | **→ ~100** | **🔄 In Progress** |

---

## PR #1: Error Handling & HTTP Types

**Agent Assignment**: Agent Alpha  
**Estimated Warnings Fixed**: ~40  
**Priority**: High  
**Complexity**: Medium

### Scope

Replace `any` types in error handling utilities with proper error types.

### Files to Update

- [ ] `lib/errors/base.ts` - Base error classes
- [ ] `lib/errors/http.ts` - HTTP error types
- [ ] `lib/errors/prisma-mapping.ts` - Prisma error mapping
- [ ] `lib/middleware/server-action-error-handling.ts` - Server action errors
- [ ] `app/admin/errors/page.tsx` - Error display component

### Success Criteria

- All `any` types replaced with `Error`, `unknown`, or specific error types
- TypeScript compilation succeeds
- Tests pass
- No new ESLint warnings introduced

### Type Strategy

```typescript
// Before
function handleError(error: any) { ... }

// After
function handleError(error: unknown) {
  if (error instanceof Error) { ... }
}
```

---

## PR #2: Monitoring & Analytics Types

**Agent Assignment**: Agent Beta  
**Estimated Warnings Fixed**: ~35  
**Priority**: High  
**Complexity**: Medium

### Scope

Add proper types for monitoring, analytics, and observability code.

### Files to Update

- [ ] `lib/monitoring/rollbar.ts` - Rollbar integration
- [ ] `lib/monitoring/rollbar-official.ts` - Official Rollbar client
- [ ] `lib/monitoring/deployment-monitor.ts` - Deployment monitoring
- [ ] `lib/monitoring/deployment-alerts.ts` - Alert system
- [ ] `lib/monitoring/web-vitals.ts` - Web vitals tracking
- [ ] `lib/analytics/request-analytics.ts` - Request analytics
- [ ] `components/monitoring/DeploymentMonitoringDashboard.tsx` - Dashboard
- [ ] `lib/utils/api-logger.ts` - API logging utilities

### Success Criteria

- Rollbar SDK types properly defined or imported
- Analytics event types clearly defined
- Dashboard component props properly typed
- All monitoring functions have explicit return types

### Type Strategy

```typescript
// Define event types
interface AnalyticsEvent {
  name: string;
  properties: Record<string, string | number | boolean>;
  timestamp: Date;
}

// Define monitoring data
interface DeploymentStatus {
  version: string;
  healthy: boolean;
  services: ServiceStatus[];
}
```

---

## PR #3: Service Layer Types

**Agent Assignment**: Agent Gamma  
**Estimated Warnings Fixed**: ~30  
**Priority**: Medium  
**Complexity**: Medium

### Scope

Type the business logic and service layer properly.

### Files to Update

- [ ] `lib/services/stripe.ts` - Stripe payment service
- [ ] `lib/services/booking.ts` - Booking service
- [ ] `lib/services/course.ts` - Course service
- [ ] `lib/services/error-analytics.ts` - Error analytics service
- [ ] `lib/seo/schemas.ts` - SEO schema generation

### Success Criteria

- Stripe webhook payloads properly typed
- Service methods have explicit return types
- Database query results properly typed
- SEO schema types match schema.org specs

### Type Strategy

```typescript
// Use Stripe types
import type Stripe from 'stripe';

interface BookingData {
  courseId: string;
  userId: string;
  amount: number;
  currency: string;
}

// Return explicit types
async function createBooking(data: BookingData): Promise<Booking> { ... }
```

---

## PR #4: Auth & Component Types

**Agent Assignment**: Agent Delta  
**Estimated Warnings Fixed**: ~25  
**Priority**: Medium  
**Complexity**: Low

### Scope

Fix types in authentication and UI components.

### Files to Update

- [ ] `lib/auth/helpers.ts` - Auth helper functions
- [ ] `components/auth/CustomSignInClient.tsx` - Sign in component
- [ ] `components/auth/CustomSignUpClient.tsx` - Sign up component
- [ ] `components/checkout/CheckoutPageClient.tsx` - Checkout page
- [ ] `components/CourseDetail.tsx` - Course detail view

### Success Criteria

- Clerk auth types properly imported
- Component props interfaces complete
- Event handlers properly typed
- Form data types explicit

### Type Strategy

```typescript
// Clerk types
import { type User } from '@clerk/nextjs/server';

interface SignInFormData {
  email: string;
  password: string;
}

// Event handlers
const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => { ... }
```

---

## PR #5: Test Infrastructure Types

**Agent Assignment**: Agent Epsilon  
**Estimated Warnings Fixed**: ~20  
**Priority**: Low  
**Complexity**: Low

### Scope

Clean up test file types and mocks.

### Files to Update

- [ ] `tests/contracts/web-vitals.contract.spec.ts`
- [ ] `tests/contracts/request-id.contract.spec.ts`
- [ ] `tests/contracts/privacy-consent.contract.spec.ts`
- [ ] `tests/integration/rollbar-enabled-disabled.spec.ts`
- [ ] `tests/integration/logging-json.spec.ts`
- [ ] `tests/unit/rollbar-sampling.spec.ts`
- [ ] `tests/unit/booking-model.spec.ts`
- [ ] `tests/e2e/authorization.spec.ts`
- [ ] `tests/e2e/seo-academy.spec.ts`
- [ ] `tests/e2e/seo-a11y-courses.spec.ts`

### Success Criteria

- Mock types properly defined
- Test fixtures have explicit types
- Assertion types are clear
- No test-only `any` types remain

### Type Strategy

```typescript
// Mock with proper types
const mockUser: User = {
  id: '123',
  email: 'test@example.com',
  // ... other required fields
};

// Type test data
interface TestBooking {
  id: string;
  courseId: string;
  amount: number;
}
```

---

## PR #6: Cleanup & Polish

**Agent Assignment**: Agent Zeta  
**Estimated Warnings Fixed**: ~30  
**Priority**: Low  
**Complexity**: Low

### Scope

Fix remaining small issues: unused vars, empty blocks, escape characters.

### Tasks

- [ ] Fix remaining unused variables (prefix with `_` or remove)
- [ ] Fix unused function parameters (prefix with `_`)
- [ ] Remove or fill empty catch/if blocks
- [ ] Fix unnecessary escape characters in regexes
- [ ] Remove unused imports
- [ ] Fix remaining demo/example code types in `lib/examples/`

### Files to Review

- [ ] `lib/examples/api-routes-demo.ts`
- [ ] `lib/examples/server-actions-demo.ts`
- [ ] All files with empty blocks (7 warnings)
- [ ] All files with unused vars (15 warnings)

### Success Criteria

- All "empty block" warnings resolved
- All "unused var" warnings resolved
- All "useless escape" warnings resolved
- Code is cleaner and more maintainable

---

## Execution Plan

### Phase 1: Setup (Day 1)

1. Create all 6 branches from `main`
2. Assign each PR to a coding agent
3. Share this plan document with all agents

### Phase 2: Parallel Development (Days 2-3)

- All agents work independently
- Each agent creates their PR
- PRs are independent and don't conflict

### Phase 3: Sequential Merging (Days 4-5)

**Merge Order** (to minimize conflicts):

1. PR #6 (Cleanup) - Least conflicts
2. PR #5 (Tests) - Independent from app code
3. PR #4 (Components) - UI layer
4. PR #3 (Services) - Business logic
5. PR #2 (Monitoring) - Infrastructure
6. PR #1 (Errors) - Core utilities

### Phase 4: Final Verification (Day 6)

- Run full test suite
- Check final warning count (target: < 100)
- Update max-warnings in CI (350 → 150)
- Celebrate! 🎉

---

## Agent Coordination

### Communication Protocol

- Each agent posts status updates in their PR
- Conflicts are resolved by rebasing on latest main
- If an agent is blocked, reassign their tasks

### Branch Naming Convention

- `chore/error-handling-types` (PR #1)
- `chore/monitoring-types` (PR #2)
- `chore/service-layer-types` (PR #3)
- `chore/component-types` (PR #4)
- `chore/test-types` (PR #5)
- `chore/final-cleanup` (PR #6)

### Success Metrics

| Metric          | Current | Target | Status |
| --------------- | ------- | ------ | ------ |
| Total Warnings  | 240     | < 100  | 🔄     |
| no-explicit-any | 180     | < 40   | 🔄     |
| no-unused-vars  | 15      | 0      | 🔄     |
| no-empty        | 15      | 0      | 🔄     |
| CI max-warnings | 350     | 150    | 🔄     |

---

## Risk Management

### Potential Issues

1. **Type conflicts**: Use `unknown` when uncertain, not `any`
2. **Breaking changes**: Ensure all tests pass before merging
3. **Merge conflicts**: Rebase frequently on main
4. **Over-typing**: Don't over-engineer, practical > perfect

### Rollback Plan

- Each PR is independent
- If a PR causes issues, revert just that PR
- Other PRs remain unaffected

---

## Post-Completion

### Documentation Updates

- [ ] Update `README.md` with new type safety features
- [ ] Document common type patterns in `docs/typescript-patterns.md`
- [ ] Update contributing guidelines with type requirements

### CI/CD Updates

- [ ] Reduce `max-warnings` from 350 to 150
- [ ] Consider adding `@typescript-eslint/strict` rules
- [ ] Add pre-commit hook for type checking

### Future Work

- Explore enabling `strict: true` in `tsconfig.json`
- Add type coverage reporting
- Consider using `ts-reset` for better types

---

**Last Updated**: 2025-11-09  
**Plan Owner**: Lead Developer  
**Status**: Ready for Agent Assignment
