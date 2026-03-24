import { del, put } from '@vercel/blob';
import { type NextRequest, NextResponse } from 'next/server';

import {
  deleteMaterial,
  getMaterialById,
  isIdentifierTaken,
  updateMaterial,
} from '@/lib/api/course-material';
import { requireAdminUser } from '@/lib/auth/helpers';
import { serverInstance } from '@/lib/monitoring/rollbar-official';
import {
  ALLOWED_FILE_EXTENSIONS,
  courseMaterialUpdateSchema,
  MAX_FILE_SIZE,
} from '@/lib/schemas/admin/course-material';
import { logAuditEvent } from '@/lib/utils/audit-logging';
import { sanitizeHtml, validateHtmlContent } from '@/lib/utils/html-sanitizer';
import {
  sanitizeAuditLogDetails,
  sanitizeBlobUrlField,
} from '@/lib/utils/log-sanitizer';

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/admin/course-material/[id]
 * Get a single course material
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAdminUser();
    if (!auth.authorized) return auth.response;

    const { id } = await params;

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
      type: material.type,
      blobUrl: material.blobUrl,
      blobPathname: material.blobPathname,
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
 * Supports JSON (CONTENT type) and FormData (SLIDE_CONTROL type)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  // Extract id before try block so it's available in catch for logging
  const { id } = await params;

  let userId: string | null = null;
  try {
    const auth = await requireAdminUser();
    if (!auth.authorized) return auth.response;
    userId = auth.userId;

    const existingMaterial = await getMaterialById(id);

    if (!existingMaterial) {
      return NextResponse.json(
        { error: 'not_found', message: 'Material nicht gefunden' },
        { status: 404 }
      );
    }

    const contentType = request.headers.get('content-type') || '';
    const mediaType = (contentType.split(';')[0] ?? '').trim().toLowerCase();
    const isFormData = mediaType === 'multipart/form-data';

    // Type mismatch guard
    if (isFormData && existingMaterial.type === 'CONTENT') {
      return NextResponse.json(
        {
          error: 'type_mismatch',
          message: 'Materialtyp stimmt nicht mit der Anfrage überein',
        },
        { status: 400 }
      );
    }

    if (isFormData) {
      return await handleFormDataPut(request, id, existingMaterial, userId);
    }
    return await handleJsonPut(request, id, existingMaterial, userId);
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
 * Handle FormData PUT for SLIDE_CONTROL materials
 */
async function handleFormDataPut(
  request: NextRequest,
  id: string,
  existingMaterial: NonNullable<Awaited<ReturnType<typeof getMaterialById>>>,
  userId: string | null
) {
  const formData = await request.formData();
  const titleValue = formData.get('title');
  const identifierValue = formData.get('identifier');
  const fileValue = formData.get('file');

  // Validate types at runtime
  const title =
    titleValue !== null && typeof titleValue === 'string' ? titleValue : null;
  const identifierField =
    identifierValue !== null && typeof identifierValue === 'string'
      ? identifierValue
      : null;
  const file =
    fileValue !== null && fileValue instanceof File ? fileValue : null;

  const updateData: {
    title?: string;
    identifier?: string;
    blobUrl?: string;
    blobPathname?: string;
  } = {};

  if (title !== undefined && title !== null) {
    if (title.trim().length === 0 || title.length > 200) {
      return NextResponse.json(
        {
          error: 'validation_error',
          message: 'Titel muss zwischen 1 und 200 Zeichen lang sein',
        },
        { status: 400 }
      );
    }
    updateData.title = title;
  }

  // Handle identifier change
  const newIdentifier = identifierField || existingMaterial.identifier;
  if (identifierField && identifierField !== existingMaterial.identifier) {
    if (await isIdentifierTaken(identifierField, id)) {
      return NextResponse.json(
        {
          error: 'conflict',
          message: `Identifier "${identifierField}" ist bereits vergeben`,
        },
        { status: 409 }
      );
    }
    updateData.identifier = identifierField;
  }

  // Handle file upload replacement
  if (file && file.size > 0) {
    const hasValidExtension = ALLOWED_FILE_EXTENSIONS.some(ext =>
      file.name.toLowerCase().endsWith(ext)
    );
    if (!hasValidExtension) {
      return NextResponse.json(
        {
          error: 'validation_error',
          message: 'Nur .html-Dateien sind erlaubt',
        },
        { status: 400 }
      );
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: 'validation_error',
          message: `Datei darf maximal ${MAX_FILE_SIZE / 1024 / 1024} MB groß sein`,
        },
        { status: 400 }
      );
    }

    const fileContent = await file.text();

    // SLIDE_CONTROL: store as-is — admin-uploaded, intentional scripts/event
    // handlers allowed, origin-isolated via Vercel Blob separate domain
    const blobPathname = `course-material/slides/${newIdentifier}.html`;

    let blob;
    try {
      blob = await put(blobPathname, fileContent, {
        access: 'public',
        contentType: 'text/html',
        allowOverwrite: true,
      });
    } catch (blobError) {
      serverInstance.error('Blob upload failed during SLIDE_CONTROL update', {
        identifier: newIdentifier,
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

    // Delete old blob if URL changed
    if (
      existingMaterial.blobUrl !== blob.url &&
      existingMaterial.blobPathname
    ) {
      try {
        await del(existingMaterial.blobPathname);
      } catch (deleteError) {
        const blobIdentifier = sanitizeBlobUrlField(existingMaterial.blobUrl);
        serverInstance.warning('Failed to delete old blob during update', {
          ...(blobIdentifier || {}),
          error:
            deleteError instanceof Error
              ? deleteError.message
              : 'Unknown error',
        });
      }
    }

    updateData.blobUrl = blob.url;
    updateData.blobPathname = blob.pathname;
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

  logAuditEvent(
    'COURSE_MATERIAL_UPDATE',
    userId ?? 'unknown',
    id,
    'course-material',
    'success',
    {
      details: sanitizeAuditLogDetails({
        ...updateData,
        type: existingMaterial.type,
      }),
    }
  );

  return NextResponse.json({
    id: material.id,
    identifier: material.identifier,
    title: material.title,
    type: existingMaterial.type,
    blobUrl: material.blobUrl,
    blobPathname: material.blobPathname,
    createdAt: material.createdAt.toISOString(),
    updatedAt: material.updatedAt.toISOString(),
  });
}

/**
 * Handle JSON PUT for CONTENT materials (existing flow with type guard)
 */
async function handleJsonPut(
  request: NextRequest,
  id: string,
  existingMaterial: NonNullable<Awaited<ReturnType<typeof getMaterialById>>>,
  userId: string | null
) {
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

  // Type mismatch: JSON + htmlContent for SLIDE_CONTROL material
  if (htmlContent !== undefined && existingMaterial.type === 'SLIDE_CONTROL') {
    return NextResponse.json(
      {
        error: 'type_mismatch',
        message: 'Materialtyp stimmt nicht mit der Anfrage überein',
      },
      { status: 400 }
    );
  }

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
        userId ?? 'unknown',
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

    // Sanitize HTML to remove potentially dangerous content (CONTENT type)
    const sanitizedHtml = sanitizeHtml(htmlContent);

    // Upload new content first, then delete old blob (prevents data loss on upload failure)
    const blobPathname = `course-material/${newIdentifier}.html`;
    let blob;
    try {
      blob = await put(blobPathname, sanitizedHtml, {
        access: 'public',
        contentType: 'text/html',
        allowOverwrite: true,
      });
    } catch (blobError) {
      const blobErrorMessage =
        blobError instanceof Error ? blobError.message : 'Unknown error';
      logAuditEvent(
        'COURSE_MATERIAL_UPDATE',
        userId ?? 'unknown',
        id,
        'course-material',
        'failure',
        {
          error: `Blob upload failed: ${blobErrorMessage}`,
        }
      );
      serverInstance.error('Blob upload failed during update', {
        identifier: newIdentifier,
        blobPathname,
        contentLength: sanitizedHtml.length,
        error: blobErrorMessage,
      });
      return NextResponse.json(
        {
          error: 'blob_error',
          message: 'Upload zu Blob-Storage fehlgeschlagen',
        },
        { status: 502 }
      );
    }

    // Delete old blob only if the URL changed (different identifier → different pathname).
    // With allowOverwrite the new upload replaces the old content at the same URL,
    // so deleting it would destroy the just-uploaded file.
    if (
      existingMaterial.blobUrl !== blob.url &&
      existingMaterial.blobPathname
    ) {
      try {
        await del(existingMaterial.blobPathname);
      } catch (deleteError) {
        // Log but don't fail - old blob will be orphaned but new content is safe
        const blobIdentifier = sanitizeBlobUrlField(existingMaterial.blobUrl);
        serverInstance.warning('Failed to delete old blob during update', {
          ...(blobIdentifier ?? {}),
          error:
            deleteError instanceof Error
              ? deleteError.message
              : 'Unknown error',
        });
      }
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

  logAuditEvent(
    'COURSE_MATERIAL_UPDATE',
    userId ?? 'unknown',
    id,
    'course-material',
    'success',
    {
      details: sanitizeAuditLogDetails({
        ...updateData,
        type: existingMaterial.type,
      }),
    }
  );

  return NextResponse.json({
    id: material.id,
    identifier: material.identifier,
    title: material.title,
    type: existingMaterial.type,
    blobUrl: material.blobUrl,
    blobPathname: material.blobPathname,
    createdAt: material.createdAt.toISOString(),
    updatedAt: material.updatedAt.toISOString(),
  });
}

/**
 * DELETE /api/admin/course-material/[id]
 * Delete a course material
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  // Extract id before try block so it's available in catch for logging
  const { id } = await params;

  let userId: string | null = null;
  try {
    const auth = await requireAdminUser();
    if (!auth.authorized) return auth.response;
    userId = auth.userId;

    const material = await getMaterialById(id);

    if (!material) {
      return NextResponse.json(
        { error: 'not_found', message: 'Material nicht gefunden' },
        { status: 404 }
      );
    }

    // Delete blob file
    const blobTarget = material.blobPathname || material.blobUrl;
    if (blobTarget) {
      try {
        await del(blobTarget);
      } catch {
        // Log but continue with DB deletion
        const blobIdentifier = sanitizeBlobUrlField(material.blobUrl);
        serverInstance.warning('Failed to delete blob file', {
          ...(blobIdentifier ?? {}),
        });
      }
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
