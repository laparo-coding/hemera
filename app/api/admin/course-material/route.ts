// biome-ignore assist/source/organizeImports: Clerk auth must be imported first for proper Next.js initialization
import { auth } from '@clerk/nextjs/server';
import { put } from '@vercel/blob';
import { type NextRequest, NextResponse } from 'next/server';

import {
  createMaterial,
  getAllMaterials,
  isIdentifierTaken,
} from '@/lib/api/course-material';
import { isAdmin } from '@/lib/auth/helpers';
import { serverInstance } from '@/lib/monitoring/rollbar-official';
import {
  generateSlug,
  seminarMaterialCreateSchema,
} from '@/lib/schemas/admin/course-material';

/**
 * GET /api/admin/seminarmaterial
 * List all seminar materials
 */
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'unauthorized', message: 'Authentifizierung erforderlich' },
        { status: 401 }
      );
    }

    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json(
        { error: 'forbidden', message: 'Admin-Berechtigung erforderlich' },
        { status: 403 }
      );
    }

    const materials = await getAllMaterials();

    return NextResponse.json({
      materials: materials.map(m => ({
        id: m.id,
        identifier: m.identifier,
        title: m.title,
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    serverInstance.error('Failed to list seminar materials', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'Fehler beim Abrufen der Materialien',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/seminarmaterial
 * Create a new seminar material
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          error: 'unauthorized',
          message: 'Authentifizierung erforderlich',
        },
        { status: 401 }
      );
    }

    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json(
        { error: 'forbidden', message: 'Admin-Berechtigung erforderlich' },
        { status: 403 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: 'validation_error',
          message: 'Ungültiges JSON-Format',
        },
        { status: 400 }
      );
    }

    const parsed = seminarMaterialCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'validation_error',
          message: parsed.error.issues[0]?.message || 'Ungültige Eingabe',
        },
        { status: 400 }
      );
    }

    const { title, identifier: providedIdentifier, htmlContent } = parsed.data;

    // Generate or use provided identifier
    const identifier = providedIdentifier || generateSlug(title);

    // Check if identifier is already taken
    if (await isIdentifierTaken(identifier)) {
      return NextResponse.json(
        {
          error: 'conflict',
          message: `Identifier "${identifier}" ist bereits vergeben`,
        },
        { status: 409 }
      );
    }

    // Upload HTML to Vercel Blob
    const blobPathname = `course-material/${identifier}.html`;
    let blob;
    try {
      blob = await put(blobPathname, htmlContent, {
        access: 'public',
        contentType: 'text/html',
      });
    } catch (blobError) {
      serverInstance.error('Blob upload failed', {
        identifier,
        error: blobError instanceof Error ? blobError.message : 'Unknown error',
      });
      return NextResponse.json(
        {
          error: 'blob_error',
          message: 'Upload zu Blob-Storage fehlgeschlagen',
        },
        { status: 502 }
      );
    }

    // Create database record
    const material = await createMaterial({
      identifier,
      title,
      blobUrl: blob.url,
      blobPathname: blob.pathname,
    });

    return NextResponse.json(
      {
        id: material.id,
        identifier: material.identifier,
        title: material.title,
        blobUrl: material.blobUrl,
        blobPathname: material.blobPathname,
        createdAt: material.createdAt.toISOString(),
        updatedAt: material.updatedAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    serverInstance.error('Failed to create seminar material', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'Fehler beim Erstellen des Materials',
      },
      { status: 500 }
    );
  }
}
