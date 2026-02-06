/**
 * Admin Users API
 * Feature: 024-admin-dashboard
 *
 * Server-side functions for user management.
 */

import { clerkClient } from '@clerk/nextjs/server';
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

  const offset = (page - 1) * limit;

  // Get all users from Clerk via pagination (iterative fetch)
  const clerk = await clerkClient();
  let allClerkUsers: Awaited<
    ReturnType<typeof clerk.users.getUserList>
  >['data'] = [];
  let clerkOffset = 0;
  const clerkLimit = 100;
  let hasMore = true;

  while (hasMore) {
    const clerkResponse = await clerk.users.getUserList({
      limit: clerkLimit,
      offset: clerkOffset,
      orderBy: sortBy === 'createdAt' ? '-created_at' : undefined,
    });
    allClerkUsers = allClerkUsers.concat(clerkResponse.data);
    clerkOffset += clerkLimit;
    hasMore = clerkResponse.data.length === clerkLimit;
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

  const bookingCounts = await prisma.booking.groupBy({
    by: ['userId'],
    where: {
      userId: { in: userIds },
    },
    _count: true,
  });

  const completedParticipations = await prisma.courseParticipation.groupBy({
    by: ['userId'],
    where: {
      userId: { in: userIds },
      summaryCompletedAt: { not: null },
    },
    _count: true,
  });

  // Check for Outperformer status (completed advanced course)
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

  // Transform to AdminUserListItem
  const transformedUsers: AdminUserListItem[] = users.map(user => {
    const bookingCount =
      bookingCounts.find(b => b.userId === user.id)?._count ?? 0;
    const completedCount =
      completedParticipations.find(p => p.userId === user.id)?._count ?? 0;

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
      isOutperformer: outperformerSet.has(user.id),
      lastSignInAt: user.lastSignInAt
        ? new Date(user.lastSignInAt).toISOString()
        : null,
      createdAt: new Date(user.createdAt).toISOString(),
      bookingsCount: bookingCount,
      completedCoursesCount: completedCount,
    };
  });

  // Sort
  transformedUsers.sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'name':
        comparison = (a.fullName ?? '').localeCompare(b.fullName ?? '');
        break;
      case 'email':
        comparison = a.email.localeCompare(b.email);
        break;
      case 'lastSignInAt':
        comparison = (a.lastSignInAt ?? '').localeCompare(b.lastSignInAt ?? '');
        break;
      default:
        // Default sort by createdAt
        comparison = a.createdAt.localeCompare(b.createdAt);
    }
    return sortOrder === 'desc' ? -comparison : comparison;
  });

  // Paginate
  const totalItems = transformedUsers.length;
  const totalPages = Math.ceil(totalItems / limit);
  const paginatedUsers = transformedUsers.slice(offset, offset + limit);

  const pagination: PaginationMeta = {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };

  return {
    users: paginatedUsers,
    pagination,
  };
}

/**
 * Update user admin role
 */
export async function updateUserRole(
  userId: string,
  isAdmin: boolean
): Promise<AdminUserListItem> {
  const clerk = await clerkClient();

  await clerk.users.updateUserMetadata(userId, {
    publicMetadata: {
      role: isAdmin ? 'admin' : 'user',
    },
  });

  const user = await clerk.users.getUser(userId);

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
    isOutperformer: false, // Would need to re-fetch from DB
    lastSignInAt: user.lastSignInAt
      ? new Date(user.lastSignInAt).toISOString()
      : null,
    createdAt: new Date(user.createdAt).toISOString(),
    bookingsCount: 0, // Would need to re-fetch from DB
    completedCoursesCount: 0,
  };
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
  await prisma.user.update({
    where: { id: userId },
    data: {
      email: `deleted-${userId}@example.com`,
      name: 'Deleted User',
      image: null,
    },
  });

  // Hard delete: remove from Clerk
  const clerk = await clerkClient();
  await clerk.users.deleteUser(userId);
}
