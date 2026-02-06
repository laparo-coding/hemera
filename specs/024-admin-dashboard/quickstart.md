# Quickstart: Admin Dashboard

**Feature**: 024-admin-dashboard
**Date**: 2026-02-04

## Prerequisites

- Node.js 20+
- PostgreSQL database running
- Clerk account with admin user configured
- Environment variables set (see `.env.example`)

## Quick Validation

### 1. Start Development Server

```bash
npm run dev
```

### 2. Access Admin Dashboard

Navigate to: `http://localhost:3000/admin`

**Expected**: 
- 3-column grid with 6 cards
- No footer visible
- No welcome message
- All text in German

### 3. Test Breadcrumb Navigation

1. Click on "Seminare" card
2. **Expected**: Breadcrumb shows "Admin Dashboard > Seminare"
3. Click "Admin Dashboard" in breadcrumb
4. **Expected**: Returns to main dashboard

### 4. Test Course Publish Toggle

1. Navigate to `/admin/courses`
2. Find any course in the list
3. Click the toggle switch in the "Status" column
4. **Expected**: 
   - Toggle changes state
   - Label shows "Veröffentlicht" or "Unveröffentlicht"
   - No page reload required

### 5. Test User Management

1. Click "Benutzer" card
2. **Expected**: Table of users with columns:
   - Name
   - E-Mail
   - Rolle
   - Outperformer
   - Letzte Anmeldung
   - Aktionen
3. Toggle "Nur Outperformer" filter
4. **Expected**: List filters to outperformer users only

### 6. Test Reports & Analytics

1. Click "Berichte & Analysen" card
2. **Expected**: Page shows:
   - System Health section with status indicators
   - Buchungsstatistiken
   - Kursauslastung
   - Benutzerwachstum
3. Click "Aktualisieren" button
4. **Expected**: Data refreshes without page reload

### 7. Test Location Management

1. Click "Veranstaltungsorte" card
2. **Expected**: 
   - No search field visible
   - Table layout matches Seminare style
   - Same column spacing and structure

## API Validation

### List Users

```bash
curl -X GET "http://localhost:3000/api/admin/users?page=1&limit=10" \
  -H "Authorization: Bearer $CLERK_TOKEN"
```

**Expected Response**:
```json
{
  "data": [
    {
      "id": "user_xxx",
      "email": "user@example.com",
      "fullName": "Max Mustermann",
      "role": "user",
      "isOutperformer": false,
      "createdAt": "2026-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  },
  "requestId": "req_xxx"
}
```

### Get Dashboard Stats

```bash
curl -X GET "http://localhost:3000/api/admin/reports/stats" \
  -H "Authorization: Bearer $CLERK_TOKEN"
```

**Expected Response**:
```json
{
  "data": {
    "bookings": {
      "total": 150,
      "confirmed": 120,
      "pending": 30,
      "thisMonth": 15
    },
    "revenue": {
      "total": 45000000,
      "thisMonth": 5000000,
      "currency": "EUR"
    },
    "courses": {
      "total": 8,
      "published": 5,
      "utilization": [...]
    },
    "users": {
      "total": 250,
      "newThisMonth": 20,
      "growth": [...]
    }
  },
  "requestId": "req_xxx"
}
```

## E2E Test Commands

```bash
# Run admin dashboard E2E tests
npx playwright test tests/e2e/admin-dashboard.spec.ts

# Run with UI
npx playwright test tests/e2e/admin-dashboard.spec.ts --ui
```

## Common Issues

### Issue: "Forbidden" when accessing admin
**Solution**: Ensure your Clerk user has `publicMetadata.role = 'admin'`

### Issue: User list empty
**Solution**: Check Clerk API key is valid and has Backend API access

### Issue: Stats show 0
**Solution**: Seed database with test data: `npm run db:seed`

## Definition of Done Checklist

- [ ] Dashboard shows 6 cards in 3-column grid
- [ ] Breadcrumb visible on all admin subpages
- [ ] Footer removed from admin layout
- [ ] Welcome message removed from dashboard
- [ ] All text in German
- [ ] Course publish toggle works
- [ ] User list displays Clerk users
- [ ] Outperformer filter works
- [ ] Reports page shows health + stats
- [ ] Location page has no search field
- [ ] All input fields have placeholder + helper text
