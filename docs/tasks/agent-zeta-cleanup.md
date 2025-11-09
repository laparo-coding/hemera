# Agent Zeta: Final Cleanup

## Assignment Details

- **PR Number**: #6
- **Branch**: `chore/final-cleanup`
- **Priority**: Low
- **Estimated Time**: 3-4 hours
- **Estimated Warnings Fixed**: ~30

## Objective

Fix remaining miscellaneous ESLint warnings: unused variables, empty blocks, escape sequences, and
other minor issues across the codebase.

## Categories to Address

### 1. Unused Variables (`no-unused-vars`)

**Estimated**: ~15 warnings

**Tasks**:

- [ ] Remove truly unused imports and variables
- [ ] Prefix intentionally unused parameters with `_`
- [ ] Convert unused function parameters to `_param`
- [ ] Add `// eslint-disable-next-line @typescript-eslint/no-unused-vars` where removal isn't
      possible

**Example**:

```typescript
// Before
import { useState, useEffect, useMemo } from 'react';

function Component() {
  const [data, setData] = useState(null);
  const cached = useMemo(() => data, [data]); // never used

  return <div>{data}</div>;
}

// After
import { useState } from 'react';

function Component() {
  const [data, setData] = useState(null);

  return <div>{data}</div>;
}

// Before - callback with unused params
function onClick(event, data, index) {
  console.log(data);
}

// After - prefix unused with underscore
function onClick(_event: MouseEvent, data: Data, _index: number) {
  console.log(data);
}
```

### 2. Empty Blocks (`no-empty`)

**Estimated**: ~7 warnings

**Tasks**:

- [ ] Add meaningful code to empty catch blocks
- [ ] Add comments explaining why blocks are empty
- [ ] Remove empty try-catch if not needed
- [ ] Add proper error handling

**Example**:

```typescript
// Before - empty catch
try {
  await riskyOperation();
} catch (error) {
  // empty
}

// After - with error handling
try {
  await riskyOperation();
} catch (error) {
  console.error('Operation failed:', error);
  // Gracefully continue - this is expected in some cases
}

// Before - empty block in conditional
if (condition) {
  // TODO: implement
}

// After - either implement or remove
if (condition) {
  console.warn('Condition met but handler not implemented');
}

// Or if truly intentional:
if (condition) {
  // Intentionally empty - condition checked for side effects
}
```

### 3. Useless Escape Sequences (`no-useless-escape`)

**Estimated**: ~3 warnings

**Tasks**:

- [ ] Remove unnecessary backslashes in regex
- [ ] Fix escaped characters in strings
- [ ] Use template literals instead of escaped quotes

**Example**:

```typescript
// Before
const regex = /\./g; // unnecessary escape
const path = 'C:\\Users\\test'; // unnecessary escapes
const message = "Don\'t do this"; // unnecessary escape

// After
const regex = /./g;
const path = 'C:/Users/test'; // or use template literal
const message = "Don't do this"; // or use template literal
const message2 = `Don't do this`; // better
```

### 4. Remaining `any` Types

**Estimated**: ~5 warnings (edge cases not covered by other agents)

**Tasks**:

- [ ] Review remaining `any` types
- [ ] Replace with `unknown` where possible
- [ ] Add proper interfaces for complex types
- [ ] Add `// @ts-expect-error` comments with explanation if truly unavoidable

**Example**:

```typescript
// Before
function processData(data: any) {
  return data.value;
}

// After - use unknown and type guard
function processData(data: unknown): string | null {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return String(data.value);
  }
  return null;
}

// Or if structure is known:
interface DataWithValue {
  value: string;
}

function processData(data: DataWithValue): string {
  return data.value;
}
```

### 5. Console Statements (if enforced)

**Estimated**: Variable

**Tasks**:

- [ ] Replace `console.log` with proper logger
- [ ] Remove debug statements
- [ ] Keep intentional logs with comments

**Example**:

```typescript
// Before
console.log('User data:', userData);

// After - use logger
import { logger } from '@/lib/utils/logger';
logger.info('User data retrieved', { userId: userData.id });

// Or if debugging:
// eslint-disable-next-line no-console
console.log('DEBUG: User data:', userData);
```

### 6. Miscellaneous Rules

**Tasks**:

- [ ] Fix any `prefer-const` warnings (use `const` instead of `let`)
- [ ] Fix `no-case-declarations` (wrap case blocks)
- [ ] Fix any other one-off warnings

**Example**:

```typescript
// Before - prefer-const
let value = 10;
return value * 2;

// After
const value = 10;
return value * 2;

// Before - no-case-declarations
switch (action) {
  case 'add':
    const result = x + y;
    return result;
}

// After
switch (action) {
  case 'add': {
    const result = x + y;
    return result;
  }
}
```

## Files to Review

Based on lint output, focus on these directories:

- `lib/utils/`
- `lib/middleware/`
- `components/`
- `app/api/`
- `tests/` (files not covered by Agent Epsilon)

Run this to find specific files:

```bash
npm run lint:ci | grep -E "(no-unused-vars|no-empty|no-useless-escape)" | grep "^/" | cut -d: -f1 | sort | uniq
```

## Strategy

### Phase 1: Quick Wins (1 hour)

1. Remove obviously unused imports
2. Fix useless escape sequences
3. Change `let` to `const` where possible

### Phase 2: Empty Blocks (30 min)

1. Add proper error handling to empty catches
2. Document intentionally empty blocks
3. Remove unnecessary empty blocks

### Phase 3: Unused Variables (1 hour)

1. Remove truly unused variables
2. Prefix intentionally unused with `_`
3. Add disable comments where needed

### Phase 4: Remaining Issues (30-60 min)

1. Fix any remaining one-off warnings
2. Address edge case `any` types
3. Clean up console statements

## Testing Requirements

### General Tests

- [ ] Run `npm run lint:ci` - verify all warnings fixed
- [ ] Run `npx tsc --noEmit` - ensure TypeScript compiles
- [ ] Run `npm test` - all tests pass
- [ ] Run `npm run build` - production build succeeds

### Spot Checks

- [ ] Test pages with modified components
- [ ] Verify error handling still works
- [ ] Check that no functionality was broken

## Verification Checklist

Before creating PR:

- [ ] Run full lint check: `npm run lint:ci`
- [ ] Verify warning count is below target (<100 total)
- [ ] Run all tests: `npm test`
- [ ] Check TypeScript compilation: `npx tsc --noEmit`
- [ ] Build project: `npm run build`
- [ ] Review all changes in diff
- [ ] No debug/temporary code left behind
- [ ] All comments are meaningful

## Common Patterns

### Unused Parameters in Callbacks

```typescript
// Array.map with unused index
items.map((item, _index) => item.name);

// Event handlers with unused event
onClick={(_event) => doSomething()};

// Or omit if at end of parameter list
items.map((item) => item.name);
```

### Intentional Empty Blocks

```typescript
// Add comment explaining why
try {
  await operation();
} catch (error) {
  // Intentionally ignoring errors - operation is optional
}

// Or use void
try {
  await operation();
} catch {
  void 0; // Explicitly ignore
}
```

### Safe Type Conversions

```typescript
// Instead of 'any', use type guards
function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}

if (isStringArray(data)) {
  // TypeScript knows data is string[]
  data.forEach(str => console.log(str));
}
```

### Escaping in Strings

```typescript
// Use template literals
const message = `Don't use 'single' or "double" quotes`;

// Or raw strings for paths
const path = String.raw`C:\Users\test`;

// For regex, escape only when needed
const dotRegex = /\./g; // dot needs escape
const slashRegex = /\//g; // slash needs escape
const bracketRegex = /[()]/g; // brackets in character class don't need escape
```

## Expected Results

**Before**: ~30 miscellaneous warnings **After**: 0-5 warnings (true edge cases only) **Impact**:
Clean codebase, passing CI checks, ready for strict enforcement

## Merge Order

This PR should be merged **FIRST** (as PR #6) because:

- Least likely to conflict with other PRs
- Quick wins that reduce overall warning count
- Sets clean baseline for other agents

Other agents can work in parallel, then merge in reverse order:

1. PR #6 (this one) - Cleanup ✓
2. PR #5 - Tests
3. PR #4 - Components
4. PR #3 - Services
5. PR #2 - Monitoring
6. PR #1 - Errors

## Resources

- [ESLint Rules Reference](https://eslint.org/docs/latest/rules/)
- [TypeScript Do's and Don'ts](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [Unused Variables Best Practices](https://typescript-eslint.io/rules/no-unused-vars/)

## Support

If blocked or need clarification, comment on the PR or reach out to the lead developer.

## Quick Reference Commands

```bash
# Find unused variables
npm run lint:ci | grep "no-unused-vars"

# Find empty blocks
npm run lint:ci | grep "no-empty"

# Find useless escapes
npm run lint:ci | grep "no-useless-escape"

# Count warnings by type
npm run lint:ci | grep "warning" | sed 's/.*warning  //' | cut -d' ' -f1 | sort | uniq -c | sort -rn

# Check specific file
npx eslint path/to/file.ts
```
