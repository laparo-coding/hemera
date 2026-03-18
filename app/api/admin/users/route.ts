import { auth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import { checkUserAdminStatus } from '../../../../lib/auth/helpers';
import { prisma } from '../../../../lib/db/prisma';
import {
  createErrorResponse,
  createSuccessResponse,
  ErrorCodes,
} from '../../../../lib/utils/api-response';
import { getCorsHeaders } from '../../../../lib/utils/cors';
import { getOrCreateRequestId } from '../../../../lib/utils/request-id';

// CORS headers restricted to same origin (not wildcard)
const corsHeaders = getCorsHeaders();

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);

  try {
    // Authentication check
    let userId: string | null = null;
    try {
      const authResult = await auth();
      userId = authResult.userId;
    } catch (_authError) {
      // In E2E test mode, auth() might fail, return 401
      const errorResponse = createErrorResponse(
        'Unauthorized access',
        ErrorCodes.UNAUTHORIZED,
        requestId,
        401
      );

      // Add CORS headers to error response
      Object.entries(corsHeaders).forEach(([key, value]) => {
        errorResponse.headers.set(key, value);
      });

      return errorResponse;
    }

    if (!userId) {
      const errorResponse = createErrorResponse(
        'Unauthorized access',
        ErrorCodes.UNAUTHORIZED,
        requestId,
        401
      );

      // Add CORS headers to error response
      Object.entries(corsHeaders).forEach(([key, value]) => {
        errorResponse.headers.set(key, value);
      });

      return errorResponse;
    }

    // Admin authorization check
    const isAdmin = await checkUserAdminStatus();
    if (!isAdmin) {
      const errorResponse = createErrorResponse(
        'Admin privileges required',
        ErrorCodes.FORBIDDEN,
        requestId,
        403
      );

      // Add CORS headers to error response
      Object.entries(corsHeaders).forEach(([key, value]) => {
        errorResponse.headers.set(key, value);
      });

      return errorResponse;
    }

    // Parse query parameters for enhanced filtering (024-admin-dashboard)
    const url = new URL(request.url);
    const rawPage = parseInt(url.searchParams.get('page') || '1', 10);
    const rawLimit = parseInt(url.searchParams.get('limit') || '20', 10);
    const page = Number.isNaN(rawPage) ? 1 : Math.max(1, rawPage);
    const limit = Number.isNaN(rawLimit)
      ? 20
      : Math.min(Math.max(1, rawLimit), 100);
    const search = url.searchParams.get('search') || undefined;
    const outperformerOnly =
      url.searchParams.get('outperformerOnly') === 'true';
    const adminOnly = url.searchParams.get('adminOnly') === 'true';
    const rawSortBy = url.searchParams.get('sortBy') || 'createdAt';
    const rawSortOrder = url.searchParams.get('sortOrder') || 'desc';
    const validSortFields = ['name', 'email', 'createdAt', 'lastSignInAt'];
    const validSortOrders = ['asc', 'desc'];
    const sortBy = validSortFields.includes(rawSortBy)
      ? rawSortBy
      : 'createdAt';
    const sortOrder = validSortOrders.includes(rawSortOrder)
      ? rawSortOrder
      : 'desc';

    // If enhanced mode requested (has pagination params), use new API
    if (url.searchParams.has('page') || url.searchParams.has('limit')) {
      const { getAdminUsers } = await import('@/lib/api/admin-users');

      const result = await getAdminUsers({
        page,
        limit,
        search,
        outperformerOnly,
        adminOnly,
        sortBy: sortBy as 'name' | 'email' | 'createdAt' | 'lastSignInAt',
        sortOrder: sortOrder as 'asc' | 'desc',
      });

      const response = createSuccessResponse(result, requestId);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }

    // Legacy mode: return Prisma users
    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: {
            bookings: true,
          },
        },
      },
      orderBy: {
        id: 'desc',
      },
    });

    const response = createSuccessResponse(
      {
        users,
        total: users.length,
      },
      requestId
    );

    // Add CORS headers to response
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (_error) {
    const errorResponse = createErrorResponse(
      'Failed to fetch users',
      ErrorCodes.INTERNAL_ERROR,
      requestId,
      500
    );

    // Add CORS headers to error response
    Object.entries(corsHeaders).forEach(([key, value]) => {
      errorResponse.headers.set(key, value);
    });

    return errorResponse;
  }
}
