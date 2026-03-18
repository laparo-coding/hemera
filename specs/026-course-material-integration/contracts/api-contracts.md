# API Contracts: Course Material Integration (026)

## GET /api/admin/course-material

### Response (200) — Extended

```json
{
  "materials": [
    {
      "id": "clxyz...",
      "identifier": "einfuehrung-chirurgie",
      "title": "Einführung Chirurgie",
      "type": "CONTENT",
      "createdAt": "2026-03-19T10:00:00.000Z",
      "updatedAt": "2026-03-19T10:00:00.000Z"
    },
    {
      "id": "clxyz...",
      "identifier": "modul-1-steuerung",
      "title": "Modul 1 – Steuerung",
      "type": "SLIDE_CONTROL",
      "createdAt": "2026-03-19T11:00:00.000Z",
      "updatedAt": "2026-03-19T11:00:00.000Z"
    }
  ]
}
```

**Change**: Each material object gains a `type` field (`"CONTENT"` | `"SLIDE_CONTROL"`).

---

## GET /api/admin/course-material/[id]

### Response (200) — Extended

```json
{
  "id": "clxyz...",
  "identifier": "modul-1-steuerung",
  "title": "Modul 1 – Steuerung",
  "type": "SLIDE_CONTROL",
  "blobUrl": "https://....public.blob.vercel-storage.com/course-material/slides/modul-1-steuerung.html",
  "blobPathname": "course-material/slides/modul-1-steuerung.html",
  "createdAt": "2026-03-19T11:00:00.000Z",
  "updatedAt": "2026-03-19T11:00:00.000Z"
}
```

**Change**: Adds `type`, `blobUrl`, and `blobPathname` fields to single-material response (needed
for edit page to detect type and show download link).

---

## POST /api/admin/course-material

### Variant A: CONTENT (existing, unchanged)

**Content-Type**: `application/json`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | Yes | Material title (1–200 chars) |
| identifier | string | No | URL-safe slug; auto-generated from title if omitted |
| htmlContent | string | Yes | HTML content, max 2 MB |
| type | string | No | Defaults to `"CONTENT"` |

```json
{
  "title": "Einführung Chirurgie",
  "identifier": "einfuehrung-chirurgie",
  "htmlContent": "<h1>Einführung</h1><p>...</p>"
}
```

**Response (201)**: Same as before + `type: "CONTENT"`.

### Variant B: SLIDE_CONTROL (new)

**Content-Type**: `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | Yes | Material title (1–200 chars) |
| identifier | string | No | URL-safe slug; auto-generated from title if omitted |
| file | File | Yes | HTML file, `.html` extension, ≤ 20 MB |

**Response (201)**:

```json
{
  "id": "clxyz...",
  "identifier": "modul-1-steuerung",
  "title": "Modul 1 – Steuerung",
  "type": "SLIDE_CONTROL",
  "blobUrl": "https://....public.blob.vercel-storage.com/course-material/slides/modul-1-steuerung.html",
  "blobPathname": "course-material/slides/modul-1-steuerung.html",
  "createdAt": "2026-03-19T11:00:00.000Z",
  "updatedAt": "2026-03-19T11:00:00.000Z"
}
```

### Error Responses (both variants)

| Status | Error Code | Message |
|--------|------------|---------|
| 400 | `validation_error` | `Ungültiges JSON-Format` / `Ungültige Eingabe` / `Nur .html-Dateien sind erlaubt` / `Datei darf maximal 20 MB groß sein` |
| 401 | `unauthorized` | `Authentifizierung erforderlich` |
| 409 | `conflict` | `Identifier "{identifier}" ist bereits vergeben` |
| 502 | `blob_error` | `Upload zu Blob-Storage fehlgeschlagen` |
| 500 | `internal_error` | `Fehler beim Erstellen des Materials` |

---

## PUT /api/admin/course-material/[id]

### Variant A: CONTENT (existing, unchanged)

**Content-Type**: `application/json`

```json
{
  "title": "Einführung Chirurgie v2",
  "htmlContent": "<h1>Einführung v2</h1>"
}
```

### Variant B: SLIDE_CONTROL (new)

**Content-Type**: `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | No | Updated title |
| identifier | string | No | Updated identifier |
| file | File | No | Replacement HTML file; if omitted, only metadata updates |

**Response (200)**: Full material object with `type`.

### Error Responses (PUT)

| Status | Error Code | Message |
|--------|------------|--------|
| 400 | `validation_error` | `Materialtyp stimmt nicht mit der Anfrage überein` / `Ungültige Eingabe` |
| 401 | `unauthorized` | `Authentifizierung erforderlich` |
| 404 | `not_found` | `Material nicht gefunden` |
| 409 | `conflict` | `Identifier "{identifier}" ist bereits vergeben` |
| 502 | `blob_error` | `Upload zu Blob-Storage fehlgeschlagen` |
| 500 | `internal_error` | `Fehler beim Aktualisieren des Materials` |

### Error: Type Mismatch

If the request sends `multipart/form-data` to a CONTENT material (or JSON with `htmlContent` to a
SLIDE_CONTROL material), the server returns:

```json
{ "error": "validation_error", "message": "Materialtyp stimmt nicht mit der Anfrage überein" }
```

Status: 400

---

## DELETE /api/admin/course-material/[id]

No changes to the interface. Works identically for both types:
- **CONTENT**: Deletes blob at `course-material/{identifier}.html` + DB record
- **SLIDE_CONTROL**: Deletes blob at `course-material/slides/{identifier}.html` + DB record
- If `blobUrl` is null/empty, blob deletion is skipped (guard added in 026)
