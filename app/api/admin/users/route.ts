import type { NextRequest } from 'next/server';
import { requireAdminUser } from '@/lib/auth/helpers';
import { prisma } from '@/lib/db/prisma';
import { serverInstance as rollbar } from '@/lib/monitoring/rollbar-official';
import {
  createErrorResponse,
  createSuccessResponse,
  ErrorCodes,
} from '@/lib/utils/api-response';
import {
  applyCorsHeaders,
  createCorsPreflightResponse,
  getCorsHeaders,
} from '@/lib/utils/cors';
import { getOrCreateRequestId } from '@/lib/utils/request-id';

// CORS headers restricted to same origin (not wildcard)
const corsHeaders = getCorsHeaders();

export async function OPTIONS() {
  return createCorsPreflightResponse(corsHeaders);
}

export async function GET(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);

  try {
    const adminAuth = await requireAdminUser(requestId);
    if (!adminAuth.authorized) {
      return applyCorsHeaders(adminAuth.response, corsHeaders);
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

      return applyCorsHeaders(
        createSuccessResponse(result, requestId),
        corsHeaders
      );
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

    return applyCorsHeaders(
      createSuccessResponse(
        {
          users,
          total: users.length,
        },
        requestId
      ),
      corsHeaders
    );
  } catch (error) {
    try {
      rollbar.error(error instanceof Error ? error : new Error(String(error)), {
        requestId,
        route: 'GET /api/admin/users',
      });
    } catch {
      // Rollbar reporting must never block the API response.
    }

    return applyCorsHeaders(
      createErrorResponse(
        'Failed to fetch users',
        ErrorCodes.INTERNAL_ERROR,
        requestId,
        500
      ),
      corsHeaders
    );
  }
}
