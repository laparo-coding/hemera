import { del, put } from '@vercel/blob';
import { type NextRequest, NextResponse } from 'next/server';

import {
  createMaterial,
  getAllMaterials,
  isIdentifierTaken,
} from '@/lib/api/course-material';
import { requireAdminUser } from '@/lib/auth/helpers';
import { serverInstance } from '@/lib/monitoring/rollbar-official';
import {
  ALLOWED_FILE_EXTENSIONS,
  courseMaterialCreateSchema,
  generateSlug,
  MAX_FILE_SIZE,
} from '@/lib/schemas/admin/course-material';
import { logAuditEvent } from '@/lib/utils/audit-logging';
import { sanitizeHtml, validateHtmlContent } from '@/lib/utils/html-sanitizer';
import { sanitizeBlobUrlField } from '@/lib/utils/log-sanitizer';

/**
 * Validate and resolve identifier: generate if not provided, check length, check uniqueness
 * Returns the validated identifier or a NextResponse error
 */
async function validateAndResolveIdentifier(
  providedIdentifier: string | null,
  title: string,
  excludeId?: string
): Promise<{ identifier: string } | NextResponse> {
  const identifier = providedIdentifier || generateSlug(title);

  // Validate identifier is not empty
  if (!identifier || identifier.length < 2) {
    return NextResponse.json(
      {
        error: 'validation_error',
        message:
          'Der generierte Identifier ist ungültig. Bitte einen Identifier manuell angeben.',
      },
      { status: 400 }
    );
  }

  // Check identifier uniqueness
  if (await isIdentifierTaken(identifier, excludeId)) {
    return NextResponse.json(
      {
        error: 'conflict',
        message: `Identifier "${identifier}" ist bereits vergeben`,
      },
      { status: 409 }
    );
  }

  return { identifier };
}

/**
 * GET /api/admin/course-material
 * List all course materials
 */
export async function GET() {
  try {
    const auth = await requireAdminUser();
    if (!auth.authorized) return auth.response;

    const materials = await getAllMaterials();

    return NextResponse.json({
      materials: materials.map(m => ({
        id: m.id,
        identifier: m.identifier,
        title: m.title,
        type: m.type,
        blobUrl: m.blobUrl,
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    serverInstance.error('Failed to list course materials', {
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
 * POST /api/admin/course-material
 * Create a new course material
 * Supports JSON (CONTENT type) and FormData (SLIDE_CONTROL type)
 */
export async function POST(request: NextRequest) {
  let userId: string | null = null;
  try {
    const auth = await requireAdminUser();
    if (!auth.authorized) return auth.response;
    userId = auth.userId;

    const contentType = request.headers.get('content-type') || '';
    const mediaType = (contentType.split(';')[0] ?? '').trim().toLowerCase();
    const isFormData = mediaType === 'multipart/form-data';

    if (isFormData) {
      return await handleFormDataPost(request, userId);
    }
    return await handleJsonPost(request, userId);
  } catch (error) {
    const auditUserId = userId ?? 'unknown';
    logAuditEvent(
      'COURSE_MATERIAL_CREATE',
      auditUserId,
      undefined,
      'course-material',
      'failure',
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    );
    serverInstance.error('Failed to create course material', {
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

/**
 * Handle FormData POST for SLIDE_CONTROL materials
 */
async function handleFormDataPost(request: NextRequest, userId: string | null) {
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

  // Validate title
  if (!title || title.trim().length === 0) {
    return NextResponse.json(
      { error: 'validation_error', message: 'Titel ist erforderlich' },
      { status: 400 }
    );
  }
  if (title.length > 200) {
    return NextResponse.json(
      {
        error: 'validation_error',
        message: 'Titel darf maximal 200 Zeichen lang sein',
      },
      { status: 400 }
    );
  }

  // Validate file presence and properties
  if (!file || file.size === 0) {
    return NextResponse.json(
      {
        error: 'validation_error',
        message: 'Eine .html-Datei ist erforderlich',
      },
      { status: 400 }
    );
  }

  const hasValidExtension = ALLOWED_FILE_EXTENSIONS.some(ext =>
    file.name.toLowerCase().endsWith(ext)
  );
  if (!hasValidExtension) {
    return NextResponse.json(
      { error: 'validation_error', message: 'Nur .html-Dateien sind erlaubt' },
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

  // Generate or use provided identifier
  const identifierResult = await validateAndResolveIdentifier(
    identifierField,
    title
  );

  // Check if result is a NextResponse error
  if (identifierResult instanceof NextResponse) {
    return identifierResult;
  }

  const { identifier } = identifierResult;

  // Read file content
  const fileContent = await file.text();

  // SLIDE_CONTROL: store as-is — admin-uploaded, intentional scripts/event
  // handlers allowed, origin-isolated via Vercel Blob separate domain

  // Upload to Vercel Blob under slides/ subdirectory
  const blobPathname = `course-material/slides/${identifier}.html`;
  let blob;
  try {
    blob = await put(blobPathname, fileContent, {
      access: 'public',
      contentType: 'text/html',
    });
  } catch (blobError) {
    logAuditEvent(
      'COURSE_MATERIAL_CREATE',
      userId ?? 'unknown',
      identifier,
      'course-material',
      'failure',
      {
        error: `Blob upload failed: ${blobError instanceof Error ? blobError.message : 'Unknown error'}`,
      }
    );
    serverInstance.error('Blob upload failed for SLIDE_CONTROL', {
      identifier,
      error: blobError instanceof Error ? blobError.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'blob_error', message: 'Upload zu Blob-Storage fehlgeschlagen' },
      { status: 502 }
    );
  }

  // Create database record with type SLIDE_CONTROL
  let material;
  try {
    material = await createMaterial({
      identifier,
      title,
      type: 'SLIDE_CONTROL',
      blobUrl: blob.url,
      blobPathname: blob.pathname,
    });
  } catch (dbError) {
    // Delete the uploaded blob since DB write failed
    if (blob.pathname) {
      try {
        await del(blob.pathname);
      } catch (deleteError) {
        const blobIdentifier = sanitizeBlobUrlField(blob.url);
        serverInstance.error('Failed to delete orphaned blob after DB error', {
          ...blobIdentifier,
          error:
            deleteError instanceof Error
              ? deleteError.message
              : 'Unknown error',
        });
      }
    }
    // Log the DB error
    logAuditEvent(
      'COURSE_MATERIAL_CREATE',
      userId ?? 'unknown',
      identifier,
      'course-material',
      'failure',
      {
        error: `Database error: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`,
      }
    );
    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'Fehler beim Speichern des Materials',
      },
      { status: 500 }
    );
  }

  logAuditEvent(
    'COURSE_MATERIAL_CREATE',
    userId ?? 'unknown',
    material.id,
    'course-material',
    'success',
    { details: { identifier, title, type: 'SLIDE_CONTROL' } }
  );

  return NextResponse.json(
    {
      id: material.id,
      identifier: material.identifier,
      title: material.title,
      type: material.type,
      blobUrl: material.blobUrl,
      blobPathname: material.blobPathname,
      createdAt: material.createdAt.toISOString(),
      updatedAt: material.updatedAt.toISOString(),
    },
    { status: 201 }
  );
}

/**
 * Handle JSON POST for CONTENT materials (existing flow)
 */
async function handleJsonPost(request: NextRequest, userId: string | null) {
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

  const parsed = courseMaterialCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'validation_error',
        message: parsed.error.issues[0]?.message || 'Ungültige Eingabe',
      },
      { status: 400 }
    );
  }

  const {
    title,
    identifier: providedIdentifier,
    htmlContent,
    type,
  } = parsed.data;

  // JSON POST only supports CONTENT type; SLIDE_CONTROL requires FormData
  if (type && type !== 'CONTENT') {
    return NextResponse.json(
      {
        error: 'validation_error',
        message:
          'SLIDE_CONTROL-Materialien müssen als FormData hochgeladen werden',
      },
      { status: 400 }
    );
  }

  // CONTENT type requires htmlContent
  if (!htmlContent) {
    return NextResponse.json(
      {
        error: 'validation_error',
        message: 'HTML-Inhalt ist erforderlich für CONTENT-Materialien',
      },
      { status: 400 }
    );
  }

  // Validate HTML content for security
  const htmlValidation = validateHtmlContent(htmlContent);
  if (!htmlValidation.safe) {
    logAuditEvent(
      'COURSE_MATERIAL_CREATE',
      userId ?? 'unknown',
      undefined,
      'course-material',
      'failure',
      { error: `XSS validation failed: ${htmlValidation.errors.join(', ')}` }
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

  // Sanitize HTML to remove any potentially dangerous content
  const sanitizedHtml = sanitizeHtml(htmlContent);

  // Generate or use provided identifier
  const identifierResult = await validateAndResolveIdentifier(
    providedIdentifier || null,
    title
  );

  // Check if result is a NextResponse error
  if (identifierResult instanceof NextResponse) {
    return identifierResult;
  }

  const { identifier } = identifierResult;

  // Upload HTML to Vercel Blob
  const blobPathname = `course-material/${identifier}.html`;
  let blob;
  try {
    blob = await put(blobPathname, sanitizedHtml, {
      access: 'public',
      contentType: 'text/html',
    });
  } catch (blobError) {
    logAuditEvent(
      'COURSE_MATERIAL_CREATE',
      userId ?? 'unknown',
      identifier,
      'course-material',
      'failure',
      {
        error: `Blob upload failed: ${blobError instanceof Error ? blobError.message : 'Unknown error'}`,
      }
    );
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
  let material;
  try {
    material = await createMaterial({
      identifier,
      title,
      type: 'CONTENT',
      blobUrl: blob.url,
      blobPathname: blob.pathname,
    });
  } catch (dbError) {
    // Delete the uploaded blob since DB write failed
    if (blob.pathname) {
      try {
        await del(blob.pathname);
      } catch (deleteError) {
        const blobIdentifier = sanitizeBlobUrlField(blob.url);
        serverInstance.error('Failed to delete orphaned blob after DB error', {
          ...blobIdentifier,
          error:
            deleteError instanceof Error
              ? deleteError.message
              : 'Unknown error',
        });
      }
    }
    // Log the DB error
    logAuditEvent(
      'COURSE_MATERIAL_CREATE',
      userId ?? 'unknown',
      identifier,
      'course-material',
      'failure',
      {
        error: `Database error: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`,
      }
    );
    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'Fehler beim Speichern des Materials',
      },
      { status: 500 }
    );
  }

  logAuditEvent(
    'COURSE_MATERIAL_CREATE',
    userId ?? 'unknown',
    material.id,
    'course-material',
    'success',
    { details: { identifier, title, type: 'CONTENT' } }
  );

  return NextResponse.json(
    {
      id: material.id,
      identifier: material.identifier,
      title: material.title,
      type: material.type,
      blobUrl: material.blobUrl,
      blobPathname: material.blobPathname,
      createdAt: material.createdAt.toISOString(),
      updatedAt: material.updatedAt.toISOString(),
    },
    { status: 201 }
  );
}
