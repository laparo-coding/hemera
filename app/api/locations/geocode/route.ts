/**
 * Geocode API Route - POST geocode address
 * Feature: 015-course-locations
 * Task: T030
 */

import { currentUser } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { isAdmin } from '@/lib/auth/helpers';
import { geocodeRequestSchema } from '@/lib/schemas/location-schema';
import { geocodeLocationAddress } from '@/lib/services/location';
import { createApiLogger } from '@/lib/utils/api-logger';
import {
  createErrorResponse,
  createSuccessResponse,
  ErrorCodes,
} from '@/lib/utils/api-response';
import { isClerkDisabled } from '@/lib/utils/clerk-disabled-check';
import {
  createRequestContext,
  getOrCreateRequestId,
} from '@/lib/utils/request-id';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * POST /api/locations/geocode - Geocode an address (admin only)
 */
export async function POST(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);
  const context = createRequestContext(
    requestId,
    'POST',
    '/api/locations/geocode'
  );
  const logger = createApiLogger(context);

  try {
    // Check authentication
    const user = await currentUser();

    if (!user?.id) {
      // E2E test fallback: when Clerk is disabled, return 401 early
      if (isClerkDisabled()) {
        logger.info(
          'E2E-Testmodus: Clerk deaktiviert, Geocoding-Anfrage abgelehnt'
        );
        return createErrorResponse(
          'Authentifizierung im E2E-Modus deaktiviert',
          ErrorCodes.UNAUTHORIZED,
          requestId,
          401
        );
      }

      logger.warn('Unauthorized attempt to geocode');
      return createErrorResponse(
        'Authentifizierung erforderlich',
        ErrorCodes.UNAUTHORIZED,
        requestId,
        401
      );
    }

    // Check admin role
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      logger.warn('Non-admin user attempted to geocode', { userId: user.id });
      return createErrorResponse(
        'Admin-Berechtigung erforderlich',
        ErrorCodes.FORBIDDEN,
        requestId,
        403
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = geocodeRequestSchema.safeParse(body);

    if (!validation.success) {
      logger.warn('Invalid geocode request', {
        errors: validation.error.issues,
      });
      return createErrorResponse(
        'Ungültige Eingabedaten',
        ErrorCodes.INVALID_INPUT,
        requestId,
        400
      );
    }

    logger.info('Geocoding address', {
      address: validation.data.address,
      city: validation.data.city,
    });

    const result = await geocodeLocationAddress(validation.data);

    logger.info('Geocoding completed', { success: result.success });

    return createSuccessResponse(result, requestId);
  } catch (error) {
    logger.error(
      'Error geocoding address',
      error instanceof Error ? error : new Error(String(error))
    );
    return createErrorResponse(
      'Fehler bei der Geocodierung',
      ErrorCodes.INTERNAL_ERROR,
      requestId,
      500
    );
  }
}
