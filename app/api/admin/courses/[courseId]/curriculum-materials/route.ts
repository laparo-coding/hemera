/**
 * GET /api/admin/courses/[courseId]/curriculum-materials
 * POST /api/admin/courses/[courseId]/curriculum-materials
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

/**
 * GET – Fetch all material links for a course
 */
export const GET = createAdminHandler(
  async (_requestId: string, request?: NextRequest) => {
    const url = new URL(request!.url);
    const courseId = url.pathname.split('/').at(-2);
    if (!courseId) throw new Error('Missing courseId');
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
    const url = new URL(request!.url);
    const courseId = url.pathname.split('/').at(-2);
    if (!courseId) throw new Error('Missing courseId');

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
