/**
 * User Management Service
 * Provides comprehensive user operations with error handling
 */

import { type User as ClerkUser, currentUser } from '@clerk/nextjs/server';
import type { User } from '@prisma/client';
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
 */
export async function getCurrentUserWithSync(): Promise<User> {
  const clerkUser = await currentUser();

  if (!clerkUser?.id) {
    throw new UserNotFoundError('No authenticated user found');
  }

  const email = clerkUser.primaryEmailAddress?.emailAddress || '';
  const name = clerkUser.fullName || clerkUser.firstName || null;
  const image = clerkUser.imageUrl || null;

  // First try: Find by Clerk ID
  const existingByClerkId = await prisma.user.findUnique({
    where: { id: clerkUser.id },
  });

  if (existingByClerkId) {
    // User with Clerk ID exists - update their data
    const user = await prisma.user.update({
      where: { id: clerkUser.id },
      data: { name, email, image },
    });
    return user;
  }

  // No user with Clerk ID - check if email already exists
  const existingByEmail = email
    ? await prisma.user.findUnique({ where: { email } })
    : null;

  if (existingByEmail) {
    // Email exists with different ID - this user was created before Clerk sync
    // Update their ID to the Clerk ID (migrate the user)
    // Note: This requires careful handling of foreign key constraints

    // For now, just return the existing user and update non-ID fields
    // The Clerk ID mismatch will be logged for manual review
    console.warn(
      `[User Sync] Email ${email} exists with ID ${existingByEmail.id}, but Clerk ID is ${clerkUser.id}. Using existing user.`
    );

    const user = await prisma.user.update({
      where: { id: existingByEmail.id },
      data: { name, image },
    });
    return user;
  }

  // Neither Clerk ID nor email exists - create new user
  const user = await prisma.user.create({
    data: {
      id: clerkUser.id,
      name,
      email,
      image,
    },
  });

  if (!user) {
    throw new DatabaseConnectionError('Failed to sync user with database');
  }

  return user;
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
 */
export async function syncUserFromClerk(clerkUser: ClerkUser): Promise<User> {
  if (!clerkUser?.id) {
    throw new UserValidationError('Invalid Clerk user provided');
  }

  const userData: CreateUserData = {
    id: clerkUser.id,
    email: clerkUser.primaryEmailAddress?.emailAddress || '',
    name: clerkUser.fullName || clerkUser.firstName || null,
    image: clerkUser.imageUrl || null,
  };

  const user = await safePrismaOperation(async () => {
    // First check if user exists by ID
    const existingById = await prisma.user.findUnique({
      where: { id: userData.id },
    });

    if (existingById) {
      // User exists with this ID, update it (but don't change email if it conflicts)
      return await prisma.user.update({
        where: { id: userData.id },
        data: {
          name: userData.name,
          image: userData.image,
          // Only update email if it hasn't changed or if the new email isn't taken
        },
      });
    }

    // Check if a user with this email already exists (with a different ID)
    if (userData.email) {
      const existingByEmail = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existingByEmail) {
        // A user with this email exists but with different ID.
        // This happens when Clerk ID changed or user logged in with different auth method.
        // Delete the old user and create new one with the correct Clerk ID.
        // First, update any bookings to point to the new user ID
        await prisma.booking.updateMany({
          where: { userId: existingByEmail.id },
          data: { userId: userData.id },
        });

        // Delete the old user (ignore if already deleted by parallel request)
        try {
          await prisma.user.delete({
            where: { id: existingByEmail.id },
          });
        } catch {
          // User may have been deleted by a parallel request - that's OK
        }
      }
    }

    // Create new user with Clerk ID (use upsert to handle race conditions)
    return await prisma.user.upsert({
      where: { id: userData.id },
      update: {
        name: userData.name,
        image: userData.image,
      },
      create: userData,
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
