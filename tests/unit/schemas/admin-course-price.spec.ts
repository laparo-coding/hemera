import { describe, expect, it } from '@/tests/vitest/jest-globals';

import {
  courseCreateSchema,
  courseUpdateSchema,
} from '../../../lib/schemas/admin/course';

describe('admin course price schema', () => {
  it('converts create payload euro decimals to integer cents', async () => {
    const result = await courseCreateSchema.parseAsync({
      title: 'Schema Test Course',
      description: 'A sufficiently long description for schema validation.',
      price: 149.99,
      startTime: new Date().toISOString(),
      instructor: 'Schema Admin',
      level: 'BEGINNER',
      capacity: 12,
      curriculum: null,
    });

    expect(result.price).toBe(14999);
  });

  it('converts update payload euro decimals to integer cents', async () => {
    const result = await courseUpdateSchema.parseAsync({
      price: 199.99,
      updatedAt: new Date().toISOString(),
    });

    expect(result.price).toBe(19999);
  });

  it('shows that cent-style integer input is treated as euro input and scaled again', async () => {
    const result = await courseCreateSchema.parseAsync({
      title: 'Schema Test Course',
      description: 'A sufficiently long description for schema validation.',
      price: 9999,
      startTime: new Date().toISOString(),
      instructor: 'Schema Admin',
      level: 'BEGINNER',
      capacity: 12,
      curriculum: null,
    });

    expect(result.price).not.toBe(9999);
    expect(result.price).toBe(999900);
  });
});