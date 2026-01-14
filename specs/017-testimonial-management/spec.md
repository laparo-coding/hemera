# Feature Specification: Testimonial Management

**Feature Branch**: `017-testimonial-management`  
**Created**: 2025-01-14  
**Status**: Draft  
**Input**: User description: "Every participant should be able to testify the value of the course they participated in via testimonials displayed on course detail pages."

## Clarifications

### Session 2025-01-15

- Q: Where is the testimonial input located? → A: On the course page within the user dashboard.
- Q: Where are testimonials displayed? → A: On the respective course detail page beneath the "Termin und Preis" (Date and Price) section.
- Q: What information is shown in a testimonial? → A: Statement text, profile photo (if available from Clerk), and participant name with configurable display format.
- Q: Can a participant edit or delete their testimonial after submission? → A: Edit anytime allowed; no user-initiated delete (admin can hide via HIDDEN status).
- Q: Are testimonials published immediately or require admin approval? → A: Admin approval required before display (PENDING → PUBLISHED workflow).
- Q: What is the character limit for testimonial statements? → A: 1000 characters maximum.
- Q: What if participant's home city is unavailable for option A? → A: Option A is hidden/disabled when no city in profile.

## User Scenarios & Testing _(mandatory)_

### Primary User Story

As a course participant, I want to share my experience by writing a testimonial for a course I completed, so that prospective participants can learn about the value of the course from real attendees.

### Acceptance Scenarios

1. **Given** a participant who completed a course booking, **When** they navigate to the course in their user dashboard, **Then** they see a testimonial input form that mirrors the final display layout on the course detail page.

2. **Given** a participant writing a testimonial, **When** they enter their statement text and select a name display option, **Then** they see a live preview matching exactly how it will appear on the course detail page.

3. **Given** a participant with a Clerk profile photo, **When** they submit a testimonial, **Then** the testimonial displays their profile photo alongside their statement and chosen name format.

4. **Given** a participant selecting name display format, **When** they choose from the available options, **Then** the system stores and displays the name according to their selection:
   - A) Full name and home city (e.g., "Max Mustermann, Berlin")
   - B) Full name only (e.g., "Max Mustermann")
   - C) First name and first letter of family name (e.g., "Max M.")
   - D) First name only (e.g., "Max")

5. **Given** a course detail page with published testimonials, **When** a visitor views the page, **Then** the testimonials appear beneath the "Termin und Preis" section with profile photo, formatted name, and statement text.

### Edge Cases

- What happens if a participant has no profile photo in Clerk? → Display a default avatar or initials.
- Can a participant edit or delete their testimonial after submission? → Edit anytime; no user delete (admin can hide).
- Is there a character limit for testimonial statements? → 1000 characters maximum.
- Are testimonials published immediately or require admin approval? → Admin approval required before public display.
- Can a participant submit multiple testimonials for the same course? → No, one testimonial per booking.
- What if the participant's home city is not available in their profile for option A? → Option A hidden/disabled; user selects from B/C/D.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST allow participants with a confirmed, completed booking to create a testimonial for the respective course.
- **FR-002**: System MUST provide a text input field for the testimonial statement on the course page within the user dashboard.
- **FR-003**: System MUST display the testimonial input form in a layout that mirrors the final display appearance on the course detail page (WYSIWYG preview).
- **FR-004**: System MUST allow participants to select their name display format from four options:
  - A) Full name and home city
  - B) Full name only
  - C) First name and first letter of family name
  - D) First name only
- **FR-005**: System MUST retrieve and display the participant's profile photo from Clerk if available.
- **FR-006**: System MUST display published testimonials on the course detail page beneath the "Termin und Preis" section.
- **FR-007**: System MUST associate each testimonial with both the participant and the specific course booking.
- **FR-008**: System MUST limit participants to one testimonial per course booking.
- **FR-009**: System MUST persist the selected name display format with the testimonial record.

### Non-Functional Requirements

- **NFR-001**: Testimonial input preview MUST visually match the display on the course detail page to ensure user confidence.
- **NFR-002**: Testimonial display MUST not negatively impact page load performance (respect Lighthouse budgets).

### Key Entities _(include if feature involves data)_

- **Testimonial**: Represents a participant's course review, containing:
  - Statement text (the testimonial content)
  - Name display format selection (A/B/C/D)
  - Reference to the participant (user)
  - Reference to the course booking
  - Reference to the course
  - Profile photo URL (cached from Clerk or null)
  - Publication status
  - Timestamps (created, updated)

## Dependencies

- Clerk authentication and profile data (profile photo, name, city)
- Existing booking system (to verify participant eligibility)
- Course detail page layout (for testimonial section placement)

## Review & Acceptance Checklist

_GATE: Automated checks run during main() execution_

### Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Execution Status

_Updated by main() during processing_

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed
