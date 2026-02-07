/**
 * Admin Users API
 * Feature: 024-admin-dashboard
 *
 * Server-side functions for user management.
 */

import { clerkClient } from '@clerk/nextjs/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import type {
  AdminUserListItem,
  AdminUsersQueryParams,
  AdminUsersResponse,
  PaginationMeta,
} from '@/lib/types/admin';

/**
 * Get paginated list of users with optional filtering
 */
export async function getAdminUsers(
  params: AdminUsersQueryParams
): Promise<AdminUsersResponse> {
  const {
    page = 1,
    limit = 20,
    search,
    outperformerOnly = false,
    adminOnly = false,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = params;

  // Validate pagination bounds
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), 100);
  const offset = (safePage - 1) * safeLimit;

  try {
    // Get all users from Clerk via pagination (iterative fetch)
    const clerk = await clerkClient();
    let allClerkUsers: Awaited<
      ReturnType<typeof clerk.users.getUserList>
    >['data'] = [];
    let clerkOffset = 0;
    const clerkLimit = 100;
    let hasMore = true;
    const maxPages = 100;
    let pagesFetched = 0;

    while (hasMore && pagesFetched < maxPages) {
      const clerkResponse = await clerk.users.getUserList({
        limit: clerkLimit,
        offset: clerkOffset,
        orderBy: sortBy === 'createdAt' ? '-created_at' : undefined,
      });
      allClerkUsers = allClerkUsers.concat(clerkResponse.data);
      clerkOffset += clerkLimit;
      hasMore = clerkResponse.data.length === clerkLimit;
      pagesFetched++;
    }

    let users = allClerkUsers;

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter(
        user =>
          user.emailAddresses.some(e =>
            e.emailAddress.toLowerCase().includes(searchLower)
          ) ||
          user.firstName?.toLowerCase().includes(searchLower) ||
          user.lastName?.toLowerCase().includes(searchLower)
      );
    }

    // Apply admin filter
    if (adminOnly) {
      users = users.filter(user => user.publicMetadata?.role === 'admin');
    }

    // Get booking counts and outperformer status from database
    const userIds = users.map(u => u.id);

    // Outperformer query needed before filtering — runs on all filtered userIds
    const outperformerUserIds = await prisma.courseParticipation.findMany({
      where: {
        userId: { in: userIds },
        summaryCompletedAt: { not: null },
        booking: {
          course: {
            level: 'ADVANCED',
          },
        },
      },
      select: { userId: true },
      distinct: ['userId'],
    });

    const outperformerSet = new Set(outperformerUserIds.map(p => p.userId));

    // Apply outperformer filter
    if (outperformerOnly) {
      users = users.filter(user => outperformerSet.has(user.id));
    }

    // Build basic user list (without DB counts) for sorting and pagination
    const basicUsers = users.map(user => ({
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress ?? '',
      fullName:
        user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : user.firstName || user.lastName || null,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
      isAdmin: user.publicMetadata?.role === 'admin',
      isOutperformer: outperformerSet.has(user.id),
      lastSignInAt: user.lastSignInAt
        ? new Date(user.lastSignInAt).toISOString()
        : null,
      createdAt: new Date(user.createdAt).toISOString(),
    }));

    // Sort
    basicUsers.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = (a.fullName ?? '').localeCompare(b.fullName ?? '');
          break;
        case 'email':
          comparison = a.email.localeCompare(b.email);
          break;
        case 'lastSignInAt':
          comparison = (a.lastSignInAt ?? '').localeCompare(
            b.lastSignInAt ?? ''
          );
          break;
        default:
          // Default sort by createdAt
          comparison = a.createdAt.localeCompare(b.createdAt);
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    // Paginate first, then fetch DB counts only for the current page
    const totalItems = basicUsers.length;
    const totalPages = Math.ceil(totalItems / safeLimit);
    const paginatedBasicUsers = basicUsers.slice(offset, offset + safeLimit);

    // Fetch booking/completion counts only for paginated user IDs (bounded IN clause)
    const pageUserIds = paginatedBasicUsers.map(u => u.id);

    const [bookingCounts, completedParticipations] = await Promise.all([
      prisma.booking.groupBy({
        by: ['userId'],
        where: {
          userId: { in: pageUserIds },
        },
        _count: true,
      }),
      prisma.courseParticipation.groupBy({
        by: ['userId'],
        where: {
          userId: { in: pageUserIds },
          summaryCompletedAt: { not: null },
        },
        _count: true,
      }),
    ]);

    // Transform to AdminUserListItem (using Maps for O(1) lookups)
    const bookingCountMap = new Map(
      bookingCounts.map(b => [b.userId, b._count])
    );
    const completedCountMap = new Map(
      completedParticipations.map(p => [p.userId, p._count])
    );

    const paginatedUsers: AdminUserListItem[] = paginatedBasicUsers.map(
      user => ({
        ...user,
        bookingsCount: bookingCountMap.get(user.id) ?? 0,
        completedCoursesCount: completedCountMap.get(user.id) ?? 0,
      })
    );

    const pagination: PaginationMeta = {
      page: safePage,
      limit: safeLimit,
      totalItems,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPreviousPage: safePage > 1,
    };

    return {
      users: paginatedUsers,
      pagination,
    };
  } catch (error) {
    throw new Error(
      `Fehler beim Laden der Benutzer: ${
        error instanceof Error ? error.message : 'Unbekannter Fehler'
      }`
    );
  }
}

/**
 * Update user admin role
 */
export async function updateUserRole(
  userId: string,
  isAdmin: boolean
): Promise<AdminUserListItem> {
  try {
    const clerk = await clerkClient();

    await clerk.users.updateUserMetadata(userId, {
      publicMetadata: {
        role: isAdmin ? 'admin' : 'user',
      },
    });

    const user = await clerk.users.getUser(userId);

    // Fetch actual DB data for bookingsCount and isOutperformer
    const [bookingCount, completedCount, outperformerStatus] =
      await Promise.all([
        prisma.booking.count({ where: { userId } }),
        prisma.courseParticipation.count({
          where: { userId, summaryCompletedAt: { not: null } },
        }),
        prisma.courseParticipation.findFirst({
          where: {
            userId,
            summaryCompletedAt: { not: null },
            booking: { course: { level: 'ADVANCED' } },
          },
          select: { id: true },
        }),
      ]);

    return {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress ?? '',
      fullName:
        user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : user.firstName || user.lastName || null,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
      isAdmin: user.publicMetadata?.role === 'admin',
      isOutperformer: !!outperformerStatus,
      lastSignInAt: user.lastSignInAt
        ? new Date(user.lastSignInAt).toISOString()
        : null,
      createdAt: new Date(user.createdAt).toISOString(),
      bookingsCount: bookingCount,
      completedCoursesCount: completedCount,
    };
  } catch (error) {
    throw new Error(
      `Fehler beim Aktualisieren der Benutzerrolle: ${
        error instanceof Error ? error.message : 'Unbekannter Fehler'
      }`
    );
  }
}

/**
 * Delete a user (soft delete: anonymize data in Prisma, delete from Clerk)
 * Uses same soft-delete pattern as lib/api/users.ts deleteUser
 */
export async function deleteUser(userId: string): Promise<void> {
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    throw new Error('Invalid user ID provided');
  }

  // Soft delete: anonymize user data in Prisma (keep records for audit)
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        email: `deleted-${userId}@example.com`,
        name: 'Deleted User',
        image: null,
      },
    });
  } catch (prismaError) {
    // User may not exist in Prisma (Clerk-only user) — continue with Clerk deletion
    if (
      !(
        prismaError instanceof Prisma.PrismaClientKnownRequestError &&
        prismaError.code === 'P2025'
      )
    ) {
      throw prismaError;
    }
  }

  // Hard delete: remove from Clerk
  try {
    const clerk = await clerkClient();
    await clerk.users.deleteUser(userId);
  } catch (clerkError) {
    throw new Error(
      `Benutzer wurde in der Datenbank anonymisiert, aber konnte nicht aus Clerk gelöscht werden: ${
        clerkError instanceof Error ? clerkError.message : 'Unbekannter Fehler'
      }`
    );
  }
}
