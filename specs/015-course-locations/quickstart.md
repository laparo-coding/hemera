# Quickstart: Course Locations

**Feature**: 015-course-locations
**Date**: 2025-12-23

## Prerequisites

1. Development environment running (`npm run dev`)
2. Admin user authenticated via Clerk
3. Database migrated with Location model

## Test Scenarios

### Scenario 1: Create a Location (Admin)

**Steps**:
1. Navigate to `/admin/locations`
2. Click "Neue Location hinzufügen"
3. Fill in required fields:
   - Name: "Yoga Studio Berlin"
   - Adresse: "Torstraße 123"
   - Stadt: "Berlin"
4. Fill in optional fields:
   - PLZ: "10119"
   - E-Mail: "info@yoga-studio.de"
   - Telefon: "+49 30 12345678"
   - Website: "https://yoga-studio.de"
5. Click "Speichern"

**Expected Result**:
- Location appears in list
- Slug generated: `yoga-studio-berlin`
- Coordinates populated (if Nominatim successful)
- Success toast displayed

**Validation**:
```bash
# Check via API
curl http://localhost:3000/api/locations | jq '.locations[0]'
```

---

### Scenario 2: View Location Landing Page (Public)

**Steps**:
1. Navigate to `/locations/yoga-studio-berlin`

**Expected Result**:
- Page title: "Yoga Studio Berlin"
- Address block displayed:
  ```
  Torstraße 123
  10119 Berlin
  ```
- Contact section with clickable links:
  - Email: mailto link
  - Phone: tel link
  - Website: external link
- Interactive map showing location marker
- "In Apple Maps öffnen" button
- "In Google Maps öffnen" button

**Mobile Check**:
- Open on mobile device/emulator
- Verify tap-to-call works
- Verify map is touch-friendly
- Verify layout stacks vertically

---

### Scenario 3: Edit Location (Admin)

**Steps**:
1. Navigate to `/admin/locations`
2. Click edit icon on "Yoga Studio Berlin"
3. Change address to "Friedrichstraße 456"
4. Click "Speichern"

**Expected Result**:
- Location updated in list
- New coordinates fetched from Nominatim
- Map on landing page shows new location

---

### Scenario 4: Delete Blocked (Referential Integrity)

**Precondition**: Create a Course that references "Yoga Studio Berlin"

**Steps**:
1. Navigate to `/admin/locations`
2. Click delete icon on "Yoga Studio Berlin"
3. Confirm deletion

**Expected Result**:
- Error dialog displayed: "Location wird von Kursen verwendet"
- List of referencing courses shown
- Location NOT deleted

---

### Scenario 5: Delete Location (No References)

**Precondition**: Location has no courses assigned

**Steps**:
1. Navigate to `/admin/locations`
2. Click delete icon on unused location
3. Confirm deletion

**Expected Result**:
- Confirmation dialog shown
- After confirm: Location removed from list
- Success toast displayed

---

### Scenario 6: Map Navigation Buttons

**Steps**:
1. Navigate to `/locations/yoga-studio-berlin`
2. Click "In Apple Maps öffnen"
3. Click "In Google Maps öffnen"

**Expected Result**:
- Apple Maps button: Opens `maps.apple.com` with address
- Google Maps button: Opens `maps.google.com` with address
- Both open in new tab

**Button URLs**:
```
Apple:  https://maps.apple.com/?address=Torstraße+123,+10119+Berlin
Google: https://www.google.com/maps/search/?api=1&query=Torstraße+123,+10119+Berlin
```

---

### Scenario 7: Geocoding Failure Handling

**Steps**:
1. Create location with invalid address: "XYZ123 Nowhere"
2. Save location

**Expected Result**:
- Location saved successfully
- Latitude/Longitude remain null
- On landing page: Map hidden, address text shown
- No error displayed to user

---

### Scenario 8: Empty State (No Locations)

**Precondition**: No locations in database

**Steps**:
1. Navigate to `/admin/locations`

**Expected Result**:
- Empty state message: "Noch keine Locations vorhanden"
- Prominent "Erste Location erstellen" button

---

## API Contract Tests

### List Locations (GET /api/locations)

```bash
# Public - no auth required
curl -X GET http://localhost:3000/api/locations

# Expected: 200 OK
# { "locations": [...], "total": 1 }
```

### Create Location (POST /api/locations)

```bash
# Requires admin auth
curl -X POST http://localhost:3000/api/locations \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Location",
    "address": "Teststraße 1",
    "city": "Berlin"
  }'

# Expected: 201 Created
# { "id": "...", "slug": "test-location", ... }
```

### Update Location (PUT /api/locations/{id})

```bash
curl -X PUT http://localhost:3000/api/locations/$LOCATION_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Location",
    "address": "Neue Straße 2",
    "city": "München"
  }'

# Expected: 200 OK
```

### Delete Location (DELETE /api/locations/{id})

```bash
# Without references
curl -X DELETE http://localhost:3000/api/locations/$LOCATION_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Expected: 204 No Content

# With references
# Expected: 409 Conflict
# { "error": "Location is referenced by courses", "referencingCourses": [...] }
```

### Unauthorized Access

```bash
# No auth header
curl -X POST http://localhost:3000/api/locations \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "address": "Test", "city": "Test"}'

# Expected: 401 Unauthorized
```

---

## Acceptance Criteria Checklist

| # | Criterion | Test Scenario |
|---|-----------|---------------|
| 1 | Admin can create location | Scenario 1 |
| 2 | Public can view landing page | Scenario 2 |
| 3 | Admin can edit location | Scenario 3 |
| 4 | Delete blocked with references | Scenario 4 |
| 5 | Delete allowed without references | Scenario 5 |
| 6 | Map navigation buttons work | Scenario 6 |
| 7 | Graceful geocoding failure | Scenario 7 |
| 8 | Empty state displayed | Scenario 8 |
| 9 | Slug auto-generated | Scenario 1 |
| 10 | Mobile-responsive layout | Scenario 2 (mobile) |
