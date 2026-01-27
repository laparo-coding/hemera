# 021 Learning Path - Research

## Übersicht

Dieses Dokument analysiert die bestehende Codebasis, um die vier Features des Learning Path zu implementieren:

1. **Empfehlungsfelder** für Kurse (recommended/notRecommended)
2. **Voraussetzungs-Prüfung** bei Buchungen mit Admin-Benachrichtigung
3. **Nicht-öffentliche Kurse** (isNonPublic Flag)
4. **Outperformer-Flag** für Teilnehmer

---

## 1. Datenbank-Analyse

### Aktuelles Course-Model (`prisma/schema.prisma:30-55`)

```prisma
model Course {
  id            String              @id @default(cuid())
  title         String
  description   String?
  teaser        String?             // max 300 chars
  curriculum    Json?
  slug          String              @unique
  price         Int
  currency      String              @default("EUR")
  capacity      Int                 @default(20)
  startDate     DateTime?           @map("start_date")
  endDate       DateTime?           @map("end_date")
  startTime     DateTime?           @map("start_time")
  endTime       DateTime?           @map("end_time")
  isPublished   Boolean             @default(false) @map("is_published")
  instructor    String              @default("TBD")
  level         CourseLevel         @default(BEGINNER)
  thumbnailUrl  String?             @map("thumbnail_url")
  imageDetail   String?             @map("image_detail")
  imageTwitter  String?             @map("image_twitter")
  heroVideoPlaybackId String?       @map("hero_video_playback_id")
  locationId    String?             @map("location_id")
  location      Location?           @relation(...)
  bookings      Booking[]
  summaryAssets CourseSummaryAsset[]
  testimonials  Testimonial[]
  createdAt     DateTime            @default(now()) @map("created_at")
  updatedAt     DateTime            @updatedAt @map("updated_at")
  
  @@index([startDate])
  @@map("courses")
}
```

### Aktuelles User-Model (`prisma/schema.prisma:18-27`)

```prisma
model User {
  id            String    @id // Clerk User ID
  name          String?
  email         String?   @unique
  emailVerified DateTime? @map("email_verified")
  image         String?
  bookings      Booking[]
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  @@map("users")
}
```

### CourseLevel Enum (`prisma/schema.prisma:57-61`)

```prisma
enum CourseLevel {
  BEGINNER
  INTERMEDIATE
  ADVANCED
}
```

### Booking Model (`prisma/schema.prisma:63-84`)

```prisma
model Booking {
  id                    String               @id @default(cuid())
  userId                String               @map("user_id")
  courseId              String               @map("course_id")
  paymentStatus         PaymentStatus        @default(PENDING)
  stripePaymentIntentId String?
  stripeSessionId       String?
  stripeInvoiceId       String?
  stripeInvoiceUrl      String?
  stripeInvoicePdfUrl   String?
  amount                Int
  currency              String               @default("EUR")
  course                Course               @relation(...)
  user                  User                 @relation(...)
  testimonial           Testimonial?
  participation         CourseParticipation?
  createdAt             DateTime
  updatedAt             DateTime

  @@unique([userId, courseId])
  @@map("bookings")
}
```

---

## 2. Benötigte Schema-Änderungen

### Feature 1: Empfehlungsfelder (Course)

```prisma
// Neue Felder im Course-Model
recommended     String?  @map("recommended") @db.VarChar(300)
notRecommended  String?  @map("not_recommended") @db.VarChar(300)
```

### Feature 3: Nicht-öffentliche Kurse (Course)

```prisma
// Neues Feld im Course-Model
isNonPublic     Boolean  @default(false) @map("is_non_public")
```

### Feature 4: Outperformer-Flag (User)

```prisma
// Neues Feld im User-Model
isOutperformer  Boolean  @default(false) @map("is_outperformer")
```

### Feature 2: Voraussetzungs-Prüfung (Booking)

```prisma
// Neues Feld im Booking-Model für Review-Status
requiresReview  Boolean  @default(false) @map("requires_review")
reviewedAt      DateTime? @map("reviewed_at")
reviewedBy      String?   @map("reviewed_by")
```

---

## 3. Code-Analyse

### 3.1 Course Admin Panel

**Hauptkomponente:** [components/admin/CourseForm.tsx](components/admin/CourseForm.tsx)

Die `CourseForm`-Komponente verwendet:
- React Hook Form mit Zod-Validierung
- Controller-Pattern für alle Felder
- Teaser-Feld als Referenz für Textareas mit Zeichenbegrenzung (300 chars)

**Relevante Code-Muster für neue Felder:**

```tsx
// Teaser-Feld als Vorlage (lines 107-124)
<Controller
  name='teaser'
  control={control}
  render={({ field }) => (
    <TextField
      {...field}
      value={field.value || ''}
      label='Teaser (Kurzbeschreibung für Übersichten)'
      multiline
      rows={2}
      helperText={`${(field.value || '').length}/300 Zeichen`}
      inputProps={{ maxLength: 300 }}
    />
  )}
/>
```

**Erweiterungen benötigt in:**
- `lib/schemas/admin/course.ts` - Zod-Schema
- `lib/db/admin/courses.ts` - `createCourse()` und `updateCourse()`
- `lib/types/admin.ts` - TypeScript-Typen

### 3.2 Course Detail Page

**Hauptkomponente:** [app/courses/[id]/page.tsx](app/courses/[id]/page.tsx)

Die Seite verwendet `CourseDetailLayout` aus `components/course-detail/`:

```tsx
// CourseDetailCourse Interface (lines 21-47 in CourseDetailLayout.tsx)
export interface CourseDetailCourse {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  // ... weitere Felder
}
```

**Neue Felder benötigt:**
- `recommended: string | null`
- `notRecommended: string | null`

**Neue Sektion für Empfehlungen:**
Eine neue Komponente `CourseRecommendationSection` sollte erstellt werden.

### 3.3 Course Listing (Public)

**Relevante Dateien:**
- `lib/api/courses.ts` - `getCourseBySlug()`, `getCourseById()`
- `components/CourseListing.tsx`
- `app/courses/page.tsx`

**Wichtig für Feature 3:**
Nicht-öffentliche Kurse (`isNonPublic: true`) müssen aus Public Listings gefiltert werden:

```typescript
// In lib/api/courses.ts - anpassen:
export async function getPublishedCourses() {
  return prisma.course.findMany({
    where: {
      isPublished: true,
      isNonPublic: false,  // NEU: Nicht-öffentliche ausschließen
    },
    // ...
  });
}
```

### 3.4 Booking Flow

**Hauptdateien:**
- [app/api/payment/create-intent/route.ts](app/api/payment/create-intent/route.ts) - Payment Intent Erstellung
- [lib/services/booking.ts](lib/services/booking.ts) - `createBooking()`
- [components/checkout/CheckoutPageClient.tsx](components/checkout/CheckoutPageClient.tsx)

**Voraussetzungs-Prüfung einfügen:**

```typescript
// In app/api/payment/create-intent/route.ts:
// Nach Kurs-Abruf, vor Booking-Erstellung:

// Prüfen ob Voraussetzungen erforderlich (INTERMEDIATE/ADVANCED)
if (course.level !== 'BEGINNER') {
  const hasPrerequisite = await checkUserPrerequisite(userId, course.level);
  
  if (!hasPrerequisite) {
    // Booking mit requiresReview = true erstellen
    // Admin-Email senden via Loops.so
  }
}
```

### 3.5 Admin User Management

**API-Endpoint:** [app/api/admin/users/route.ts](app/api/admin/users/route.ts)

Aktuell nur GET-Methode zum Auflisten von Usern. Für Feature 4 benötigt:
- PATCH-Endpoint zum Aktualisieren des `isOutperformer`-Flags
- Frontend-UI im Admin-Panel

**Admin-Panel Übersicht:** [app/admin/database/page.tsx](app/admin/database/page.tsx)

Diese Seite zeigt Kurse und Buchungen. User-Management muss erweitert werden.

---

## 4. Loops.so Integration

### Aktueller Stand

Es gibt **keine bestehende Loops.so-Integration** im Projekt. Dies ist eine neue Abhängigkeit.

### Implementierungsplan

1. **NPM-Paket installieren:**
   ```bash
   npm install loops
   ```

2. **Umgebungsvariablen hinzufügen:**
   ```env
   LOOPS_API_KEY=xxxxxxxxxx
   ADMIN_NOTIFICATION_EMAIL=admin@hemera-academy.de
   ```

3. **Service-Datei erstellen:**
   ```typescript
   // lib/services/loops.ts
   import { LoopsClient } from 'loops';
   
   const client = new LoopsClient(process.env.LOOPS_API_KEY);
   
   export async function sendPrerequisiteReviewEmail(data: {
     customerName: string;
     customerEmail: string;
     courseName: string;
     missingPrerequisite: string;
     bookingId: string;
   }) {
     return client.sendTransactionalEmail({
       transactionalId: 'prerequisite-review',
       email: process.env.ADMIN_NOTIFICATION_EMAIL,
       dataVariables: {
         customer_name: data.customerName,
         customer_email: data.customerEmail,
         course_name: data.courseName,
         missing_prerequisite: data.missingPrerequisite,
         admin_link: `${process.env.NEXT_PUBLIC_APP_URL}/admin/bookings/${data.bookingId}`,
       },
     });
   }
   ```

4. **Loops.so Dashboard:**
   - Transaktionale E-Mail-Vorlage "prerequisite-review" erstellen
   - Variablen definieren: customer_name, customer_email, course_name, etc.

---

## 5. Voraussetzungs-Logik

### Level-Hierarchie

| Level | Erforderliche Voraussetzung |
|-------|----------------------------|
| BEGINNER | Keine |
| INTERMEDIATE | Mindestens ein BEGINNER-Kurs abgeschlossen |
| ADVANCED | Mindestens ein INTERMEDIATE-Kurs abgeschlossen |

### "Abgeschlossen" Definition

Ein Kurs gilt als abgeschlossen wenn:
1. Booking mit `paymentStatus = 'PAID'` existiert
2. **UND** das Kursdatum in der Vergangenheit liegt (`course.endDate < now()`)

### Prüf-Query

```typescript
// lib/services/prerequisite.ts
export async function checkUserPrerequisite(
  userEmail: string,
  requiredLevel: CourseLevel
): Promise<boolean> {
  const requiredCompletedLevel = requiredLevel === 'ADVANCED' 
    ? 'INTERMEDIATE' 
    : 'BEGINNER';
    
  const completedCourses = await prisma.booking.findMany({
    where: {
      user: { email: userEmail },
      paymentStatus: 'PAID',
      course: {
        level: requiredCompletedLevel,
        endDate: { lt: new Date() },
      },
    },
    take: 1,
  });
  
  return completedCourses.length > 0;
}
```

---

## 6. Nicht-öffentliche Kurse

### Booking via Direktlink

Nicht-öffentliche Kurse können weiterhin gebucht werden über:
- `/courses/{slug}` - Detailseite bleibt erreichbar
- `/checkout?courseId={id}` - Checkout funktioniert

### Filter in Public Listings

```typescript
// lib/api/courses.ts
export async function getPublishedCourses() {
  return prisma.course.findMany({
    where: {
      isPublished: true,
      isNonPublic: false,
    },
  });
}

// Admin sieht alle Kurse
export async function getAllCoursesForAdmin() {
  return prisma.course.findMany({
    // kein isNonPublic Filter
  });
}
```

---

## 7. Betroffene Dateien

### Schema & Migration
- `prisma/schema.prisma` - Neue Felder
- `prisma/migrations/xxx_learning_path/migration.sql` - Migration

### Backend
- `lib/db/admin/courses.ts` - CRUD erweitern
- `lib/schemas/admin/course.ts` - Zod-Schema
- `lib/types/admin.ts` - TypeScript-Typen
- `lib/api/courses.ts` - isNonPublic Filter
- `lib/services/prerequisite.ts` - NEU: Voraussetzungs-Prüfung
- `lib/services/loops.ts` - NEU: E-Mail-Service
- `lib/env.ts` - Neue Umgebungsvariablen
- `app/api/payment/create-intent/route.ts` - Prerequisite Check

### Frontend - Admin
- `components/admin/CourseForm.tsx` - Neue Felder
- `app/admin/database/page.tsx` - User Outperformer Toggle
- `app/api/admin/users/route.ts` - PATCH für isOutperformer
- `app/api/admin/bookings/[id]/review/route.ts` - NEU: Review Endpoint

### Frontend - Public
- `components/course-detail/CourseRecommendationSection.tsx` - NEU
- `components/course-detail/CourseDetailLayout.tsx` - Section einbinden
- `components/course-detail/index.ts` - Export
- `components/checkout/CheckoutPageClient.tsx` - Warnung anzeigen

---

## 8. Test-Strategie

### Unit Tests
- `tests/unit/services/prerequisite.spec.ts` - Level-Prüfung
- `tests/unit/services/loops.spec.ts` - E-Mail (mocked)

### Integration Tests
- `tests/integration/booking-prerequisite.spec.ts` - Booking mit/ohne Voraussetzung

### E2E Tests
- `tests/e2e/admin-course-form.spec.ts` - Neue Felder im Admin
- `tests/e2e/course-listing.spec.ts` - isNonPublic Filter

---

## 9. Migrations-Strategie

### Single Migration

```sql
-- Migration: learning_path
ALTER TABLE courses 
  ADD COLUMN recommended VARCHAR(300),
  ADD COLUMN not_recommended VARCHAR(300),
  ADD COLUMN is_non_public BOOLEAN DEFAULT false NOT NULL;

ALTER TABLE users 
  ADD COLUMN is_outperformer BOOLEAN DEFAULT false NOT NULL;

ALTER TABLE bookings 
  ADD COLUMN requires_review BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN reviewed_at TIMESTAMP,
  ADD COLUMN reviewed_by VARCHAR(255);
```

---

## 10. Risiken & Offene Fragen

### Risiken

| Risiko | Auswirkung | Mitigation |
|--------|-----------|------------|
| Loops.so API-Ausfälle | Admin erhält keine Benachrichtigung | Retry-Mechanismus + Fallback-Logging |
| Falsche Voraussetzungs-Prüfung | Kunden falsch abgelehnt | Manuelle Review bleibt möglich |
| Performance bei Booking | Zusätzliche DB-Queries | Indexes auf relevante Felder |

### Offene Fragen

1. **Email an Admin:** Soll eine feste Admin-Email verwendet werden oder basierend auf Clerk-Rollen?
   - **Empfehlung:** Umgebungsvariable `ADMIN_NOTIFICATION_EMAIL`

2. **Review-Workflow:** Wie erfolgt die manuelle Freigabe durch Admin?
   - **Empfehlung:** Separater Admin-Bereich für "Pending Reviews"

3. **Booking-Status bei Review:** Soll das Booking als PENDING bleiben oder neuer Status?
   - **Empfehlung:** `requiresReview` Flag + bestehender `PENDING` Status

4. **Outperformer Sichtbarkeit:** Wer sieht das Outperformer-Flag?
   - **Empfehlung:** Nur Admins im Admin-Panel

---

## 11. Dependencies

### Neue npm-Pakete
- `loops` - Loops.so SDK für transaktionale E-Mails

### Neue Umgebungsvariablen
```env
LOOPS_API_KEY=xxx
ADMIN_NOTIFICATION_EMAIL=admin@hemera-academy.de
```

---

## 12. Zusammenfassung

Die 021-learning-path Feature-Implementierung erfordert:

1. **4 Schema-Erweiterungen:** Course (3 Felder), User (1 Feld), Booking (3 Felder)
2. **1 neue Integration:** Loops.so für E-Mails
3. **~15 Datei-Änderungen** in Backend und Frontend
4. **1 Migration** für alle Datenbankänderungen

Das bestehende Code-Muster für:
- Zod-Validierung in `lib/schemas/`
- Prisma-Queries in `lib/db/`
- Admin-Forms mit React Hook Form
- Booking-Flow über `/api/payment/create-intent`

...bietet eine solide Grundlage für die Implementierung.
