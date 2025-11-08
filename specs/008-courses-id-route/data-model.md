# Data model: Course

## Prisma model (example)

```prisma
model Course {
  id          String   @id @default(uuid())
  name        String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## Notes

- `id`: primary key, UUID
- `name`: course name
- `description`: optional description
- `createdAt`, `updatedAt`: timestamps
