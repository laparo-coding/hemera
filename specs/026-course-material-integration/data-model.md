# Data Model: Course Material Integration (026)

## Entity Changes

### `CourseMaterial` — Extended

| Field | Type | Default | Constraint | Map | Notes |
|-------|------|---------|------------|-----|-------|
| id | String | `cuid()` | `@id` | — | Existing |
| identifier | String | — | `@unique` | — | Existing |
| title | String | — | — | — | Existing |
| **type** | **String** | **`"CONTENT"`** | — | **`@map("type")`** | **NEW** — `"CONTENT"` or `"SLIDE_CONTROL"` |
| blobUrl | String | — | — | `@map("blob_url")` | Existing |
| blobPathname | String | — | — | `@map("blob_pathname")` | Existing |
| createdAt | DateTime | `now()` | — | `@map("created_at")` | Existing |
| updatedAt | DateTime | `@updatedAt` | — | `@map("updated_at")` | Existing |

**Table**: `seminar_materials` (unchanged `@@map`)

### Prisma Schema Addition

```prisma
model CourseMaterial {
  id           String   @id @default(cuid())
  identifier   String   @unique
  title        String
  type         String   @default("CONTENT") @map("type")
  blobUrl      String   @map("blob_url")
  blobPathname String   @map("blob_pathname")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  curriculumLinks CurriculumTopicMaterial[]

  @@map("seminar_materials")
}
```

### Migration

- Migration name: `add_material_type`
- SQL: `ALTER TABLE seminar_materials ADD COLUMN "type" TEXT NOT NULL DEFAULT 'CONTENT';`
- All existing rows receive `'CONTENT'` automatically.
- No data migration or backfill script needed.

## Validation Rules

### Type Field

- Allowed values: `"CONTENT"`, `"SLIDE_CONTROL"`
- Set at creation time, immutable after.
- Default: `"CONTENT"` (backward compatible).

### File Upload (SLIDE_CONTROL only)

- File extension: `.html` (case-insensitive)
- MIME type: must start with `text/html` (accepts charset parameters like `text/html; charset=utf-8`)
- Max file size: 20 MB (20,971,520 bytes)
- No HTML sanitization applied (stored as-is).

> **Future consideration**: Migrate `type` from `String` to a Prisma `enum CourseMaterialType { CONTENT SLIDE_CONTROL }` for stricter database-level validation. This requires a Prisma migration.

> **Security note**: SLIDE_CONTROL files are admin-uploaded and may contain `<script>` tags for slide control logic. They are served from Vercel Blob (separate origin), limiting XSS risk to the blob domain.

### Blob Storage Pathnames

| Type | Pattern | Example |
|------|---------|---------|
| CONTENT | `course-material/{identifier}.html` | `course-material/einfuehrung-chirurgie.html` |
| SLIDE_CONTROL | `course-material/slides/{identifier}.html` | `course-material/slides/modul-1-steuerung.html` |

## State Transitions

```
CourseMaterial lifecycle:
  CREATE → type locked (CONTENT or SLIDE_CONTROL)
  UPDATE → title, identifier, blob content can change; type CANNOT change
  DELETE → blob deleted, DB record removed
```

## Relationships

No new relationships. Existing `CurriculumTopicMaterial` join table works for both material types
without changes.
