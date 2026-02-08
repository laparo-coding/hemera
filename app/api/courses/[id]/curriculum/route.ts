/**
 * GET /api/courses/[id]/curriculum
 *
 * Public endpoint to fetch a course's curriculum with linked seminar materials.
 * Returns the full curriculum structure enriched with material metadata.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getCurriculumWithMaterials } from '@/lib/api/curriculum-material';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Resolve course by id or slug
    const course = await prisma.course.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      select: { id: true, isPublished: true },
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Kurs nicht gefunden' },
        { status: 404 }
      );
    }

    const result = await getCurriculumWithMaterials(course.id);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (_error) {
    return NextResponse.json(
      { success: false, error: 'Fehler beim Laden des Curriculums' },
      { status: 500 }
    );
  }
}
