# Research: Course Locations

**Feature**: 015-course-locations
**Date**: 2025-12-23

## Research Summary

All technical decisions have been documented in the feature specification after the `/clarify` session.

## 1. Map Integration

**Decision**: React Leaflet with OpenStreetMap

**Rationale**:
- Free and open-source (no API costs)
- DSGVO-compliant (no data sent to Google)
- Consistent with German market requirements
- High trust score (Leaflet: 9.5 in Context7)

**Alternatives Considered**:
| Option | Evaluated | Rejected Because |
|--------|-----------|------------------|
| Google Maps Embed | Yes | API costs, DSGVO concerns |
| Mapbox | No | Similar cost structure to Google |

**Implementation**:
```bash
npm install react-leaflet leaflet
npm install -D @types/leaflet
```

**Next.js SSR Compatibility**:
```tsx
import dynamic from 'next/dynamic'

const LocationMap = dynamic(
  () => import('@/components/LocationMap'),
  { ssr: false }
)
```

## 2. Geocoding (Address to Coordinates)

**Decision**: Nominatim API (OpenStreetMap)

**Rationale**:
- Free with no API key required
- Consistent with OSM/Leaflet ecosystem
- Rate limit (1 req/sec) acceptable for admin-only usage
- Coordinates cached in database (latitude, longitude fields)

**Alternatives Considered**:
| Option | Evaluated | Rejected Because |
|--------|-----------|------------------|
| Google Geocoding API | Yes | API costs, requires billing |
| Mapbox Geocoding | No | Similar cost structure |
| Manual coordinates | Yes | Poor UX for admins |

**API Endpoint**:
```
GET https://nominatim.openstreetmap.org/search
  ?q={address}, {city}, Germany
  &format=json
  &limit=1
```

**Fallback Behavior**:
- If geocoding fails: Save location without coordinates
- On landing page: Hide map, show address text only

## 3. URL Slug Generation

**Decision**: Auto-generate from location name (same as Course entity)

**Rationale**:
- Consistency with existing Course pattern
- SEO-friendly URLs
- No additional admin effort

**Implementation Pattern** (from existing Course):
```typescript
import slugify from 'slugify'

const slug = slugify(name, { lower: true, strict: true })
```

## 4. Website Scanning (Deferred)

**Decision**: Manual entry only for MVP (Phase 1)

**Rationale**:
- Website structures vary greatly (unreliable extraction)
- KI-APIs add complexity and costs
- Low location volume (~10-50) makes manual entry acceptable
- Feature can be added in Phase 2 if demand exists

**Deferred Requirements**:
- FR-ADM-033 through FR-ADM-041
- FR-ADM-049 through FR-ADM-051

## 5. Image Storage

**Decision**: URL-only storage (matching Course.thumbnailUrl pattern)

**Rationale**:
- Consistent with existing Course pattern
- No additional blob storage complexity
- Admin provides URLs from existing hosting

**Future Enhancement** (if needed):
- FR-ADM-046/047 define upload capability
- Can use Vercel Blob or existing upload infrastructure

## Dependencies Summary

| Package | Version | Purpose |
|---------|---------|---------|
| react-leaflet | ^5.0.0 | React components for Leaflet |
| leaflet | ^1.9.4 | Map library |
| @types/leaflet | ^1.9.x | TypeScript definitions |
| slugify | existing | URL slug generation |

## No Outstanding Unknowns

All NEEDS CLARIFICATION items from Technical Context have been resolved:
- ✅ Map library chosen
- ✅ Geocoding approach defined
- ✅ Slug generation pattern established
- ✅ Website scanning deferred with clear scope

---

**Next Phase**: Phase 1 - Design & Contracts
