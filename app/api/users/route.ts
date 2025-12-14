import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import {
  type CreateUserData,
  createUser,
  getAllUsers,
  searchUsers,
  type UserProfile,
} from '../../../lib/api/users';
import { checkUserAdminStatus } from '../../../lib/auth/helpers';
import { createApiLogger } from '../../../lib/utils/api-logger';
import {
  createErrorResponse,
  createSuccessResponse,
  ErrorCodes,
} from '../../../lib/utils/api-response';
import {
  createRequestContext,
  getOrCreateRequestId,
} from '../../../lib/utils/request-id';

export async function GET(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);
  const context = createRequestContext(requestId, 'GET', '/api/users');
  const logger = createApiLogger(context);

  try {
    logger.info('Starting user list request');

    const { userId } = await auth();
    if (!userId) {
      logger.warn('Unauthorized access attempt');
      return createErrorResponse(
        'Unauthorized access',
        ErrorCodes.UNAUTHORIZED,
        requestId,
        401
      );
    }

    const isAdmin = await checkUserAdminStatus(userId);
    if (!isAdmin) {
      logger.warn('Non-admin user attempted to access user list', { userId });
      return createErrorResponse(
        'Admin privileges required',
        ErrorCodes.FORBIDDEN,
        requestId,
        403
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const search = searchParams.get('search');

    logger.info('Fetching users', { limit, offset, search: !!search });

    let users: { users: UserProfile[]; total: number } | UserProfile[];
    if (search) {
      users = await searchUsers(search, limit);
      logger.info('Search completed', {
        resultCount: users.length,
        searchTerm: search,
      });
    } else {
      users = await getAllUsers(limit, offset);
      logger.info('User list retrieved', {
        resultCount: users.users.length,
        total: users.total,
      });
    }

    return createSuccessResponse(
      {
        users: 'users' in users ? users.users : users,
        pagination: {
          limit,
          offset,
          total: 'total' in users ? users.total : users.length,
        },
      },
      requestId
    );
  } catch (error) {
    logger.error('Error in GET /api/users', error as Error);
    return createErrorResponse(
      'Failed to retrieve users',
      ErrorCodes.INTERNAL_ERROR,
      requestId,
      500
    );
  }
}

export async function POST(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);
  const context = createRequestContext(requestId, 'POST', '/api/users');
  const logger = createApiLogger(context);

  try {
    logger.info('Starting user creation request');

    const { userId } = await auth();
    if (!userId) {
      logger.warn('Unauthorized user creation attempt');
      return createErrorResponse(
        'Unauthorized access',
        ErrorCodes.UNAUTHORIZED,
        requestId,
        401
      );
    }

    const isAdmin = await checkUserAdminStatus(userId);
    if (!isAdmin) {
      logger.warn('Non-admin user attempted to create user', { userId });
      return createErrorResponse(
        'Admin privileges required',
        ErrorCodes.FORBIDDEN,
        requestId,
        403
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch (_error) {
      logger.warn('Invalid JSON in request body');
      return createErrorResponse(
        'Invalid JSON in request body',
        ErrorCodes.INVALID_INPUT,
        requestId,
        400
      );
    }

    // Type guard for body
    const data = body as Record<string, unknown>;

    if (!data.email || typeof data.email !== 'string') {
      logger.warn('Missing or invalid email in request', {
        hasEmail: !!data.email,
      });
      return createErrorResponse(
        'Email is required and must be a string',
        ErrorCodes.INVALID_INPUT,
        requestId,
        400
      );
    }

    if (!data.id || typeof data.id !== 'string') {
      logger.warn('Missing or invalid user ID in request', {
        hasId: !!data.id,
      });
      return createErrorResponse(
        'User ID is required and must be a string',
        ErrorCodes.INVALID_INPUT,
        requestId,
        400
      );
    }

    const createData: CreateUserData = {
      id: data.id.trim(),
      email: data.email.trim(),
      name: typeof data.name === 'string' ? data.name : null,
      image: typeof data.image === 'string' ? data.image : null,
    };

    logger.info('Creating new user', { email: createData.email });

    const newUser = await createUser(createData);

    logger.info('User created successfully', { userId: newUser.id });

    return createSuccessResponse(
      {
        user: newUser,
      },
      requestId
    );
  } catch (error) {
    logger.error('Error in POST /api/users', error as Error);
    return createErrorResponse(
      'Failed to create user',
      ErrorCodes.INTERNAL_ERROR,
      requestId,
      500
    );
  }
}
