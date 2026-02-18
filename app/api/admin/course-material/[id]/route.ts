import { del, put } from '@vercel/blob';
import { type NextRequest, NextResponse } from 'next/server';

import {
  deleteMaterial,
  getMaterialById,
  isIdentifierTaken,
  updateMaterial,
} from '@/lib/api/course-material';
import {
  checkUserAdminStatus,
  getCurrentUser,
  type User,
} from '@/lib/auth/helpers';
import { serverInstance } from '@/lib/monitoring/rollbar-official';
import { courseMaterialUpdateSchema } from '@/lib/schemas/admin/course-material';
import { logAuditEvent } from '@/lib/utils/audit-logging';
import { sanitizeHtml, validateHtmlContent } from '@/lib/utils/html-sanitizer';

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/admin/course-material/[id]
 * Get a single course material
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  let userId: string | null = null;
  let authUser: User | null = null;
  try {
    try {
      authUser = await getCurrentUser();
      userId = authUser?.id ?? null;
    } catch (authError) {
      serverInstance.warning('getCurrentUser() fehlgeschlagen', {
        error: authError instanceof Error ? authError.message : 'Unknown error',
      });
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

    const adminCheckGet = await checkUserAdminStatus(userId, authUser);
    if (!adminCheckGet) {
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

    return NextResponse.json({
      id: material.id,
      identifier: material.identifier,
      title: material.title,
      createdAt: material.createdAt.toISOString(),
      updatedAt: material.updatedAt.toISOString(),
    });
  } catch (error) {
    serverInstance.error('Failed to get course material', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'internal_error', message: 'Fehler beim Abrufen des Materials' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/course-material/[id]
 * Update a course material
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  // Extract id before try block so it's available in catch for logging
  const { id } = await params;

  let userId: string | null = null;
  let authUser: User | null = null;
  try {
    try {
      authUser = await getCurrentUser();
      userId = authUser?.id ?? null;
    } catch (authError) {
      serverInstance.warning('getCurrentUser() fehlgeschlagen', {
        error: authError instanceof Error ? authError.message : 'Unknown error',
      });
      userId = null;
    }

    if (!userId) {
      return NextResponse.json(
        {
          error: 'unauthorized',
          message: 'Authentifizierung erforderlich',
        },
        { status: 401 }
      );
    }

    const adminCheck = await checkUserAdminStatus(userId, authUser);
    if (!adminCheck) {
      return NextResponse.json(
        { error: 'forbidden', message: 'Admin-Berechtigung erforderlich' },
        { status: 403 }
      );
    }

    const existingMaterial = await getMaterialById(id);

    if (!existingMaterial) {
      return NextResponse.json(
        { error: 'not_found', message: 'Material nicht gefunden' },
        { status: 404 }
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

    const parsed = courseMaterialUpdateSchema.safeParse(body);

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

    if (title !== undefined) updateData.title = title;

    // If identifier changes, we need to re-upload with new pathname
    const newIdentifier = identifier || existingMaterial.identifier;

    if (htmlContent !== undefined) {
      // Validate HTML content for security
      const htmlValidation = validateHtmlContent(htmlContent);
      if (!htmlValidation.safe) {
        logAuditEvent(
          'COURSE_MATERIAL_UPDATE',
          userId,
          id,
          'course-material',
          'failure',
          {
            error: `XSS validation failed: ${htmlValidation.errors.join(', ')}`,
          }
        );
        return NextResponse.json(
          {
            error: 'validation_error',
            message:
              'HTML-Validierung fehlgeschlagen. Bitte entferne unsichere Inhalte und versuche es erneut.',
          },
          { status: 400 }
        );
      }

      // Sanitize HTML
      const sanitizedHtml = sanitizeHtml(htmlContent);

      // Always delete old blob before uploading new content
      try {
        await del(existingMaterial.blobUrl);
      } catch (deleteError) {
        // Log but don't fail - blob might not exist
        serverInstance.warning('Failed to delete old blob during update', {
          blobUrl: existingMaterial.blobUrl,
          error:
            deleteError instanceof Error
              ? deleteError.message
              : 'Unknown error',
        });
      }

      // Upload new content
      const blobPathname = `course-material/${newIdentifier}.html`;
      let blob;
      try {
        blob = await put(blobPathname, sanitizedHtml, {
          access: 'public',
          contentType: 'text/html',
        });
      } catch (blobError) {
        logAuditEvent(
          'COURSE_MATERIAL_UPDATE',
          userId,
          id,
          'course-material',
          'failure',
          {
            error: `Blob upload failed: ${blobError instanceof Error ? blobError.message : 'Unknown error'}`,
          }
        );
        serverInstance.error('Blob upload failed during update', {
          identifier: newIdentifier,
          error:
            blobError instanceof Error ? blobError.message : 'Unknown error',
        });
        return NextResponse.json(
          {
            error: 'blob_error',
            message: 'Upload zu Blob-Storage fehlgeschlagen',
          },
          { status: 502 }
        );
      }

      updateData.blobUrl = blob.url;
      updateData.blobPathname = blob.pathname;
    }

    if (identifier !== undefined) {
      updateData.identifier = identifier;
    }

    // Validate that at least one field is being updated
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          error: 'validation_error',
          message: 'Mindestens ein Feld muss aktualisiert werden',
        },
        { status: 400 }
      );
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
    const auditUserId = userId ?? 'unknown';
    logAuditEvent(
      'COURSE_MATERIAL_UPDATE',
      auditUserId,
      id,
      'course-material',
      'failure',
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    );
    serverInstance.error('Failed to update course material', {
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
 * DELETE /api/admin/course-material/[id]
 * Delete a course material
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  // Extract id before try block so it's available in catch for logging
  const { id } = await params;

  let userId: string | null = null;
  let authUser: User | null = null;
  try {
    try {
      authUser = await getCurrentUser();
      userId = authUser?.id ?? null;
    } catch (authError) {
      serverInstance.warning('getCurrentUser() fehlgeschlagen', {
        error: authError instanceof Error ? authError.message : 'Unknown error',
      });
      userId = null;
    }

    if (!userId) {
      return NextResponse.json(
        {
          error: 'unauthorized',
          message: 'Authentifizierung erforderlich',
        },
        { status: 401 }
      );
    }

    const adminCheckDelete = await checkUserAdminStatus(userId, authUser);
    if (!adminCheckDelete) {
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

    // Log successful deletion
    logAuditEvent(
      'COURSE_MATERIAL_DELETE',
      userId,
      id,
      'course-material',
      'success',
      {
        details: {
          identifier: material.identifier,
          title: material.title,
        },
      }
    );

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const auditUserId = userId ?? 'unknown';
    logAuditEvent(
      'COURSE_MATERIAL_DELETE',
      auditUserId,
      id,
      'course-material',
      'failure',
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    );
    serverInstance.error('Failed to delete course material', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'internal_error', message: 'Fehler beim Löschen des Materials' },
      { status: 500 }
    );
  }
}
