# Feature Specification: Course Locations

**Feature Branch**: `015-course-locations`  
**Created**: 2025-12-22  
**Status**: Draft  
**Input**: User description: "Create a database object 'locations' to store venue/location information for courses including contact details and photos."

## Execution Flow (main)

```
1. Parse user description from Input
   ✓ Parsed: Database entity for storing location/venue information
2. Extract key concepts from description
   ✓ Actors: Administrators (manage locations), System (reference in courses)
   ✓ Actions: Create, Read, Update, Delete locations
   ✓ Data: Location entity with address, contact, and media fields
   ✓ Constraints: Follow established naming conventions
3. For each unclear aspect:
   ✓ All fields clearly defined
4. Fill User Scenarios & Testing section
   ✓ Completed
5. Generate Functional Requirements
   ✓ Completed
6. Identify Key Entities (if data involved)
   ✓ Location entity defined
7. Run Review Checklist
   ✓ All checks passed
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines

- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

---

## Clarifications

### Session 2025-12-23

- Q: How should the system extract website content and generate the description? → A: Manual entry only (website scanning feature deferred to Phase 2)
- Q: How should the system convert addresses to geo-coordinates for map display? → A: Nominatim API (free, OpenStreetMap-based); coordinates cached in DB
- Q: How should the location URL (slug) be generated? → A: Same system as Courses (auto-generated from name, unique)

---

## User Scenarios & Testing _(mandatory)_

### Primary User Story

As an administrator, I need to manage location information for courses so that students know where courses take place. Each location should store address details, contact information, and photos of the venue.

### Acceptance Scenarios

1. **Given** I am an authenticated administrator, **When** I create a new location with all required fields, **Then** the location is saved and can be referenced by courses

2. **Given** a location exists, **When** I view the location details, **Then** I see name, full address, contact information, and any uploaded images

3. **Given** a location is referenced by one or more courses, **When** I view those courses, **Then** the location details are displayed correctly

4. **Given** I am editing a location, **When** I update the address or contact information, **Then** all courses referencing this location reflect the updated information

5. **Given** a location has no courses assigned, **When** I delete the location, **Then** it is removed from the system

6. **Given** a location has courses assigned, **When** I attempt to delete it, **Then** the system prevents deletion and shows an appropriate message

### Edge Cases

- What happens when a location image URL is invalid or inaccessible?
- How does the system handle locations in different countries (address format)?
- Can multiple courses share the same location?

---

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST allow administrators to create new locations with name, address, and city as required fields
- **FR-002**: System MUST store optional contact information (email, phone, website) for each location
- **FR-003**: System MUST support storing URLs for location images (venue exterior and room interior)
- **FR-004**: System MUST allow locations to be reused across multiple courses
- **FR-005**: System MUST prevent deletion of locations that are referenced by existing courses
- **FR-006**: System MUST validate email format when provided
- **FR-007**: System MUST validate website URL format when provided
- **FR-008**: System MUST include timestamps (created, updated) for audit purposes

### Key Entities

#### Location Entity

| Field | Description | Required |
|-------|-------------|----------|
| id | Unique identifier | Yes (auto) |
| slug | URL-friendly identifier (auto-generated from name) | Yes (unique) |
| name | Display name of the venue | Yes |
| description | Brief description of the venue | No |
| address | Street address | Yes |
| zipCode | Postal/ZIP code | No |
| city | City name | Yes |
| email | Contact email address | No |
| phone | Contact telephone number | No |
| website | Website URL | No |
| imageUrl | URL to venue exterior image | No |
| roomImageUrl | URL to room/interior image | No |
| latitude | Geo-coordinate latitude (from Nominatim) | No |
| longitude | Geo-coordinate longitude (from Nominatim) | No |
| createdAt | Creation timestamp | Yes (auto) |
| updatedAt | Last update timestamp | Yes (auto) |

**Relationships:**
- A Location can be referenced by zero or more Courses (one-to-many)
- Courses reference Location via an optional foreign key

**Field Name Corrections Applied:**
- `telehphone` → `phone` (typo corrected, shortened for clarity)
- `photo_location` → `imageUrl` (consistent with thumbnailUrl pattern)
- `photo_room` → `roomImageUrl` (clearer naming)
- `zipcode` → `zipCode` (proper camelCase)

---

## Database Naming Convention Compliance

Following the established convention from `.github/copilot-instructions.md`:

| Prisma Field | Database Column |
|--------------|-----------------|
| `slug` | `slug` |
| `name` | `name` |
| `description` | `description` |
| `address` | `address` |
| `zipCode` | `zip_code` |
| `city` | `city` |
| `email` | `email` |
| `phone` | `phone` |
| `website` | `website` |
| `imageUrl` | `image_url` |
| `roomImageUrl` | `room_image_url` |
| `latitude` | `latitude` |
| `longitude` | `longitude` |
| `createdAt` | `created_at` |
| `updatedAt` | `updated_at` |

Table name: `locations` (snake_case plural)

---

## Technical Decisions

### Map Integration: React Leaflet + OpenStreetMap

**Decision**: Use React Leaflet with OpenStreetMap for all map functionality.

**Evaluated Options:**

| Option | Pros | Cons |
|--------|------|------|
| Google Maps Embed (`@next/third-parties`) | Native Next.js integration, familiar UX | API key required (costs), DSGVO concerns |
| **React Leaflet + OpenStreetMap** ✅ | Free, open-source, DSGVO-friendly, highly customizable | Requires dynamic import for SSR |

**Rationale:**
1. **Cost-effective**: No API fees, free for any usage volume
2. **DSGVO-compliant**: No data sent to Google, suitable for German market
3. **Matches FR-ADM-042**: Explicitly requires "open-source map service (e.g., OpenStreetMap/Leaflet)"
4. **High trust score**: Leaflet has Trust Score 9.5 with 1852 code snippets in Context7

**Implementation Notes:**
- Use `dynamic(() => import(...), { ssr: false })` for Next.js App Router compatibility
- Import Leaflet CSS: `import 'leaflet/dist/leaflet.css'`
- Components: `MapContainer`, `TileLayer`, `Marker`, `Popup` from `react-leaflet`

**Dependencies:**
```bash
npm install react-leaflet leaflet
npm install -D @types/leaflet
```

### Geocoding: Nominatim API

**Decision**: Use OpenStreetMap Nominatim API for address-to-coordinate conversion.

**Rationale:**
1. **OSM-Konsistenz**: Passt zur Leaflet/OpenStreetMap-Kartenentscheidung
2. **Kostenlos**: Keine API-Kosten
3. **Rate-Limit**: 1 Request/Sekunde (ausreichend für Admin-Nutzung)
4. **Caching**: Koordinaten werden in DB gespeichert (`latitude`, `longitude`) – Nominatim wird nur beim Speichern aufgerufen

**Fallback-Verhalten:**
- Wenn Geocoding fehlschlägt: Karte wird ausgeblendet, nur Adresse angezeigt
- Admin kann Location trotzdem speichern (Koordinaten bleiben null)

**API-Endpoint:**
```
https://nominatim.openstreetmap.org/search?q={address}&format=json&limit=1
```

---

## Part 2: Location Landing Page

### User Story

As a prospective student or course participant, I want to view detailed information about a course location so that I can plan my visit, understand what facilities are available, and navigate to the venue using my preferred maps application.

### Acceptance Scenarios

1. **Given** a location exists in the system, **When** I navigate to the location's landing page, **Then** I see the venue name prominently displayed

2. **Given** a location has address information, **When** I view the landing page, **Then** I see the full address including street, ZIP code, and city formatted clearly

3. **Given** a location has contact information, **When** I view the landing page, **Then** I see clickable email, phone, and website links that open appropriate applications

4. **Given** a location has a valid address, **When** I view the landing page, **Then** I see an embedded interactive map showing the location

5. **Given** a location has a valid address, **When** I want to navigate to the venue, **Then** I can choose between "Open in Apple Maps" and "Open in Google Maps" buttons

6. **Given** a location has exterior and/or room images, **When** I view the landing page, **Then** the images are displayed attractively showcasing the venue

7. **Given** a location has a description, **When** I view the landing page, **Then** I can read the description to understand what makes this venue special

8. **Given** I am viewing a course detail page, **When** that course has an assigned location, **Then** I can click through to view the location landing page

### Edge Cases (Landing Page)

- What happens when a location has no images? (Display gracefully without broken images)
- What happens when email or phone is not provided? (Hide those contact options)
- What happens when the address cannot be geocoded for the map? (Show address text, hide map or show error state)
- How does the page behave on mobile devices? (Responsive layout with touch-friendly map links)
- What happens when a user clicks Apple Maps link on an Android device? (Should fallback or show web version)

### Functional Requirements (Landing Page)

#### Display Requirements
- **FR-LP-001**: System MUST display the location name as the page title/heading
- **FR-LP-002**: System MUST display the location description when provided
- **FR-LP-003**: System MUST display the full address (street address, ZIP code, city) in a formatted block
- **FR-LP-004**: System MUST display contact information (email, phone, website) when provided
- **FR-LP-005**: System MUST render the exterior image (imageUrl) prominently when available
- **FR-LP-006**: System MUST render the room/interior image (roomImageUrl) when available

#### Map Integration
- **FR-LP-007**: System MUST embed an interactive map view using React Leaflet with OpenStreetMap tiles showing the location based on its address
- **FR-LP-008**: System MUST provide a clearly labeled button/link to "Open in Apple Maps"
- **FR-LP-009**: System MUST provide a clearly labeled button/link to "Open in Google Maps"
- **FR-LP-010**: Map links MUST open in a new browser tab/window or the native maps application

#### Contact Interactivity
- **FR-LP-011**: Email address MUST be a clickable mailto: link
- **FR-LP-012**: Phone number MUST be a clickable tel: link for mobile devices
- **FR-LP-013**: Website URL MUST be a clickable link opening in a new tab

#### Navigation & SEO
- **FR-LP-014**: Each location MUST have a unique, SEO-friendly URL (e.g., /locations/[slug])
- **FR-LP-015**: Page MUST include appropriate meta tags for search engines
- **FR-LP-016**: Courses referencing this location SHOULD link to the location landing page

#### Design & UX
- **FR-LP-017**: Page layout MUST use MUI components consistent with the site's design system
- **FR-LP-018**: Page MUST be fully responsive for mobile, tablet, and desktop viewports
- **FR-LP-019**: All images MUST have appropriate alt text for accessibility
- **FR-LP-020**: Map buttons MUST use recognizable icons (Apple Maps logo, Google Maps logo)

#### Mobile Optimization
- **FR-LP-021**: Page MUST be optimized as mobile-first design
- **FR-LP-022**: Touch targets (buttons, links) MUST be at least 44x44 pixels for easy tapping
- **FR-LP-023**: Images MUST be responsive and load optimized sizes for mobile bandwidth
- **FR-LP-024**: Map view MUST be touch-friendly with pinch-to-zoom support
- **FR-LP-025**: Phone number MUST be prominently displayed with large tap-to-call button on mobile
- **FR-LP-026**: Address MUST include a one-tap "Get Directions" action on mobile
- **FR-LP-027**: Page layout MUST stack content vertically on small screens
- **FR-LP-028**: Font sizes MUST be legible on mobile without zooming (minimum 16px body text)
- **FR-LP-029**: Page MUST load quickly on mobile networks (target < 3 seconds on 3G)

### Field Display Mapping

| Field | Display Usage |
|-------|---------------|
| name | Page title and main heading |
| description | Descriptive text section |
| address | Address block line 1 |
| zipCode | Address block with city |
| city | Address block line 2 |
| email | Contact section - clickable mailto link |
| phone | Contact section - clickable tel link |
| website | Contact section - clickable external link |
| imageUrl | Hero/featured image of venue exterior |
| roomImageUrl | Secondary image of interior/room |

---

## Part 3: Location Admin Page

### User Story

As an administrator, I want a dedicated admin page for managing locations so that I can create, edit, and delete venue information efficiently, similar to how I manage courses.

### Acceptance Scenarios

1. **Given** I am an authenticated administrator on the main admin page, **When** I look for location management, **Then** I see a clearly labeled link/button to access the Locations admin page

2. **Given** I am on the Locations admin page, **When** the page loads, **Then** I see a list of all existing locations with key information (name, city, address)

3. **Given** I am on the Locations admin page, **When** I click "Add New Location", **Then** I see a form with all location fields ready for input

4. **Given** I am creating a new location, **When** I fill in the required fields (name, address, city) and submit, **Then** the location is saved and appears in the list

5. **Given** I am viewing the locations list, **When** I click on a location row or edit button, **Then** I can edit all location fields

6. **Given** I am editing a location, **When** I save my changes, **Then** the updated information is persisted and reflected in the list

7. **Given** a location has no courses assigned, **When** I click delete and confirm, **Then** the location is removed from the system

8. **Given** a location has courses assigned, **When** I attempt to delete it, **Then** the system shows a warning indicating which courses reference this location and prevents deletion

9. **Given** I am on the Locations admin page, **When** I want to return to the main admin area, **Then** I can easily navigate back

### Edge Cases (Admin Page)

- What happens when the locations list is empty? (Show helpful message with "Add New" prompt)
- How is the list sorted? (Alphabetically by name, with option to sort by city)
- Can I search/filter locations? (Search by name or city)
- What happens if I navigate away with unsaved changes? (Warn user before leaving)

### Functional Requirements (Admin Page)

#### Navigation & Access
- **FR-ADM-001**: Main admin page MUST include a link/navigation item to the Locations admin page
- **FR-ADM-002**: Locations admin page MUST be accessible only to authenticated administrators
- **FR-ADM-003**: Page MUST provide clear navigation back to the main admin area

#### List View
- **FR-ADM-004**: System MUST display all locations in a tabular/list format
- **FR-ADM-005**: List MUST show at minimum: name, city, and address for each location
- **FR-ADM-006**: List SHOULD show the number of courses using each location
- **FR-ADM-007**: List MUST support sorting by name and city
- **FR-ADM-008**: List SHOULD support searching/filtering by name or city
- **FR-ADM-009**: Empty state MUST show a helpful message encouraging creation of first location

#### Create & Edit
- **FR-ADM-010**: System MUST provide a form to create new locations
- **FR-ADM-011**: System MUST provide a form to edit existing locations
- **FR-ADM-012**: Form MUST validate required fields (name, address, city) before submission
- **FR-ADM-013**: Form MUST validate email format when provided
- **FR-ADM-014**: Form MUST validate website URL format when provided
- **FR-ADM-015**: Form MUST show clear error messages for validation failures
- **FR-ADM-016**: Form MUST support image URL input for venue and room photos
- **FR-ADM-017**: System SHOULD warn user when navigating away with unsaved changes

#### "Add New Location" Workflow

When an administrator invokes "Add New Location", the system MUST provide a standard form for manual data entry.

**Phase 1 (MVP):**
- **FR-ADM-030**: System MUST provide a form with all location fields for manual entry
- **FR-ADM-031**: Form MUST validate required fields (name, address, city) before submission
- **FR-ADM-032**: Form MUST support image URL input for venue and room photos

**Phase 2 (Future Enhancement - Website Scanning):**
The following requirements are deferred to a future phase:
- ~~FR-ADM-033~~: System scans website for hero/banner image
- ~~FR-ADM-034~~: System displays detected hero image as venue image
- ~~FR-ADM-035~~: Admin can replace auto-detected image
- ~~FR-ADM-036~~: System compiles description from website content
- ~~FR-ADM-037~~: System inserts compiled description
- ~~FR-ADM-038~~: Admin can modify auto-generated description
- ~~FR-ADM-039~~: System extracts address, zipCode, city, phone, email from website
- ~~FR-ADM-040~~: All auto-populated fields are editable
- ~~FR-ADM-041~~: System indicates which fields were auto-populated

**Step 3: Map & Navigation**
- **FR-ADM-042**: System MUST generate a map preview using React Leaflet with OpenStreetMap tiles
- **FR-ADM-043**: System MUST auto-generate Apple Maps route link from the address
- **FR-ADM-044**: System MUST auto-generate Google Maps route link from the address
- **FR-ADM-045**: Map preview MUST update when address fields are modified

**Step 4: Room Image**
- **FR-ADM-046**: System MUST provide an upload function for the room/interior image (roomImageUrl)
- **FR-ADM-047**: Upload function MUST support common image formats (JPEG, PNG, WebP)
- **FR-ADM-048**: System SHOULD display a preview of the uploaded room image

**Fallback Behavior**
- ~~FR-ADM-049~~: Deferred to Phase 2
- ~~FR-ADM-050~~: Deferred to Phase 2
- ~~FR-ADM-051~~: Deferred to Phase 2

#### Delete
- **FR-ADM-018**: System MUST allow deletion of locations not referenced by any courses
- **FR-ADM-019**: System MUST prevent deletion of locations referenced by courses
- **FR-ADM-020**: When deletion is blocked, system MUST display which courses reference the location
- **FR-ADM-021**: Delete action MUST require confirmation before execution

#### Design & UX
- **FR-ADM-022**: Page layout MUST follow the same pattern as the Course admin page
- **FR-ADM-023**: Page MUST use MUI components consistent with the site's design system
- **FR-ADM-024**: Page MUST be fully responsive for tablet and desktop viewports
- **FR-ADM-025**: Actions (edit, delete) MUST be clearly visible and accessible for each list item

---

## Part 4: Locations API

### User Story

As a system component (admin page, landing page, or external integration), I need a well-defined API for managing locations so that all CRUD operations are handled consistently and securely.

### Acceptance Scenarios

1. **Given** an authenticated administrator, **When** a POST request is made with valid location data, **Then** a new location is created and returned with its ID

2. **Given** a valid location ID, **When** a GET request is made, **Then** the complete location data is returned

3. **Given** no specific ID, **When** a GET request is made to the list endpoint, **Then** all locations are returned

4. **Given** an authenticated administrator and valid location ID, **When** a PUT/PATCH request is made with updated data, **Then** the location is updated and the new data is returned

5. **Given** an authenticated administrator and a location with no course references, **When** a DELETE request is made, **Then** the location is deleted and a success response is returned

6. **Given** an authenticated administrator and a location with course references, **When** a DELETE request is made, **Then** the request is rejected with an error indicating the referencing courses

7. **Given** an unauthenticated user, **When** any mutating request (POST/PUT/PATCH/DELETE) is made, **Then** the request is rejected with a 401 Unauthorized response

8. **Given** a non-administrator authenticated user, **When** any mutating request is made, **Then** the request is rejected with a 403 Forbidden response

### Functional Requirements (API)

#### Endpoints
- **FR-API-001**: System MUST provide a GET endpoint to retrieve all locations
- **FR-API-002**: System MUST provide a GET endpoint to retrieve a single location by ID
- **FR-API-003**: System MUST provide a POST endpoint to create a new location
- **FR-API-004**: System MUST provide a PUT/PATCH endpoint to update an existing location
- **FR-API-005**: System MUST provide a DELETE endpoint to remove a location

#### Authentication & Authorization
- **FR-API-006**: All mutating endpoints (POST, PUT, PATCH, DELETE) MUST require authentication
- **FR-API-007**: All mutating endpoints MUST require administrator role
- **FR-API-008**: GET endpoints for public location data MAY be accessible without authentication
- **FR-API-009**: System MUST return 401 Unauthorized for unauthenticated mutating requests
- **FR-API-010**: System MUST return 403 Forbidden for non-admin mutating requests

#### Validation
- **FR-API-011**: API MUST validate required fields (name, address, city) on create/update
- **FR-API-012**: API MUST validate email format when provided
- **FR-API-013**: API MUST validate website URL format when provided
- **FR-API-014**: API MUST return 400 Bad Request with descriptive error messages for validation failures

#### Business Logic
- **FR-API-015**: DELETE endpoint MUST check for course references before deletion
- **FR-API-016**: DELETE endpoint MUST return 409 Conflict when location is referenced by courses
- **FR-API-017**: Error response for blocked deletion MUST include list of referencing course IDs/names
- **FR-API-018**: API MUST automatically set createdAt timestamp on creation
- **FR-API-019**: API MUST automatically update updatedAt timestamp on modification

**Note**: Delete operation MUST follow the same implementation pattern as the Course delete API, including:
- Same authorization checks
- Same error response format
- Same referential integrity validation approach
- Same confirmation/soft-delete behavior if applicable

#### Response Format
- **FR-API-020**: All responses MUST use consistent JSON format
- **FR-API-021**: Successful responses MUST include the location data
- **FR-API-022**: Error responses MUST include error code and human-readable message
- **FR-API-023**: List endpoint SHOULD support pagination for large datasets

---

## Review & Acceptance Checklist

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

---

## Execution Status

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked (none found)
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed
