# 021 Learning Path

## Overview

Enhance course management with prerequisite tracking, recommendation fields, and access control features to support structured learning paths.

## Clarifications

### Session 2026-01-27

- Q: Was passiert wenn ein Kunde verschiedene E-Mail-Adressen für verschiedene Buchungen verwendet hat? → A: Alle historischen E-Mails des Clerk-Accounts prüfen
- Q: Wann gilt ein Kurs als "abgeschlossen" für die Voraussetzungs-Prüfung? → A: Bezahlt UND Participation-Status = COMPLETE
- Q: Wenn Loops.so API nicht erreichbar ist - wie reagiert das System? → A: Buchung bleibt PRE_BOOKED, Fehler nur loggen (stille Degradation)
- Q: Welche Admin-E-Mail für Voraussetzungs-Review-Benachrichtigungen? → A: Alle Clerk-User mit role: admin dynamisch benachrichtigen
- Q: Kann Admin PRE_BOOKED Buchungen freigeben oder ablehnen? → A: Freigeben ODER ablehnen mit Storno-Email an Kunden

## User Requirements

### 1. Course Recommendation Fields

Add two new database fields to the Course model:

| Field | Type | Max Length | Description |
|-------|------|------------|-------------|
| `recommended` | Text (multi-line) | 300 chars | Describes who this course is recommended for |
| `notRecommended` | Text (multi-line) | 300 chars | Describes who this course is NOT recommended for |

**Display locations:**
- Course detail page (public)
- Course admin panel (create/edit forms)

### 2. Prerequisite Booking Check

Introduce a booking validation for intermediate and master class courses:

- Customers must have **completed** a lower-level course before booking a higher-level course
  - Definition "completed": `paymentStatus = PAID` **AND** `CourseParticipation.status = COMPLETE`
- Use **all email addresses linked to the customer's Clerk account** for prerequisite verification (not just current login email)
- When prerequisites are not met, display:

> "Sie haben bisher kein Seminar absolviert, das für die Teilnahme an {course_name} erforderlich ist. Wir prüfen Ihre Buchungsanfrage und melden uns per E-Mail bei Ihnen."

**Behavior:**
- Non-qualified bookings are **always** created with status `PRE_BOOKED` (requires manual admin review)
- Admin receives notification to review the booking request
- Customer receives confirmation that request is under review
- **Admin Review Actions:**
  - **Approve:** Change status to `PENDING` (proceed to payment)
  - **Reject:** Change status to `CANCELLED` and send cancellation email to customer via Loops.so

**Admin Notification Email (via Loops.so):**
- Trigger: When a non-qualified customer attempts to book a course
- Recipient: All Clerk users with `publicMetadata.role = 'admin'` (dynamically fetched)
- Email content:
  - Customer name and email
  - Attempted course name
  - Missing prerequisite course(s)
  - Link to booking in admin panel
- Integration: Use [Loops.so](https://loops.so) transactional email API
- **Error Handling:** If Loops.so API fails, log error to Rollbar (silent degradation) - booking remains `PRE_BOOKED` regardless

### 3. Non-Public Course Flag

Add a checkbox to the course admin panel:

| Field | Type | Description |
|-------|------|-------------|
| `isNonPublic` | Boolean | When true, course is invitation-only |

**Behavior:**
- Non-public courses are hidden from public course listings
- Customers can only book via direct invitation link
- Admin can still manage and view all courses

### 4. Outperformer Flag for Participants

Add a checkbox to the user management panel:

| Field | Type | Description |
|-------|------|-------------|
| `isOutperformer` | Boolean | Marks participant as high-performer |

**Usage:**
- Allows admins to track exceptional participants
- Can be used for prioritized invitations to advanced courses

## Acceptance Criteria

### Feature 1: Recommendation Fields
- [ ] Database migration adds `recommended` and `not_recommended` columns to courses table
- [ ] Fields are editable in course admin create/edit forms
- [ ] Fields display on public course detail page
- [ ] Character limit of 300 is enforced

### Feature 2: Prerequisite Check
- [ ] System checks completed courses by email before allowing booking
- [ ] Warning message displayed when prerequisites not met
- [ ] Booking created with "pending review" status
- [ ] Admin notification sent for manual review

### Feature 3: Non-Public Courses
- [ ] `is_non_public` field added to courses table
- [ ] Checkbox in admin course form
- [ ] Non-public courses hidden from public listings
- [ ] Direct booking link still works

### Feature 4: Outperformer Flag
- [ ] `is_outperformer` field added to users table
- [ ] Checkbox in user management panel
- [ ] Flag visible in admin user list

## Dependencies

- Existing Course model and admin panel
- Existing Booking flow
- Existing User management

## Out of Scope

- Automatic prerequisite course assignment
- Learning path visualization/roadmap UI
- Certificate generation for completed courses
