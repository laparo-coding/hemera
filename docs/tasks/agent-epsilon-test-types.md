# Agent Epsilon: Test Infrastructure Types

## Assignment Details

- **PR Number**: #5
- **Branch**: `chore/test-types`
- **Priority**: Low
- **Estimated Time**: 3-4 hours
- **Estimated Warnings Fixed**: ~20

## Objective

Add proper TypeScript types for test utilities, fixtures, and test infrastructure.

## Files to Update

### 1. tests/setup.ts (already partially fixed)

**Current Issues**: Remaining test container methods and globals **Tasks**:

- [ ] Complete testcontainers typing
- [ ] Type global test utilities
- [ ] Type Jest custom matchers (if any)
- [ ] Type test environment setup

**Example**:

```typescript
import { PostgreSqlContainer } from '@testcontainers/postgresql';

interface TestDatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

interface GlobalTestContext {
  dbContainer?: PostgreSqlContainer;
  dbConfig?: TestDatabaseConfig;
}

declare global {
  var __TEST_CONTEXT__: GlobalTestContext;
}

async function setupTestDatabase(): Promise<TestDatabaseConfig> {
  const container = await new PostgreSqlContainer('postgres:15')
    .withDatabase('test_db')
    .withUsername('test_user')
    .withPassword('test_pass')
    .start();

  global.__TEST_CONTEXT__ = { dbContainer: container };

  return {
    host: container.getHost(),
    port: container.getPort(),
    database: container.getDatabase(),
    username: container.getUsername(),
    password: container.getPassword(),
  };
}

async function teardownTestDatabase(): Promise<void> {
  const { dbContainer } = global.__TEST_CONTEXT__ ?? {};
  if (dbContainer) {
    await dbContainer.stop();
  }
}
```

### 2. tests/unit/helpers.ts

**Current Issues**: Test helper functions use `any` **Tasks**:

- [ ] Type test data factories
- [ ] Type mock builders
- [ ] Type assertion helpers
- [ ] Type cleanup utilities

**Example**:

```typescript
import { User, Booking, Prisma } from '@prisma/client';

// Factory for creating test users
interface CreateUserOptions {
  email?: string;
  name?: string;
  role?: 'user' | 'admin';
  emailVerified?: Date | null;
}

export function createTestUser(options: CreateUserOptions = {}): Prisma.UserCreateInput {
  return {
    email: options.email ?? `test-${Date.now()}@example.com`,
    name: options.name ?? 'Test User',
    emailVerified: options.emailVerified ?? null,
    role: options.role ?? 'user',
  };
}

// Factory for creating test bookings
interface CreateBookingOptions {
  userId?: string;
  serviceId?: string;
  scheduledAt?: Date;
  status?: 'pending' | 'confirmed' | 'cancelled';
}

export function createTestBooking(options: CreateBookingOptions = {}): Prisma.BookingCreateInput {
  return {
    user: {
      connect: { id: options.userId ?? 'user-1' },
    },
    service: {
      connect: { id: options.serviceId ?? 'service-1' },
    },
    scheduledAt: options.scheduledAt ?? new Date(),
    status: options.status ?? 'pending',
  };
}

// Mock builder for external services
interface MockStripeService {
  createCheckoutSession: jest.Mock<
    Promise<{ id: string; url: string }>,
    [params: { priceId: string; successUrl: string; cancelUrl: string }]
  >;
  retrieveSession: jest.Mock<Promise<{ id: string; payment_status: string }>, [sessionId: string]>;
}

export function createMockStripeService(): MockStripeService {
  return {
    createCheckoutSession: jest.fn().mockResolvedValue({
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/test',
    }),
    retrieveSession: jest.fn().mockResolvedValue({
      id: 'cs_test_123',
      payment_status: 'paid',
    }),
  };
}

// Assertion helpers
export function assertUserShape(user: unknown): asserts user is User {
  expect(user).toMatchObject({
    id: expect.any(String),
    email: expect.any(String),
    name: expect.any(String),
    createdAt: expect.any(Date),
  });
}

export function assertBookingShape(booking: unknown): asserts booking is Booking {
  expect(booking).toMatchObject({
    id: expect.any(String),
    userId: expect.any(String),
    serviceId: expect.any(String),
    scheduledAt: expect.any(Date),
    status: expect.stringMatching(/^(pending|confirmed|cancelled|completed)$/),
  });
}
```

### 3. tests/integration/api-client.ts

**Current Issues**: API test client uses `any` for responses **Tasks**:

- [ ] Type API client methods
- [ ] Type request/response formats
- [ ] Type authentication helpers
- [ ] Type error responses

**Example**:

```typescript
import { NextRequest } from 'next/server';

interface ApiResponse<T = unknown> {
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    requestId: string;
    timestamp: string;
  };
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  auth?:
    | {
        token: string;
      }
    | {
        email: string;
        password: string;
      };
}

export class TestApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  async request<T = unknown>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (options.auth && 'token' in options.auth) {
      headers['Authorization'] = `Bearer ${options.auth.token}`;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    return response.json() as Promise<ApiResponse<T>>;
  }

  async get<T = unknown>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  async post<T = unknown>(
    path: string,
    body: unknown,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>(path, { ...options, method: 'POST', body });
  }

  async authenticateUser(email: string, password: string): Promise<string> {
    const response = await this.post<{ token: string }>('/api/auth/signin', {
      email,
      password,
    });

    if (!response.data?.token) {
      throw new Error('Authentication failed');
    }

    return response.data.token;
  }
}
```

### 4. tests/e2e/fixtures.ts

**Current Issues**: Playwright fixtures use `any` **Tasks**:

- [ ] Type Playwright fixtures
- [ ] Type page object models
- [ ] Type test contexts
- [ ] Type custom test hooks

**Example**:

```typescript
import { test as base, Page } from '@playwright/test';

interface AuthenticatedUser {
  email: string;
  password: string;
  token: string;
}

interface TestFixtures {
  authenticatedPage: Page;
  testUser: AuthenticatedUser;
}

// Extend base test with custom fixtures
export const test = base.extend<TestFixtures>({
  testUser: async ({}, use) => {
    const user: AuthenticatedUser = {
      email: `test-${Date.now()}@example.com`,
      password: 'Test123!@#',
      token: '',
    };

    // Create test user
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email,
        password: user.password,
      }),
    });

    const data = (await response.json()) as { token: string };
    user.token = data.token;

    await use(user);

    // Cleanup
    await fetch('http://localhost:3000/api/users/me', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${user.token}` },
    });
  },

  authenticatedPage: async ({ page, testUser }, use) => {
    // Set auth token in cookies/storage
    await page.goto('http://localhost:3000');
    await page.evaluate(token => {
      localStorage.setItem('auth_token', token);
    }, testUser.token);

    await use(page);
  },
});

export { expect } from '@playwright/test';

// Page object models
export class LoginPage {
  constructor(private page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/auth/signin');
  }

  async signIn(email: string, password: string): Promise<void> {
    await this.page.fill('input[name="email"]', email);
    await this.page.fill('input[name="password"]', password);
    await this.page.click('button[type="submit"]');
  }

  async getErrorMessage(): Promise<string | null> {
    const errorElement = this.page.locator('[data-testid="error-message"]');
    return errorElement.isVisible() ? errorElement.textContent() : null;
  }
}

export class BookingPage {
  constructor(private page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/bookings/new');
  }

  async selectService(serviceId: string): Promise<void> {
    await this.page.selectOption('select[name="serviceId"]', serviceId);
  }

  async selectDate(date: Date): Promise<void> {
    const dateString = date.toISOString().split('T')[0];
    await this.page.fill('input[type="date"]', dateString);
  }

  async submit(): Promise<void> {
    await this.page.click('button[type="submit"]');
  }
}
```

### 5. tests/contracts/openapi-validator.ts

**Current Issues**: OpenAPI validation helpers use `any` **Tasks**:

- [ ] Type OpenAPI schema objects
- [ ] Type validation results
- [ ] Type request/response validators

**Example**:

```typescript
import { OpenAPIV3 } from 'openapi-types';

interface ValidationError {
  field: string;
  message: string;
  value: unknown;
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export class OpenApiValidator {
  constructor(private schema: OpenAPIV3.Document) {}

  validateRequest(
    path: string,
    method: string,
    request: {
      params?: Record<string, unknown>;
      query?: Record<string, unknown>;
      body?: unknown;
    }
  ): ValidationResult {
    const errors: ValidationError[] = [];

    const pathItem = this.schema.paths[path] as OpenAPIV3.PathItemObject | undefined;
    if (!pathItem) {
      return { valid: false, errors: [{ field: 'path', message: 'Path not found', value: path }] };
    }

    const operation = pathItem[method.toLowerCase() as keyof OpenAPIV3.PathItemObject] as
      | OpenAPIV3.OperationObject
      | undefined;

    if (!operation) {
      return {
        valid: false,
        errors: [{ field: 'method', message: 'Method not allowed', value: method }],
      };
    }

    // Validate parameters, body, etc.
    // ...

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  validateResponse(
    path: string,
    method: string,
    statusCode: number,
    response: unknown
  ): ValidationResult {
    // Validation logic
    return { valid: true, errors: [] };
  }
}
```

### 6. tests/unit/mocks/prisma.ts

**Current Issues**: Prisma mocks use `any` **Tasks**:

- [ ] Type Prisma mock implementations
- [ ] Type mock data repositories
- [ ] Type transaction mocks

**Example**:

```typescript
import { PrismaClient, Prisma } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

export type MockPrismaClient = DeepMockProxy<PrismaClient>;

export const prismaMock: MockPrismaClient = mockDeep<PrismaClient>();

// Reset mocks before each test
beforeEach(() => {
  mockReset(prismaMock);
});

// Helper to setup common mock responses
export function setupUserMocks(users: Prisma.UserCreateInput[]): void {
  prismaMock.user.findMany.mockResolvedValue(
    users.map((user, index) => ({
      id: `user-${index}`,
      email: user.email,
      name: user.name ?? null,
      emailVerified: user.emailVerified instanceof Date ? user.emailVerified : null,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }))
  );
}

export function setupBookingMocks(
  bookings: Array<{
    id: string;
    userId: string;
    serviceId: string;
    scheduledAt: Date;
    status: string;
  }>
): void {
  prismaMock.booking.findMany.mockResolvedValue(
    bookings.map(booking => ({
      ...booking,
      notes: null,
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }))
  );
}
```

## Testing Requirements

### Unit Tests

- [ ] Test helpers create valid data
- [ ] Mock builders work correctly
- [ ] Assertion helpers validate shapes
- [ ] API client handles errors

### Integration Tests

- [ ] Test fixtures set up correctly
- [ ] Page objects navigate properly
- [ ] OpenAPI validation works
- [ ] Prisma mocks return expected data

## Verification Checklist

Before creating PR:

- [ ] Run `npm run lint:ci` - verify warning reduction
- [ ] Run `npx tsc --noEmit` - ensure TypeScript compiles
- [ ] Run `npm test` - all tests pass
- [ ] Run `npm run test:e2e` - Playwright tests work
- [ ] Verify test utilities are typed correctly

## Common Patterns

### Type-Safe Mock Functions

```typescript
const mockFunction = jest.fn<ReturnType, [Param1Type, Param2Type]>();
mockFunction.mockResolvedValue(expectedValue);
```

### Generic Test Factories

```typescript
function createTestEntity<T extends { id: string }>(
  base: Omit<T, 'id' | 'createdAt' | 'updatedAt'>,
  id?: string
): T {
  return {
    ...base,
    id: id ?? `test-${Date.now()}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as T;
}
```

### Type Guards in Tests

```typescript
function isApiError(response: ApiResponse): response is ApiResponse<never> {
  return 'error' in response && response.error !== undefined;
}

test('handles error response', async () => {
  const response = await apiClient.get('/invalid');

  if (isApiError(response)) {
    expect(response.error.message).toBe('Not found');
  }
});
```

## Expected Results

**Before**: ~20 warnings in test files **After**: 0-2 warnings (complex mock scenarios only)
**Impact**: Type-safe test utilities, better test maintenance, fewer test flakiness

## Resources

- [Jest TypeScript Guide](https://jestjs.io/docs/getting-started#via-ts-jest)
- [Playwright TypeScript](https://playwright.dev/docs/test-typescript)
- [Testcontainers Node](https://node.testcontainers.org/)
- [jest-mock-extended](https://github.com/marchaos/jest-mock-extended)

## Support

If blocked or need clarification, comment on the PR or reach out to the lead developer.
