import { del, put } from '@vercel/blob';
import { type NextRequest, NextResponse } from 'next/server';
import { handleServerError } from '@/lib/api/api-errors';
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
  identifierSchema,
  MAX_FILE_SIZE,
} from '@/lib/schemas/admin/course-material';
import { logAuditEvent } from '@/lib/utils/audit-logging';
import { sanitizeHtml, validateHtmlContent } from '@/lib/utils/html-sanitizer';
import { sanitizeBlobUrlField } from '@/lib/utils/log-sanitizer';
import { getOrCreateRequestId } from '@/lib/utils/request-id';

/**
 * Validate and resolve identifier: generate if not provided, check length, check uniqueness
 * Returns the validated identifier or a NextResponse error
 */
async function validateAndResolveIdentifier(
  providedIdentifier: string | null,
  title: string,
  excludeId?: string
): Promise<{ identifier: string } | NextResponse> {
  const rawIdentifier = providedIdentifier || generateSlug(title);

  // Normalize and validate identifier using schema (includes toLowerCase and regex checks)
  const validationResult = identifierSchema.safeParse(rawIdentifier);
  if (!validationResult.success) {
    return NextResponse.json(
      {
        error: 'validation_error',
        message:
          validationResult.error.issues[0]?.message ||
          'Der Identifier ist ungültig. Bitte einen gültigen Identifier angeben.',
      },
      { status: 400 }
    );
  }

  const identifier = validationResult.data;

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
export async function GET(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);

  try {
    const auth = await requireAdminUser(requestId);
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
    return handleServerError(
      error,
      'Failed to list course materials',
      requestId,
      'Fehler beim Abrufen der Materialien'
    );
  }
}

/**
 * POST /api/admin/course-material
 * Create a new course material
 * Supports JSON (CONTENT type) and FormData (SLIDE_CONTROL type)
 */
export async function POST(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);
  let userId: string | null = null;
  try {
    const auth = await requireAdminUser(requestId);
    if (!auth.authorized) return auth.response;
    userId = auth.userId;

    const contentType = request.headers.get('content-type') || '';
    const mediaType = (contentType.split(';')[0] ?? '').trim().toLowerCase();
    const isFormData = mediaType === 'multipart/form-data';

    if (isFormData) {
      return await handleFormDataPost(request, userId, requestId);
    }
    return await handleJsonPost(request, userId, requestId);
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
    return handleServerError(
      error,
      'Failed to create course material',
      requestId,
      'Fehler beim Erstellen des Materials'
    );
  }
}

/**
 * Handle FormData POST for SLIDE_CONTROL and CONTENT (upload) materials
 * Feature 030: Extended to support CONTENT type via FormData upload
 */
async function handleFormDataPost(
  request: NextRequest,
  userId: string | null,
  requestId: string
) {
  const formData = await request.formData();
  const titleValue = formData.get('title');
  const identifierValue = formData.get('identifier');
  const fileValue = formData.get('file');
  const typeValue = formData.get('type');

  // Determine material type: default SLIDE_CONTROL for backward compat;
  // CONTENT when explicitly specified (Feature 030 upload pathway)
  const materialType: 'CONTENT' | 'SLIDE_CONTROL' =
    typeValue === 'CONTENT' ? 'CONTENT' : 'SLIDE_CONTROL';

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

  // NOTE: We intentionally skip MIME-type (file.type) validation here.
  // The browser-supplied Content-Type is unreliable — legitimate .html files
  // are often sent as application/octet-stream, and attackers can spoof
  // text/html. Instead, we validate the actual file content below via
  // validateHtmlContent() for CONTENT uploads and a structural HTML check.

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

  // Basic content sniff: verify the file contains HTML structure.
  // Catches binary files disguised with a .html extension regardless of
  // what the browser reported as Content-Type.
  if (
    !/<!DOCTYPE\s+html/i.test(fileContent) &&
    !/<html[\s>]/i.test(fileContent)
  ) {
    return NextResponse.json(
      {
        error: 'validation_error',
        message: 'Datei enthält keine gültige HTML-Struktur',
      },
      { status: 400 }
    );
  }

  // For CONTENT uploads, apply the same XSS validation and sanitization
  // pipeline as handleJsonPost to maintain consistent security guarantees.
  // SLIDE_CONTROL files are stored as-is (admin-uploaded control files on
  // a separate blob path, origin-isolated via Vercel Blob separate domain).
  let contentToUpload = fileContent;
  if (materialType === 'CONTENT') {
    const htmlValidation = validateHtmlContent(fileContent);
    if (!htmlValidation.safe) {
      logAuditEvent(
        'COURSE_MATERIAL_CREATE',
        userId ?? 'unknown',
        identifier,
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
    contentToUpload = sanitizeHtml(fileContent);
  }

  // Determine Blob subdirectory based on material type:
  // - CONTENT (upload): course-material/content/{identifier}.html (Feature 030)
  // - SLIDE_CONTROL: course-material/slides/{identifier}.html (Feature 026)
  const blobSubdir = materialType === 'CONTENT' ? 'content' : 'slides';
  const blobPathname = `course-material/${blobSubdir}/${identifier}.html`;
  let blob;
  try {
    blob = await put(blobPathname, contentToUpload, {
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
    serverInstance.error('Blob upload failed for FormData material', {
      identifier,
      materialType,
      error: blobError instanceof Error ? blobError.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'blob_error', message: 'Upload zu Blob-Storage fehlgeschlagen' },
      { status: 502 }
    );
  }

  // Create database record with determined type
  let material;
  try {
    material = await createMaterial({
      identifier,
      title,
      type: materialType,
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
    return handleServerError(
      dbError,
      'Failed to persist material to DB',
      requestId,
      'Fehler beim Speichern des Materials'
    );
  }

  logAuditEvent(
    'COURSE_MATERIAL_CREATE',
    userId ?? 'unknown',
    material.id,
    'course-material',
    'success',
    { details: { identifier, title, type: materialType } }
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
async function handleJsonPost(
  request: NextRequest,
  userId: string | null,
  requestId: string
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
    return handleServerError(
      dbError,
      'Failed to persist material to DB',
      requestId,
      'Fehler beim Speichern des Materials'
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
