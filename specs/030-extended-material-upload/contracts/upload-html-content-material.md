# API Contract: Upload HTML Content Material

**Feature**: 030-extended-material-upload  
**Endpoint**: `POST /api/admin/course-material`  
**Purpose**: Create course material from uploaded HTML file  
**Version**: 1.0  

## Request

### Method & Path
```
POST /api/admin/course-material
```

### Authentication
- **Required**: Clerk auth token (cookie or header)
- **Role**: Admin required (Clerk custom claim)
- **Failure**: 401 Unauthorized if unauthenticated; 403 Forbidden if not admin

### Headers
```
Content-Type: multipart/form-data
Authorization: Bearer {clerk_token}  [implicit via cookie; optional explicit header]
```

### Request Body (FormData)

| Field | Type | Required | Constraints | Example |
|-------|------|----------|-------------|---------|
| `title` | String | Yes | 1-255 characters | "Advanced CSS Patterns" |
| `identifier` | String | No | alphanumeric + dashes; auto-generated if omitted | "advanced-css-2024" |
| `file` | File | Yes | .html extension; Content-Type text/html; ≤ 20 MB | `File(advanced-css.html)` |

### Example Request (cURL)

```bash
curl -X POST http://localhost:3000/api/admin/course-material \
  -H "Cookie: __session={clerk_token}" \
  -F "title=Advanced CSS Patterns" \
  -F "file=@tests/fixtures/advanced-css.html"
```

---

## Response

### Success (201 Created)

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "courseId": "550e8400-e29b-41d4-a716-446655440001",
    "title": "Advanced CSS Patterns",
    "identifier": "advanced-css-2024",
    "type": "CONTENT",
    "blobUrl": "https://my-vercel-blob.com/course-material/content/advanced-css-2024.html",
    "blobPathname": "course-material/content/advanced-css-2024.html",
    "createdAt": "2026-07-07T10:30:00Z",
    "updatedAt": "2026-07-07T10:30:00Z"
  }
}
```

**Status**: 201 Created

### Error: Invalid File Type (400 Bad Request)

```json
{
  "success": false,
  "error": {
    "code": "INVALID_FILE_TYPE",
    "message": "Nur .html Dateien werden unterstützt"
  }
}
```

**Status**: 400 Bad Request  
**Trigger**: File is not `.html` or Content-Type is not `text/html`

### Error: File Too Large (400 Bad Request)

```json
{
  "success": false,
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "Datei zu groß (max. 20 MB)"
  }
}
```

**Status**: 400 Bad Request  
**Trigger**: File size exceeds 20 MB

### Error: Missing Required Field (400 Bad Request)

```json
{
  "success": false,
  "error": {
    "code": "MISSING_FIELD",
    "message": "Titel erforderlich"
  }
}
```

**Status**: 400 Bad Request  
**Trigger**: `title` field missing or empty

### Error: Unauthorized (401 Unauthorized)

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentifizierung erforderlich"
  }
}
```

**Status**: 401 Unauthorized  
**Trigger**: No valid Clerk token provided

### Error: Forbidden - Not Admin (403 Forbidden)

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Administratorrechte erforderlich"
  }
}
```

**Status**: 403 Forbidden  
**Trigger**: User authenticated but not admin role

### Error: Blob Storage Failure (502 Bad Gateway)

```json
{
  "success": false,
  "error": {
    "code": "STORAGE_ERROR",
    "message": "Upload fehlgeschlagen. Bitte versuchen Sie es später erneut."
  }
}
```

**Status**: 502 Bad Gateway  
**Trigger**: Vercel Blob API failure  
**Server Logging**: Redacted metadata only (identifier, materialType, sanitized error message); request ID correlated. No raw API response bodies or sensitive details logged.

---

## Implementation Patterns

### File Validation

```typescript
// Server-side validation (required)
1. Check file extension: .html
2. Check Content-Type header: text/html
3. Check file size: ≤ 20 MB
4. Parse HTML to ensure it's valid (optional but recommended)
```

### Storage Path

```typescript
// Blob pathname format
const pathname = `course-material/content/${identifier}.html`;
const publicUrl = await vercelBlob.put(pathname, file, { access: 'public' });
```

### Database Storage

```typescript
// Prisma insert
const material = await prisma.courseMaterial.create({
  data: {
    courseId,
    title,
    identifier,
    type: 'CONTENT',           // Always CONTENT for uploads
    blobPathname: pathname,
    blobUrl: publicUrl,
    htmlContent: null,         // No inline HTML for uploads
  },
});
```

### Error Handling

```typescript
// Client receives generic message
// Server logs redacted metadata only
if (blobError) {
  // Server-side log (redacted)
  logger.error('Blob upload failed', {
    identifier,
    materialType,
    error: sanitizeBlobUrlField(blobError.message),
    requestId,
  });
  
  // Client response
  throw new HttpError(502, 'Upload fehlgeschlagen. Bitte versuchen Sie es später erneut.');
}
```

---

## Notes

- **Idempotency**: If request is retried with same `identifier`, the second attempt should fail (duplicate identifier) or update the existing material (design choice — recommend reject to prevent accidental overwrites).
- **Async**: Upload should complete synchronously (< 5 seconds for 20 MB files on typical connection).
- **Logging**: All failures logged server-side with request ID for troubleshooting.
