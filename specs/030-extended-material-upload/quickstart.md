# Quickstart: Extended Material Upload (Feature 030)

## Integration Test Scenario: Admin Uploads HTML Course Material

This quickstart documents the happy-path integration test for Feature 030. It serves as:
1. **Acceptance criteria validation** — confirms the feature works as designed
2. **Setup reference** — how to create test data and run integration tests
3. **Documentation** — user story walkthrough

## Prerequisites

- Hemera local dev environment running (`npm run dev`)
- Admin user authenticated (Clerk test credentials)
- Course created in test database
- Test HTML file available: `tests/fixtures/advanced-css.html` (valid HTML, 5 MB)

## Test Scenario

### Setup

```bash
# 1. Start dev server
npm run dev

# 2. Login as admin
# Navigate to http://localhost:3000/auth (use Clerk test credentials)

# 3. Navigate to course material creation
# URL: http://localhost:3000/admin/course-material/new
```

### Test Steps

#### Step 1: Verify Material Type Selection Screen

**Action**: Navigate to `/admin/course-material/new`

**Expected**:
- Page displays title "Material anlegen"
- 3 tiles visible:
  - **Tile 1**: "Ich möchte eine Inhaltsseite hinzufügen." (top-left)
  - **Tile 2**: "Ich möchte eine Inhaltsseite anlegen." (top-right)
  - **Tile 3**: "Ich möchte eine Steuerdatei hinzufügen." (bottom)
- Tiles arranged in 2-1 grid layout
- All tiles use consistent icon style (upload icon from Feature 026)

#### Step 2: Click "Hochladen" Tile

**Action**: Click "Ich möchte eine Inhaltsseite hinzufügen"

**Expected**:
- Route to `/admin/course-material/new?type=upload`
- Form displays:
  - Title field (empty, required)
  - Identifier field (empty, optional)
  - Drag-and-drop zone with "Datei auswählen" button
  - Submit and Cancel buttons

#### Step 3: Fill Form and Select File

**Action**:
1. Enter title: "Advanced CSS Patterns"
2. Leave identifier empty (auto-generate)
3. Click drag-and-drop zone
4. Select `tests/fixtures/advanced-css.html`

**Expected**:
- File name "advanced-css.html" appears in drag-and-drop zone
- File size displayed: "5.0 MB"
- Submit button enabled

#### Step 4: Upload File

**Action**: Click "Speichern"

**Expected**:
- Upload progress indicator appears (animated)
- Upload completes within 5 seconds
- Success toast notification: "Material erfolgreich hochgeladen"
- Redirect to material list (`/admin/course-material`)

#### Step 5: Verify in List

**Action**: Observe material list page

**Expected**:
- New material "Advanced CSS Patterns" appears in list
- Type badge displays "Inhaltsseite" (MUI Chip)
- Created timestamp matches current time (within 1 minute)
- Material row is clickable (link to edit page)

#### Step 6: Verify File Storage

**Action**: Open browser DevTools → Network tab; click material edit link

**Expected** (in network tab):
- API call: `GET /api/admin/course-material/{id}/content`
- Response includes `blobUrl: "https://..."`
- Loading the blobUrl in a new tab renders the HTML page (text/html)

#### Step 7: Verify Existing Tile (Regression Test)

**Action**: Navigate back to `/admin/course-material/new`; click "Ich möchte eine Inhaltsseite anlegen"

**Expected**:
- SlideEditor opens (existing WYSIWYG editor from Feature 026)
- Form layout unchanged
- All existing functionality works (create/edit content)

---

## Test Data

### Fixture: `tests/fixtures/advanced-css.html`

```html
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <title>Advanced CSS Patterns</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #884143; }
    </style>
</head>
<body>
    <h1>Advanced CSS Patterns</h1>
    <p>Learn modern CSS techniques for responsive design.</p>
    <h2>Topics</h2>
    <ul>
        <li>Grid Layout</li>
        <li>Flexbox Mastery</li>
        <li>CSS Variables</li>
        <li>CSS Animation</li>
    </ul>
</body>
</html>
```

---

## Expected Outcomes

After completing all steps, Feature 030 is validated:

✅ Material type selection screen renders correctly  
✅ Upload tile routes to new upload form  
✅ Form accepts title + file input  
✅ File upload succeeds and completes < 5s  
✅ Material stored in database with correct metadata  
✅ File stored in Blob at `course-material/content/{identifier}.html`  
✅ Material list shows type badge "Inhaltsseite"  
✅ Edit page displays uploaded file  
✅ Existing "anlegen" tile works unchanged (regression test passed)  

---

## Error Scenarios (Not in Quickstart, but documented for E2E Tests)

| Scenario | Error Message | Recovery |
|----------|---------------|----------|
| Non-.html file selected | "Nur .html Dateien werden unterstützt" | Select valid .html file |
| File > 20 MB | "Datei zu groß (max. 20 MB)" | Select smaller file |
| Missing title | "Titel erforderlich" | Enter title |
| Network timeout | "Upload fehlgeschlagen. Bitte versuchen Sie es später erneut." | Retry upload |

---

## Running Quickstart via Test

```bash
# Run integration test (Vitest)
npm run test -- tests/integration/course-material-upload.spec.ts

# Run E2E test (Playwright)
npm run test:e2e -- tests/e2e/course-material-upload.spec.ts

# Run all tests for Feature 030
npm run test -- tests/contracts/upload-html-content-material.spec.ts tests/integration/course-material-upload.spec.ts
```
