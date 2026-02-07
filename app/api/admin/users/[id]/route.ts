import { auth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import { deleteUser, updateUserRole } from '../../../../../lib/api/admin-users';
import { checkUserAdminStatus } from '../../../../../lib/auth/helpers';
import { prisma } from '../../../../../lib/db/prisma';
import { serverInstance } from '../../../../../lib/monitoring/rollbar-official';
import { userPatchSchema } from '../../../../../lib/schemas/admin/user';
import {
  createErrorResponse,
  createSuccessResponse,
  ErrorCodes,
} from '../../../../../lib/utils/api-response';
import { getCorsHeaders } from '../../../../../lib/utils/cors';
import { getOrCreateRequestId } from '../../../../../lib/utils/request-id';

// CORS headers restricted to same origin (not wildcard)
const corsHeaders = getCorsHeaders();

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/users/[id]
 * Get user details by ID
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const requestId = getOrCreateRequestId(request);
  let targetUserId: string | undefined;

  try {
    const params = await context.params;
    targetUserId = params.id;

    // Validate user ID
    if (!targetUserId || targetUserId.trim() === '') {
      const errorResponse = createErrorResponse(
        'Ungültige Benutzer-ID',
        ErrorCodes.VALIDATION_ERROR,
        requestId,
        400
      );
      Object.entries(corsHeaders).forEach(([key, value]) => {
        errorResponse.headers.set(key, value);
      });
      return errorResponse;
    }

    // Authentication check
    let userId: string | null = null;
    try {
      const authResult = await auth();
      userId = authResult.userId;
    } catch (_authError) {
      const errorResponse = createErrorResponse(
        'Nicht autorisierter Zugriff',
        ErrorCodes.UNAUTHORIZED,
        requestId,
        401
      );
      Object.entries(corsHeaders).forEach(([key, value]) => {
        errorResponse.headers.set(key, value);
      });
      return errorResponse;
    }

    if (!userId) {
      const errorResponse = createErrorResponse(
        'Nicht autorisierter Zugriff',
        ErrorCodes.UNAUTHORIZED,
        requestId,
        401
      );
      Object.entries(corsHeaders).forEach(([key, value]) => {
        errorResponse.headers.set(key, value);
      });
      return errorResponse;
    }

    // Admin authorization check
    const isAdmin = await checkUserAdminStatus(userId);
    if (!isAdmin) {
      const errorResponse = createErrorResponse(
        'Admin-Berechtigung erforderlich',
        ErrorCodes.FORBIDDEN,
        requestId,
        403
      );
      Object.entries(corsHeaders).forEach(([key, value]) => {
        errorResponse.headers.set(key, value);
      });
      return errorResponse;
    }

    // Fetch user
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        name: true,
        email: true,
        isOutperformer: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      const errorResponse = createErrorResponse(
        'Benutzer nicht gefunden',
        ErrorCodes.NOT_FOUND,
        requestId,
        404
      );
      Object.entries(corsHeaders).forEach(([key, value]) => {
        errorResponse.headers.set(key, value);
      });
      return errorResponse;
    }

    const successResponse = createSuccessResponse(user, requestId);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      successResponse.headers.set(key, value);
    });
    return successResponse;
  } catch (error) {
    // Log minimal context without full error object
    serverInstance.error('Fehler beim Laden der Benutzerdetails', {
      context: 'AdminUsers.GET',
      userId: targetUserId || 'unknown',
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    const errorResponse = createErrorResponse(
      'Benutzerdetails konnten nicht geladen werden',
      ErrorCodes.INTERNAL_ERROR,
      requestId,
      500
    );
    Object.entries(corsHeaders).forEach(([key, value]) => {
      errorResponse.headers.set(key, value);
    });
    return errorResponse;
  }
}

/**
 * PATCH /api/admin/users/[id]
 * Update user fields: role (admin/user) and/or outperformer status
 * Used for Admin Dashboard (024) and Learning Path (021)
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const requestId = getOrCreateRequestId(request);
  let targetUserId: string | undefined;

  try {
    const params = await context.params;
    targetUserId = params.id;

    // Validate user ID
    if (!targetUserId || targetUserId.trim() === '') {
      const errorResponse = createErrorResponse(
        'Ungültige Benutzer-ID',
        ErrorCodes.VALIDATION_ERROR,
        requestId,
        400
      );
      Object.entries(corsHeaders).forEach(([key, value]) => {
        errorResponse.headers.set(key, value);
      });
      return errorResponse;
    }

    // Authentication check
    let userId: string | null = null;
    try {
      const authResult = await auth();
      userId = authResult.userId;
    } catch (_authError) {
      const errorResponse = createErrorResponse(
        'Nicht autorisierter Zugriff',
        ErrorCodes.UNAUTHORIZED,
        requestId,
        401
      );
      Object.entries(corsHeaders).forEach(([key, value]) => {
        errorResponse.headers.set(key, value);
      });
      return errorResponse;
    }

    if (!userId) {
      const errorResponse = createErrorResponse(
        'Nicht autorisierter Zugriff',
        ErrorCodes.UNAUTHORIZED,
        requestId,
        401
      );
      Object.entries(corsHeaders).forEach(([key, value]) => {
        errorResponse.headers.set(key, value);
      });
      return errorResponse;
    }

    // Admin authorization check
    const isAdmin = await checkUserAdminStatus(userId);
    if (!isAdmin) {
      const errorResponse = createErrorResponse(
        'Admin-Berechtigung erforderlich',
        ErrorCodes.FORBIDDEN,
        requestId,
        403
      );
      Object.entries(corsHeaders).forEach(([key, value]) => {
        errorResponse.headers.set(key, value);
      });
      return errorResponse;
    }

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch (_parseError) {
      const errorResponse = createErrorResponse(
        'Ungültiger JSON-Body',
        ErrorCodes.VALIDATION_ERROR,
        requestId,
        400
      );
      Object.entries(corsHeaders).forEach(([key, value]) => {
        errorResponse.headers.set(key, value);
      });
      return errorResponse;
    }

    const parseResult = userPatchSchema.safeParse(body);
    if (!parseResult.success) {
      const errorResponse = createErrorResponse(
        `Validierungsfehler: ${parseResult.error.issues.map(e => e.message).join(', ')}`,
        ErrorCodes.VALIDATION_ERROR,
        requestId,
        400
      );
      Object.entries(corsHeaders).forEach(([key, value]) => {
        errorResponse.headers.set(key, value);
      });
      return errorResponse;
    }

    const { role, isOutperformer } = parseResult.data;

    // Handle role update via Clerk
    if (role !== undefined) {
      const updatedUser = await updateUserRole(targetUserId, role === 'admin');

      // Audit log: record role change
      serverInstance.info('Benutzerrolle durch Admin geändert', {
        context: 'AdminUsers.PATCH.role',
        targetUserId,
        adminUserId: userId,
        newRole: role,
        requestId,
      });

      const successResponse = createSuccessResponse(updatedUser, requestId);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        successResponse.headers.set(key, value);
      });
      return successResponse;
    }

    // Handle outperformer status update via Prisma
    if (isOutperformer !== undefined) {
      const existingUser = await prisma.user.findUnique({
        where: { id: targetUserId },
      });

      if (!existingUser) {
        const errorResponse = createErrorResponse(
          'Benutzer nicht gefunden',
          ErrorCodes.NOT_FOUND,
          requestId,
          404
        );
        Object.entries(corsHeaders).forEach(([key, value]) => {
          errorResponse.headers.set(key, value);
        });
        return errorResponse;
      }

      const updatedUser = await prisma.user.update({
        where: { id: targetUserId },
        data: { isOutperformer },
        select: {
          id: true,
          name: true,
          email: true,
          isOutperformer: true,
          updatedAt: true,
        },
      });

      // Audit log: record outperformer status change
      serverInstance.info('Outperformer-Status durch Admin geändert', {
        context: 'AdminUsers.PATCH.outperformer',
        targetUserId,
        adminUserId: userId,
        isOutperformer,
        requestId,
      });

      const successResponse = createSuccessResponse(updatedUser, requestId);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        successResponse.headers.set(key, value);
      });
      return successResponse;
    }

    // Should not reach here due to schema validation
    const errorResponse = createErrorResponse(
      'Keine gültige Aktion angegeben',
      ErrorCodes.VALIDATION_ERROR,
      requestId,
      400
    );
    Object.entries(corsHeaders).forEach(([key, value]) => {
      errorResponse.headers.set(key, value);
    });
    return errorResponse;
  } catch (error) {
    serverInstance.error('Fehler beim Aktualisieren des Benutzers', {
      context: 'AdminUsers.PATCH',
      userId: targetUserId || 'unknown',
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    const errorResponse = createErrorResponse(
      'Benutzer konnte nicht aktualisiert werden',
      ErrorCodes.INTERNAL_ERROR,
      requestId,
      500
    );
    Object.entries(corsHeaders).forEach(([key, value]) => {
      errorResponse.headers.set(key, value);
    });
    return errorResponse;
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Delete a user (024-admin-dashboard)
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const requestId = getOrCreateRequestId(request);
  let targetUserId: string | undefined;

  try {
    const params = await context.params;
    targetUserId = params.id;

    // Validate user ID
    if (!targetUserId || targetUserId.trim() === '') {
      const errorResponse = createErrorResponse(
        'Ungültige Benutzer-ID',
        ErrorCodes.VALIDATION_ERROR,
        requestId,
        400
      );
      Object.entries(corsHeaders).forEach(([key, value]) => {
        errorResponse.headers.set(key, value);
      });
      return errorResponse;
    }

    // Authentication check
    let userId: string | null = null;
    try {
      const authResult = await auth();
      userId = authResult.userId;
    } catch (_authError) {
      const errorResponse = createErrorResponse(
        'Nicht autorisierter Zugriff',
        ErrorCodes.UNAUTHORIZED,
        requestId,
        401
      );
      Object.entries(corsHeaders).forEach(([key, value]) => {
        errorResponse.headers.set(key, value);
      });
      return errorResponse;
    }

    if (!userId) {
      const errorResponse = createErrorResponse(
        'Nicht autorisierter Zugriff',
        ErrorCodes.UNAUTHORIZED,
        requestId,
        401
      );
      Object.entries(corsHeaders).forEach(([key, value]) => {
        errorResponse.headers.set(key, value);
      });
      return errorResponse;
    }

    // Admin authorization check
    const isAdmin = await checkUserAdminStatus(userId);
    if (!isAdmin) {
      const errorResponse = createErrorResponse(
        'Admin-Berechtigung erforderlich',
        ErrorCodes.FORBIDDEN,
        requestId,
        403
      );
      Object.entries(corsHeaders).forEach(([key, value]) => {
        errorResponse.headers.set(key, value);
      });
      return errorResponse;
    }

    // Prevent self-deletion
    if (userId === targetUserId) {
      const errorResponse = createErrorResponse(
        'Du kannst dein eigenes Konto nicht löschen',
        ErrorCodes.FORBIDDEN,
        requestId,
        403
      );
      Object.entries(corsHeaders).forEach(([key, value]) => {
        errorResponse.headers.set(key, value);
      });
      return errorResponse;
    }

    // Delete user via Clerk
    await deleteUser(targetUserId);

    // Audit log: record user deletion
    serverInstance.info('Benutzer durch Admin gelöscht', {
      context: 'AdminUsers.DELETE',
      deletedUserId: targetUserId,
      adminUserId: userId,
      requestId,
    });

    // Return 204 No Content
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders,
    });
  } catch (error) {
    serverInstance.error('Fehler beim Löschen des Benutzers', {
      context: 'AdminUsers.DELETE',
      userId: targetUserId || 'unknown',
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    const errorResponse = createErrorResponse(
      'Benutzer konnte nicht gelöscht werden',
      ErrorCodes.INTERNAL_ERROR,
      requestId,
      500
    );
    Object.entries(corsHeaders).forEach(([key, value]) => {
      errorResponse.headers.set(key, value);
    });
    return errorResponse;
  }
}
