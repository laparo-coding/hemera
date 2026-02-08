/**
 * DELETE /api/admin/courses/[courseId]/curriculum-materials/[linkId]
 *
 * Remove a single curriculum–material link.
 */

import type { NextRequest } from 'next/server';
import {
  adminOptions,
  createAdminHandler,
} from '@/lib/api/admin-route-handler';
import { removeMaterialLink } from '@/lib/api/curriculum-material';

export const OPTIONS = adminOptions;

/**
 * DELETE – Remove a material link by its ID
 */
export const DELETE = createAdminHandler(
  async (_requestId: string, request?: NextRequest) => {
    const url = new URL(request!.url);
    const linkId = url.pathname.split('/').pop();
    if (!linkId) throw new Error('Missing linkId');
    await removeMaterialLink(linkId);
    return { deleted: true };
  },
  {
    context: 'Admin.CurriculumMaterials.DELETE',
    errorMessage: 'Fehler beim Entfernen der Seminarmaterial-Verknüpfung',
  }
);
