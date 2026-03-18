# Quickstart: Course Material Integration (026)

## Prerequisites

- Node.js 20+, npm
- PostgreSQL running (Docker or local)
- `.env.local` with valid `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`, Clerk keys

## 1. Apply Migration

```bash
npx prisma migrate dev --name add_material_type
npx prisma generate
```

Verify the `type` column exists:

```bash
npx prisma studio
# → Open seminar_materials table → Confirm "type" column with default "CONTENT"
```

## 2. Start Dev Server

```bash
npm run dev
```

## 3. Verify Existing Flow (CONTENT)

1. Navigate to `http://localhost:3000/admin/course-material/new`
2. **Expected**: Type selection screen with two cards:
   - (A) „Ich möchte eine Inhaltsseite anlegen."
   - (B) „Ich möchte eine Steuerdatei hinzufügen."
3. Click (A) → MaterialForm (SlideEditor) should render.
4. Enter title "Test Inhaltsseite", write some content, submit.
5. **Expected**: Redirect to list page. New material appears with chip „Inhaltsseite".

## 4. Verify New Flow (SLIDE_CONTROL)

1. Navigate to `/admin/course-material/new`
2. Click (B) → Upload form should render.
3. Enter title "Test Steuerdatei".
4. Drag an `.html` file into the upload zone (or click to browse).
5. Submit.
6. **Expected**: Redirect to list page. New material appears with chip „Steuerdatei".

## 5. Verify Edit Page

### CONTENT material
1. Click edit on the CONTENT material → SlideEditor loads with existing HTML.
2. Change title, submit → Updates correctly.

### SLIDE_CONTROL material
1. Click edit on the SLIDE_CONTROL material → Upload form loads.
2. Current file name and download link visible.
3. Upload a replacement `.html` file, submit → Old blob replaced, new URL stored.

## 6. Verify Constraints

- Try uploading a `.txt` file → **Expected**: Rejection with „Nur .html-Dateien sind erlaubt".
- Try uploading a 25 MB HTML file → **Expected**: Rejection with size error.
- On SLIDE_CONTROL edit page → type label visible, no option to switch to CONTENT.

## 7. Run Tests

```bash
npm run lint
npm run typecheck
npm run test
```

All must pass with no new warnings or errors.
