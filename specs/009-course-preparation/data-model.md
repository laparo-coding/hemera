# 009 – Course Preparation: Data Model (Draft)

Created: 2025-11-02

## Entities (Draft)

- Course: id, slug, title, description, status
- Unit: id, courseId, index, title, summary
- Asset: id, unitId, type (mdx, video, link), url/path, meta
- Progress (optional): userId, courseId, unitId, status

## Relationships

- Course 1..n Unit
- Unit 0..n Asset
