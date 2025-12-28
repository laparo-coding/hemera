# Feature Specification: Course Assignments Participation Flow

**Feature Branch**: `016-course-assignments`  
**Created**: 2025-12-28  
**Status**: Draft  
**Input**: User description: "Users who book a course are participants... Separate the sections \"Preparation\", \"Summary\" and \"Debriefing\" and \"Results\"."

## Clarifications

### Session 2025-12-28
- Q: How should résumé uploads be managed for each course participation? → A: Allow one active résumé; new upload replaces the old.
- Q: Who is responsible for providing and maintaining the summary videos shown to participants? → A: Use MUX for videos.
- Q: If a course currently has no summary videos on Mux, what should participants see in the Summary step? → A: Hide the Summary step entirely until videos exist.
- Q: How should Mux summary assets be associated with courses? → A: Hybrid: course defaults with optional booking overrides.
- Q: Which roles may access a participant’s recorded preparation, debriefing, and results data? → A: Participant, instructors, and organizational admins/managers.

## User Scenarios & Testing _(mandatory)_

### Primary User Story

A booked participant signs in, selects a specific course in their personal space, and is guided through preparation, summary, debriefing, and results sections to capture required information, optionally upload a résumé, review video summaries, and revisit entries later.

### Acceptance Scenarios

1. **Given** a participant with a confirmed booking, **When** they open the course workspace and enter preparation responses, **Then** the system saves intention, desired results, and line manager characteristics tied to that booking and shows updated progress for the preparation section.
2. **Given** a participant who completed the course, **When** they open the debriefing section and document the planned salary discussion content, month, and final negotiation outcomes, **Then** the system stores the entries, marks debriefing and results as complete, and keeps them available for review in the personal space.
3. **Given** course summary videos are available, **When** a participant views the summary section, **Then** the system lists the curated videos and tracks that the summary resources were presented alongside navigation guidance toward the next section.

### Edge Cases

- What happens when a participant uploads multiple résumé versions or wants to remove an earlier upload? [NEEDS CLARIFICATION: permitted résumé upload count and replacement behavior]
- How does system handle missing summary videos for a course while still guiding participants through other sections? [NEEDS CLARIFICATION: fallback when no summary media exists]

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST provide authenticated participants with a course-specific workspace accessible from the personal user area for every active booking.
- **FR-002**: System MUST capture and persist preparation text fields covering course intention, desired post-course results, and line manager characteristics per booking.
- **FR-003**: System MUST allow participants to optionally upload, replace, or remove a résumé PDF associated with the booking while maintaining metadata for auditing, keeping only the latest résumé active.
- **FR-004**: System MUST display curated course summary video entries within the summary section, sourcing playback from Mux-managed assets, and confirm availability before marking the section complete.
- **FR-005**: System MUST enable participants to record debriefing information including planned salary discussion content and scheduled month.
- **FR-006**: System MUST enable participants to document outcomes of the salary negotiation within the results section and re-open entries for future reference.
- **FR-007**: System MUST present a guided multi-step interface that separates Preparation, Summary, Debriefing, and Results, highlighting completion state for each step, and automatically hides the Summary step when no Mux videos exist.
- **FR-008**: System MUST synchronize progress indicators and data availability so the personal dashboard reflects current completion status per phase.
- **FR-009**: System MUST ensure participants can review and edit previously submitted information while maintaining timestamps of latest updates.
- **FR-010**: System MUST enforce association of all captured information and files with both the participant profile and the specific booked course for auditability, while restricting access to the participant, assigned instructors, and organizational administrators/managers.

### Key Entities _(include if feature involves data)_

- **CourseParticipation Record**: Represents a participant’s lifecycle engagement for a single booking, storing preparation, summary viewing state, debrief inputs, results text, timestamps, status progression, and links to uploaded résumé metadata.
- **ParticipationDocument**: Represents optional participant-provided files (e.g., résumé PDF), capturing file metadata, upload timing, and associations to the CourseParticipation.
- **CourseSummaryAsset**: Represents Mux-hosted multimedia resources (e.g., video summaries) tied to a course, describing ordering, availability windows, and display metadata. Courses provide default assets while allowing optional booking-specific overrides.

## Review & Acceptance Checklist

_GATE: Automated checks run during main() execution_

### Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness

- [ ] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [ ] Dependencies and assumptions identified

## Execution Status

_Updated by main() during processing_

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [ ] Review checklist passed

