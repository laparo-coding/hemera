# ESLint Cleanup - Agent Assignments

## Overview

This document tracks the parallel cleanup of 240 ESLint warnings across 6 dedicated coding agents.

**Current Status**: 240 warnings → **Target**: <100 warnings  
**Timeline**: 6 days (2-3 days parallel work, 2 days sequential merging, 1 day final verification)

## Progress Dashboard

| Agent             | PR  | Branch                       | Status   | Warnings | Priority |
| ----------------- | --- | ---------------------------- | -------- | -------- | -------- |
| **Agent Alpha**   | TBD | `chore/error-handling-types` | 🟡 Ready | ~40      | High     |
| **Agent Beta**    | TBD | `chore/monitoring-types`     | 🟡 Ready | ~35      | High     |
| **Agent Gamma**   | TBD | `chore/service-layer-types`  | 🟡 Ready | ~30      | Medium   |
| **Agent Delta**   | TBD | `chore/component-types`      | 🟡 Ready | ~25      | Medium   |
| **Agent Epsilon** | TBD | `chore/test-types`           | 🟡 Ready | ~20      | Low      |
| **Agent Zeta**    | TBD | `chore/final-cleanup`        | 🟡 Ready | ~30      | Low      |

**Status Legend**:

- 🟡 Ready - Branch created, waiting for agent assignment
- 🔵 In Progress - Agent actively working
- 🟢 Complete - PR ready for review
- ✅ Merged - Changes in main branch

## Agent Assignments

### Agent Alpha - Error Handling Types

- **Task File**: `docs/tasks/agent-alpha-error-types.md`
- **Branch**: `chore/error-handling-types`
- **Scope**: Error classes, HTTP errors, Prisma mapping, server actions
- **Files**: 5 files in `lib/errors/` and error pages
- **Time**: 4-6 hours
- **Priority**: HIGH (foundational types)

### Agent Beta - Monitoring & Analytics Types

- **Task File**: `docs/tasks/agent-beta-monitoring-types.md`
- **Branch**: `chore/monitoring-types`
- **Scope**: Rollbar, deployment monitoring, alerts, web vitals, analytics
- **Files**: 7 files in `lib/monitoring/`, `lib/analytics/`, `components/monitoring/`
- **Time**: 5-7 hours
- **Priority**: HIGH (observability critical)

### Agent Gamma - Service Layer Types

- **Task File**: `docs/tasks/agent-gamma-service-types.md`
- **Branch**: `chore/service-layer-types`
- **Scope**: Stripe, email, booking, notification, user, auth services
- **Files**: 6 files in `lib/services/`
- **Time**: 4-6 hours
- **Priority**: MEDIUM (business logic)

### Agent Delta - Component & Auth Types

- **Task File**: `docs/tasks/agent-delta-component-types.md`
- **Branch**: `chore/component-types`
- **Scope**: Auth components, payment forms, booking UI, dashboards
- **Files**: 7 files in `components/`, `app/auth/`
- **Time**: 3-5 hours
- **Priority**: MEDIUM (UI layer)

### Agent Epsilon - Test Infrastructure Types

- **Task File**: `docs/tasks/agent-epsilon-test-types.md`
- **Branch**: `chore/test-types`
- **Scope**: Test utilities, fixtures, mocks, Playwright setup
- **Files**: 6 files in `tests/unit/`, `tests/integration/`, `tests/e2e/`, `tests/contracts/`
- **Time**: 3-4 hours
- **Priority**: LOW (test code)

### Agent Zeta - Final Cleanup

- **Task File**: `docs/tasks/agent-zeta-cleanup.md`
- **Branch**: `chore/final-cleanup`
- **Scope**: Unused variables, empty blocks, escape sequences, misc fixes
- **Files**: Multiple files across codebase
- **Time**: 3-4 hours
- **Priority**: LOW (quick wins)

## Merge Order

**IMPORTANT**: Merge in this sequence to minimize conflicts:

1. ✅ **PR #6** (Agent Zeta) - Final Cleanup ← Merge FIRST
2. ⬇️ **PR #5** (Agent Epsilon) - Test Types
3. ⬇️ **PR #4** (Agent Delta) - Component Types
4. ⬇️ **PR #3** (Agent Gamma) - Service Types
5. ⬇️ **PR #2** (Agent Beta) - Monitoring Types
6. ⬇️ **PR #1** (Agent Alpha) - Error Types ← Merge LAST

**Rationale**: Least dependent → Most dependent (errors are imported by everything)

## Coordination Protocol

### Before Starting Work

1. ✅ Read your task file in `docs/tasks/`
2. ✅ Check out your assigned branch: `git checkout <branch-name>`
3. ✅ Run `npm run lint:ci` to see baseline warnings
4. ✅ Update this file to mark your status as 🔵 In Progress

### During Work

1. Commit frequently with descriptive messages
2. Run `npm run lint:ci` after each file to track progress
3. Run `npx tsc --noEmit` to catch type errors early
4. Run `npm test` before final push

### Before Creating PR

1. ✅ Verify all checklist items in task file
2. ✅ Run `npm run lint:ci` - confirm warning reduction
3. ✅ Run `npx tsc --noEmit` - no compilation errors
4. ✅ Run `npm test` - all tests pass
5. ✅ Run `npm run build` - production build succeeds
6. ✅ Update this file to mark status as 🟢 Complete
7. ✅ Create PR with descriptive title and body
8. ✅ Link to task file in PR description

### PR Template

```markdown
## Summary

Fixes ESLint warnings in [domain area]

## Changes

- Added proper TypeScript types for [specific areas]
- Fixed X warnings (Category: Y → 0)

## Testing

- [ ] `npm run lint:ci` - warnings reduced
- [ ] `npx tsc --noEmit` - compiles successfully
- [ ] `npm test` - all tests pass
- [ ] `npm run build` - builds successfully

## Task Reference

See detailed task file: `docs/tasks/agent-[name]-[domain].md`

## Related Issues

Part of ESLint cleanup initiative - see `docs/lint-cleanup-plan.md`
```

## Communication

### Questions & Blockers

- Comment on your PR
- Tag lead developer: @Laparo
- Reference master plan: `docs/lint-cleanup-plan.md`

### Progress Updates

Update this file when:

- Starting work (🟡 → 🔵)
- PR ready (🔵 → 🟢)
- PR merged (🟢 → ✅)

## Resources

### Master Plan

📄 `docs/lint-cleanup-plan.md` - Complete strategy and context

### Task Files

- 📋 `docs/tasks/agent-alpha-error-types.md`
- 📋 `docs/tasks/agent-beta-monitoring-types.md`
- 📋 `docs/tasks/agent-gamma-service-types.md`
- 📋 `docs/tasks/agent-delta-component-types.md`
- 📋 `docs/tasks/agent-epsilon-test-types.md`
- 📋 `docs/tasks/agent-zeta-cleanup.md`

### Useful Commands

```bash
# Check your warnings
npm run lint:ci | grep "warning"

# Type check
npx tsc --noEmit

# Run tests
npm test

# Build
npm run build

# Count warnings by type
npm run lint:ci | grep "warning" | sed 's/.*warning  //' | cut -d' ' -f1 | sort | uniq -c | sort -rn
```

### External Docs

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [ESLint Rules](https://eslint.org/docs/latest/rules/)
- [TypeScript ESLint](https://typescript-eslint.io/)

## Success Criteria

### Individual PR

- Warning count reduced by estimated amount
- TypeScript compiles without errors
- All tests pass
- Production build succeeds
- No new warnings introduced

### Overall Initiative

- Total warnings: 240 → <100 (58% reduction)
- All 6 PRs merged successfully
- No merge conflicts
- CI/CD pipeline passes
- Code quality improved

## Timeline

### Phase 1: Parallel Development (Days 1-3)

All agents work simultaneously on their branches

### Phase 2: Sequential Merging (Days 4-5)

PRs merged in order: #6 → #5 → #4 → #3 → #2 → #1

### Phase 3: Verification (Day 6)

- Final lint check
- Update CI warning threshold
- Close all related issues
- Documentation update

## Notes

### PR #138 Status

The existing PR #138 (`chore/type-refinement`) contains preliminary type refinement work (259→240
warnings, -19). This has been **merged into main** and serves as the baseline for all agent work.

### Conflict Resolution

If conflicts arise during merging:

1. Resolve in favor of more specific types
2. Consult master plan for type strategies
3. Ask lead developer if uncertain

### Post-Completion

After all PRs merged:

1. Run full test suite
2. Update ESLint config (reduce `max-warnings`)
3. Enable stricter rules if desired
4. Document lessons learned

---

**Last Updated**: 2025-01-02  
**Maintained By**: Lead Developer  
**Questions?**: See `docs/lint-cleanup-plan.md` or create an issue
