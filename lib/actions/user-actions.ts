/**
 * User Management Server Actions
 * Provides authenticated server actions for user operations
 */

'use server';

import { revalidatePath } from 'next/cache';
import {
  getCurrentUserWithSync,
  getUserStats,
  type UpdateUserData,
  updateUser,
} from '../api/users';
import { UserValidationError } from '../errors';
import {
  type ServerActionContext,
  type ServerActionResult,
  withServerActionErrorHandling,
} from '../middleware/server-action-error-handling';
import { serverInstance } from '../monitoring/rollbar-official';

/**
 * Get current user profile
 */
export const getCurrentProfileAction = withServerActionErrorHandling(
  async (_context: ServerActionContext) => {
    return await getCurrentUserWithSync();
  }
);

/**
 * Update current user profile
 */
export const updateProfileAction = async (
  formData: FormData
): Promise<ServerActionResult> => {
  try {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const image = formData.get('image') as string;

    // Get current user first
    const currentUser = await getCurrentUserWithSync();

    // Validate data
    const updateData: UpdateUserData = {};

    if (name !== undefined && name !== currentUser.name) {
      if (name && typeof name !== 'string') {
        throw new UserValidationError('Name must be a string');
      }
      updateData.name = name || null;
    }

    if (email !== undefined && email !== currentUser.email) {
      if (!email || typeof email !== 'string') {
        throw new UserValidationError('Email is required and must be a string');
      }
      updateData.email = email;
    }

    if (image !== undefined && image !== currentUser.image) {
      if (image && typeof image !== 'string') {
        throw new UserValidationError('Image must be a string URL');
      }
      updateData.image = image || null;
    }

    // Only update if there are changes
    if (Object.keys(updateData).length === 0) {
      return {
        success: true,
        data: currentUser,
      };
    }

    const updatedUser = await updateUser(currentUser.id, updateData);

    // Revalidate user-related pages
    revalidatePath('/protected');
    revalidatePath('/profile');

    return {
      success: true,
      data: updatedUser,
    };
  } catch (error) {
    serverInstance.error('Update profile error', {
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });
    return {
      success: false,
      error: {
        code: 'UPDATE_PROFILE_FAILED',
        message:
          error instanceof Error ? error.message : 'Failed to update profile',
      },
    };
  }
};

/**
 * Get user statistics
 */
export const getUserStatsAction = withServerActionErrorHandling(
  async (_context: ServerActionContext) => {
    const currentUser = await getCurrentUserWithSync();
    const stats = await getUserStats(currentUser.id);

    return stats;
  }
);

/**
 * Sync user with Clerk (useful after external updates)
 */
export const syncUserAction = withServerActionErrorHandling(
  async (_context: ServerActionContext) => {
    const user = await getCurrentUserWithSync();

    revalidatePath('/protected');
    revalidatePath('/profile');

    return user;
  }
);

/**
 * Check if user email is available (for updates)
 */
export const checkEmailAvailabilityAction = async (
  email: string
): Promise<ServerActionResult> => {
  try {
    if (!email || typeof email !== 'string') {
      throw new UserValidationError('Valid email is required');
    }

    const currentUser = await getCurrentUserWithSync();

    // If it's the same as current email, it's available
    if (email === currentUser.email) {
      return {
        success: true,
        data: {
          available: true,
          message: 'Email is available (current email)',
        },
      };
    }

    try {
      // Try to find user with this email
      const { getUserByEmail } = await import('../api/users');
      await getUserByEmail(email);

      // If we found a user, email is not available
      return {
        success: true,
        data: {
          available: false,
          message: 'Email is already registered',
        },
      };
    } catch (error) {
      // If UserNotFoundError, email is available
      if (error instanceof Error && error.message.includes('not found')) {
        return {
          success: true,
          data: {
            available: true,
            message: 'Email is available',
          },
        };
      }

      // Re-throw other errors
      throw error;
    }
  } catch (error) {
    serverInstance.error('Check email availability error', {
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });
    return {
      success: false,
      error: {
        code: 'EMAIL_CHECK_FAILED',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to check email availability',
      },
    };
  }
};

/**
 * Update user preference (for non-critical updates)
 */
export const updateUserPreferenceAction = async (
  key: string,
  value: unknown
): Promise<ServerActionResult> => {
  try {
    if (!key || typeof key !== 'string') {
      throw new UserValidationError('Preference key is required');
    }

    // This would typically update user preferences/metadata
    // For now, we'll just return success
    return {
      success: true,
      data: { [key]: value },
    };
  } catch (error) {
    serverInstance.error('Update user preference error', {
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });
    return {
      success: false,
      error: {
        code: 'PREFERENCE_UPDATE_FAILED',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to update preference',
      },
    };
  }
};
