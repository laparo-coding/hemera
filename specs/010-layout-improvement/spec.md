# Feature Specification: Premium Feminine Layout for Hemera Academy

**Feature Branch**: `010-layout-improvement`  
**Created**: December 1, 2025  
**Status**: Draft  
**Input**: User description: "Premium feminine layout for Hemera Academy – Transformation from
functional tech-look to a premium, harmonious design in interior architecture style"

## Execution Flow (main)

```
1. Parse user description from Input
   → SUCCESS: Comprehensive description provided
2. Extract key concepts from description
   → Actors: Women in professional environment (premium segment)
   → Actions: Book courses, understand concept, acquire negotiation skills
   → Data: 3 progressive courses for salary negotiation
   → Constraints: Keep Material Design, add premium feel
3. For each unclear aspect:
   → All clarified
4. Fill User Scenarios & Testing section
   → SUCCESS: User flows defined
5. Generate Functional Requirements
   → SUCCESS: Requirements testable
6. Identify Key Entities
   → SUCCESS: Design entities identified
7. Run Review Checklist
   → SUCCESS: All checks passed
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines

- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

---

## Context & Objectives

### Current State

The current Hemera layout is functional and technically oriented. It primarily appeals to tech-savvy
individuals and does not convey the premium feel and exclusivity required by the academy's premium
pricing segment.

### Target State

A premium, feminine layout that:

- Conveys the atmosphere of a design-oriented interior architect's office (Reference:
  martinkempdesign.com)
- Uses harmoniously coordinated colors
- Radiates professionalism and elegance for the target audience (women in senior professional
  positions)
- **Presents ALL relevant information on the homepage (one-page concept)**:
  - Hemera concept and philosophy
  - Three courses with their respective dates
  - Clear course progression (Beginner → Advanced → Masterclass)

### Core Message

**"Convince with your multifaceted strengths and achieve your negotiation goal in a cooperative
way."** (German: "Überzeuge mit deinen vielschichtigen Kräften und erreiche dein Verhandlungsziel
auf kooperative Art.")

### Scope Definition

- ✅ **In Scope**: Homepage with all Hemera information and course overview including dates
- ❌ **Out of Scope**: Course detail pages (already implemented), separate course calendar (not
  required)
- ℹ️ Booking is done via existing course detail pages

---

## Course Structure

### The Three Hemera Courses

| Course       | Name                              | Level        | Description                               |
| ------------ | --------------------------------- | ------------ | ----------------------------------------- |
| **Course A** | Grundkurs (Beginner)              | Entry        | Fundamentals of salary negotiation        |
| **Course B** | Fortgeschrittenen-Kurs (Advanced) | Intermediate | Advanced strategies and techniques        |
| **Course C** | Masterclass                       | Expert       | Expert knowledge for complex negotiations |

### Course Progression

Courses build upon each other: **A → B → C**

Each course displays on the homepage:

- Course title and brief description
- Level indicator (Beginner/Advanced/Masterclass)
- Next available dates
- Link to course detail page (for booking)

---

## User Scenarios & Testing _(mandatory)_

### Primary User Story

As a **professional woman in senior management**, I want to immediately understand when visiting the
Hemera website that this is a **premium academy for salary negotiations**, and I want to find **all
important information on one page**, so I can quickly decide which course is suitable for me.

### Acceptance Scenarios

1. **Given** a visitor opens the Hemera homepage, **When** she sees the page for the first time,
   **Then** she perceives the design as premium, professional, and inviting (not technical or cold)

2. **Given** a visitor is on the homepage, **When** she scrolls, **Then** she finds **all
   information about Hemera** on this one page (concept, courses, dates)

3. **Given** a visitor wants to see course offerings, **When** she reaches the course section,
   **Then** she immediately recognizes the three progressive courses (**Beginner A → Advanced B →
   Masterclass C**) and their next dates

4. **Given** a visitor wants to book a course, **When** she clicks on a course, **Then** she reaches
   the existing course detail page where she can book

5. **Given** a visitor is looking for a suitable date, **When** she views the courses on the
   homepage, **Then** she sees the next dates **directly with each course** (no separate calendar
   needed)

6. **Given** a visitor reads the texts, **When** she consumes the content, **Then** all texts are in
   **German** and use the **informal "Du" form** for personal addressing

### Edge Cases

- What happens when a course has no upcoming dates? → Display "Dates in planning" with option to
  express interest
- How does the layout look on mobile devices? → Same premium feel, courses stacked vertically
- How does the design appear to colorblind users? → Contrast ratios must meet WCAG AA

---

## Requirements _(mandatory)_

### Functional Requirements – Language & Addressing

- **FR-001**: All texts MUST be written in **German**
- **FR-002**: All texts MUST use the **informal "Du" form** (personal, direct addressing)

### Functional Requirements – Color Scheme & Visual Identity

- **FR-003**: The system MUST use a harmoniously coordinated color scheme that radiates warmth,
  professionalism, and feminine elegance
- **FR-004**: The system MUST use the following color palette (Source:
  colorhunt.co/palette/fbf5dda6cdc616404ddda853):
  - **Primary Background**: `#FBF5DD` (Cream/Ivory) – warm, elegant base tone
  - **Secondary/Accent**: `#A6CDC6` (Sage Green/Mint) – calming, professional
  - **Dark/Text**: `#16404D` (Dark Petrol) – for headlines and important text
  - **Highlight/CTA**: `#DDA853` (Golden Amber) – for call-to-actions and accents
- **FR-005**: The system MUST ensure sufficient contrast for readability (WCAG AA compliant)

### Functional Requirements – Typography

- **FR-006**: The system MUST use premium typography that combines elegance and readability
- **FR-007**: Headlines MUST have a clear visual hierarchy with appropriate font sizes and weights
- **FR-008**: Typography MUST be readable on all screen sizes

### Functional Requirements – Imagery

- **FR-009**: The system MUST display high-quality images of professional conversation situations in
  elegant office environments
- **FR-010**: Images MUST predominantly show women in negotiation or conversation situations with
  male counterparts
- **FR-011**: The imagery MUST reflect situations reminiscent of salary and negotiation
  conversations
- **FR-012**: Images MUST be high-quality stock photos that match the interior design style

### Functional Requirements – Homepage (One-Page Concept)

- **FR-013**: The homepage MUST contain **all relevant Hemera information** on one page
- **FR-014**: The homepage MUST have a prominent hero area with the core message
- **FR-015**: The homepage MUST have a detailed concept section explaining Hemera's philosophy
- **FR-016**: Visitors MUST be able to grasp the core message and character of Hemera without
  scrolling
- **FR-017**: The homepage MUST provide a clear call-to-action to the course section
- **FR-018**: A separate course calendar is NOT required – dates are displayed with the courses

### Functional Requirements – Course Display on Homepage

- **FR-019**: The homepage MUST clearly display the three courses with their progression:
  - **Course A**: Grundkurs (Beginner/Entry)
  - **Course B**: Fortgeschrittenen-Kurs (Advanced/Intermediate)
  - **Course C**: Masterclass (Expert)
- **FR-020**: The three courses MUST be visually recognizable as progressive levels (A → B → C)
- **FR-021**: Each course MUST display the following information:
  - Course title and level designation
  - Brief description
  - Next available dates (directly with course)
  - Link to course detail page
- **FR-022**: The course progression MUST be visually clear (e.g., through numbering, arrows, or
  stepped display)
- **FR-023**: Clicking on a course MUST lead to the existing course detail page (booking there)

### Functional Requirements – Material Design Integration

- **FR-024**: The system MUST continue to use Material Design components as a base
- **FR-025**: Material Design components MUST be visually customized to convey premium feel
- **FR-026**: Buttons and interactive elements MUST match the premium look

### Functional Requirements – Whitespace & Layout

- **FR-027**: The layout MUST use generous whitespace to convey premium feel and calm
- **FR-028**: Content MUST be separated with appropriate spacing
- **FR-029**: The layout MUST appear equally premium on desktop and mobile

---

### Key Entities

- **Color Palette**: Defined set of primary, secondary, and accent colors
- **Typography System**: Hierarchy of font families, sizes, and weights
- **Imagery Guidelines**: Specifications for style, subjects, and quality
- **Course Model**:
  - **Course A** = Grundkurs (Beginner/Entry)
  - **Course B** = Fortgeschrittenen-Kurs (Advanced/Intermediate)
  - **Course C** = Masterclass (Expert)
- **Concept Section**: Explanation of Hemera philosophy and methodology
- **Date Display**: Course dates displayed directly with each course

---

## Review & Acceptance Checklist

### Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focus on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections filled

### Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remaining
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Scope is clearly defined
- [x] Dependencies and assumptions identified

---

## Clarified Points

1. ✅ **Color Palette**: Set to colorhunt.co/palette/fbf5dda6cdc616404ddda853
2. ✅ **Image Source**: High-quality stock photos
3. ✅ **Page Structure**: One-page concept – all info on homepage
4. ✅ **Course Calendar**: Not required – dates shown with courses
5. ✅ **Course Structure**: A=Beginner, B=Advanced, C=Masterclass
6. ✅ **Language**: German, informal "Du" form
7. ✅ **Booking**: Via existing course detail pages (not part of this spec)

---

## Execution Status

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed

---
