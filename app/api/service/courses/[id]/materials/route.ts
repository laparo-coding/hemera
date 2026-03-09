import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { getMaterialLinksForCourse } from '@/lib/api/curriculum-material';
import { handleServiceAuthError } from '@/lib/auth/handle-service-auth';
import { authenticateServiceRequest } from '@/lib/auth/service-auth';
import { prisma } from '@/lib/db/prisma';
import { checkRateLimit } from '@/lib/middleware/rate-limit';
import {
  extractIpAddress,
  logServiceApiCall,
} from '@/lib/monitoring/service-api-logger';
import { createApiLogger } from '@/lib/utils/api-logger';
import { ErrorCodes } from '@/lib/utils/api-response';
import {
  createRequestContext,
  getOrCreateRequestId,
} from '@/lib/utils/request-id';
import {
  createServiceApiErrorResponse,
  createServiceApiSuccessResponse,
  handleOptionsRequest,
} from '@/lib/utils/service-api-response';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const IdParamSchema = z.string().cuid('Invalid course ID format');

/**
 * OPTIONS /api/service/courses/[id]/materials
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);
  return handleOptionsRequest(requestId);
}

/**
 * Fetch HTML content from Vercel Blob with timeout.
 * Returns the HTML string or null on failure.
 */
async function fetchBlobContent(blobUrl: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(blobUrl, { signal: controller.signal });
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * GET /api/service/courses/[id]/materials
 * Get course materials with HTML content, grouped by curriculum topic.
 *
 * Returns materials linked via CurriculumTopicMaterial, including:
 * - Topic grouping (topicId, topicTitle)
 * - Material metadata (identifier, title, sortOrder)
 * - Full HTML body fetched from Vercel Blob
 *
 * Auth: api-client or admin role required
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const requestId = getOrCreateRequestId(request);

  // Validate ID format
  const idResult = IdParamSchema.safeParse(rawId);
  if (!idResult.success) {
    return await createServiceApiErrorResponse(
      'Invalid course ID format',
      ErrorCodes.VALIDATION_ERROR,
      requestId,
      400
    );
  }
  const id = idResult.data;

  const context = createRequestContext(
    requestId,
    'GET',
    `/api/service/courses/${id}/materials`
  );
  const logger = createApiLogger(context);
  const startTime = Date.now();

  try {
    // Unified auth check (Clerk session or API key)
    const authResult = await authenticateServiceRequest(request);

    if ('error' in authResult) {
      return await handleServiceAuthError(authResult, logger, requestId);
    }

    const { userId, role } = authResult;

    logger.info('Service API materials request authorized', {
      userId,
      role,
      authMethod: authResult.authMethod,
      courseId: id,
    });

    // Rate limiting check
    const rateLimitResponse = await checkRateLimit(userId, role, requestId);
    if (rateLimitResponse) {
      logger.warn('Rate limit exceeded', { userId, role });
      return rateLimitResponse;
    }

    // Verify course exists and load curriculum JSON
    const course = await prisma.course.findUnique({
      where: { id },
      select: { id: true, curriculum: true },
    });

    if (!course) {
      logger.warn('Course not found', { courseId: id });
      return await createServiceApiErrorResponse(
        'Course not found',
        ErrorCodes.NOT_FOUND,
        requestId,
        404,
        userId,
        role
      );
    }

    // Load material links grouped by topicId
    const materialLinks = await getMaterialLinksForCourse(id);

    // Parse curriculum JSON to get topic titles
    const curriculum = course.curriculum as Array<{
      id: string;
      day: number;
      title: string;
      topics: Array<{
        id: string;
        timeRange: string;
        title: string;
      }>;
    }> | null;

    // Build a topicId → topicTitle lookup from curriculum JSON
    const topicTitleMap = new Map<string, string>();
    if (curriculum) {
      for (const mod of curriculum) {
        for (const topic of mod.topics) {
          topicTitleMap.set(topic.id, topic.title);
        }
      }
    }

    // Collect all unique materialIds to load blobUrls
    const allMaterialIds = new Set<string>();
    for (const links of Object.values(materialLinks)) {
      for (const link of links) {
        allMaterialIds.add(link.materialId);
      }
    }

    // Load blobUrls for all materials in a single query
    const materials = await prisma.courseMaterial.findMany({
      where: { id: { in: [...allMaterialIds] } },
      select: { id: true, blobUrl: true },
    });
    // Fetch all HTML contents in parallel
    const htmlContentMap = new Map<string, string>();
    const fetchPromises = materials.map(async m => {
      const html = await fetchBlobContent(m.blobUrl);
      if (html !== null) {
        htmlContentMap.set(m.id, html);
      } else {
        logger.warn('Failed to fetch blob content for material', {
          materialId: m.id,
          blobUrl: m.blobUrl,
        });
      }
    });
    await Promise.all(fetchPromises);

    // Build response: array of topic groups with materials
    const topics: Array<{
      topicId: string;
      topicTitle: string;
      materials: Array<{
        materialId: string;
        identifier: string;
        title: string;
        sortOrder: number;
        htmlContent: string | null;
      }>;
    }> = [];

    for (const [topicId, links] of Object.entries(materialLinks)) {
      topics.push({
        topicId,
        topicTitle: topicTitleMap.get(topicId) ?? topicId,
        materials: links.map(link => ({
          materialId: link.materialId,
          identifier: link.identifier,
          title: link.title,
          sortOrder: link.sortOrder,
          htmlContent: htmlContentMap.get(link.materialId) ?? null,
        })),
      });
    }

    const totalMaterials = topics.reduce(
      (sum, t) => sum + t.materials.length,
      0
    );

    logger.info('Course materials retrieved successfully', {
      courseId: id,
      topicCount: topics.length,
      materialCount: totalMaterials,
    });

    // Audit log
    logServiceApiCall({
      userId,
      userRole: role,
      endpoint: `/api/service/courses/${id}/materials`,
      method: 'GET',
      statusCode: 200,
      requestId,
      timestamp: new Date().toISOString(),
      ipAddress: extractIpAddress(request.headers),
      responseTime: Date.now() - startTime,
    });

    return await createServiceApiSuccessResponse(requestId, userId, role, {
      courseId: id,
      topics,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to retrieve course materials', err);
    return await createServiceApiErrorResponse(
      'Internal server error',
      ErrorCodes.INTERNAL_ERROR,
      requestId,
      500
    );
  }
}
