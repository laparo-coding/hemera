/**
 * User Management Service
 * Provides comprehensive user operations with error handling
 */

import { type User as ClerkUser, currentUser } from '@clerk/nextjs/server';
import type { User } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma';
import {
  DatabaseConnectionError,
  UserEmailAlreadyExistsError,
  UserNotFoundError,
  UserValidationError,
} from '../errors';
import { safePrismaOperation } from '../errors/prisma-mapping';

export type { User } from '@prisma/client';

export interface UserProfile extends User {
  _count?: {
    bookings: number;
  };
}

export interface CreateUserData {
  id: string; // Clerk user ID
  email: string;
  name?: string | null;
  image?: string | null;
}

export interface UpdateUserData {
  name?: string | null;
  email?: string;
  image?: string | null;
}

export interface UserStats {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  totalSpent: number;
}

/**
 * Get current authenticated user from Clerk and sync with local database
 *
 * Handles potential email conflicts when Clerk users are synced:
 * - If user exists by Clerk ID: update their data
 * - If email already exists with different ID: update existing user's Clerk ID
 * - If neither exists: create new user
 *
 * Now with Clerk ID migration: If a user exists with email but different
 * ID, we migrate them to use the Clerk ID.
 */
export async function getCurrentUserWithSync(): Promise<User> {
  const clerkUser = await currentUser();

  if (!clerkUser?.id) {
    throw new UserNotFoundError('No authenticated user found');
  }

  const clerkId = clerkUser.id;
  const email = clerkUser.primaryEmailAddress?.emailAddress || '';
  const name = clerkUser.fullName || clerkUser.firstName || null;
  const image = clerkUser.imageUrl || null;

  // First try: Find by Clerk ID
  const existingByClerkId = await prisma.user.findUnique({
    where: { id: clerkId },
  });

  if (existingByClerkId) {
    // User with Clerk ID exists - update their profile
    return await prisma.user.update({
      where: { id: clerkId },
      data: { name, email, image },
    });
  }

  // No user with Clerk ID - check if email already exists
  const existingByEmail = email
    ? await prisma.user.findUnique({ where: { email } })
    : null;

  if (existingByEmail && existingByEmail.id !== clerkId) {
    // Migrate legacy user to Clerk ID
    // Migration logged via Rollbar monitoring in production
    // Use retry-on-conflict to handle race conditions between concurrent requests

    try {
      return await prisma.$transaction(async tx => {
        // 1. Create new user with Clerk ID (use temp email to avoid unique constraint)
        await tx.user.create({
          data: {
            id: clerkId,
            name,
            image,
            email: `migrating-${clerkId}@example.invalid`,
          },
        });

        // 2. Update all bookings to use Clerk ID
        await tx.booking.updateMany({
          where: { userId: existingByEmail.id },
          data: { userId: clerkId },
        });

        // 3. Delete old user (use deleteMany to avoid P2025 if already deleted)
        await tx.user.deleteMany({
          where: { id: existingByEmail.id },
        });

        // 4. Update new user with correct email
        return await tx.user.update({
          where: { id: clerkId },
          data: { email },
        });
      });
    } catch (error) {
      // Handle race condition: another request may have already migrated this user
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === 'P2002' || error.code === 'P2025')
      ) {
        // P2002: Unique constraint violation (user already created)
        // P2025: Record not found (legacy user already deleted)
        // Retry by fetching the now-migrated user
        const migratedUser = await prisma.user.findUnique({
          where: { id: clerkId },
        });
        if (migratedUser) {
          return await prisma.user.update({
            where: { id: clerkId },
            data: { name, email, image },
          });
        }
      }
      throw error;
    }
  }

  // Create new user with Clerk ID
  try {
    const user = await prisma.user.create({
      data: { id: clerkId, name, email, image },
    });

    if (!user) {
      throw new DatabaseConnectionError('Failed to sync user with database');
    }

    return user;
  } catch (error) {
    // Handle race condition: another request may have created this user
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      const existingUser = await prisma.user.findUnique({
        where: { id: clerkId },
      });
      if (existingUser) {
        return await prisma.user.update({
          where: { id: clerkId },
          data: { name, email, image },
        });
      }
    }
    throw error;
  }
}

/**
 * Sync a Clerk user to the local database with legacy user migration.
 * Handles email conflicts by migrating legacy users to Clerk IDs.
 * Uses retry-on-conflict to handle race conditions between concurrent requests.
 *
 * @param clerkId - The Clerk user ID
 * @param email - The user's email address (optional)
 * @param name - The user's display name (optional)
 * @param image - The user's profile image URL (optional)
 * @returns The synced or created user
 */
export async function syncClerkUserToDatabase(
  clerkId: string,
  email: string | null,
  name: string | null,
  image: string | null
): Promise<User> {
  if (email) {
    const existingByEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingByEmail && existingByEmail.id !== clerkId) {
      // Migrate legacy user to Clerk ID
      try {
        await prisma.$transaction(async tx => {
          // 1. Create new user with temp email
          await tx.user.upsert({
            where: { id: clerkId },
            update: { name, image },
            create: {
              id: clerkId,
              name,
              image,
              email: `migrating-${clerkId}@example.invalid`,
            },
          });

          // 2. Update all bookings to use Clerk ID
          await tx.booking.updateMany({
            where: { userId: existingByEmail.id },
            data: { userId: clerkId },
          });

          // 3. Delete old user
          await tx.user.delete({
            where: { id: existingByEmail.id },
          });

          // 4. Update new user with correct email
          await tx.user.update({
            where: { id: clerkId },
            data: { email },
          });
        });

        // Return the migrated user
        const migratedUser = await prisma.user.findUnique({
          where: { id: clerkId },
        });
        if (migratedUser) {
          return migratedUser;
        }
        // Transaction succeeded but user not found - should not happen
        throw new DatabaseConnectionError(
          'Migration completed but user not found'
        );
      } catch (error) {
        // Handle race condition: another request may have already migrated this user
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          (error.code === 'P2002' || error.code === 'P2025')
        ) {
          // P2002: Unique constraint violation (user already created)
          // P2025: Record not found (legacy user already deleted)
          // Just upsert the user
          return await prisma.user.upsert({
            where: { id: clerkId },
            update: { name, email, image },
            create: { id: clerkId, name, email, image },
          });
        }
        throw error;
      }
    }
  }

  // No legacy user conflict or no email, safe to upsert directly
  return await prisma.user.upsert({
    where: { id: clerkId },
    update: { name, email, image },
    create: { id: clerkId, name, email, image },
  });
}

/**
 * Get user by ID with error handling
 */
export async function getUserById(userId: string): Promise<User> {
  if (!userId || typeof userId !== 'string') {
    throw new UserValidationError('Invalid user ID provided');
  }

  const user = await safePrismaOperation(async () => {
    return await prisma.user.findUnique({
      where: { id: userId },
    });
  });

  if (!user) {
    throw new UserNotFoundError(`User with ID ${userId} not found`);
  }

  return user;
}

/**
 * Get user by email with error handling
 */
export async function getUserByEmail(email: string): Promise<User> {
  if (!email || typeof email !== 'string' || !isValidEmail(email)) {
    throw new UserValidationError('Invalid email address provided');
  }

  const user = await safePrismaOperation(async () => {
    return await prisma.user.findUnique({
      where: { email },
    });
  });

  if (!user) {
    throw new UserNotFoundError(`User with email ${email} not found`);
  }

  return user;
}

/**
 * Get user profile with additional data
 */
export async function getUserProfile(userId: string): Promise<UserProfile> {
  if (!userId || typeof userId !== 'string') {
    throw new UserValidationError('Invalid user ID provided');
  }

  const user = await safePrismaOperation(async () => {
    return await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: { bookings: true },
        },
      },
    });
  });

  if (!user) {
    throw new UserNotFoundError(`User profile for ID ${userId} not found`);
  }

  return user;
}

/**
 * Create a new user (typically from Clerk webhook)
 */
export async function createUser(data: CreateUserData): Promise<User> {
  // Validate required fields
  if (!data.id) {
    throw new UserValidationError('User ID is required');
  }

  if (!data.email || !isValidEmail(data.email)) {
    throw new UserValidationError('Valid email address is required');
  }

  // Check if user already exists
  const existingUser = await safePrismaOperation(async () => {
    return await prisma.user.findUnique({
      where: { id: data.id },
    });
  });

  if (existingUser) {
    throw new UserEmailAlreadyExistsError(
      `User with ID ${data.id} already exists`
    );
  }

  // Check if email is already taken
  const emailExists = await safePrismaOperation(async () => {
    return await prisma.user.findUnique({
      where: { email: data.email },
    });
  });

  if (emailExists) {
    throw new UserEmailAlreadyExistsError(
      `Email ${data.email} is already registered`
    );
  }

  // Create new user
  const user = await safePrismaOperation(async () => {
    return await prisma.user.create({
      data: {
        id: data.id,
        email: data.email,
        name: data.name,
        image: data.image,
      },
    });
  });

  if (!user) {
    throw new DatabaseConnectionError('Failed to create user in database');
  }

  return user;
}

/**
 * Update user profile
 */
export async function updateUser(
  userId: string,
  data: UpdateUserData
): Promise<User> {
  if (!userId || typeof userId !== 'string') {
    throw new UserValidationError('Invalid user ID provided');
  }

  // Validate email if provided
  if (data.email && !isValidEmail(data.email)) {
    throw new UserValidationError('Invalid email address provided');
  }

  // Check if user exists
  await getUserById(userId); // This will throw if user not found

  // If email is being updated, check if it's already taken
  if (data.email) {
    const emailExists = await safePrismaOperation(async () => {
      return await prisma.user.findFirst({
        where: {
          email: data.email,
          NOT: { id: userId },
        },
      });
    });

    if (emailExists) {
      throw new UserEmailAlreadyExistsError(
        `Email ${data.email} is already registered`
      );
    }
  }

  // Update user
  const user = await safePrismaOperation(async () => {
    return await prisma.user.update({
      where: { id: userId },
      data,
    });
  });

  if (!user) {
    throw new DatabaseConnectionError('Failed to update user in database');
  }

  return user;
}

/**
 * Delete user (soft delete by removing personal data)
 */
export async function deleteUser(userId: string): Promise<User> {
  if (!userId || typeof userId !== 'string') {
    throw new UserValidationError('Invalid user ID provided');
  }

  // Check if user exists
  await getUserById(userId); // This will throw if user not found

  // Soft delete: anonymize user data but keep bookings intact
  const user = await safePrismaOperation(async () => {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        email: `deleted-${userId}@example.com`,
        name: 'Deleted User',
        image: null,
      },
    });
  });

  if (!user) {
    throw new DatabaseConnectionError('Failed to delete user in database');
  }

  return user;
}

/**
 * Get user statistics
 */
export async function getUserStats(userId: string): Promise<UserStats> {
  if (!userId || typeof userId !== 'string') {
    throw new UserValidationError('Invalid user ID provided');
  }

  // Check if user exists
  await getUserById(userId); // This will throw if user not found

  const stats = await safePrismaOperation(async () => {
    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: { course: true },
    });

    const totalBookings = bookings.length;
    const pendingBookings = bookings.filter(
      b => b.paymentStatus === 'PENDING'
    ).length;
    const confirmedBookings = bookings.filter(
      b => b.paymentStatus === 'PAID'
    ).length;
    const cancelledBookings = bookings.filter(
      b => b.paymentStatus === 'CANCELLED'
    ).length;

    const totalSpent = bookings
      .filter(b => b.paymentStatus === 'PAID')
      .reduce(
        (sum, booking) => sum + (booking.amount || booking.course.price || 0),
        0
      );

    return {
      totalBookings,
      pendingBookings,
      confirmedBookings,
      cancelledBookings,
      totalSpent,
    };
  });

  if (!stats) {
    throw new DatabaseConnectionError('Failed to retrieve user statistics');
  }

  return stats;
}

/**
 * Check if user exists
 */
export async function userExists(userId: string): Promise<boolean> {
  if (!userId || typeof userId !== 'string') {
    return false;
  }

  try {
    await getUserById(userId);
    return true;
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      return false;
    }
    throw error; // Re-throw other errors
  }
}

/**
 * Get all users (admin only)
 */
export async function getAllUsers(
  limit: number = 50,
  offset: number = 0
): Promise<{ users: UserProfile[]; total: number }> {
  const [users, total] = await safePrismaOperation(async () => {
    return await Promise.all([
      prisma.user.findMany({
        include: {
          _count: {
            select: { bookings: true },
          },
        },
        orderBy: { id: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.user.count(),
    ]);
  });

  if (!users) {
    throw new DatabaseConnectionError('Failed to retrieve users');
  }

  return { users, total };
}

/**
 * Search users by name or email (admin only)
 */
export async function searchUsers(
  query: string,
  limit: number = 20
): Promise<UserProfile[]> {
  if (!query || query.trim().length < 2) {
    throw new UserValidationError(
      'Search query must be at least 2 characters long'
    );
  }

  const users = await safePrismaOperation(async () => {
    return await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query.trim(), mode: 'insensitive' } },
          { email: { contains: query.trim(), mode: 'insensitive' } },
        ],
      },
      include: {
        _count: {
          select: { bookings: true },
        },
      },
      take: limit,
      orderBy: { id: 'desc' },
    });
  });

  if (!users) {
    throw new DatabaseConnectionError('Failed to search users');
  }

  return users;
}

/**
 * Sync user from Clerk to local database
 *
 * Uses Clerk ID as the primary identifier. If a user with the same email
 * exists with a different (legacy cuid) ID, we migrate that user to use
 * the Clerk ID and update all related bookings.
 */
export async function syncUserFromClerk(clerkUser: ClerkUser): Promise<User> {
  if (!clerkUser?.id) {
    throw new UserValidationError('Invalid Clerk user provided');
  }

  const clerkId = clerkUser.id;
  const email = clerkUser.primaryEmailAddress?.emailAddress || '';
  const name = clerkUser.fullName || clerkUser.firstName || null;
  const image = clerkUser.imageUrl || null;

  const user = await safePrismaOperation(async () => {
    // First check if user already exists with Clerk ID
    const existingById = await prisma.user.findUnique({
      where: { id: clerkId },
    });

    if (existingById) {
      // User already has Clerk ID, just update profile
      return await prisma.user.update({
        where: { id: clerkId },
        data: { name, image, email },
      });
    }

    // Check if user exists with legacy ID (by email)
    if (email) {
      const existingByEmail = await prisma.user.findUnique({
        where: { email },
      });

      if (existingByEmail && existingByEmail.id !== clerkId) {
        // Migrate legacy user to Clerk ID
        // Migration logged via Rollbar monitoring in production

        // Use transaction: First create/upsert new user, then update bookings, then delete old
        try {
          return await prisma.$transaction(async tx => {
            // 1. Upsert user with Clerk ID (handles race conditions)
            const _newUser = await tx.user.upsert({
              where: { id: clerkId },
              update: {
                name,
                image,
                // Keep temp email during migration
              },
              create: {
                id: clerkId,
                name,
                image,
                email: `migrating-${clerkId}@example.invalid`,
              },
            });

            // 2. Update all bookings to use Clerk ID
            await tx.booking.updateMany({
              where: { userId: existingByEmail.id },
              data: { userId: clerkId },
            });

            // 3. Delete old user (use deleteMany to avoid P2025 if already deleted)
            await tx.user.deleteMany({
              where: { id: existingByEmail.id },
            });

            // 4. Update new user with correct email
            return await tx.user.update({
              where: { id: clerkId },
              data: { email },
            });
          });
        } catch (migrationError) {
          // Handle race condition: another request may have already migrated this user
          if (
            migrationError instanceof Prisma.PrismaClientKnownRequestError &&
            (migrationError.code === 'P2002' || migrationError.code === 'P2025')
          ) {
            // Use upsert for atomic operation — avoids TOCTOU race between find and update
            return await prisma.user.upsert({
              where: { id: clerkId },
              update: { name, email, image },
              create: { id: clerkId, name, email, image },
            });
          }
          throw migrationError;
        }
      }
    }

    // Create new user with Clerk ID
    return await prisma.user.create({
      data: { id: clerkId, email, name, image },
    });
  });

  if (!user) {
    throw new DatabaseConnectionError('Failed to sync user from Clerk');
  }

  return user;
}

// Helper functions
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
