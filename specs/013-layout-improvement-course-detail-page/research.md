# Research: Course Detail Page Layout Improvement

**Feature**: 013-layout-improvement-course-detail-page  
**Date**: 2026-01-08  
**Status**: Complete

---

## 1. Mux Video Player Integration

### Decision
Use dynamic import of `@mux/mux-player-react` with SSR disabled, following the existing pattern in `SummaryAssetList.tsx`.

### Rationale
- Mux Player is already integrated in the project for Feature 016 (Course Assignments)
- Dynamic import prevents SSR hydration issues with the video player
- Skeleton loading state provides good UX during player initialization
- Browser autoplay policy requires muted autoplay, which Mux handles correctly

### Implementation Pattern
```typescript
const MuxPlayer = dynamic(
  () => import('@mux/mux-player-react').then(mod => mod.default),
  {
    ssr: false,
    loading: () => (
      <Skeleton variant='rectangular' width='100%' height={400} />
    ),
  }
);
```

### Configuration for Hero Video
- `autoPlay`: true (muted by default per browser policy)
- `muted`: true (required for autoplay)
- `loop`: true (15-30 second hero videos should loop)
- `playsInline`: true (required for iOS)
- `accentColor`: `#DDA853` (gold from design tokens)
- Fallback: Static image via `poster` attribute or separate `<Image>` component

### Alternatives Considered
| Option | Pros | Cons |
|--------|------|------|
| HTML5 Video | Simple, no dependency | No HLS, no analytics, manual streaming setup |
| Video.js | Full-featured | Large bundle, complex config |
| **Mux Player** ✓ | Already integrated, HLS built-in, analytics | Additional field in DB |

---

## 2. Full-Width Layout Pattern

### Decision
Use MUI `Box` without `Container` for full-width sections (Hero, Testimonials), and `Container maxWidth="lg"` for content sections.

### Rationale
- Spec requires edge-to-edge design for visual impact
- Existing `HeroSection.tsx` uses this pattern successfully
- Container inside Box allows constrained content within full-width backgrounds

### Implementation Pattern
```typescript
// Full-width section with contained content
<Box
  component="section"
  sx={{
    width: '100%',
    bgcolor: colors.cream,
    py: { xs: 6, md: 10 },
  }}
>
  <Container maxWidth="lg">
    {/* Constrained content here */}
  </Container>
</Box>

// True full-width (hero video)
<Box
  component="section"
  sx={{
    width: '100vw',
    position: 'relative',
    left: '50%',
    right: '50%',
    marginLeft: '-50vw',
    marginRight: '-50vw',
  }}
>
  {/* Edge-to-edge content */}
</Box>
```

### Section Layout Plan
| Section | Layout | Background |
|---------|--------|------------|
| Hero | Full-width | Video/Image |
| Overview | Container lg | Cream |
| Curriculum | Container lg | White |
| Dates/Pricing | Container lg | Sage (muted) |
| Testimonials | Full-width | Petrol |
| Final CTA | Full-width | Gold accent |

---

## 3. Design Token Centralization

### Decision
Create `lib/design-tokens.ts` as single source of truth, import in all components.

### Rationale
- Currently each component duplicates the colors object
- Centralization ensures consistency and easier updates
- TypeScript `as const` provides type safety

### Implementation
```typescript
// lib/design-tokens.ts
export const colors = {
  cream: '#FBF5DD',
  petrol: '#16404D',
  gold: '#DDA853',
  sage: '#A6CDC6',
  white: '#FFFFFF',
} as const;

export const typography = {
  heading: '"Playfair Display", serif',
  body: '"Inter", sans-serif',
} as const;

export const spacing = {
  sectionPy: { xs: 6, md: 10 },
  containerMaxWidth: 'lg',
} as const;
```

---

## 4. Multiple Booking CTAs Strategy

### Decision
Create reusable `BookingCTA` component with variants (primary, secondary, inline).

### Rationale
- CTAs appear in 3+ locations per spec: Hero, after Overview, after Pricing, Footer
- Consistent styling and behavior across all instances
- A/B testing capability for future optimization

### CTA Placements
1. **Hero Section**: Primary CTA, prominent gold button
2. **After Overview**: Secondary CTA, subtle petrol outline
3. **Dates/Pricing Section**: Primary CTA with price display
4. **Page Footer**: Full-width banner CTA

### Mobile Consideration (from Clarification)
- Keep inline CTA visible on mobile (no sticky footer)
- Ensure tap target ≥ 44px height
- Stack CTAs vertically on mobile

---

## 5. Curriculum Display Component

### Decision
Use MUI `Accordion` with `Table` inside for expandable daily schedules.

### Rationale
- Tabular format requested in clarifications (HH:MM - HH:MM format)
- Accordion allows multi-day courses to be scannable
- Paper styling with elevation for premium feel

### Format Example
```
Tag 1: Grundlagen
├── 09:00 - 09:20  Vorstellungsrunde
├── 09:20 - 10:00  Vorbereitungen besprechen
├── 10:00 - 10:15  Pause
└── 10:15 - 12:00  Verhandlungstechniken
```

### Component Structure
```typescript
<CurriculumSection modules={course.curriculum}>
  {modules.map(module => (
    <Accordion key={module.id}>
      <AccordionSummary>{module.title}</AccordionSummary>
      <AccordionDetails>
        <Table>
          {module.topics.map(topic => (
            <TableRow>
              <TableCell>{topic.timeRange}</TableCell>
              <TableCell>{topic.title}</TableCell>
            </TableRow>
          ))}
        </Table>
      </AccordionDetails>
    </Accordion>
  ))}
</CurriculumSection>
```

---

## 6. Testimonials with Success Indicators

### Decision
Use Card-based layout with success indicator text (no star ratings).

### Rationale
- Clarification specified success indicator text over star ratings
- Premium feel with quote styling
- Placeholder content until real testimonials available

### Success Indicator Format
```
"Nach dem Kurs habe ich meine erste Gehaltsverhandlung erfolgreich geführt 
und 15% mehr bekommen!"
— Lisa M., Senior Manager

✓ Erfolgsindikator: Gehaltssteigerung von 15%
```

### Placeholder Content Strategy
- 3 hardcoded testimonials in component for MVP
- Future: CMS integration or database model
- Each testimonial includes: quote, name, role, success metric

---

## 7. Database Schema Extension

### Decision
Add `heroVideoPlaybackId` field to Course model as optional String.

### Rationale
- Mux Playback IDs are strings (e.g., "xyw0xyx00D02TUYCpZjG6aKnHqI2tYTG00")
- Optional field allows gradual rollout (courses without video use fallback)
- No breaking change to existing data

### Migration
```prisma
model Course {
  // ... existing fields
  heroVideoPlaybackId String? @map("hero_video_playback_id")
}
```

---

## 8. Performance Considerations

### Video Loading Strategy
1. **Desktop**: Autoplay muted, preload metadata only
2. **Mobile**: Poster image, load video on user interaction
3. **Slow Connection**: Detect via Network Information API, show image fallback

### Lazy Loading
- Hero section: SSR for above-fold content
- Curriculum/Testimonials: Dynamic import with `loading` component
- Images: Next.js `<Image>` with priority for hero, lazy for below-fold

### Bundle Impact
- `@mux/mux-player-react`: ~45KB gzipped (already in bundle)
- No additional dependencies required

---

## Open Questions Resolved

| Question | Resolution |
|----------|------------|
| Mobile sticky CTA? | No - keep inline (Clarification) |
| Testimonial format? | Success indicator text, no stars (Clarification) |
| VAT display? | "inkl. 19% MwSt." (Clarification) |
| Curriculum format? | Tabular with HH:MM-HH:MM (Clarification) |
| New navigation? | No - keep existing (Clarification) |

---

## References

- [SummaryAssetList.tsx](../../components/participation/SummaryAssetList.tsx) - Mux integration pattern
- [HeroSection.tsx](../../components/landing/HeroSection.tsx) - Full-width layout pattern
- [Mux Setup Guide](../../docs/development/mux-setup.md) - Environment configuration
- [Feature Spec](./spec.md) - Full requirements and clarifications
