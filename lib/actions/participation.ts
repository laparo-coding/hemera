/**
 * Course Participation Server Actions
 *
 * Provides authenticated server actions for participation workflow:
 * - Preparation step data management
 * - Summary step tracking
 * - Debriefing step data management
 * - Result step data management
 * - Résumé document upload/delete
 *
 * All actions require Clerk authentication and verify booking ownership.
 */

'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUserWithSync } from '../api/users';
import {
  completeDebriefingStep,
  completePreparationStep,
  completeResultStep,
  completeSummaryStep,
  createParticipation,
  createResumeDocument,
  type DebriefingInput,
  deactivateResumeDocument,
  getActiveResume,
  getParticipationByBookingId,
  getParticipationsByUserId,
  getResolvedSummaryAssets,
  hasSummaryAssets,
  type ParticipationWithRelations,
  type PreparationInput,
  type ResolvedSummaryAsset,
  type ResultInput,
  recordSummaryPresented,
  updateDebriefing,
  updatePreparation,
  updateResult,
} from '../db/courseParticipation';
import { prisma } from '../db/prisma';
import {
  type ServerActionResult,
  withParameterizedServerAction,
  withServerActionErrorHandling,
} from '../middleware/server-action-error-handling';
import { serverInstance } from '../monitoring/rollbar-official';
import {
  deleteResume,
  type ResumeUploadResult,
  uploadResume,
} from '../utils/resumeUpload';

// ============================================================================
// Types
// ============================================================================

/** Booking with course data (for users without participation yet) */
export interface BookingWithCourse {
  id: string;
  userId: string;
  courseId: string;
  paymentStatus: string;
  course: {
    id: string;
    title: string;
    slug: string;
    startDate: Date | null;
  };
}

/** Combined view: either has participation or just booking */
export interface CourseEnrollment {
  booking: BookingWithCourse;
  participation: ParticipationWithRelations | null;
  hasSummaryAssets: boolean;
}

export interface ParticipationSummary {
  participation: ParticipationWithRelations;
  hasSummaryAssets: boolean;
}

// Re-export types for consumers
export type {
  ParticipationWithRelations,
  ResolvedSummaryAsset,
} from '../db/courseParticipation';

// ============================================================================
// Authorization Helpers
// ============================================================================

/**
 * Verify the current user owns the participation (via booking)
 */
async function verifyParticipationOwnership(
  bookingId: string
): Promise<{ userId: string; participation: ParticipationWithRelations }> {
  const syncedUser = await getCurrentUserWithSync();
  const userId = syncedUser.id;

  const participation = await getParticipationByBookingId(bookingId);

  if (!participation) {
    throw new Error('Teilnahme nicht gefunden');
  }

  // Verify the booking belongs to the current user
  if (participation.booking.userId !== userId) {
    serverInstance.warning('Unauthorized participation access attempt', {
      userId,
      bookingId,
      participationId: participation.id,
      ownerId: participation.booking.userId,
    });
    throw new Error('Keine Berechtigung für diese Teilnahme');
  }

  return { userId, participation };
}

// ============================================================================
// Load Actions
// ============================================================================

/**
 * Get all course enrollments for the current user (bookings with optional participation)
 * This includes bookings where the user hasn't started preparation yet.
 */
export const getMyEnrollmentsAction = withServerActionErrorHandling(
  async (): Promise<CourseEnrollment[]> => {
    const syncedUser = await getCurrentUserWithSync();
    const userId = syncedUser.id;

    // Get all paid/confirmed bookings for the user
    const bookings = await prisma.booking.findMany({
      where: {
        userId,
        paymentStatus: { in: ['PAID', 'CONFIRMED'] },
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            startDate: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get existing participations for these bookings
    const participations = await getParticipationsByUserId(userId);
    const participationByBookingId = new Map(
      participations.map(p => [p.bookingId, p])
    );

    // Build enrollment list
    const results: CourseEnrollment[] = [];
    for (const booking of bookings) {
      const participation = participationByBookingId.get(booking.id) || null;
      const hasAssets = await hasSummaryAssets(booking.courseId);
      results.push({
        booking: {
          id: booking.id,
          userId: booking.userId,
          courseId: booking.courseId,
          paymentStatus: booking.paymentStatus,
          course: booking.course,
        },
        participation,
        hasSummaryAssets: hasAssets,
      });
    }

    return results;
  }
);

/**
 * Start participation for a booking (creates CourseParticipation record)
 */
export const startParticipationAction = withParameterizedServerAction(
  async (bookingId: string): Promise<ParticipationSummary> => {
    const syncedUser = await getCurrentUserWithSync();
    const userId = syncedUser.id;

    // Check if booking exists and belongs to user
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            startDate: true,
          },
        },
      },
    });

    if (!booking) {
      throw new Error('Buchung nicht gefunden');
    }

    if (booking.userId !== userId) {
      throw new Error('Keine Berechtigung für diese Buchung');
    }

    if (!['PAID', 'CONFIRMED'].includes(booking.paymentStatus)) {
      throw new Error('Buchung ist nicht bezahlt');
    }

    // Check if participation already exists
    let participation = await getParticipationByBookingId(bookingId);

    if (!participation) {
      // Create new participation
      await createParticipation({
        bookingId,
        userId,
        courseId: booking.courseId,
      });
      participation = await getParticipationByBookingId(bookingId);
    }

    if (!participation) {
      throw new Error('Teilnahme konnte nicht erstellt werden');
    }

    const hasAssets = await hasSummaryAssets(participation.courseId);

    serverInstance.info('Participation started', {
      userId,
      bookingId,
      participationId: participation.id,
    });

    return {
      participation,
      hasSummaryAssets: hasAssets,
    };
  }
);

/**
 * Get all participations for the current user
 */
export const getMyParticipationsAction = withServerActionErrorHandling(
  async (): Promise<ParticipationSummary[]> => {
    const syncedUser = await getCurrentUserWithSync();
    const userId = syncedUser.id;

    const participations = await getParticipationsByUserId(userId);

    // Check summary asset availability for each participation
    const results: ParticipationSummary[] = [];
    for (const participation of participations) {
      const hasAssets = await hasSummaryAssets(participation.courseId);
      results.push({
        participation,
        hasSummaryAssets: hasAssets,
      });
    }

    return results;
  }
);

/**
 * Get a single participation by booking ID
 */
export const getParticipationAction = withParameterizedServerAction(
  async (bookingId: string): Promise<ParticipationSummary> => {
    const { participation } = await verifyParticipationOwnership(bookingId);
    const hasAssets = await hasSummaryAssets(participation.courseId);

    return {
      participation,
      hasSummaryAssets: hasAssets,
    };
  }
);

/**
 * Get resolved summary assets for a participation
 */
export const getSummaryAssetsAction = withParameterizedServerAction(
  async (bookingId: string): Promise<ResolvedSummaryAsset[]> => {
    const { participation } = await verifyParticipationOwnership(bookingId);

    return await getResolvedSummaryAssets(
      participation.id,
      participation.courseId
    );
  }
);

// ============================================================================
// Preparation Step Actions
// ============================================================================

/**
 * Save preparation step data (auto-save)
 */
export async function savePreparationAction(
  bookingId: string,
  data: PreparationInput
): Promise<ServerActionResult> {
  try {
    const { userId, participation } =
      await verifyParticipationOwnership(bookingId);

    await updatePreparation(participation.id, data, false);

    serverInstance.info('Preparation data saved', {
      userId,
      participationId: participation.id,
      bookingId,
    });

    revalidatePath('/my-courses');

    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unbekannter Fehler';
    serverInstance.error('Failed to save preparation', error as Error, {
      bookingId,
    });
    return {
      success: false,
      error: {
        code: 'PREPARATION_SAVE_FAILED',
        message,
      },
    };
  }
}

/**
 * Complete preparation step and advance to Summary
 */
export async function completePreparationAction(
  bookingId: string,
  data: PreparationInput
): Promise<ServerActionResult> {
  try {
    const { userId, participation } =
      await verifyParticipationOwnership(bookingId);

    // Save final data and mark complete
    await updatePreparation(participation.id, data, true);
    await completePreparationStep(participation.id);

    serverInstance.info('Preparation step completed', {
      userId,
      participationId: participation.id,
      bookingId,
    });

    revalidatePath('/my-courses');

    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unbekannter Fehler';
    serverInstance.error('Failed to complete preparation', error as Error, {
      bookingId,
    });
    return {
      success: false,
      error: {
        code: 'PREPARATION_COMPLETE_FAILED',
        message,
      },
    };
  }
}

// ============================================================================
// Summary Step Actions
// ============================================================================

/**
 * Record that summary was viewed/presented
 */
export async function markSummaryViewedAction(
  bookingId: string
): Promise<ServerActionResult> {
  try {
    const { userId, participation } =
      await verifyParticipationOwnership(bookingId);

    // Determine the source of assets
    const assets = await getResolvedSummaryAssets(
      participation.id,
      participation.courseId
    );

    if (assets.length > 0) {
      await recordSummaryPresented(participation.id, assets[0].source);

      serverInstance.info('Summary viewed', {
        userId,
        participationId: participation.id,
        bookingId,
        assetSource: assets[0].source,
        assetCount: assets.length,
      });
    }

    revalidatePath('/my-courses');

    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unbekannter Fehler';
    serverInstance.error('Failed to mark summary viewed', error as Error, {
      bookingId,
    });
    return {
      success: false,
      error: {
        code: 'SUMMARY_VIEW_FAILED',
        message,
      },
    };
  }
}

/**
 * Complete summary step and advance to Debriefing
 */
export async function completeSummaryAction(
  bookingId: string
): Promise<ServerActionResult> {
  try {
    const { userId, participation } =
      await verifyParticipationOwnership(bookingId);

    await completeSummaryStep(participation.id);

    serverInstance.info('Summary step completed', {
      userId,
      participationId: participation.id,
      bookingId,
    });

    revalidatePath('/my-courses');

    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unbekannter Fehler';
    serverInstance.error('Failed to complete summary', error as Error, {
      bookingId,
    });
    return {
      success: false,
      error: {
        code: 'SUMMARY_COMPLETE_FAILED',
        message,
      },
    };
  }
}

// ============================================================================
// Debriefing Step Actions
// ============================================================================

/**
 * Save debriefing step data (auto-save)
 */
export async function saveDebriefingAction(
  bookingId: string,
  data: DebriefingInput
): Promise<ServerActionResult> {
  try {
    const { userId, participation } =
      await verifyParticipationOwnership(bookingId);

    await updateDebriefing(participation.id, data);

    serverInstance.info('Debriefing data saved', {
      userId,
      participationId: participation.id,
      bookingId,
    });

    revalidatePath('/my-courses');

    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unbekannter Fehler';
    serverInstance.error('Failed to save debriefing', error as Error, {
      bookingId,
    });
    return {
      success: false,
      error: {
        code: 'DEBRIEFING_SAVE_FAILED',
        message,
      },
    };
  }
}

/**
 * Complete debriefing step and advance to Result
 */
export async function completeDebriefingAction(
  bookingId: string,
  data: DebriefingInput
): Promise<ServerActionResult> {
  try {
    const { userId, participation } =
      await verifyParticipationOwnership(bookingId);

    await updateDebriefing(participation.id, data);
    await completeDebriefingStep(participation.id);

    serverInstance.info('Debriefing step completed', {
      userId,
      participationId: participation.id,
      bookingId,
    });

    revalidatePath('/my-courses');

    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unbekannter Fehler';
    serverInstance.error('Failed to complete debriefing', error as Error, {
      bookingId,
    });
    return {
      success: false,
      error: {
        code: 'DEBRIEFING_COMPLETE_FAILED',
        message,
      },
    };
  }
}

// ============================================================================
// Result Step Actions
// ============================================================================

/**
 * Save result step data (auto-save)
 */
export async function saveResultAction(
  bookingId: string,
  data: ResultInput
): Promise<ServerActionResult> {
  try {
    const { userId, participation } =
      await verifyParticipationOwnership(bookingId);

    await updateResult(participation.id, data);

    serverInstance.info('Result data saved', {
      userId,
      participationId: participation.id,
      bookingId,
    });

    revalidatePath('/my-courses');

    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unbekannter Fehler';
    serverInstance.error('Failed to save result', error as Error, {
      bookingId,
    });
    return {
      success: false,
      error: {
        code: 'RESULT_SAVE_FAILED',
        message,
      },
    };
  }
}

/**
 * Complete result step - marks entire participation as complete
 */
export async function completeResultAction(
  bookingId: string,
  data: ResultInput
): Promise<ServerActionResult> {
  try {
    const { userId, participation } =
      await verifyParticipationOwnership(bookingId);

    await updateResult(participation.id, data);
    await completeResultStep(participation.id);

    serverInstance.info('Participation completed', {
      userId,
      participationId: participation.id,
      bookingId,
      courseTitle: participation.booking.course.title,
    });

    revalidatePath('/my-courses');

    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unbekannter Fehler';
    serverInstance.error('Failed to complete result', error as Error, {
      bookingId,
    });
    return {
      success: false,
      error: {
        code: 'RESULT_COMPLETE_FAILED',
        message,
      },
    };
  }
}

// ============================================================================
// Résumé Document Actions
// ============================================================================

/**
 * Upload a résumé document
 * Enforces single-active résumé rule by deactivating previous
 */
export async function uploadResumeAction(
  bookingId: string,
  formData: FormData
): Promise<ServerActionResult<ResumeUploadResult>> {
  try {
    const { userId, participation } =
      await verifyParticipationOwnership(bookingId);

    const file = formData.get('file') as File | null;

    if (!file) {
      return {
        success: false,
        error: {
          code: 'NO_FILE',
          message: 'Keine Datei ausgewählt',
        },
      };
    }

    // Upload to Vercel Blob
    const uploadResult = await uploadResume(file, participation.id, userId);

    if (!uploadResult.success) {
      return {
        success: false,
        error: {
          code: uploadResult.code || 'UPLOAD_FAILED',
          message: uploadResult.error || 'Upload fehlgeschlagen',
        },
      };
    }

    // Save document metadata to database
    // This also handles deactivating any previous active résumé
    await createResumeDocument({
      participationId: participation.id,
      blobUrl: uploadResult.blobUrl!,
      blobKey: uploadResult.blobKey!,
      fileName: uploadResult.fileName!,
      fileSizeBytes: uploadResult.fileSizeBytes!,
      mimeType: uploadResult.mimeType!,
      createdByUserId: userId,
    });

    serverInstance.info('Résumé uploaded and saved', {
      userId,
      participationId: participation.id,
      bookingId,
      fileName: uploadResult.fileName,
      fileSizeBytes: uploadResult.fileSizeBytes,
    });

    revalidatePath('/my-courses');

    return {
      success: true,
      data: uploadResult,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unbekannter Fehler';
    serverInstance.error('Failed to upload résumé', error as Error, {
      bookingId,
    });
    return {
      success: false,
      error: {
        code: 'RESUME_UPLOAD_FAILED',
        message,
      },
    };
  }
}

/**
 * Delete the active résumé document
 */
export async function deleteResumeAction(
  bookingId: string
): Promise<ServerActionResult> {
  try {
    const { userId, participation } =
      await verifyParticipationOwnership(bookingId);

    // Get current active résumé
    const activeResume = await getActiveResume(participation.id);

    if (!activeResume) {
      return {
        success: false,
        error: {
          code: 'NO_ACTIVE_RESUME',
          message: 'Kein aktiver Lebenslauf vorhanden',
        },
      };
    }

    // Delete from Vercel Blob
    await deleteResume(activeResume.blobUrl, {
      participationId: participation.id,
      userId,
      reason: 'User requested deletion',
    });

    // Deactivate in database
    await deactivateResumeDocument(activeResume.id);

    serverInstance.info('Résumé deleted', {
      userId,
      participationId: participation.id,
      bookingId,
      documentId: activeResume.id,
    });

    revalidatePath('/my-courses');

    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unbekannter Fehler';
    serverInstance.error('Failed to delete résumé', error as Error, {
      bookingId,
    });
    return {
      success: false,
      error: {
        code: 'RESUME_DELETE_FAILED',
        message,
      },
    };
  }
}

/**
 * Get the active résumé for a participation
 */
export const getActiveResumeAction = withParameterizedServerAction(
  async (bookingId: string) => {
    const { participation } = await verifyParticipationOwnership(bookingId);
    return await getActiveResume(participation.id);
  }
);
