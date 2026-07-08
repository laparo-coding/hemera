/**
 * Shared mock setup for course material upload tests.
 * Feature: 030-extended-material-upload
 *
 * Consolidates the repeated vi.hoisted state and vi.mock definitions used by
 * tests/contracts/upload-html-content-material.spec.ts and
 * tests/integration/course-material-upload.spec.ts so both tests stay aligned if
 * the mocked modules change.
 *
 * Importing this module registers the vi.mock factories (Vitest hoists them
 * within this module). Test files import the exported mock objects for use in
 * assertions and setup.
 */

import { NextResponse } from 'next/server';
import { vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  mockPrisma: {
    courseMaterial: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
  mockRequireAdminUser: vi.fn(),
  mockPut: vi.fn(),
  mockDel: vi.fn(),
}));

const { mockPrisma, mockRequireAdminUser, mockPut, mockDel } = mocks;

export { mockDel, mockPrisma, mockPut, mockRequireAdminUser };

vi.mock('@/lib/db/prisma', () => ({
  prisma: mockPrisma,
}));

vi.mock('@/lib/auth/helpers', () => ({
  requireAdminUser: () => mockRequireAdminUser(),
}));

vi.mock('@vercel/blob', () => ({
  put: (...args: unknown[]) => mockPut(...args),
  del: (...args: unknown[]) => mockDel(...args),
}));

vi.mock('@/lib/monitoring/rollbar-official', () => ({
  serverInstance: {
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    log: vi.fn(),
  },
}));

/** Configure requireAdminUser mock to return an unauthorized response. */
export function mockUnauthenticated(): void {
  mockRequireAdminUser.mockResolvedValue({
    authorized: false,
    userId: null,
    response: NextResponse.json(
      { error: 'unauthorized', message: 'Authentifizierung erforderlich' },
      { status: 401 }
    ),
  });
}

/** Configure requireAdminUser mock to return an authorized admin user. */
export function mockAuthenticatedAdmin(userId = 'admin_123'): void {
  mockRequireAdminUser.mockResolvedValue({
    authorized: true,
    userId,
    user: { id: userId, publicMetadata: { role: 'admin' } },
  });
}
