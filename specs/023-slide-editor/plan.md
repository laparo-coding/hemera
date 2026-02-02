# Implementation Plan: 023 Slide Editor - Seminarmaterial verwalten

**Branch**: `023-slide-editor` | **Date**: 2026-01-30 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/023-slide-editor/spec.md`

## Execution Flow (/plan command scope)

```
1. ✅ Load feature spec from Input path
2. ✅ Fill Technical Context
3. ✅ Fill Constitution Check section
4. ✅ Evaluate Constitution Check - PASS
5. ✅ Execute Phase 0 → research.md
6. ✅ Execute Phase 1 → contracts, data-model.md, quickstart.md, agent file update
7. ✅ Re-evaluate Constitution Check - PASS
8. ✅ Plan Phase 2 → Describe task generation approach
9. STOP - Ready for /tasks command
```

## Summary

Erstelle ein WYSIWYG-Modul zur Gestaltung von HTML-Seiten (Seminarmaterial/Slides) im Admin-Panel. Das Modul nutzt **Tiptap** als Rich-Text-Editor und speichert HTML-Dateien/Bilder in **Vercel Blob** (da Vercel kein persistentes Dateisystem hat). Curriculum-Einträge können über `materialId` mit spezifischem Seminarmaterial verknüpft werden.

**Kernfunktionen:**
- Tiptap-Editor mit StarterKit, Image, Table, Link Extensions
- CRUD für SeminarMaterial mit Auto-Slug-Identifier
- Vercel Blob Storage für HTML und Bilder
- Curriculum-Verknüpfung über `materialId`

## Technical Context

**Language/Version**: TypeScript 5.x, Next.js 15.5.6, React 18+  
**Primary Dependencies**: Tiptap (@tiptap/react, StarterKit, Image, Table, Link), @vercel/blob, Prisma, MUI v5, Clerk  
**Storage**: PostgreSQL (Prisma) für Metadaten + Vercel Blob für HTML/Bilder  
**Testing**: Jest (unit/contract), Playwright (E2E)  
**Target Platform**: Vercel (serverless)  
**Project Type**: Web (Next.js App Router - frontend + API routes)  
**Performance Goals**: Editor-Load < 2s, Blob-Upload < 5s für 5MB Bilder  
**Constraints**: HTML max 2MB, Bilder max 5MB, Admin-only access  
**Scale/Scope**: ~100 Seminarmaterialien, ~10 Admins, keine High-Traffic-API

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Gate | Status | Notes |
|------|--------|-------|
| **I. Test-First Development** | ✅ PASS | Contract tests für API-Routen geplant, Unit-Tests für SlideEditor |
| **II. Code Quality** | ✅ PASS | Biome/Prettier/ESLint enforced, TypeScript strict |
| **III. Feature Dev Workflow** | ✅ PASS | Spec → Plan → Tasks Workflow eingehalten |
| **IV. Auth & Security** | ✅ PASS | Admin-only via Clerk, Blob private/public access control |
| **V. Component Architecture** | ✅ PASS | MUI-Integration, Tiptap als Client Component |
| **VI. Error Handling** | ✅ PASS | Rollbar für Blob-Operationen, API-Fehler-Handling |
| **VII. Stripe Integration** | N/A | Keine Zahlungsintegration in diesem Feature |

**Initial Constitution Check**: PASS ✅  
**Post-Design Constitution Check**: PASS ✅

## Project Structure

### Documentation (this feature)

```
specs/023-slide-editor/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── api-seminarmaterial.yaml
│   └── api-images.yaml
└── tasks.md             # Phase 2 output (/tasks command)
```

### Source Code (repository root)

```
app/admin/seminarmaterial/
├── page.tsx                    # Liste aller Materialien
├── new/
│   └── page.tsx                # Neues Material erstellen
└── [id]/
    └── edit/
        └── page.tsx            # Material bearbeiten

app/api/admin/seminarmaterial/
├── route.ts                    # GET (Liste), POST (Erstellen)
├── [id]/
│   ├── route.ts                # GET, PUT, DELETE
│   └── content/
│       └── route.ts            # GET HTML-Inhalt aus Blob
└── images/
    └── route.ts                # POST Bild-Upload

components/admin/
├── SlideEditor.tsx             # Tiptap WYSIWYG Editor
├── SlideEditorToolbar.tsx      # Toolbar mit Formatierungen
├── MaterialList.tsx            # Materialliste mit Aktionen
├── MaterialForm.tsx            # Metadaten-Formular (Titel, Identifier)
└── MaterialLinkSelector.tsx    # Dropdown für Curriculum-Verknüpfung

lib/api/
└── seminarmaterial.ts          # Server-Side API-Funktionen

lib/schemas/admin/
└── seminarmaterial.ts          # Zod-Schemas für Validierung

tests/
├── unit/
│   └── components/
│       └── SlideEditor.spec.ts
├── contracts/
│   └── api/
│       └── seminarmaterial.spec.ts
└── e2e/
    └── admin-seminarmaterial.spec.ts
```

**Structure Decision**: Next.js App Router Web-Struktur mit Admin-Bereich unter `/admin/seminarmaterial`. API-Routen unter `/api/admin/` mit Clerk Admin-Middleware.

## Phase 0: Outline & Research

### Research Tasks Completed

1. **Vercel Blob vs. Dateisystem**: Vercel hat kein persistentes Dateisystem → Vercel Blob erforderlich
2. **Tiptap + Next.js SSR**: `immediatelyRender: false` für Hydration, `'use client'` Directive
3. **Tiptap Extensions**: StarterKit, Image (mit Upload-Handler), Table (+Row/Header/Cell), Link
4. **Bild-Upload-Workflow**: Upload zu Blob → CDN-URL zurück → im HTML einbetten

**Output**: Siehe [spec.md](spec.md) → "Technical Research Summary" Abschnitt

## Phase 1: Design & Contracts

### 1.1 Data Model

**Neue Prisma-Entity: `SeminarMaterial`**

```prisma
model SeminarMaterial {
  id           String   @id @default(cuid())
  identifier   String   @unique  // Auto-Slug, Admin kann überschreiben
  title        String
  blobUrl      String   // Vercel Blob URL (private)
  blobPathname String   // seminarmaterial/{identifier}.html
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  @@map("seminar_materials")
}
```

**Erweiterung: `CurriculumTopic` Schema**

```typescript
// lib/schemas/admin/course.ts
export const curriculumTopicSchema = z.object({
  id: z.string(),
  timeRange: z.string(),
  title: z.string(),
  materialId: z.string().optional(), // NEU: Referenz auf SeminarMaterial.identifier
});
```

### 1.2 API Contracts

**POST /api/admin/seminarmaterial**
- Request: `{ title: string, identifier?: string, htmlContent: string }`
- Response: `{ id, identifier, title, blobUrl, createdAt }`
- Auth: Admin only

**PUT /api/admin/seminarmaterial/[id]**
- Request: `{ title?: string, identifier?: string, htmlContent?: string }`
- Response: `{ id, identifier, title, blobUrl, updatedAt }`
- Auth: Admin only

**DELETE /api/admin/seminarmaterial/[id]**
- Response: `{ success: true }`
- Side-Effect: Blob löschen
- Auth: Admin only

**GET /api/admin/seminarmaterial**
- Response: `{ materials: [{ id, identifier, title, createdAt, updatedAt }] }`
- Auth: Admin only

**GET /api/admin/seminarmaterial/[id]/content**
- Response: HTML-String aus Blob
- Auth: Admin only

**POST /api/admin/seminarmaterial/images**
- Request: FormData mit `file`
- Response: `{ url: string }` (public CDN-URL)
- Auth: Admin only
- Constraints: max 5MB, JPEG/PNG/WebP/GIF

### 1.3 Contract Tests (to be created)

```
tests/contracts/api/seminarmaterial.spec.ts
├── POST /api/admin/seminarmaterial → 201 mit Blob-URL
├── POST /api/admin/seminarmaterial → 400 bei fehlenden Feldern
├── POST /api/admin/seminarmaterial → 401 ohne Admin-Auth
├── PUT /api/admin/seminarmaterial/[id] → 200 mit Update
├── DELETE /api/admin/seminarmaterial/[id] → 204 Success
├── GET /api/admin/seminarmaterial → 200 mit Liste
├── GET /api/admin/seminarmaterial/[id]/content → 200 HTML
└── POST /api/admin/seminarmaterial/images → 201 mit CDN-URL
```

### 1.4 Quickstart

**Lokales Testen:**
```bash
# 1. Dependencies installieren
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit \
  @tiptap/extension-image @tiptap/extension-table \
  @tiptap/extension-table-row @tiptap/extension-table-header \
  @tiptap/extension-table-cell @tiptap/extension-link \
  @vercel/blob

# 2. Environment Variable setzen (lokal)
echo "BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxx" >> .env.local

# 3. Prisma Migration ausführen
npx prisma migrate dev --name add-seminar-material

# 4. Dev-Server starten
npm run dev

# 5. Admin-Panel öffnen
open http://localhost:3000/admin/seminarmaterial
```

**E2E-Validierung:**
```bash
# Seminarmaterial-Tests ausführen
npx playwright test tests/e2e/admin-seminarmaterial.spec.ts
```

**Output**: [data-model.md](data-model.md), [quickstart.md](quickstart.md), [contracts/](contracts/)

## Phase 2: Task Planning Approach

_This section describes what the /tasks command will do - DO NOT execute during /plan_

**Task Generation Strategy**:

1. **Database Layer** (Priority 1 - Foundation):
   - Prisma schema erweitern mit SeminarMaterial model
   - Migration erstellen und anwenden
   - Zod-Validierungsschemas erstellen

2. **API Layer** (Priority 2 - Backend):
   - Contract tests für alle Endpoints
   - API-Route handlers implementieren
   - Vercel Blob integration

3. **Component Layer** (Priority 3 - Frontend):
   - SlideEditor mit Tiptap
   - MaterialList, MaterialForm
   - Image-Upload-Handler

4. **Integration Layer** (Priority 4 - Connection):
   - CurriculumEditor erweitern mit MaterialLinkSelector
   - Admin-Navigation erweitern
   - E2E-Tests

**Ordering Strategy**:
- TDD: Contract tests vor Implementation
- Dependency order: Schema → API → Components → Integration
- Parallel [P] für unabhängige Komponenten

**Estimated Output**: ~20-25 Tasks in tasks.md

## Complexity Tracking

_No constitution violations requiring justification._

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| (none) | - | - |

## Progress Tracking

**Phase Status**:

- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning approach described (/plan command)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:

- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none)

---

_Based on Constitution v1.10.0 - See `.specify/memory/constitution.md`_
