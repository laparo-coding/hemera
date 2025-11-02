# Specification: Dynamic course detail page `/courses/[id]`

## Purpose

Provide a dynamic page that renders course details by ID from the database.

## Requirements

- Route: `/courses/[id]` (Next.js App Router)
- Data source: Prisma model `Course`
- Display: course name, description, and optional fields as needed
- Error handling: 404 for invalid/nonexistent ID
- UI: Material UI Card
- E2E test: validate routing and rendering

## Acceptance criteria

- Valid ID shows course details
- Invalid ID shows a not found page
- E2E test passes
- Quality gates: lint, typecheck, build, test
