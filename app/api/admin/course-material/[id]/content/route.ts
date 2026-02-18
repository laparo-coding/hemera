// biome-ignore assist/source/organizeImports: Clerk auth must be imported first
import { type NextRequest, NextResponse } from 'next/server';
import { checkUserAdminStatus, getCurrentUser } from '@/lib/auth/helpers';
import { getMaterialById } from '@/lib/api/course-material';
import { serverInstance } from '@/lib/monitoring/rollbar-official';

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/admin/course-material/[id]/content
 * Get the HTML content of a course material
 * Fetches the content from Vercel Blob
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    // Use test-friendly getCurrentUser to avoid Clerk middleware failures in Jest
    let userId: string | null = null;
    try {
      const user = await getCurrentUser();
      userId = user?.id ?? null;
    } catch (_e) {
      userId = null;
    }

    const { id } = await params;

    if (!userId) {
      return NextResponse.json(
        {
          error: 'unauthorized',
          message: 'Authentifizierung erforderlich',
        },
        { status: 401 }
      );
    }

    const adminCheck = await checkUserAdminStatus(userId);
    if (!adminCheck) {
      return NextResponse.json(
        { error: 'forbidden', message: 'Admin-Berechtigung erforderlich' },
        { status: 403 }
      );
    }

    const material = await getMaterialById(id);

    if (!material) {
      return NextResponse.json(
        { error: 'not_found', message: 'Material nicht gefunden' },
        { status: 404 }
      );
    }

    // Fetch HTML content from Vercel Blob
    const response = await fetch(material.blobUrl);

    if (!response.ok) {
      serverInstance.error('Failed to fetch blob content', {
        blobUrl: material.blobUrl,
        status: response.status,
      });
      return NextResponse.json(
        { error: 'blob_error', message: 'Inhalt konnte nicht geladen werden' },
        { status: 502 }
      );
    }

    const htmlContent = await response.text();

    return NextResponse.json({
      id: material.id,
      identifier: material.identifier,
      title: material.title,
      htmlContent,
      updatedAt: material.updatedAt.toISOString(),
    });
  } catch (error) {
    serverInstance.error('Failed to get course material content', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'internal_error', message: 'Fehler beim Abrufen des Inhalts' },
      { status: 500 }
    );
  }
}
