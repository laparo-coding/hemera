# Research: Dynamic course detail page `/courses/[id]`

## Next.js dynamic routing

- Use `[id]` in the App Router for dynamic pages
- `page.tsx` can access the ID via `params`

## Prisma integration

- Verify `Course` model: fields like `id`, `name`, `description`
- Query database via Prisma Client in a server component

## Error handling

- Show 404 page for invalid IDs
- Next.js: use `notFound()`

## UI

- Material UI Card for presentable layout

## Test

- Playwright E2E test for routing and rendering
