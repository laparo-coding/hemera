/**
 * User Admin Schemas - Zod validation schemas for user admin actions
 * Feature: 021-learning-path
 */

import { z } from 'zod';

/**
 * Schema for updating user outperformer status
 * Used by PATCH /api/admin/users/{id}
 */
export const userOutperformerUpdateSchema = z.object({
  isOutperformer: z.boolean(),
});

/**
 * Schema for general user admin updates
 * Extensible for future admin user modifications
 */
export const userAdminUpdateSchema = z.object({
  isOutperformer: z.boolean().optional(),
  // Future fields can be added here
});

/**
 * Schema for user admin update response
 */
export const userAdminUpdateResponseSchema = z.object({
  success: z.boolean(),
  user: z
    .object({
      id: z.string(),
      name: z.string().nullable(),
      email: z.string().nullable(),
      isOutperformer: z.boolean(),
      updatedAt: z.string().datetime(),
    })
    .optional(),
  error: z.string().optional(),
});

// Export inferred TypeScript types
export type UserOutperformerUpdateInput = z.infer<
  typeof userOutperformerUpdateSchema
>;
export type UserAdminUpdateInput = z.infer<typeof userAdminUpdateSchema>;
export type UserAdminUpdateResponse = z.infer<
  typeof userAdminUpdateResponseSchema
>;
