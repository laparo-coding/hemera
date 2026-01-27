/**
 * Booking Admin Schemas - Zod validation schemas for booking review actions
 * Feature: 021-learning-path
 */

import { z } from 'zod';

/**
 * Booking Review Action Enum
 */
export const BookingReviewActionEnum = z.enum(['approve', 'reject']);
export type BookingReviewAction = z.infer<typeof BookingReviewActionEnum>;

/**
 * Schema for reviewing a PRE_BOOKED booking
 * Used by PATCH /api/admin/bookings/{id}/review
 */
export const bookingReviewSchema = z.object({
  action: BookingReviewActionEnum,
});

/**
 * Schema for the booking review response
 */
export const bookingReviewResponseSchema = z.object({
  success: z.boolean(),
  booking: z
    .object({
      id: z.string(),
      paymentStatus: z.string(),
      reviewedAt: z.string().datetime().nullable(),
      reviewedBy: z.string().nullable(),
    })
    .optional(),
  error: z.string().optional(),
});

/**
 * Schema for pending booking list item
 */
export const pendingBookingSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  user: z.object({
    id: z.string(),
    clerkUserId: z.string(),
    email: z.string().nullable(),
    firstName: z.string().nullable(),
    lastName: z.string().nullable(),
    isOutperformer: z.boolean(),
  }),
  course: z.object({
    id: z.string(),
    title: z.string(),
    level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
    startDate: z.string().nullable(),
  }),
});

/**
 * Schema for pending bookings list response
 */
export const pendingBookingsResponseSchema = z.object({
  bookings: z.array(pendingBookingSchema),
  total: z.number(),
});

// Export inferred TypeScript types
export type BookingReviewInput = z.infer<typeof bookingReviewSchema>;
export type BookingReviewResponse = z.infer<typeof bookingReviewResponseSchema>;
export type PendingBooking = z.infer<typeof pendingBookingSchema>;
export type PendingBookingsResponse = z.infer<
  typeof pendingBookingsResponseSchema
>;
