# Learning Path (021) - Feature Documentation

**Status:** ✅ Implemented  
**Branch:** `021-learning-path`  
**Last Updated:** 2026-01-27

---

## Übersicht

Das Learning Path Feature ermöglicht strukturierte Kursabfolgen mit Voraussetzungsprüfung. Wenn ein Benutzer einen Kurs buchen möchte, für den er nicht qualifiziert ist, wird eine **PRE_BOOKED**-Buchung erstellt, die auf Admin-Genehmigung wartet.

---

## Dokumentations-Index

### 🚀 Schnelleinstieg

**→ [Quick Start Guide](./QUICK_START.md)**
- 5-Minuten-Übersicht
- Wichtigste Funktionen & Code-Snippets
- Status-Übergänge
- Fehlerbehandlung
- TODOs

**Empfohlen für:** Entwickler, die schnell verstehen wollen, wie PRE_BOOKED funktioniert.

---

### 📖 Vollständige Dokumentation

**→ [PRE_BOOKED Approval Workflow](./PRE_BOOKED_APPROVAL_WORKFLOW.md)**
- Detaillierter Workflow mit Diagramm
- API-Endpoint-Dokumentation
- Database-Schema
- Service-Layer-Architektur
- Email-Benachrichtigungen
- UI-Komponenten (implementiert + TODOs)
- Monitoring & Fehlerbehandlung
- Deployment-Checkliste
- Troubleshooting-Guide

**Empfohlen für:** Vollständiges Verständnis, Onboarding neuer Entwickler, Troubleshooting.

---

### 📋 Feature Plan & Spezifikationen

**→ [Specs Directory](../../../specs/021-learning-path/)**
- `plan.md` - Ursprünglicher Feature-Plan
- `tasks.md` - Task-Tracking
- `contracts/` - API-Contract-Tests
- `erd.md` - Entity-Relationship-Diagramm

---

### 🧪 Test-Dokumentation

**→ [Test Coverage Summary](../../../tests/unit/services/TEST_COVERAGE_SUMMARY.md)**
- Unit-Test-Übersicht
- Test-Szenarien
- Coverage-Statistiken

**Test-Dateien:**
- `tests/unit/services/booking-transitions.spec.ts` (12 Tests)
- `tests/unit/services/booking-orchestrator.spec.ts` (13 Tests)
- `tests/contracts/admin-booking-review.spec.ts` (5 Tests)

---

## Kern-Komponenten

### Backend (Service Layer)

| Datei | Beschreibung |
|-------|--------------|
| `lib/services/booking-orchestrator.ts` | Hauptorchestrator für Booking + Prerequisite-Prüfung |
| `lib/services/booking.ts` | CRUD-Operationen, Transition Rules (Zeilen 57-81) |
| `lib/services/prerequisite.ts` | Voraussetzungsprüfung basierend auf Kurs-Level |
| `lib/services/loops.ts` | Email-Versand (Admin-Benachrichtigung + Ablehnung) |

### API Endpoints

| Endpoint | Methode | Beschreibung |
|----------|---------|--------------|
| `/api/payment/create-intent` | POST | Erstellt Booking, prüft Voraussetzungen |
| `/api/admin/bookings/[id]/review` | PATCH | Admin genehmigt/lehnt PRE_BOOKED ab |

### UI-Komponenten

| Komponente | Status | Beschreibung |
|------------|--------|--------------|
| `BookingReviewDialog` | ✅ Implementiert | Admin-Review-Dialog |
| `CourseForm` | ✅ Implementiert | Learning-Path-Felder (recommended, notRecommended) |
| **Admin Dashboard** | ⚠️ TODO | Liste aller PRE_BOOKED Bookings |
| **Customer Status UI** | ⚠️ TODO | PRE_BOOKED-Status-Badge in Dashboard |

---

## Workflow-Diagramm (Vereinfacht)

```
Kunde wählt Kurs
       ↓
[Voraussetzungs-Check]
       ↓
    Ja / Nein
    ↓       ↓
PENDING  PRE_BOOKED ← Admin erhält Email
    ↓       ↓
Zahlung  Admin Review
    ↓       ↓
  PAID   PENDING (genehmigt) oder CANCELLED (abgelehnt)
           ↓
       Zahlung möglich
```

---

## Status-Übergänge

```typescript
// ✅ Erlaubt
null → PRE_BOOKED              // Neues Booking, Voraussetzung fehlt
CANCELLED → PRE_BOOKED         // Retry nach Ablehnung
PRE_BOOKED → PENDING           // Admin genehmigt
PRE_BOOKED → CANCELLED         // Admin lehnt ab

// ❌ Blockiert
PENDING → PRE_BOOKED           // Kein Downgrade
PAID → PRE_BOOKED              // Kein Downgrade
PRE_BOOKED → PRE_BOOKED        // Duplikat-Prävention
```

---

## Wichtige TODOs

### Kritisch (Must-Have)

- [ ] **Admin Dashboard** (`app/admin/bookings/pending/page.tsx`)  
  Liste aller PRE_BOOKED Bookings mit Filter/Sortierung

- [ ] **Customer Notification UI**  
  PRE_BOOKED-Status in `app/my-courses/page.tsx` oder Dashboard anzeigen

- [ ] **E2E-Tests**  
  Kompletter Approval-Flow (User → Admin → Payment)

### Nice-to-Have

- [ ] Auto-Approval-Regeln (z.B. wenn Voraussetzung während Wartezeit abgeschlossen)
- [ ] Voraussetzungsnachweis hochladen (Zertifikat)
- [ ] Review-Zeit-SLA mit Alerts (>48h)
- [ ] Analytics-Dashboard (Approval-Rate, häufigste fehlende Voraussetzungen)
- [ ] Bulk-Operations (mehrere Bookings gleichzeitig genehmigen)

---

## Deployment-Checkliste

Vor Production-Deployment:

- [x] Prisma-Schema migriert
- [x] Unit-Tests geschrieben (25 Tests)
- [x] API-Endpoints implementiert
- [x] Email-Templates erstellt (Loops.so)
- [ ] Admin-Rolle in Clerk konfiguriert
- [ ] `LOOPS_API_KEY` in Vercel gesetzt
- [ ] E2E-Tests geschrieben
- [ ] Admin-Dashboard implementiert
- [ ] Support-Team trainiert

---

## Monitoring

**Wichtige Metriken:**
- PRE_BOOKED Bookings pro Tag/Woche
- Durchschnittliche Review-Zeit
- Approval-Rate (%)
- Email-Zustellrate
- Bookings >48h ohne Review (Alert)

**Rollbar-Tags:**
```
feature: learning-path
workflow: pre-booked-approval
context: BookingOrchestrator.*
```

---

## Häufige Fragen

**Q: Warum wird ein separater Status PRE_BOOKED benötigt?**  
A: PENDING bedeutet "wartet auf Zahlung", PRE_BOOKED bedeutet "wartet auf Admin-Genehmigung". Klare Trennung der Verantwortlichkeiten.

**Q: Kann ein User mehrere PRE_BOOKED Bookings für denselben Kurs haben?**  
A: Nein, Duplikat-Prävention ist in `lib/services/booking.ts` (Zeilen 57-81) implementiert.

**Q: Was passiert, wenn die Email-Benachrichtigung fehlschlägt?**  
A: Booking wird trotzdem erstellt. Email-Fehler sind non-blocking und werden geloggt.

**Q: Wie lange dauert eine Review?**  
A: Keine SLA implementiert. TODO: Alert bei >48h implementieren.

---

## Weitere Ressourcen

- [Copilot Instructions](../../../.github/copilot-instructions.md)
- [Performance Guidelines](../../performance/README.md)
- [Monitoring Setup](../../monitoring/README.md)
- [Database Naming Convention](../../development/database-naming.md)

---

**Maintainer:** Development Team  
**Nächste Review:** Bei Feature-Erweiterung oder Bug-Reports
