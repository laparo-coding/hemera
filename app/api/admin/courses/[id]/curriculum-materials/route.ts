/**
 * GET /api/admin/courses/[id]/curriculum-materials
 * POST /api/admin/courses/[id]/curriculum-materials
 *
 * Admin endpoints for managing curriculum–material links.
 */

import type { NextRequest } from 'next/server';
import {
  adminOptions,
  createAdminHandler,
} from '@/lib/api/admin-route-handler';
import {
  addMaterialLink,
  getMaterialLinksForCourse,
} from '@/lib/api/curriculum-material';

export const OPTIONS = adminOptions;

/** Extract the course ID from a URL like /api/admin/courses/{id}/curriculum-materials */
function extractCourseId(url: string): string {
  const segments = new URL(url).pathname.split('/');
  const idx = segments.indexOf('courses');
  const courseId = idx >= 0 ? segments[idx + 1] : undefined;
  if (!courseId) throw new Error('Missing courseId');
  return courseId;
}

/**
 * GET – Fetch all material links for a course
 */
export const GET = createAdminHandler(
  async (_requestId: string, request?: NextRequest) => {
    const courseId = extractCourseId(request!.url);
    return getMaterialLinksForCourse(courseId);
  },
  {
    context: 'Admin.CurriculumMaterials.GET',
    errorMessage: 'Fehler beim Abrufen der Seminarmaterial-Verknüpfungen',
  }
);

/**
 * POST – Add a material link to a topic
 * Body: { topicId: string, materialId: string, sortOrder?: number }
 */
export const POST = createAdminHandler(
  async (_requestId: string, request?: NextRequest) => {
    const courseId = extractCourseId(request!.url);
    const body = await request!.json();
    const { topicId, materialId, sortOrder } = body;

    if (!topicId || !materialId) {
      throw new Error('topicId und materialId sind erforderlich');
    }

    return addMaterialLink({ courseId, topicId, materialId, sortOrder });
  },
  {
    context: 'Admin.CurriculumMaterials.POST',
    errorMessage: 'Fehler beim Verknüpfen des Seminarmaterials',
  }
);
