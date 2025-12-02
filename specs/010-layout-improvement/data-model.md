# Data Model: Premium Feminine Layout Theme Configuration

**Feature Branch**: `010-layout-improvement`  
**Created**: December 1, 2025

## Theme Configuration

### Color Palette

```typescript
const hemeraColors = {
  // Primary colors
  cream: '#FBF5DD', // Primary background - warm ivory tone
  sage: '#A6CDC6', // Secondary - calming sage green
  petrol: '#16404D', // Dark - for text and headlines
  amber: '#DDA853', // Highlight/CTA - golden amber

  // Derived colors
  creamLight: '#FDFCF7', // Even lighter background for contrast
  creamDark: '#F5EDD0', // Slightly darker cream for sections
  sageLight: '#C5DDD8', // Lighter sage variant
  sageDark: '#8FBCB4', // Darker sage variant
  petrolLight: '#2A5A69', // Lighter petrol variant
  amberLight: '#E8C17A', // Lighter amber variant
  amberDark: '#C49542', // Darker amber variant
};
```

### Typography System

```typescript
const hemeraTypography = {
  // Headlines - Playfair Display (elegant, serif)
  h1: {
    fontFamily: 'Playfair Display, Georgia, serif',
    fontWeight: 700,
    fontSize: '3.5rem', // 56px
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
    color: hemeraColors.petrol,
  },
  h2: {
    fontFamily: 'Playfair Display, Georgia, serif',
    fontWeight: 600,
    fontSize: '2.5rem', // 40px
    lineHeight: 1.25,
    letterSpacing: '-0.01em',
    color: hemeraColors.petrol,
  },
  h3: {
    fontFamily: 'Playfair Display, Georgia, serif',
    fontWeight: 600,
    fontSize: '1.75rem', // 28px
    lineHeight: 1.3,
    color: hemeraColors.petrol,
  },

  // Body - Inter (modern, clean, readable)
  body1: {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontWeight: 400,
    fontSize: '1.125rem', // 18px
    lineHeight: 1.7,
    color: hemeraColors.petrol,
  },
  body2: {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontWeight: 400,
    fontSize: '1rem', // 16px
    lineHeight: 1.6,
    color: hemeraColors.petrol,
  },

  // Buttons & Labels
  button: {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontWeight: 500,
    fontSize: '0.9375rem', // 15px
    textTransform: 'none', // No uppercase
    letterSpacing: '0.02em',
  },
};
```

### Spacing System

```typescript
const hemeraSpacing = {
  // Generous whitespace for premium look
  section: {
    paddingY: '6rem', // 96px between sections
    paddingYMobile: '4rem', // 64px on mobile
  },
  container: {
    maxWidth: '1200px',
    paddingX: '2rem', // 32px horizontal
    paddingXMobile: '1.25rem', // 20px on mobile
  },
  component: {
    marginBottom: '2.5rem', // 40px
    marginBottomLarge: '4rem', // 64px
  },
};
```

---

## Component Configuration

### HeroSection

| Property      | Value                     | Description              |
| ------------- | ------------------------- | ------------------------ |
| Background    | `cream` (#FBF5DD)         | Warm background          |
| Headline      | Playfair h1, `petrol`     | Core message in German   |
| Subheadline   | Inter body1, `petrol`     | Informal "Du" addressing |
| CTA Primary   | `amber` bg, `petrol` text | "Entdecke die Kurse"     |
| CTA Secondary | `sage` outline            | "Mehr erfahren"          |
| Height        | min. 80vh                 | Prominent but scrollable |

### ConceptSection

| Property        | Value                 | Description                 |
| --------------- | --------------------- | --------------------------- |
| Background      | `creamDark` (#F5EDD0) | Slight contrast             |
| Headline        | Playfair h2, `petrol` | "Das Hemera-Konzept"        |
| Content         | Inter body1           | German texts, informal "Du" |
| Accent elements | `sage`                | Decorative lines            |

### CourseProgressionSection

| Property      | Value                             | Description                              |
| ------------- | --------------------------------- | ---------------------------------------- |
| Background    | `cream` (#FBF5DD)                 | Primary background                       |
| Section Title | Playfair h2                       | "Dein Weg zur erfolgreichen Verhandlung" |
| Course Layout | 3-column desktop, vertical mobile | Visual progression                       |

#### Course Cards (A, B, C)

| Course       | Badge Color | Badge Text         |
| ------------ | ----------- | ------------------ |
| **Course A** | `sage`      | "Grundkurs"        |
| **Course B** | `petrol`    | "Fortgeschrittene" |
| **Course C** | `amber`     | "Masterclass"      |

| Property        | Value                    | Description                       |
| --------------- | ------------------------ | --------------------------------- |
| Card Background | white                    | Stand out from section background |
| Border          | 1px `sage`               | Subtle border                     |
| Shadow          | subtle (0 4px 20px rgba) | Light shadow                      |
| Title           | Playfair h3              | Course name                       |
| Level Badge     | Colored per course       | Beginner/Advanced/Masterclass     |
| Description     | Inter body2              | Brief description                 |
| Dates           | Inter body2, `petrol`    | "Nächste Termine:" with dates     |
| CTA             | `amber` button           | "Zum Kurs" → Link to detail page  |

#### Progression Visualization

```
   Course A            Course B            Course C
┌──────────┐   →   ┌──────────┐   →   ┌──────────┐
│ Grundkurs│       │Fortge-   │       │Masterclass│
│          │       │schrittene│       │          │
└──────────┘       └──────────┘       └──────────┘
   Entry           Intermediate          Expert
```

- Visual connection through arrows or lines
- Gradual color intensity (Sage → Petrol → Amber)
- Numbering: A, B, C or 1, 2, 3

### Date Display per Course

| Property   | Value                                      |
| ---------- | ------------------------------------------ |
| Format     | "DD. Month YYYY" (e.g., "15. Januar 2025") |
| Max. Dates | 3 upcoming per course                      |
| Fallback   | "Termine in Planung"                       |
| Language   | German                                     |

### CTASection

| Property   | Value                      | Description                        |
| ---------- | -------------------------- | ---------------------------------- |
| Background | `sage` (#A6CDC6)           | Eye-catching closing               |
| Headline   | Playfair h2, `petrol`      | "Bereit für den nächsten Schritt?" |
| Text       | Inter body1, informal "Du" | Motivating text                    |
| CTA        | `amber` button, large      | "Jetzt starten"                    |

---

## MUI Component Overrides

### Button

```typescript
MuiButton: {
  styleOverrides: {
    root: {
      borderRadius: '8px',
      padding: '12px 28px',
      textTransform: 'none',
      fontWeight: 500,
      boxShadow: 'none',
      '&:hover': {
        boxShadow: '0 4px 12px rgba(22, 64, 77, 0.15)',
      },
    },
    containedPrimary: {
      backgroundColor: hemeraColors.amber,
      color: hemeraColors.petrol,
      '&:hover': {
        backgroundColor: hemeraColors.amberDark,
      },
    },
    outlinedSecondary: {
      borderColor: hemeraColors.sage,
      color: hemeraColors.petrol,
      '&:hover': {
        backgroundColor: 'rgba(166, 205, 198, 0.1)',
        borderColor: hemeraColors.sageDark,
      },
    },
  },
}
```

### Card

```typescript
MuiCard: {
  styleOverrides: {
    root: {
      borderRadius: '12px',
      border: `1px solid ${hemeraColors.sage}`,
      boxShadow: '0 4px 20px rgba(22, 64, 77, 0.08)',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 8px 30px rgba(22, 64, 77, 0.12)',
      },
    },
  },
}
```

### AppBar/Navigation

```typescript
MuiAppBar: {
  styleOverrides: {
    root: {
      backgroundColor: hemeraColors.cream,
      color: hemeraColors.petrol,
      boxShadow: '0 1px 0 rgba(22, 64, 77, 0.08)',
    },
  },
}
```

---

## Responsive Breakpoints

| Breakpoint | Value     | Adjustments                               |
| ---------- | --------- | ----------------------------------------- |
| Mobile     | < 600px   | 1 column, smaller fonts, vertical courses |
| Tablet     | 600-900px | 2 columns, medium fonts                   |
| Desktop    | > 900px   | 3 columns, full typography                |

---

## WCAG AA Contrast Matrix

| Text             | Background       | Ratio | Status          |
| ---------------- | ---------------- | ----- | --------------- |
| Petrol (#16404D) | Cream (#FBF5DD)  | 9.8:1 | ✅ AAA          |
| Petrol (#16404D) | Sage (#A6CDC6)   | 4.7:1 | ✅ AA           |
| Petrol (#16404D) | Amber (#DDA853)  | 4.5:1 | ✅ AA           |
| White            | Amber (#DDA853)  | 2.1:1 | ❌ Not for text |
| White            | Petrol (#16404D) | 9.3:1 | ✅ AAA          |

**Recommendation**: Petrol for all important text, amber only for buttons with petrol text.
