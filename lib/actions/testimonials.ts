/**
 * Testimonial Server Actions
 * Feature: 017-testimonial-management
 *
 * Server actions for testimonial CRUD operations with revalidation
 */

'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/helpers';
import { prisma } from '@/lib/db/prisma';
import { reportError } from '@/lib/monitoring/rollbar';
import {
  createTestimonialSchema,
  updateTestimonialSchema,
} from '@/lib/schemas/testimonial-schema';
import {
  createTestimonial,
  getTestimonialById,
  submitTestimonialForApproval,
  updateTestimonial,
  updateTestimonialStatus,
} from '@/lib/services/testimonial';

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Create a new testimonial draft for a booking
 */
export async function submitTestimonialAction(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Nicht authentifiziert' };
    }

    const user = await currentUser();
    if (!user) {
      return { success: false, error: 'Benutzer nicht gefunden' };
    }

    // Parse and validate input
    const rawData = {
      bookingId: formData.get('bookingId'),
      statement: formData.get('statement'),
      nameDisplayFormat: formData.get('nameDisplayFormat'),
    };

    const parseResult = createTestimonialSchema.safeParse(rawData);
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error.issues[0]?.message || 'Ungültige Eingabe',
      };
    }

    // Verify booking ownership
    const booking = await prisma.booking.findFirst({
      where: {
        id: parseResult.data.bookingId,
        userId,
      },
      select: { id: true },
    });

    if (!booking) {
      return {
        success: false,
        error: 'Buchung nicht gefunden oder keine Berechtigung',
      };
    }

    // Get city from Clerk metadata if available (only publicMetadata is trusted)
    const city = (user.publicMetadata?.city as string) || null;

    const testimonial = await createTestimonial(parseResult.data, {
      firstName: user.firstName || 'Anonym',
      lastName: user.lastName || '',
      imageUrl: user.imageUrl,
      city,
    });

    // Revalidate relevant paths
    revalidatePath('/my-courses');
    revalidatePath('/dashboard');

    return { success: true, data: { id: testimonial.id } };
  } catch (error) {
    reportError(
      error instanceof Error ? error : new Error('Failed to create testimonial')
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Fehler beim Erstellen',
    };
  }
}

/**
 * Update an existing testimonial
 */
export async function updateTestimonialAction(
  testimonialId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Nicht authentifiziert' };
    }

    const user = await currentUser();
    if (!user) {
      return { success: false, error: 'Benutzer nicht gefunden' };
    }

    // Parse and validate input
    const rawData = {
      statement: formData.get('statement'),
      nameDisplayFormat: formData.get('nameDisplayFormat'),
    };

    const parseResult = updateTestimonialSchema.safeParse(rawData);
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error.issues[0]?.message || 'Ungültige Eingabe',
      };
    }

    // Get city from Clerk metadata if available (only publicMetadata is trusted)
    const city = (user.publicMetadata?.city as string) || null;

    await updateTestimonial(testimonialId, userId, parseResult.data, {
      firstName: user.firstName || 'Anonym',
      lastName: user.lastName || '',
      imageUrl: user.imageUrl,
      city,
    });

    // Revalidate relevant paths
    revalidatePath('/my-courses');
    revalidatePath('/dashboard');

    return { success: true };
  } catch (error) {
    reportError(
      error instanceof Error ? error : new Error('Failed to update testimonial')
    );
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Fehler beim Aktualisieren',
    };
  }
}

/**
 * Submit a draft testimonial for admin approval
 */
export async function submitForApprovalAction(
  testimonialId: string
): Promise<ActionResult> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Nicht authentifiziert' };
    }

    await submitTestimonialForApproval(testimonialId, userId);

    // Revalidate paths
    revalidatePath('/my-courses');
    revalidatePath('/dashboard');
    revalidatePath('/admin/testimonials');

    return { success: true };
  } catch (error) {
    reportError(
      error instanceof Error
        ? error
        : new Error('Failed to submit testimonial for approval')
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Fehler beim Einreichen',
    };
  }
}

/**
 * Admin: Approve a testimonial (set status to PUBLISHED)
 */
export async function approveTestimonialAction(
  testimonialId: string
): Promise<ActionResult> {
  try {
    await requireAdmin();

    await updateTestimonialStatus(testimonialId, 'PUBLISHED');

    // Revalidate paths
    revalidatePath('/admin/testimonials');
    // Also revalidate course pages where testimonials are displayed
    const testimonial = await getTestimonialById(testimonialId);
    if (testimonial?.course?.slug) {
      revalidatePath(`/courses/${testimonial.course.slug}`);
    }

    return { success: true };
  } catch (error) {
    reportError(
      error instanceof Error
        ? error
        : new Error('Failed to approve testimonial')
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Fehler beim Freigeben',
    };
  }
}

/**
 * Admin: Hide a testimonial (set status to HIDDEN)
 */
export async function hideTestimonialAction(
  testimonialId: string
): Promise<ActionResult> {
  try {
    await requireAdmin();

    await updateTestimonialStatus(testimonialId, 'HIDDEN');

    // Revalidate paths
    revalidatePath('/admin/testimonials');
    // Also revalidate course pages
    const testimonial = await getTestimonialById(testimonialId);
    if (testimonial?.course?.slug) {
      revalidatePath(`/courses/${testimonial.course.slug}`);
    }

    return { success: true };
  } catch (error) {
    reportError(
      error instanceof Error ? error : new Error('Failed to hide testimonial')
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Fehler beim Ausblenden',
    };
  }
}

/**
 * Delete a testimonial (owner only, if in DRAFT status)
 */
export async function deleteTestimonialAction(
  testimonialId: string
): Promise<ActionResult> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Nicht authentifiziert' };
    }

    const testimonial = await getTestimonialById(testimonialId);
    if (!testimonial) {
      return { success: false, error: 'Erfahrungsbericht nicht gefunden' };
    }

    // Verify ownership (defensive check for booking relation)
    if (!testimonial.booking || testimonial.booking.userId !== userId) {
      return { success: false, error: 'Keine Berechtigung' };
    }

    // Only drafts can be deleted by users
    if (testimonial.status !== 'DRAFT') {
      return {
        success: false,
        error: 'Nur Entwürfe können gelöscht werden',
      };
    }

    await prisma.testimonial.delete({
      where: { id: testimonialId },
    });

    // Revalidate paths
    revalidatePath('/my-courses');
    revalidatePath('/dashboard');

    return { success: true };
  } catch (error) {
    reportError(
      error instanceof Error ? error : new Error('Failed to delete testimonial')
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Fehler beim Löschen',
    };
  }
}
