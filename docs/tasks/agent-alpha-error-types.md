# Agent Alpha: Error Handling & HTTP Types

## Assignment Details

- **PR Number**: #1
- **Branch**: `chore/error-handling-types`
- **Priority**: High
- **Estimated Time**: 4-6 hours
- **Estimated Warnings Fixed**: ~40

## Objective

Replace all `any` types in error handling code with proper TypeScript types.

## Files to Update

### 1. lib/errors/base.ts

**Current Issues**: Generic `any` types in error constructors **Tasks**:

- [ ] Replace `cause?: any` with `cause?: Error | unknown`
- [ ] Type error metadata properly: `metadata?: Record<string, unknown>`
- [ ] Add proper error serialization types
- [ ] Export all error types for reuse

**Example**:

```typescript
// Before
export class ApplicationError extends Error {
  constructor(message: string, public metadata?: any) { ... }
}

// After
export class ApplicationError extends Error {
  constructor(
    message: string,
    public metadata?: Record<string, unknown>,
    public cause?: Error
  ) { ... }
}
```

### 2. lib/errors/http.ts

**Current Issues**: HTTP response types using `any` **Tasks**:

- [ ] Define `HttpErrorResponse` interface
- [ ] Type error status codes properly (400 | 401 | 403 | 404 | 500, etc.)
- [ ] Add `ErrorDetails` type for error context
- [ ] Ensure all HTTP error classes extend base properly

**Example**:

```typescript
interface HttpErrorResponse {
  error: {
    code: string;
    message: string;
    status: number;
    details?: Record<string, unknown>;
  };
}

export class HttpError extends ApplicationError {
  constructor(
    message: string,
    public statusCode: number,
    details?: Record<string, unknown>
  ) {
    super(message, details);
  }
}
```

### 3. lib/errors/prisma-mapping.ts

**Current Issues**: Prisma error objects typed as `any` **Tasks**:

- [ ] Import Prisma error types: `import { Prisma } from '@prisma/client'`
- [ ] Type error code mapping properly
- [ ] Use `Prisma.PrismaClientKnownRequestError` type
- [ ] Add type guards for error discrimination

**Example**:

```typescript
import { Prisma } from '@prisma/client';

export function mapPrismaError(error: unknown): HttpError {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return new ConflictError('Unique constraint violation');
      // ... other cases
    }
  }

  return new InternalServerError('Database error');
}
```

### 4. lib/middleware/server-action-error-handling.ts

**Current Issues**: Generic error catching with `any` **Tasks**:

- [ ] Replace `catch (error: any)` with `catch (error: unknown)`
- [ ] Add proper type guards for error discrimination
- [ ] Type return values explicitly
- [ ] Add JSDoc comments for public APIs

**Example**:

```typescript
export function withErrorHandling<T extends unknown[], R>(handler: (...args: T) => Promise<R>) {
  return async (...args: T): Promise<R> => {
    try {
      return await handler(...args);
    } catch (error: unknown) {
      if (error instanceof ApplicationError) {
        // Handle known errors
      }
      throw error;
    }
  };
}
```

### 5. app/admin/errors/page.tsx

**Current Issues**: Component receives error data as `any` **Tasks**:

- [ ] Define `ErrorLogEntry` interface
- [ ] Type component props properly
- [ ] Type error display data
- [ ] Ensure error objects are safely accessed

**Example**:

```typescript
interface ErrorLogEntry {
  id: string;
  timestamp: string;
  message: string;
  stack?: string;
  metadata?: Record<string, unknown>;
}

interface ErrorPageProps {
  errors: ErrorLogEntry[];
}

export default function ErrorsPage({ errors }: ErrorPageProps) { ... }
```

## Testing Requirements

### Unit Tests

- [ ] All error classes can be instantiated
- [ ] Error serialization works correctly
- [ ] Type guards function properly
- [ ] Prisma error mapping is accurate

### Integration Tests

- [ ] HTTP errors return correct status codes
- [ ] Error middleware catches and formats errors
- [ ] Error page displays errors correctly

## Verification Checklist

Before creating PR:

- [ ] Run `npm run lint:ci` - verify warning reduction
- [ ] Run `npx tsc --noEmit` - ensure TypeScript compiles
- [ ] Run `npm test` - all tests pass
- [ ] Check that no new `any` types were introduced
- [ ] Verify all error scenarios are properly typed

## Common Patterns

### Type Guard Pattern

```typescript
function isApplicationError(error: unknown): error is ApplicationError {
  return error instanceof ApplicationError;
}
```

### Error Wrapping Pattern

```typescript
function wrapError(error: unknown): ApplicationError {
  if (error instanceof ApplicationError) {
    return error;
  }
  if (error instanceof Error) {
    return new ApplicationError(error.message, undefined, error);
  }
  return new ApplicationError('Unknown error', { originalError: error });
}
```

### Safe Property Access Pattern

```typescript
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}
```

## Expected Results

**Before**: ~40 warnings related to error handling **After**: 0 warnings in error handling code
**Impact**: Safer error handling, better IDE support, clearer error types

## Resources

- [TypeScript Error Handling Best Practices](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [Prisma Error Reference](https://www.prisma.io/docs/reference/api-reference/error-reference)
- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)

## Support

If blocked or need clarification, comment on the PR or reach out to the lead developer.
