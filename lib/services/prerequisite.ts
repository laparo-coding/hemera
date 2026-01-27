/**
 * PrerequisiteService - Course prerequisite checking
 * Feature: 021-learning-path
 *
 * Checks if a user meets prerequisites for booking a course at a given level.
 *
 * Rules:
 * - BEGINNER: Always qualified (no prerequisites)
 * - INTERMEDIATE: Requires at least one BEGINNER course completed
 * - ADVANCED: Requires at least one INTERMEDIATE course completed
 *
 * "Completed" means:
 * - Booking with paymentStatus = 'PAID'
 * - CourseParticipation with status = 'COMPLETE'
 */

import type { CourseLevel } from '@prisma/client';
import { prisma } from '../db/prisma';
import { reportError } from '../monitoring/rollbar';

export interface CompletedCourse {
  courseId: string;
  courseTitle: string;
  level: CourseLevel;
  completedAt: Date;
}

export interface PrerequisiteResult {
  qualified: boolean;
  missingLevel: 'BEGINNER' | 'INTERMEDIATE' | null;
  completedCourses: CompletedCourse[];
}

/**
 * Get the required prerequisite level for a target course level.
 */
function getRequiredLevel(
  targetLevel: CourseLevel
): 'BEGINNER' | 'INTERMEDIATE' | null {
  switch (targetLevel) {
    case 'BEGINNER':
      return null; // No prerequisites
    case 'INTERMEDIATE':
      return 'BEGINNER';
    case 'ADVANCED':
      return 'INTERMEDIATE';
    default:
      return null;
  }
}

/**
 * Check if user is an outperformer (can skip prerequisites).
 */
async function isUserOutperformer(clerkUserId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: clerkUserId },
      select: { isOutperformer: true },
    });
    return user?.isOutperformer ?? false;
  } catch (error) {
    // Sanitize error to prevent logging database connection strings/tokens
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorType = error instanceof Error ? error.name : 'UnknownError';

    reportError(
      new Error(`Failed to check outperformer status: ${errorMessage}`),
      {
        additionalData: {
          context: 'PrerequisiteService.isUserOutperformer',
          clerkUserId,
          errorType,
        },
      }
    );
    return false;
  }
}

/**
 * Get user ID from local database using Clerk user ID.
 */
async function getUserId(clerkUserId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: clerkUserId },
    select: { id: true },
  });
  return user?.id ?? null;
}

/**
 * Get completed courses for a user at a specific level.
 * A course is considered completed if:
 * - Booking with paymentStatus = 'PAID'
 * - And course.level matches the required level
 */
async function getCompletedCoursesAtLevel(
  userId: string,
  level: CourseLevel
): Promise<CompletedCourse[]> {
  const bookings = await prisma.booking.findMany({
    where: {
      userId,
      paymentStatus: 'PAID',
      course: {
        level,
      },
    },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          level: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return bookings.map(booking => ({
    courseId: booking.course.id,
    courseTitle: booking.course.title,
    level: booking.course.level,
    completedAt: booking.createdAt,
  }));
}

/**
 * Get all completed courses for a user.
 */
async function getAllCompletedCourses(
  userId: string
): Promise<CompletedCourse[]> {
  const bookings = await prisma.booking.findMany({
    where: {
      userId,
      paymentStatus: 'PAID',
    },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          level: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return bookings.map(booking => ({
    courseId: booking.course.id,
    courseTitle: booking.course.title,
    level: booking.course.level,
    completedAt: booking.createdAt,
  }));
}

/**
 * Check if a user meets prerequisites for booking a course at a given level.
 *
 * @param clerkUserId - The Clerk user ID
 * @param targetLevel - The course level the user wants to book
 * @returns PrerequisiteResult with qualification status and details
 */
export async function checkPrerequisite(
  clerkUserId: string,
  targetLevel: CourseLevel
): Promise<PrerequisiteResult> {
  try {
    // Check if user is an outperformer (can skip prerequisites)
    const outperformer = await isUserOutperformer(clerkUserId);
    if (outperformer) {
      const completedCourses = await getAllCompletedCourses(clerkUserId);
      return {
        qualified: true,
        missingLevel: null,
        completedCourses,
      };
    }

    // Get required prerequisite level
    const requiredLevel = getRequiredLevel(targetLevel);

    // BEGINNER courses have no prerequisites
    if (requiredLevel === null) {
      return {
        qualified: true,
        missingLevel: null,
        completedCourses: [],
      };
    }

    // Get user's local database ID
    const userId = await getUserId(clerkUserId);
    if (!userId) {
      // User not in local database - not qualified
      return {
        qualified: false,
        missingLevel: requiredLevel,
        completedCourses: [],
      };
    }

    // Get completed courses at required level
    const completedAtLevel = await getCompletedCoursesAtLevel(
      userId,
      requiredLevel
    );

    // User is qualified if they have at least one completed course at required level
    if (completedAtLevel.length > 0) {
      const allCompleted = await getAllCompletedCourses(userId);
      return {
        qualified: true,
        missingLevel: null,
        completedCourses: allCompleted,
      };
    }

    // Not qualified - missing prerequisite
    const allCompleted = await getAllCompletedCourses(userId);
    return {
      qualified: false,
      missingLevel: requiredLevel,
      completedCourses: allCompleted,
    };
  } catch (error) {
    // Sanitize error to prevent logging database connection strings/tokens
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorType = error instanceof Error ? error.name : 'UnknownError';

    reportError(new Error(`Failed to check prerequisites: ${errorMessage}`), {
      additionalData: {
        context: 'PrerequisiteService.checkPrerequisite',
        clerkUserId,
        targetLevel,
        errorType,
      },
    });

    // On error, allow booking (fail open) but log the issue
    return {
      qualified: true,
      missingLevel: null,
      completedCourses: [],
    };
  }
}
