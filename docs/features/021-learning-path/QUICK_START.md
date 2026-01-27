# PRE_BOOKED Workflow - Quick Start Guide

**Feature:** 021-learning-path  
**Last Updated:** 2026-01-27

Schnellübersicht für Entwickler zur PRE_BOOKED Approval-Funktionalität.

---

## 5-Minuten-Übersicht

### Was ist PRE_BOOKED?

Ein Booking-Status für Kunden, die:
- Einen Kurs buchen möchten
- ABER die Voraussetzungen nicht erfüllen
- → Admin-Genehmigung erforderlich vor Zahlung

### Workflow

```
Kunde bucht Kurs
    ↓
Voraussetzung fehlt?
    ↓ Ja
PRE_BOOKED erstellt
    ↓
Admin erhält Email
    ↓
Admin prüft + entscheidet
    ↓
Genehmigt → PENDING (Zahlung)
Abgelehnt → CANCELLED + Email
```

---

## Wichtigste Dateien

| Datei | Zweck |
|-------|-------|
| `lib/services/booking-orchestrator.ts` | Hauptlogik: Voraussetzungsprüfung + Booking-Erstellung |
| `lib/services/booking.ts` | CRUD-Operationen, Transition Rules (Zeilen 57-81) |
| `app/api/payment/create-intent/route.ts` | User-Endpoint: Booking + Payment Intent |
| `app/api/admin/bookings/[id]/review/route.ts` | Admin-Endpoint: Genehmigen/Ablehnen |
| `components/admin/BookingReviewDialog.tsx` | UI: Review-Dialog für Admin |
| `lib/services/loops.ts` | Email-Versand (Admin-Benachrichtigung + Ablehnung) |

---

## Wichtige Funktionen

### 1. Booking mit Voraussetzungsprüfung erstellen

```typescript
import { handleBookingWithPrerequisites } from '@/lib/services/booking-orchestrator';

const result = await handleBookingWithPrerequisites({
  userId: 'user_123',
  userEmail: 'user@example.com',
  userName: 'John Doe',
  course: courseData,
});

if (result.requiresReview) {
  // PRE_BOOKED → Zeige Wartebildschirm
  return NextResponse.json({
    requiresReview: true,
    bookingId: result.bookingId,
    message: 'Deine Buchung wurde zur Prüfung eingereicht',
  });
} else {
  // Normal → Fahre fort mit Zahlung
  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    bookingId: result.bookingId,
  });
}
```

### 2. Admin-Review durchführen

**Endpoint:** `PATCH /api/admin/bookings/{id}/review`

```typescript
// Genehmigen
const response = await fetch(`/api/admin/bookings/${bookingId}/review`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    approved: true,
    adminNotes: 'Voraussetzung nachgewiesen',
  }),
});

// Ablehnen
const response = await fetch(`/api/admin/bookings/${bookingId}/review`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    approved: false,
    adminNotes: 'Voraussetzung fehlt',
  }),
});
```

### 3. Email-Benachrichtigungen

```typescript
import { sendPrerequisiteReviewEmail, sendBookingRejectedEmail } from '@/lib/services/loops';

// Admin benachrichtigen
await sendPrerequisiteReviewEmail({
  bookingId: 'booking_123',
  customerName: 'John',
  customerEmail: 'john@example.com',
  courseName: 'Advanced Laparoscopy',
  courseLevel: 'Fortgeschrittenen-Kurs',
  missingPrerequisite: 'Basis',
});

// Kunde über Ablehnung informieren
await sendBookingRejectedEmail({
  bookingId: 'booking_123',
  customerName: 'John',
  customerEmail: 'john@example.com',
  courseName: 'Advanced Laparoscopy',
});
```

---

## Status-Übergänge (Transition Rules)

```typescript
// ✅ ERLAUBT
null → PRE_BOOKED              // Neues Booking ohne Voraussetzung
CANCELLED → PRE_BOOKED         // Retry nach Ablehnung
PRE_BOOKED → PENDING           // Admin genehmigt
PRE_BOOKED → CANCELLED         // Admin lehnt ab

// ❌ BLOCKIERT
PENDING → PRE_BOOKED           // Kein Downgrade
PAID → PRE_BOOKED              // Kein Downgrade
PRE_BOOKED → PRE_BOOKED        // Kein Duplikat
FAILED → PRE_BOOKED            // Muss CANCELLED sein
```

**Implementierung:** `lib/services/booking.ts` Zeilen 57-81

---

## Fehlerbehandlung

### Häufige Fehler

```typescript
// ❌ Duplikat-PRE_BOOKED
throw new Error('A booking for this course is already pending admin review');

// ❌ Aktives Booking existiert
throw new Error('Active booking already exists for this course (status: PAID)');

// ❌ Kurs-Level fehlt
throw new Error('Course level is required for prerequisite check');

// ❌ Email-Adresse fehlt
serverInstance.warn('Email send skipped - invalid recipient', { ... });
```

### Logging-Best Practices

```typescript
// ✅ RICHTIG: Strukturiertes Logging mit maskierter Email
serverInstance.info('PRE_BOOKED booking created', {
  context: 'BookingOrchestrator.createPreBookedWithNotification',
  bookingId: booking.id,
  userId: booking.userId,
  courseId: booking.courseId,
  customerEmail: maskEmail(userEmail), // j***n@example.com
});

// ❌ FALSCH: Rohe Email-Adresse loggen
console.log('Email:', userEmail); // NICHT MACHEN!
```

---

## Tests

### Unit Tests ausführen

```bash
# PRE_BOOKED Transition Rules
npm test booking-transitions.spec.ts

# Orchestrator Logic
npm test booking-orchestrator.spec.ts

# Alle Tests
npm test
```

### Test-Coverage

| Komponente | Tests | Status |
|------------|-------|--------|
| Booking Transitions | 12 | ✅ Passing |
| Booking Orchestrator | 13 | ✅ Passing |
| Contract Tests | 5 | ✅ Passing |
| E2E Tests | 0 | ⚠️ TODO |

**Details:** `tests/unit/services/TEST_COVERAGE_SUMMARY.md`

---

## Umgebungsvariablen

```bash
# Email-Service (erforderlich)
LOOPS_API_KEY=loops_***

# Support-Email
SUPPORT_EMAIL=support@hemera-academy.de

# App-URL für Admin-Links
NEXT_PUBLIC_APP_URL=https://app.hemera-academy.de
```

---

## Admin-Rolle konfigurieren

1. Gehe zu [Clerk Dashboard](https://dashboard.clerk.com)
2. Users → Wähle User
3. Edit → Public Metadata
4. Füge hinzu: `{"role": "admin"}`
5. Save

---

## TODOs (Fehlende Features)

### Kritisch

- [ ] Admin-Dashboard für PRE_BOOKED Liste (`app/admin/bookings/pending/page.tsx`)
- [ ] Customer-UI für PRE_BOOKED Status-Anzeige
- [ ] E2E-Tests für kompletten Approval-Flow

### Nice-to-Have

- [ ] Auto-Approval-Regeln
- [ ] Voraussetzungsnachweis hochladen (Zertifikat)
- [ ] Review-Zeit-SLA (>48h Alert)
- [ ] Analytics-Dashboard (Approval-Rate, etc.)

---

## Weitere Dokumentation

- 📖 [Vollständige Workflow-Dokumentation](./PRE_BOOKED_APPROVAL_WORKFLOW.md)
- 📋 [Feature Plan](../../../specs/021-learning-path/plan.md)
- 🧪 [Test Coverage Summary](../../../tests/unit/services/TEST_COVERAGE_SUMMARY.md)
- 📜 [API Contracts](../../../specs/021-learning-path/contracts/)

---

## Fragen?

1. **Warum PRE_BOOKED statt PENDING?**  
   → PENDING bedeutet "wartet auf Zahlung", PRE_BOOKED bedeutet "wartet auf Admin-Genehmigung"

2. **Kann ein User mehrere PRE_BOOKED Bookings haben?**  
   → Nein, nur ein PRE_BOOKED pro Kurs (Duplikat-Prävention)

3. **Was passiert bei Email-Fehler?**  
   → Booking wird trotzdem erstellt, Email-Fehler ist non-blocking

4. **Wie lange dauert die Review?**  
   → Keine automatische SLA, TODO: Alert bei >48h implementieren

5. **Kann User nach Ablehnung erneut buchen?**  
   → Ja, CANCELLED → PRE_BOOKED ist erlaubt (Retry)

---

**Zuletzt aktualisiert:** 2026-01-27  
**Nächste Review:** Bei Feature-Erweiterung
