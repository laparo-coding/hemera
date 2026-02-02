import { auth } from '@clerk/nextjs/server';
import { del, put } from '@vercel/blob';
import { type NextRequest, NextResponse } from 'next/server';
import {
  deleteMaterial,
  getMaterialById,
  isIdentifierTaken,
  updateMaterial,
} from '@/lib/api/course-material';
import { serverInstance } from '@/lib/monitoring/rollbar-official';
import { seminarMaterialUpdateSchema } from '@/lib/schemas/admin/course-material';

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/admin/seminarmaterial/[id]
 * Get a single seminar material
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: 'unauthorized', message: 'Authentifizierung erforderlich' },
        { status: 401 }
      );
    }

    const material = await getMaterialById(id);

    if (!material) {
      return NextResponse.json(
        { error: 'not_found', message: 'Material nicht gefunden' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: material.id,
      identifier: material.identifier,
      title: material.title,
      blobUrl: material.blobUrl,
      blobPathname: material.blobPathname,
      createdAt: material.createdAt.toISOString(),
      updatedAt: material.updatedAt.toISOString(),
    });
  } catch (error) {
    serverInstance.error('Failed to get seminar material', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'internal_error', message: 'Fehler beim Abrufen des Materials' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/seminarmaterial/[id]
 * Update a seminar material
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: 'unauthorized', message: 'Authentifizierung erforderlich' },
        { status: 401 }
      );
    }

    const existingMaterial = await getMaterialById(id);

    if (!existingMaterial) {
      return NextResponse.json(
        { error: 'not_found', message: 'Material nicht gefunden' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = seminarMaterialUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'validation_error',
          message: parsed.error.issues[0]?.message || 'Ungültige Eingabe',
        },
        { status: 400 }
      );
    }

    const { title, identifier, htmlContent } = parsed.data;

    // Check if new identifier is already taken
    if (identifier && identifier !== existingMaterial.identifier) {
      if (await isIdentifierTaken(identifier, id)) {
        return NextResponse.json(
          {
            error: 'conflict',
            message: `Identifier "${identifier}" ist bereits vergeben`,
          },
          { status: 409 }
        );
      }
    }

    const updateData: {
      title?: string;
      identifier?: string;
      blobUrl?: string;
      blobPathname?: string;
    } = {};

    if (title) updateData.title = title;

    // If identifier changes, we need to re-upload with new pathname
    const newIdentifier = identifier || existingMaterial.identifier;

    if (htmlContent) {
      // Always delete old blob before uploading new content
      // (Vercel Blob doesn't allow overwriting without explicit flag)
      try {
        await del(existingMaterial.blobUrl);
      } catch {
        // Ignore delete errors - blob may not exist
      }

      // Upload new content
      const blobPathname = `course-material/${newIdentifier}.html`;
      const blob = await put(blobPathname, htmlContent, {
        access: 'public',
        contentType: 'text/html',
      });

      updateData.blobUrl = blob.url;
      updateData.blobPathname = blob.pathname;
    }

    if (identifier) {
      updateData.identifier = identifier;
    }

    const material = await updateMaterial(id, updateData);

    return NextResponse.json({
      id: material.id,
      identifier: material.identifier,
      title: material.title,
      blobUrl: material.blobUrl,
      blobPathname: material.blobPathname,
      createdAt: material.createdAt.toISOString(),
      updatedAt: material.updatedAt.toISOString(),
    });
  } catch (error) {
    serverInstance.error('Failed to update seminar material', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'Fehler beim Aktualisieren des Materials',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/seminarmaterial/[id]
 * Delete a seminar material
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: 'unauthorized', message: 'Authentifizierung erforderlich' },
        { status: 401 }
      );
    }

    const material = await getMaterialById(id);

    if (!material) {
      return NextResponse.json(
        { error: 'not_found', message: 'Material nicht gefunden' },
        { status: 404 }
      );
    }

    // Delete blob file
    try {
      await del(material.blobUrl);
    } catch {
      // Log but continue with DB deletion
      serverInstance.warning('Failed to delete blob file', {
        blobUrl: material.blobUrl,
      });
    }

    // Delete database record
    await deleteMaterial(id);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    serverInstance.error('Failed to delete seminar material', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'internal_error', message: 'Fehler beim Löschen des Materials' },
      { status: 500 }
    );
  }
}
