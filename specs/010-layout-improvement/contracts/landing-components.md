# Landing Page Components Contract

**Feature Branch**: `010-layout-improvement`  
**Version**: 1.1  
**Updated**: December 1, 2025

---

## Overview

The landing page uses a **One-Page concept**: All information about Hemera is displayed on the
homepage. All texts are in **German** and use the **informal "Du" form**.

### Component Hierarchy

```
app/page.tsx (One-Page Landing)
├── HeroSection
├── ConceptSection
├── CourseProgressionSection
│   ├── CourseCard (Course A - Beginner)
│   ├── CourseCard (Course B - Advanced)
│   └── CourseCard (Course C - Masterclass)
└── CTASection
```

---

## HeroSection

### Props Interface

```typescript
interface HeroSectionProps {
  /** Headline - core message (German) */
  headline: string;
  /** Subheadline - supporting text (informal "Du") */
  subheadline: string;
  /** Primary CTA button text */
  ctaPrimaryText: string;
  /** Primary CTA link (anchor to courses) */
  ctaPrimaryHref: string;
  /** Optional secondary CTA text */
  ctaSecondaryText?: string;
  /** Secondary CTA link (anchor to concept) */
  ctaSecondaryHref?: string;
  /** Optional: Hero image */
  heroImage?: {
    src: string;
    alt: string;
  };
}
```

### Example Content (German, informal "Du")

```typescript
const heroContent: HeroSectionProps = {
  headline: 'Überzeuge mit deinen vielschichtigen Kräften',
  subheadline:
    'Erreiche dein Verhandlungsziel auf kooperative Art. Die Hemera Akademie begleitet dich auf deinem Weg zu erfolgreichen Gehaltsverhandlungen.',
  ctaPrimaryText: 'Entdecke die Kurse',
  ctaPrimaryHref: '#kurse',
  ctaSecondaryText: 'Mehr erfahren',
  ctaSecondaryHref: '#konzept',
};
```

### Design Specs

| Property      | Value                        |
| ------------- | ---------------------------- |
| Min-Height    | `80vh`                       |
| Background    | `#FBF5DD` (cream)            |
| Text Color    | `#16404D` (petrol)           |
| Headline Font | Playfair Display, 3.5rem     |
| Primary CTA   | `#DDA853` bg, `#16404D` text |
| Secondary CTA | `#A6CDC6` outline            |

---

## ConceptSection

### Props Interface

```typescript
interface ConceptSectionProps {
  /** Section ID for anchor navigation */
  id?: string;
  /** Headline (German) */
  headline: string;
  /** Main text blocks (informal "Du") */
  paragraphs: string[];
  /** Optional: Highlight box */
  highlight?: {
    title: string;
    text: string;
  };
  /** Optional: Feature list */
  features?: Array<{
    icon?: React.ReactNode;
    title: string;
    description: string;
  }>;
}
```

### Example Content (German, informal "Du")

```typescript
const conceptContent: ConceptSectionProps = {
  id: 'konzept',
  headline: 'Das Hemera-Konzept',
  paragraphs: [
    'Du verdienst mehr – und weißt es auch. Bei Hemera lernst du, wie du deine Gehaltsverhandlung selbstbewusst und erfolgreich führst.',
    'Unsere Methode verbindet strategisches Wissen mit praktischen Übungen. Du entwickelst nicht nur Verhandlungskompetenzen, sondern auch das Selbstvertrauen, diese einzusetzen.',
  ],
  highlight: {
    title: 'Unsere Mission',
    text: 'Wir unterstützen Frauen dabei, ihren wahren Marktwert zu erkennen und durchzusetzen.',
  },
  features: [
    {
      title: 'Praxisorientiert',
      description: 'Du übst in realistischen Szenarien und erhältst direktes Feedback.',
    },
    {
      title: 'Wissenschaftlich fundiert',
      description: 'Unsere Methoden basieren auf aktueller Verhandlungsforschung.',
    },
    {
      title: 'Persönlich begleitet',
      description: 'Kleine Gruppen ermöglichen individuelle Betreuung.',
    },
  ],
};
```

### Design Specs

| Property        | Value                                 |
| --------------- | ------------------------------------- |
| Background      | `#F5EDD0` (creamDark)                 |
| Headline Font   | Playfair Display, 2.5rem              |
| Body Font       | Inter, 1.125rem                       |
| Accent Elements | `#A6CDC6` (sage)                      |
| Padding         | `6rem 0` (Desktop), `4rem 0` (Mobile) |

---

## CourseProgressionSection

### Props Interface

```typescript
interface CourseProgressionSectionProps {
  /** Section ID for anchor navigation */
  id?: string;
  /** Section headline (German) */
  headline: string;
  /** Subheadline (informal "Du") */
  subheadline?: string;
  /** Array of three courses in order A, B, C */
  courses: CourseCardProps[];
  /** Show progression arrows between courses */
  showProgression?: boolean;
}

interface CourseCardProps {
  /** Course ID for link to detail page */
  courseId: string;
  /** Course identifier: A, B, or C */
  level: 'A' | 'B' | 'C';
  /** Level designation */
  levelLabel: 'Grundkurs' | 'Fortgeschrittene' | 'Masterclass';
  /** Course title (German) */
  title: string;
  /** Brief description (German, informal "Du") */
  description: string;
  /** Upcoming course dates (max. 3) */
  upcomingDates: CourseDate[];
  /** Link to detail page */
  detailHref: string;
  /** CTA text for button */
  ctaText?: string;
}

interface CourseDate {
  /** Start date */
  date: Date;
  /** Formatted date (e.g., "15. Januar 2025") */
  formattedDate: string;
  /** Available spots (optional) */
  availableSpots?: number;
}
```

### Example Content (German, informal "Du")

```typescript
const coursesContent: CourseCardProps[] = [
  {
    courseId: 'kurs-a',
    level: 'A',
    levelLabel: 'Grundkurs',
    title: 'Grundlagen der Gehaltsverhandlung',
    description:
      'Du lernst die Basics: Vorbereitung, Timing und die wichtigsten Verhandlungstechniken für deinen Einstieg.',
    upcomingDates: [
      { date: new Date('2025-01-15'), formattedDate: '15. Januar 2025' },
      { date: new Date('2025-02-12'), formattedDate: '12. Februar 2025' },
    ],
    detailHref: '/courses/kurs-a',
    ctaText: 'Zum Grundkurs',
  },
  {
    courseId: 'kurs-b',
    level: 'B',
    levelLabel: 'Fortgeschrittene',
    title: 'Strategien für Fortgeschrittene',
    description:
      'Du vertiefst deine Techniken und lernst, auch in schwierigen Situationen souverän zu verhandeln.',
    upcomingDates: [
      { date: new Date('2025-02-05'), formattedDate: '5. Februar 2025' },
      { date: new Date('2025-03-19'), formattedDate: '19. März 2025' },
    ],
    detailHref: '/courses/kurs-b',
    ctaText: 'Zum Aufbaukurs',
  },
  {
    courseId: 'kurs-c',
    level: 'C',
    levelLabel: 'Masterclass',
    title: 'Masterclass: Komplexe Verhandlungen',
    description:
      'Du meisterst anspruchsvolle Verhandlungssituationen und entwickelst deinen persönlichen Verhandlungsstil.',
    upcomingDates: [{ date: new Date('2025-03-08'), formattedDate: '8. März 2025' }],
    detailHref: '/courses/kurs-c',
    ctaText: 'Zur Masterclass',
  },
];
```

### Design Specs - Section

| Property           | Value                                  |
| ------------------ | -------------------------------------- |
| Background         | `#FBF5DD` (cream)                      |
| Headline Font      | Playfair Display, 2.5rem               |
| Layout             | 3-columns (Desktop), 1-column (Mobile) |
| Gap                | `2rem` between course cards            |
| Progression Arrows | SVG arrows between cards               |

### Design Specs - CourseCard

| Property         | Course A         | Course B           | Course C          |
| ---------------- | ---------------- | ------------------ | ----------------- |
| Badge Color      | `#A6CDC6` (sage) | `#16404D` (petrol) | `#DDA853` (amber) |
| Badge Text       | "Grundkurs"      | "Fortgeschrittene" | "Masterclass"     |
| Badge Text Color | `#16404D`        | `#FFFFFF`          | `#16404D`         |

| Property        | Value                               |
| --------------- | ----------------------------------- |
| Card Background | `#FFFFFF`                           |
| Border          | `1px solid #A6CDC6`                 |
| Border Radius   | `12px`                              |
| Shadow          | `0 4px 20px rgba(22, 64, 77, 0.08)` |
| Title Font      | Playfair Display, 1.75rem           |
| Body Font       | Inter, 1rem                         |
| CTA Button      | `#DDA853` bg, `#16404D` text        |

### Date Display

| Property    | Value                     |
| ----------- | ------------------------- |
| Label       | "Nächste Termine:"        |
| Max. Dates  | 3 per course              |
| Date Format | "DD. Month YYYY" (German) |
| Fallback    | "Termine in Planung"      |
| Font        | Inter, 0.875rem           |
| Color       | `#16404D` (petrol)        |

---

## CTASection

### Props Interface

```typescript
interface CTASectionProps {
  /** Headline (German) */
  headline: string;
  /** Subtext (German, informal "Du") */
  subtext: string;
  /** CTA button text */
  ctaText: string;
  /** CTA link */
  ctaHref: string;
}
```

### Example Content (German, informal "Du")

```typescript
const ctaContent: CTASectionProps = {
  headline: 'Bereit für den nächsten Schritt?',
  subtext:
    'Starte jetzt mit dem Grundkurs und lege den Grundstein für erfolgreiche Gehaltsverhandlungen.',
  ctaText: 'Jetzt starten',
  ctaHref: '#kurse',
};
```

### Design Specs

| Property      | Value                               |
| ------------- | ----------------------------------- |
| Background    | `#A6CDC6` (sage)                    |
| Text Color    | `#16404D` (petrol)                  |
| Headline Font | Playfair Display, 2.5rem            |
| Body Font     | Inter, 1.125rem                     |
| CTA Button    | `#DDA853` bg, `#16404D` text, large |
| Padding       | `6rem 0`                            |
| Text Align    | Center                              |

---

## Anchor Navigation

The One-Page uses anchor links for navigation:

| Anchor     | Target Section           |
| ---------- | ------------------------ |
| `#konzept` | ConceptSection           |
| `#kurse`   | CourseProgressionSection |

---

## Responsive Behavior

### Desktop (> 900px)

- Courses: 3-column side by side
- Progression arrows visible
- Full font sizes

### Tablet (600-900px)

- Courses: 2-column (Course C alone in row 2)
- Progression arrows vertical
- Slightly reduced font sizes

### Mobile (< 600px)

- Courses: 1-column, vertically stacked
- Progression arrows as vertical line
- Compact font sizes
- Touch-optimized CTAs (min. 48px height)

---

## Accessibility

- All texts meet WCAG AA contrasts
- Focus states for all interactive elements
- Semantic HTML (section, article, nav)
- Skip link to courses
- Alt texts for all images
