/**
 * LoopsService - Transactional email via Loops.so
 * Feature: 021-learning-path
 *
 * Provides email functionality for the Learning Path feature:
 * - Admin notification when non-qualified booking is created
 * - Customer notification when booking is rejected
 *
 * Error Handling: Silent degradation - logs to Rollbar, never throws
 */

import { clerkClient } from '@clerk/nextjs/server';
import { LoopsClient } from 'loops';
import { reportError } from '../monitoring/rollbar';
import { serverInstance } from '../monitoring/rollbar-official';

export interface LoopsEmailResult {
  success: boolean;
  error?: string;
  messageId?: string;
}

// Transactional email template IDs (configured in Loops.so dashboard)
const TRANSACTIONAL_IDS = {
  PREREQUISITE_REVIEW: 'prerequisite-review',
  BOOKING_REJECTED: 'booking-rejected',
} as const;

/**
 * Validate email address format.
 * Returns true if the email has valid structure: localpart@domain.tld
 */
export function isValidEmail(email: string | null | undefined): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length === 0) return false;

  const parts = trimmed.split('@');
  if (parts.length !== 2) return false;

  const [local, domain] = parts;
  // Local part must not be empty and domain must have at least one dot
  if (!local || !domain) return false;
  return local.length > 0 && domain.includes('.') && domain.length > 3;
}

/**
 * Mask email address for safe logging (preserves domain for debugging).
 * Example: john.doe@example.com -> j***e@example.com
 */
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '[invalid-email]';
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

/**
 * Sanitize error for logging - extract only safe fields, exclude headers/tokens.
 * Never logs full error objects that might contain API responses.
 */
function sanitizeError(error: unknown): { type: string; message: string } {
  if (error instanceof Error) {
    return {
      type: error.name,
      message: error.message,
    };
  }
  return {
    type: 'UnknownError',
    message: String(error),
  };
}

/**
 * Check if Loops email service is properly configured.
 * Logs a warning if the API key is missing.
 */

// Memoize the configuration warning to log only once per process
let loopsConfigWarningLogged = false;

/**
 * Check if Loops API key is configured.
 * Used to guard email operations before attempting to send.
 *
 * @param silent - If true, don't log warning (use for repeated checks)
 */
export function isLoopsConfigured(silent = false): boolean {
  const apiKey = process.env.LOOPS_API_KEY;
  if (!apiKey) {
    // Only log the warning once per process to avoid log spam
    if (!silent && !loopsConfigWarningLogged) {
      loopsConfigWarningLogged = true;
      serverInstance.info(
        'Loops email service not configured - LOOPS_API_KEY missing',
        {
          context: 'LoopsService.isLoopsConfigured',
        }
      );
    }
    return false;
  }
  return true;
}

/**
 * Get Loops client instance.
 * Returns null if API key is not configured.
 * @throws Never - returns null on missing configuration
 */
function getLoopsClient(): LoopsClient | null {
  const apiKey = process.env.LOOPS_API_KEY;

  if (!apiKey) {
    return null;
  }

  return new LoopsClient(apiKey);
}

/**
 * Fetch all admin email addresses from Clerk.
 * Admins have publicMetadata.role = 'admin'
 */
export async function getAdminEmails(): Promise<string[]> {
  try {
    const client = await clerkClient();

    // Fetch users with admin role in public metadata
    const users = await client.users.getUserList({
      limit: 100,
    });

    const adminEmails: string[] = [];

    for (const user of users.data) {
      const metadata = user.publicMetadata as { role?: string } | undefined;

      if (metadata?.role === 'admin') {
        const email = user.primaryEmailAddress?.emailAddress;
        if (email) {
          adminEmails.push(email);
        }
      }
    }

    return adminEmails;
  } catch (error) {
    // Sanitize error to prevent logging Clerk API tokens/headers/responses
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorType = error instanceof Error ? error.name : 'UnknownError';

    reportError(new Error(`Failed to fetch admin emails: ${errorMessage}`), {
      additionalData: {
        context: 'LoopsService.getAdminEmails',
        errorType,
      },
    });
    return [];
  }
}

/**
 * Send notification email to admins when a non-qualified booking is created.
 * Called after creating a PRE_BOOKED booking.
 *
 * @param data - Email data including customer info, course info, and admin emails
 * @returns LoopsEmailResult with success status
 */
export async function sendPrerequisiteReviewEmail(data: {
  customerName: string;
  customerEmail: string;
  courseName: string;
  courseLevel: 'INTERMEDIATE' | 'ADVANCED';
  missingPrerequisite: 'BEGINNER' | 'INTERMEDIATE';
  bookingId: string;
  adminEmails: string[];
}): Promise<LoopsEmailResult> {
  // Guard: Validate customer email
  if (!isValidEmail(data.customerEmail)) {
    const error = 'Invalid or missing customer email';
    serverInstance.warn('Email send skipped - invalid recipient', {
      context: 'LoopsService.sendPrerequisiteReviewEmail',
      bookingId: data.bookingId,
      templateId: TRANSACTIONAL_IDS.PREREQUISITE_REVIEW,
      reason: 'customerEmail is empty or invalid',
    });
    return { success: false, error };
  }

  // Guard: Check if Loops is configured before attempting to send
  if (!isLoopsConfigured()) {
    serverInstance.warn('Email send skipped - service not configured', {
      context: 'LoopsService.sendPrerequisiteReviewEmail',
      bookingId: data.bookingId,
      templateId: TRANSACTIONAL_IDS.PREREQUISITE_REVIEW,
    });
    return { success: false, error: 'Email service not configured' };
  }

  // Guard: Check admin emails
  if (data.adminEmails.length === 0) {
    serverInstance.warn('Email send skipped - no admin emails', {
      context: 'LoopsService.sendPrerequisiteReviewEmail',
      bookingId: data.bookingId,
      templateId: TRANSACTIONAL_IDS.PREREQUISITE_REVIEW,
    });
    return { success: false, error: 'No admin emails configured' };
  }

  // Get Loops client - should never be null here due to isLoopsConfigured() guard
  const loops = getLoopsClient();
  if (!loops) {
    serverInstance.error(
      'Loops client is null despite isLoopsConfigured check',
      {
        context: 'LoopsService.sendPrerequisiteReviewEmail',
        bookingId: data.bookingId,
      }
    );
    return { success: false, error: 'Email service configuration error' };
  }

  // Map course level to German display name
  const levelLabels: Record<string, string> = {
    INTERMEDIATE: 'Fortgeschrittenen-Kurs',
    ADVANCED: 'Masterclass',
  };

  const prerequisiteLabels: Record<string, string> = {
    BEGINNER: 'Basis',
    INTERMEDIATE: 'Fortgeschrittene',
  };

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || 'https://app.hemera-academy.de';
  const adminLink = `${baseUrl}/admin/bookings/pending`;

  try {
    // Send to all admins
    const results = await Promise.all(
      data.adminEmails.map(email =>
        loops.sendTransactionalEmail({
          transactionalId: TRANSACTIONAL_IDS.PREREQUISITE_REVIEW,
          email,
          dataVariables: {
            customer_name: data.customerName,
            customer_email: data.customerEmail,
            course_name: data.courseName,
            course_level: levelLabels[data.courseLevel] || data.courseLevel,
            missing_prerequisite:
              prerequisiteLabels[data.missingPrerequisite] ||
              data.missingPrerequisite,
            admin_link: adminLink,
          },
        })
      )
    );

    // Check if at least one email was sent successfully
    const successCount = results.filter(r => r.success).length;

    if (successCount > 0) {
      return {
        success: true,
        messageId: `batch-${data.bookingId}`,
      };
    }

    return {
      success: false,
      error: 'All admin emails failed to send',
    };
  } catch (error) {
    const sanitized = sanitizeError(error);
    reportError(new Error(`Email send failed: ${sanitized.message}`), {
      additionalData: {
        context: 'LoopsService.sendPrerequisiteReviewEmail',
        bookingId: data.bookingId,
        recipientCount: data.adminEmails.length,
        errorType: sanitized.type,
        // Note: adminEmails array excluded to prevent PII logging
      },
    });

    serverInstance.error('Failed to send prerequisite review email', {
      context: 'LoopsService.sendPrerequisiteReviewEmail',
      bookingId: data.bookingId,
      recipientCount: data.adminEmails.length,
      errorType: sanitized.type,
      errorMessage: sanitized.message,
    });

    return {
      success: false,
      error: sanitized.message,
    };
  }
}

/**
 * Send rejection email to customer when admin rejects a PRE_BOOKED booking.
 * Called after setting booking status to CANCELLED.
 *
 * @param data - Email data including customer info and course name
 * @returns LoopsEmailResult with success status
 */
export async function sendBookingRejectedEmail(data: {
  customerEmail: string;
  customerName: string;
  courseName: string;
}): Promise<LoopsEmailResult> {
  // Guard: Validate customer email
  if (!isValidEmail(data.customerEmail)) {
    const error = 'Invalid or missing customer email';
    serverInstance.warn('Email send skipped - invalid recipient', {
      context: 'LoopsService.sendBookingRejectedEmail',
      templateId: TRANSACTIONAL_IDS.BOOKING_REJECTED,
      reason: 'customerEmail is empty or invalid',
    });
    return { success: false, error };
  }

  // Guard: Check if Loops is configured before attempting to send
  if (!isLoopsConfigured()) {
    serverInstance.warn('Email send skipped - service not configured', {
      context: 'LoopsService.sendBookingRejectedEmail',
      recipientEmail: maskEmail(data.customerEmail),
      templateId: TRANSACTIONAL_IDS.BOOKING_REJECTED,
    });
    return { success: false, error: 'Email service not configured' };
  }

  // Get Loops client - should never be null here due to isLoopsConfigured() guard
  const loops = getLoopsClient();
  if (!loops) {
    serverInstance.error(
      'Loops client is null despite isLoopsConfigured check',
      {
        context: 'LoopsService.sendBookingRejectedEmail',
        recipientEmail: maskEmail(data.customerEmail),
      }
    );
    return { success: false, error: 'Email service configuration error' };
  }

  const supportEmail = process.env.SUPPORT_EMAIL || 'support@hemera-academy.de';

  try {
    const result = await loops.sendTransactionalEmail({
      transactionalId: TRANSACTIONAL_IDS.BOOKING_REJECTED,
      email: data.customerEmail,
      dataVariables: {
        customer_name: data.customerName,
        course_name: data.courseName,
        support_email: supportEmail,
      },
    });

    if (result.success) {
      return {
        success: true,
        messageId: `rejected-${Date.now()}`,
      };
    }

    return {
      success: false,
      error: 'Failed to send rejection email',
    };
  } catch (error) {
    const sanitized = sanitizeError(error);
    const maskedEmail = maskEmail(data.customerEmail);

    reportError(new Error(`Email send failed: ${sanitized.message}`), {
      additionalData: {
        context: 'LoopsService.sendBookingRejectedEmail',
        recipientEmail: maskedEmail, // Masked for PII protection
        courseName: data.courseName,
        errorType: sanitized.type,
      },
    });

    serverInstance.error('Failed to send booking rejection email', {
      context: 'LoopsService.sendBookingRejectedEmail',
      recipientEmail: maskedEmail,
      courseName: data.courseName,
      errorType: sanitized.type,
      errorMessage: sanitized.message,
    });

    return {
      success: false,
      error: sanitized.message,
    };
  }
}
