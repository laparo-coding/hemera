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

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
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
  BaseError,
  BookingNotFoundError,
  InvalidBookingStatusError,
  ParticipationCreationError,
  ParticipationNotFoundError,
  UnauthorizedError,
} from '../errors';
import {
  type ServerActionResult,
  withParameterizedServerAction,
  withServerActionErrorHandling,
} from '../middleware/server-action-error-handling';
import { serverInstance } from '../monitoring/rollbar-official';
import {
  canStartPreparationForStatus,
  PREPARATION_PAYMENT_STATUSES,
} from '../types/booking';
import { isNegotiationPartner } from '../types/participation';
import { generateRequestId } from '../utils/request-id';
import {
  deleteResume,
  type ResumeUploadResult,
  uploadResume,
} from '../utils/resumeUpload';

const strictIso8601Regex = /^\d{4}-\d{2}-\d{2}$/;
const participationLogRetryAttempts = 3;
// Keep logging retries low-latency because these failures should not materially delay user-facing actions.
const participationLogInitialDelayMs = 20;

function normalizeParticipationActionError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  const detail = (() => {
    if (typeof error === 'string') {
      return error;
    }

    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  })();

  return new Error(`Non-Error thrown: ${detail}`, { cause: error });
}

function createLocalizedUnauthorizedError(
  resource: string,
  message: string
): UnauthorizedError {
  return new UnauthorizedError(
    resource,
    localizeInformalGermanMessage(message),
    generateRequestId()
  );
}

function localizeInformalGermanMessage(message: string): string {
  const directMappings: Record<string, string> = {
    'Nicht authentifiziert': 'Du bist nicht angemeldet',
    'Keine Berechtigung': 'Du hast keine Berechtigung',
    'Keine Berechtigung für diese Teilnahme':
      'Du hast keine Berechtigung für diese Teilnahme',
    'Keine Berechtigung für diese Buchung':
      'Du hast keine Berechtigung für diese Buchung',
  };

  if (directMappings[message]) {
    return directMappings[message];
  }

  return message
    .replace(/^Nicht authentifiziert$/i, 'Du bist nicht angemeldet')
    .replace(/^Keine Berechtigung$/i, 'Du hast keine Berechtigung')
    .replace(/^Sie sind /i, 'Du bist ')
    .replace(/^Sie haben /i, 'Du hast ')
    .replace(/\bIhre\b/g, 'deine')
    .replace(/\bIhnen\b/g, 'dir');
}

async function retryWithBackoff(
  operation: () => void | Promise<void>,
  attempts = participationLogRetryAttempts,
  initialDelayMs = participationLogInitialDelayMs
): Promise<void> {
  let delayMs = initialDelayMs;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      await operation();
      return;
    } catch (error) {
      lastError = normalizeParticipationActionError(error);

      if (attempt === attempts) {
        // biome-ignore lint/suspicious/noConsole: logging failures must stay visible even when telemetry transport is broken
        console.warn('[participation] Logging retry exhausted', lastError);
        return;
      }

      await new Promise(resolve => setTimeout(resolve, delayMs));
      delayMs *= 2;
    }
  }
}

async function reportParticipationActionError(
  action: string,
  error: unknown,
  context: Record<string, unknown>
): Promise<void> {
  if (error instanceof BaseError) {
    const domainContext = error.context ?? {};

    await retryWithBackoff(async () => {
      await serverInstance.info(`${action} (handled domain error)`, {
        ...context,
        ...domainContext,
        errorCode: error.errorCode,
        errorMessage: error.message,
        errorContext: error.context,
      });
    });
    return;
  }

  const normalizedError = normalizeParticipationActionError(error);

  await retryWithBackoff(async () => {
    await serverInstance.error(action, normalizedError, context);
  });
}

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
  const { userId } = await auth();

  if (!userId) {
    throw createLocalizedUnauthorizedError(
      'Teilnahme',
      'Nicht authentifiziert'
    );
  }

  const participation = await getParticipationByBookingId(bookingId);

  if (!participation) {
    throw new ParticipationNotFoundError({
      requestId: generateRequestId(),
      identifier: bookingId,
      lookupField: 'bookingId',
      bookingId,
    });
  }

  // Verify the booking belongs to the current user
  if (participation.booking.userId !== userId) {
    serverInstance.warning('Unauthorized participation access attempt', {
      userId,
      bookingId,
      participationId: participation.id,
      ownerId: participation.booking.userId,
    });
    throw createLocalizedUnauthorizedError(
      'Teilnahme',
      'Keine Berechtigung für diese Teilnahme'
    );
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
    const { userId } = await auth();

    if (!userId) {
      throw createLocalizedUnauthorizedError(
        'Teilnahmen',
        'Nicht authentifiziert'
      );
    }

    // Get all paid/confirmed bookings for the user
    const bookings = (await prisma.booking.findMany({
      where: {
        userId,
        paymentStatus: { in: [...PREPARATION_PAYMENT_STATUSES] },
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
    })) as BookingWithCourse[];

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
    const { userId } = await auth();

    if (!userId) {
      throw createLocalizedUnauthorizedError(
        'Teilnahme',
        'Nicht authentifiziert'
      );
    }

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
      throw new BookingNotFoundError(bookingId);
    }

    if (booking.userId !== userId) {
      throw createLocalizedUnauthorizedError(
        'Buchung',
        'Keine Berechtigung für diese Buchung'
      );
    }

    if (!canStartPreparationForStatus(booking.paymentStatus)) {
      throw new InvalidBookingStatusError(
        booking.paymentStatus,
        PREPARATION_PAYMENT_STATUSES.join(' oder ')
      );
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
      throw new ParticipationCreationError({
        requestId: generateRequestId(),
        bookingId,
      });
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
    const { userId } = await auth();

    if (!userId) {
      throw createLocalizedUnauthorizedError(
        'Teilnahmen',
        'Nicht authentifiziert'
      );
    }

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
    await reportParticipationActionError('Failed to save preparation', error, {
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
    await reportParticipationActionError(
      'Failed to complete preparation',
      error,
      { bookingId }
    );
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

    const firstAsset = assets[0];
    if (assets.length > 0 && firstAsset) {
      await recordSummaryPresented(participation.id, firstAsset.source);

      serverInstance.info('Summary viewed', {
        userId,
        participationId: participation.id,
        bookingId,
        assetSource: firstAsset.source,
        assetCount: assets.length,
      });
    }

    revalidatePath('/my-courses');

    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unbekannter Fehler';
    await reportParticipationActionError(
      'Failed to mark summary viewed',
      error,
      {
        bookingId,
      }
    );
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
    await reportParticipationActionError('Failed to complete summary', error, {
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
    await reportParticipationActionError('Failed to save debriefing', error, {
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
    await reportParticipationActionError(
      'Failed to complete debriefing',
      error,
      {
        bookingId,
      }
    );
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
    await reportParticipationActionError('Failed to save result', error, {
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
    await reportParticipationActionError('Failed to complete result', error, {
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

export async function saveNegotiationResultAction(params: {
  bookingId: string;
  resultDate?: string | null;
  resultNegotiationPartner?: string | null;
  resultOutcome?: string | null;
}): Promise<ServerActionResult> {
  try {
    const { userId, participation } = await verifyParticipationOwnership(
      params.bookingId
    );

    const trimmedPartner = params.resultNegotiationPartner?.trim() || null;
    if (trimmedPartner && !isNegotiationPartner(trimmedPartner)) {
      return {
        success: false,
        error: {
          code: 'INVALID_NEGOTIATION_PARTNER',
          message: 'Ungültiger Verhandlungspartner',
        },
      };
    }

    const trimmedOutcome = params.resultOutcome?.trim() || null;
    if (trimmedOutcome && trimmedOutcome.length > 2000) {
      return {
        success: false,
        error: {
          code: 'OUTCOME_TOO_LONG',
          message:
            'Das Verhandlungsergebnis darf maximal 2000 Zeichen lang sein',
        },
      };
    }

    let parsedDate: Date | null = null;
    if (params.resultDate) {
      if (!strictIso8601Regex.test(params.resultDate)) {
        return {
          success: false,
          error: {
            code: 'INVALID_DATE',
            message: 'Ungültiges Datum',
          },
        };
      }

      const [year, month, day] = params.resultDate.split('-').map(Number);
      if (!year || !month || !day) {
        return {
          success: false,
          error: {
            code: 'INVALID_DATE',
            message: 'Ungültiges Datum',
          },
        };
      }

      parsedDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
      const roundTrip = [
        parsedDate.getUTCFullYear(),
        String(parsedDate.getUTCMonth() + 1).padStart(2, '0'),
        String(parsedDate.getUTCDate()).padStart(2, '0'),
      ].join('-');

      if (roundTrip !== params.resultDate) {
        return {
          success: false,
          error: {
            code: 'INVALID_DATE',
            message: 'Ungültiges Datum',
          },
        };
      }

      const today = new Date();
      const todayUtc = new Date(
        Date.UTC(
          today.getUTCFullYear(),
          today.getUTCMonth(),
          today.getUTCDate(),
          12,
          0,
          0
        )
      );

      if (parsedDate.getTime() > todayUtc.getTime()) {
        return {
          success: false,
          error: {
            code: 'DATE_IN_FUTURE',
            message: 'Das Datum darf nicht in der Zukunft liegen',
          },
        };
      }
    }

    await updateResult(participation.id, {
      resultDate: parsedDate,
      resultNegotiationPartner: trimmedPartner,
      resultOutcome: trimmedOutcome ?? undefined,
    });

    serverInstance.info('Negotiation result saved', {
      bookingId: params.bookingId,
      participationId: participation.id,
      userId,
    });

    revalidatePath('/my-courses');
    revalidatePath(`/my-courses/${params.bookingId}`);

    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unbekannter Fehler';
    await reportParticipationActionError(
      'Failed to save negotiation result',
      error,
      { bookingId: params.bookingId }
    );
    return {
      success: false,
      error: {
        code: 'NEGOTIATION_RESULT_SAVE_FAILED',
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
    await reportParticipationActionError('Failed to upload résumé', error, {
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
    await reportParticipationActionError('Failed to delete résumé', error, {
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
