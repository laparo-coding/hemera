import { type NextRequest, NextResponse } from 'next/server';
import { getMaterialById } from '@/lib/api/course-material';
import { requireAdminUser } from '@/lib/auth/helpers';
import { serverInstance } from '@/lib/monitoring/rollbar-official';
import { getOrCreateRequestId } from '@/lib/utils/request-id';

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/admin/course-material/[id]/content
 * Get the HTML content of a course material
 * Fetches the content from Vercel Blob
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const requestId = getOrCreateRequestId(request);
    const auth = await requireAdminUser(requestId);
    if (!auth.authorized) return auth.response;

    const { id } = await params;

    const material = await getMaterialById(id);

    if (!material) {
      return NextResponse.json(
        { error: 'not_found', message: 'Material nicht gefunden' },
        { status: 404 }
      );
    }

    // Fetch HTML content from Vercel Blob with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, 10_000);
    let response: Response;
    try {
      response = await fetch(material.blobUrl, { signal: controller.signal });
    } catch (fetchError) {
      clearTimeout(timeout);
      if (
        fetchError instanceof DOMException &&
        fetchError.name === 'AbortError'
      ) {
        serverInstance.error('Blob fetch timed out', {
          blobUrl: material.blobUrl,
        });
        return NextResponse.json(
          {
            error: 'gateway_timeout',
            message: 'Zeitüberschreitung beim Laden des Inhalts',
          },
          { status: 504 }
        );
      }
      serverInstance.error('Failed to fetch blob content', {
        blobUrl: material.blobUrl,
        error:
          fetchError instanceof Error ? fetchError.message : 'Unknown error',
      });
      return NextResponse.json(
        { error: 'blob_error', message: 'Inhalt konnte nicht geladen werden' },
        { status: 502 }
      );
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      serverInstance.error('Blob returned non-OK status', {
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
