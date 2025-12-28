/**
 * Course Participation Database Queries
 *
 * Prisma-based data access layer for course participation management.
 * Handles participation lifecycle, résumé documents, and summary asset resolution.
 */

import type {
  CourseParticipation,
  CourseSummaryAsset,
  ParticipationDocument,
  ParticipationStatus,
  ParticipationSummaryOverride,
  SummaryAssetSource,
} from '@prisma/client';
import { prisma } from './prisma';

// ============================================================================
// Type Definitions
// ============================================================================

/** Participation with related booking and course data */
export type ParticipationWithRelations = CourseParticipation & {
  booking: {
    id: string;
    userId: string;
    paymentStatus: string;
    course: {
      id: string;
      title: string;
      slug: string;
      startDate: Date | null;
    };
  };
  documents: ParticipationDocument[];
  summaryOverrides: ParticipationSummaryOverride[];
};

/** Summary asset resolved for display (course default or booking override) */
export interface ResolvedSummaryAsset {
  id: string;
  muxPlaybackId: string;
  muxAssetId: string;
  title: string;
  description: string | null;
  sortOrder: number;
  source: SummaryAssetSource;
}

/** Input for creating preparation data */
export interface PreparationInput {
  preparationIntent?: string;
  desiredResults?: string;
  lineManagerProfile?: string;
}

/** Input for debriefing data */
export interface DebriefingInput {
  debriefingPlan?: string;
  salaryDiscussionMonth?: string;
}

/** Input for result data */
export interface ResultInput {
  resultOutcome?: string;
  resultNotes?: string;
}

// ============================================================================
// Participation CRUD
// ============================================================================

/**
 * Get participation by booking ID with all related data
 */
export async function getParticipationByBookingId(
  bookingId: string
): Promise<ParticipationWithRelations | null> {
  return prisma.courseParticipation.findUnique({
    where: { bookingId },
    include: {
      booking: {
        select: {
          id: true,
          userId: true,
          paymentStatus: true,
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
              startDate: true,
            },
          },
        },
      },
      documents: {
        where: { isActive: true },
        orderBy: { uploadedAt: 'desc' },
      },
      summaryOverrides: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  });
}

/**
 * Get participation by ID
 */
export async function getParticipationById(
  id: string
): Promise<CourseParticipation | null> {
  return prisma.courseParticipation.findUnique({
    where: { id },
  });
}

/**
 * Get all participations for a user
 */
export async function getParticipationsByUserId(
  userId: string
): Promise<ParticipationWithRelations[]> {
  return prisma.courseParticipation.findMany({
    where: { userId },
    include: {
      booking: {
        select: {
          id: true,
          userId: true,
          paymentStatus: true,
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
              startDate: true,
            },
          },
        },
      },
      documents: {
        where: { isActive: true },
        orderBy: { uploadedAt: 'desc' },
      },
      summaryOverrides: {
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Create a new participation record for a booking
 */
export async function createParticipation(data: {
  bookingId: string;
  userId: string;
  courseId: string;
}): Promise<CourseParticipation> {
  return prisma.courseParticipation.create({
    data: {
      bookingId: data.bookingId,
      userId: data.userId,
      courseId: data.courseId,
      status: 'PREPARATION',
    },
  });
}

/**
 * Update participation status
 */
export async function updateParticipationStatus(
  id: string,
  status: ParticipationStatus
): Promise<CourseParticipation> {
  return prisma.courseParticipation.update({
    where: { id },
    data: { status },
  });
}

// ============================================================================
// Preparation Step
// ============================================================================

/**
 * Update preparation fields and optionally mark as completed
 */
export async function updatePreparation(
  participationId: string,
  input: PreparationInput,
  markCompleted = false
): Promise<CourseParticipation> {
  return prisma.courseParticipation.update({
    where: { id: participationId },
    data: {
      preparationIntent: input.preparationIntent,
      desiredResults: input.desiredResults,
      lineManagerProfile: input.lineManagerProfile,
      ...(markCompleted && { preparationCompletedAt: new Date() }),
    },
  });
}

/**
 * Mark preparation step as completed and advance to SUMMARY
 */
export async function completePreparationStep(
  participationId: string
): Promise<CourseParticipation> {
  return prisma.courseParticipation.update({
    where: { id: participationId },
    data: {
      preparationCompletedAt: new Date(),
      status: 'SUMMARY',
    },
  });
}

// ============================================================================
// Summary Step
// ============================================================================

/**
 * Get resolved summary assets for a participation
 * Returns booking-specific overrides if present, else course defaults
 */
export async function getResolvedSummaryAssets(
  participationId: string,
  courseId: string
): Promise<ResolvedSummaryAsset[]> {
  // First check for booking-specific overrides
  const overrides = await prisma.participationSummaryOverride.findMany({
    where: { participationId },
    orderBy: { sortOrder: 'asc' },
    include: {
      courseSummaryAsset: true,
    },
  });

  if (overrides.length > 0) {
    return overrides.map(override => ({
      id: override.id,
      muxPlaybackId:
        override.muxPlaybackId ||
        override.courseSummaryAsset?.muxPlaybackId ||
        '',
      muxAssetId:
        override.muxAssetId || override.courseSummaryAsset?.muxAssetId || '',
      title: override.label,
      description: override.courseSummaryAsset?.description || null,
      sortOrder: override.sortOrder,
      source: 'BOOKING_OVERRIDE' as SummaryAssetSource,
    }));
  }

  // Fall back to course default assets
  const courseAssets = await prisma.courseSummaryAsset.findMany({
    where: {
      courseId,
      isActive: true,
      OR: [{ availableFrom: null }, { availableFrom: { lte: new Date() } }],
      AND: [
        {
          OR: [
            { availableUntil: null },
            { availableUntil: { gte: new Date() } },
          ],
        },
      ],
    },
    orderBy: { sortOrder: 'asc' },
  });

  return courseAssets.map(asset => ({
    id: asset.id,
    muxPlaybackId: asset.muxPlaybackId,
    muxAssetId: asset.muxAssetId,
    title: asset.title,
    description: asset.description,
    sortOrder: asset.sortOrder,
    source: 'COURSE_DEFAULT' as SummaryAssetSource,
  }));
}

/**
 * Check if a course has any summary assets available
 */
export async function hasSummaryAssets(courseId: string): Promise<boolean> {
  const count = await prisma.courseSummaryAsset.count({
    where: {
      courseId,
      isActive: true,
      OR: [{ availableFrom: null }, { availableFrom: { lte: new Date() } }],
    },
  });
  return count > 0;
}

/**
 * Record that summary was presented to the participant
 */
export async function recordSummaryPresented(
  participationId: string,
  source: SummaryAssetSource
): Promise<CourseParticipation> {
  return prisma.courseParticipation.update({
    where: { id: participationId },
    data: {
      summaryPresentedAt: new Date(),
      summaryAssetSource: source,
    },
  });
}

/**
 * Mark summary step as completed and advance to DEBRIEFING
 */
export async function completeSummaryStep(
  participationId: string
): Promise<CourseParticipation> {
  return prisma.courseParticipation.update({
    where: { id: participationId },
    data: {
      summaryCompletedAt: new Date(),
      status: 'DEBRIEFING',
    },
  });
}

// ============================================================================
// Debriefing Step
// ============================================================================

/**
 * Update debriefing fields
 */
export async function updateDebriefing(
  participationId: string,
  input: DebriefingInput
): Promise<CourseParticipation> {
  return prisma.courseParticipation.update({
    where: { id: participationId },
    data: {
      debriefingPlan: input.debriefingPlan,
      salaryDiscussionMonth: input.salaryDiscussionMonth,
    },
  });
}

/**
 * Mark debriefing step as completed and advance to RESULT
 */
export async function completeDebriefingStep(
  participationId: string
): Promise<CourseParticipation> {
  return prisma.courseParticipation.update({
    where: { id: participationId },
    data: {
      status: 'RESULT',
    },
  });
}

// ============================================================================
// Result Step
// ============================================================================

/**
 * Update result fields
 */
export async function updateResult(
  participationId: string,
  input: ResultInput
): Promise<CourseParticipation> {
  return prisma.courseParticipation.update({
    where: { id: participationId },
    data: {
      resultOutcome: input.resultOutcome,
      resultNotes: input.resultNotes,
    },
  });
}

/**
 * Mark result step as completed - final step
 */
export async function completeResultStep(
  participationId: string
): Promise<CourseParticipation> {
  return prisma.courseParticipation.update({
    where: { id: participationId },
    data: {
      resultCompletedAt: new Date(),
      status: 'COMPLETE',
    },
  });
}

// ============================================================================
// Résumé Document Management
// ============================================================================

/**
 * Get the active résumé document for a participation
 */
export async function getActiveResume(
  participationId: string
): Promise<ParticipationDocument | null> {
  return prisma.participationDocument.findFirst({
    where: {
      participationId,
      isActive: true,
    },
    orderBy: { uploadedAt: 'desc' },
  });
}

/**
 * Create a new résumé document and deactivate any previous one
 * Enforces single-active résumé rule
 */
export async function createResumeDocument(data: {
  participationId: string;
  blobUrl: string;
  blobKey: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  createdByUserId: string;
}): Promise<ParticipationDocument> {
  // Find current active document to replace
  const currentActive = await getActiveResume(data.participationId);

  // Use transaction to ensure atomicity
  return prisma.$transaction(async tx => {
    // Deactivate previous document if exists
    if (currentActive) {
      await tx.participationDocument.update({
        where: { id: currentActive.id },
        data: {
          isActive: false,
          replacedAt: new Date(),
        },
      });
    }

    // Create new document
    return tx.participationDocument.create({
      data: {
        participationId: data.participationId,
        blobUrl: data.blobUrl,
        blobKey: data.blobKey,
        fileName: data.fileName,
        fileSizeBytes: data.fileSizeBytes,
        mimeType: data.mimeType,
        createdByUserId: data.createdByUserId,
        replacesDocumentId: currentActive?.id || null,
      },
    });
  });
}

/**
 * Deactivate (soft-delete) a résumé document
 */
export async function deactivateResumeDocument(
  documentId: string
): Promise<ParticipationDocument> {
  return prisma.participationDocument.update({
    where: { id: documentId },
    data: {
      isActive: false,
      replacedAt: new Date(),
    },
  });
}

/**
 * Get document history for a participation (for audit purposes)
 */
export async function getDocumentHistory(
  participationId: string
): Promise<ParticipationDocument[]> {
  return prisma.participationDocument.findMany({
    where: { participationId },
    orderBy: { uploadedAt: 'desc' },
  });
}

// ============================================================================
// Course Summary Asset Management (Admin)
// ============================================================================

/**
 * Get all summary assets for a course
 */
export async function getCourseSummaryAssets(
  courseId: string
): Promise<CourseSummaryAsset[]> {
  return prisma.courseSummaryAsset.findMany({
    where: { courseId },
    orderBy: { sortOrder: 'asc' },
  });
}

/**
 * Create a course summary asset
 */
export async function createCourseSummaryAsset(data: {
  courseId: string;
  muxAssetId: string;
  muxPlaybackId: string;
  title: string;
  description?: string;
  sortOrder?: number;
  availableFrom?: Date;
  availableUntil?: Date;
}): Promise<CourseSummaryAsset> {
  return prisma.courseSummaryAsset.create({
    data: {
      courseId: data.courseId,
      muxAssetId: data.muxAssetId,
      muxPlaybackId: data.muxPlaybackId,
      title: data.title,
      description: data.description,
      sortOrder: data.sortOrder ?? 0,
      availableFrom: data.availableFrom,
      availableUntil: data.availableUntil,
    },
  });
}

/**
 * Update a course summary asset
 */
export async function updateCourseSummaryAsset(
  id: string,
  data: {
    title?: string;
    description?: string;
    sortOrder?: number;
    isActive?: boolean;
    availableFrom?: Date | null;
    availableUntil?: Date | null;
  }
): Promise<CourseSummaryAsset> {
  return prisma.courseSummaryAsset.update({
    where: { id },
    data,
  });
}

/**
 * Delete a course summary asset
 */
export async function deleteCourseSummaryAsset(id: string): Promise<void> {
  await prisma.courseSummaryAsset.delete({
    where: { id },
  });
}
