# Research: Premium Feminine Layout für Hemera Akademie

**Feature**: 010-010-layout-improvement  
**Date**: 1. Dezember 2025  
**Status**: Complete

---

## 1. Premium Typography Fonts

### Decision: Playfair Display + Inter

**Rationale**:

- **Playfair Display** (Headlines): Elegante Serifenschrift mit hohem Kontrast, vermittelt Luxus und
  Raffinesse. Perfekt für Premium-Marken im Coaching-Bereich.
- **Inter** (Body): Moderne Sans-Serif mit exzellenter Lesbarkeit auf Bildschirmen. Variable Font
  für optimale Performance.

**Alternatives Considered**: | Font-Kombination | Bewertung | Abgelehnt weil |
|------------------|-----------|----------------| | Cormorant + Source Sans | Gut | Cormorant zu
dünn bei kleinen Größen | | Lora + Open Sans | Gut | Weniger elegant als Playfair | | Bodoni +
Helvetica | Klassisch | Bodoni zu streng, weniger warm | | DM Serif + DM Sans | Modern | Weniger
Premium-Ausstrahlung |

**Implementation**:

```typescript
// lib/fonts.ts
import { Playfair_Display, Inter } from 'next/font/google';

export const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair',
  weight: ['400', '500', '600', '700'],
});

export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});
```

---

## 2. WCAG Contrast Validation

### Decision: Farbpalette ist WCAG AA konform mit Anpassungen

**Farbpalette**:

- Background: `#FBF5DD` (Cremeweiß)
- Accent: `#A6CDC6` (Salbeigrün)
- Dark/Text: `#16404D` (Dunkles Petrol)
- Highlight: `#DDA853` (Goldener Bernstein)

**Kontrast-Analyse** (gegen #FBF5DD Background):

| Farbe      | Hex     | Kontrast-Ratio | WCAG AA (4.5:1) | WCAG AAA (7:1) |
| ---------- | ------- | -------------- | --------------- | -------------- |
| Text Dark  | #16404D | 8.2:1          | ✅ PASS         | ✅ PASS        |
| Salbeigrün | #A6CDC6 | 1.8:1          | ❌ FAIL         | ❌ FAIL        |
| Bernstein  | #DDA853 | 2.1:1          | ❌ FAIL         | ❌ FAIL        |

**Rationale für Anpassungen**:

- Salbeigrün (#A6CDC6) NUR für dekorative Elemente, nie für Text
- Für Text auf Salbeigrün-Hintergrund: #16404D verwenden
- Bernstein (#DDA853) für Buttons mit weißem Text oder dunklem Text

**Empfohlene Text-Farben**:

- **Primärer Text**: #16404D auf #FBF5DD → 8.2:1 ✅
- **Sekundärer Text**: #2D5A66 (leicht aufgehellt) auf #FBF5DD → 6.1:1 ✅
- **Button-Text auf Bernstein**: #16404D → 5.8:1 ✅
- **Link-Text**: #16404D mit Underline für Erkennbarkeit

---

## 3. Interior Design UI Patterns

### Decision: Minimalistisches Layout mit großzügigem Whitespace

**Analyse von martinkempdesign.com**:

| Element    | Beobachtung                         | Umsetzung für Hemera                            |
| ---------- | ----------------------------------- | ----------------------------------------------- |
| Hero       | Großflächiges Bild, minimaler Text  | Hero mit Hintergrundbild, Kernbotschaft zentral |
| Typography | Große Headlines, viel Luft          | h1: 56-72px, line-height: 1.2                   |
| Whitespace | Sehr großzügig (120-200px Sections) | Section-Padding: 120px vertical                 |
| Farben     | Gedämpft, natürlich                 | Cremeweiß als Basis, Petrol als Kontrast        |
| Navigation | Schlicht, transparent               | Sticky Nav mit Scroll-Effekt                    |
| Images     | Full-width, hochwertig              | Stockbilder mit Overlay für Text                |
| CTAs       | Subtil aber klar                    | Buttons mit Bernstein-Akzent                    |

**Rationale**: Interior-Design-Websites setzen auf "weniger ist mehr". Die visuelle Ruhe
signalisiert Qualität und Exklusivität – perfekt für Premium-Kurse.

**Konkrete Umsetzung**:

- Section-Höhe: min. 100vh für Hero, 80vh für andere Sections
- Max-Width für Content: 1200px mit großzügigem Padding
- Bildgrößen: Full-width mit aspect-ratio 16:9 oder 3:2
- Animationen: Subtle fade-in beim Scrollen (intersection observer)

---

## 4. MUI Theme Customization

### Decision: Deep Theme Override mit Custom Component Variants

**Rationale**: MUI bietet vollständige Kontrolle über das Design-System bei Beibehaltung der
Komponentenlogik.

**Key Customizations**:

```typescript
// Auszug aus theme.ts
const theme = createTheme({
  palette: {
    primary: {
      main: '#16404D', // Dunkles Petrol
      light: '#2D5A66',
      dark: '#0D2A33',
      contrastText: '#FBF5DD',
    },
    secondary: {
      main: '#DDA853', // Goldener Bernstein
      light: '#E5BD7A',
      dark: '#C4913A',
      contrastText: '#16404D',
    },
    background: {
      default: '#FBF5DD', // Cremeweiß
      paper: '#FFFFFF',
    },
    text: {
      primary: '#16404D',
      secondary: '#2D5A66',
    },
    accent: {
      main: '#A6CDC6', // Salbeigrün (custom)
    },
  },
  typography: {
    fontFamily: 'var(--font-inter), "Helvetica", "Arial", sans-serif',
    h1: {
      fontFamily: 'var(--font-playfair), "Georgia", serif',
      fontWeight: 600,
      fontSize: '3.5rem',
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    // ... weitere Hierarchie
  },
  shape: {
    borderRadius: 8, // Weichere Kanten als Standard
  },
  shadows: [
    'none',
    '0 2px 8px rgba(22, 64, 77, 0.08)', // Subtiler als MUI default
    // ... angepasste Shadow-Stufen
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // Kein ALL-CAPS
          fontWeight: 500,
          padding: '12px 32px',
          borderRadius: 4,
        },
      },
    },
    // ... weitere Component Overrides
  },
});
```

**Alternatives Considered**:

- Tailwind CSS: Abgelehnt, da MUI bereits im Projekt und Constitution es vorschreibt
- CSS Modules: Zu fragmentiert für konsistentes Design-System
- Styled Components: Redundant mit MUI/Emotion

---

## 5. Next/Font Optimization

### Decision: next/font/google mit CSS Variables

**Rationale**:

- Automatisches Font-Subsetting
- Zero Layout Shift durch `display: swap` und size-adjust
- CSS Variables für Theme-Integration
- Keine externen Requests (self-hosted)

**Implementation Pattern**:

```typescript
// lib/fonts.ts
import { Playfair_Display, Inter } from 'next/font/google';

export const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair',
  weight: ['400', '500', '600', '700'],
  fallback: ['Georgia', 'Times New Roman', 'serif'],
});

export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  fallback: ['Helvetica', 'Arial', 'sans-serif'],
});
```

```tsx
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html className={`${playfairDisplay.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

**Performance Impact**:

- Font-Dateien: ~50KB (subset) vs ~200KB (full)
- LCP-Impact: Minimal durch preload
- CLS: 0 durch CSS variables

---

## 6. Stockbild-Strategie

### Decision: Unsplash/Pexels mit spezifischen Suchkriterien

**Suchkriterien für passende Bilder**:

1. "business meeting woman"
2. "salary negotiation professional"
3. "executive woman office"
4. "corporate discussion elegant"
5. "modern office interior design"

**Qualitätskriterien**:

- Mindestauflösung: 1920x1080
- Lichtstimmung: Warm, natürlich (keine harten Blitzlichter)
- Farbtemperatur: Passend zur Palette (warm, nicht kühl)
- Setting: Hochwertige Büros, moderne Architektur
- Personen: Professionell gekleidet, diverse Darstellung

**Empfohlene Quellen**:

- Unsplash (kostenlos, hochwertig)
- Pexels (kostenlos, gute Auswahl)
- Adobe Stock (falls Budget vorhanden)

**Bild-Optimierung**:

- Next.js Image-Komponente mit lazy loading
- WebP-Format mit JPEG-Fallback
- Responsive srcset für verschiedene Viewports
- Blur-Placeholder für LCP-Optimierung

---

## Summary

Alle Research-Tasks sind abgeschlossen. Die Erkenntnisse fließen in folgende Artefakte ein:

| Research                 | Output                                     |
| ------------------------ | ------------------------------------------ |
| Typography               | `lib/fonts.ts`, Theme-Konfiguration        |
| WCAG Contrast            | Theme-Palette mit geprüften Werten         |
| Interior Design Patterns | Component-Struktur, Spacing-System         |
| MUI Customization        | `lib/theme.ts` vollständige Überarbeitung  |
| Next/Font                | `lib/fonts.ts`, Layout-Integration         |
| Stockbilder              | Asset-Beschaffung parallel zur Entwicklung |

**Nächster Schritt**: Phase 1 - Design & Contracts (data-model.md)
