/**
 * DELETE /api/admin/courses/[id]/curriculum-materials/[linkId]
 *
 * Remove a single curriculum–material link.
 */

import type { NextRequest } from 'next/server';
import {
  adminOptions,
  createAdminHandler,
} from '@/lib/api/admin-route-handler';
import { prisma } from '@/lib/db/prisma';
import { removeMaterialLink } from '@/lib/api/curriculum-material';

export const OPTIONS = adminOptions;

/** Extract courseId and linkId from URL */
function extractIds(url: string): { courseId: string; linkId: string } {
  const segments = new URL(url).pathname.split('/');
  const coursesIdx = segments.indexOf('courses');
  const courseId = coursesIdx >= 0 ? segments[coursesIdx + 1] : undefined;
  const linkId = segments[segments.length - 1];
  if (!courseId || !linkId) {
    throw new Error('courseId und linkId sind erforderlich');
  }
  return { courseId, linkId };
}

/**
 * DELETE – Remove a material link by its ID
 */
export const DELETE = createAdminHandler(
  async (_requestId: string, request?: NextRequest) => {
    if (!request) throw new Error('Request fehlt');
    const { courseId, linkId } = extractIds(request.url);

    // Verify link belongs to the course
    const link = await prisma.curriculumTopicMaterial.findUnique({
      where: { id: linkId },
    });
    if (!link || link.courseId !== courseId) {
      throw new Error('Verknüpfung nicht gefunden');
    }

    await removeMaterialLink(linkId);
    return { deleted: true };
  },
  {
    context: 'Admin.CurriculumMaterials.DELETE',
    errorMessage: 'Fehler beim Entfernen der Seminarmaterial-Verknüpfung',
  }
);
