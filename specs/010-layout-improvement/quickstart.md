# Quickstart: Premium Feminine Layout for Hemera Academy

**Branch**: `010-layout-improvement`  
**Created**: December 1, 2025

---

## Quick Overview

### Goal

Transform the Hemera homepage into a premium, feminine **one-page design** with all relevant
information on a single page.

### Key Points

- **One-page concept**: All info on the homepage
- **Color palette**: Cream (#FBF5DD), Sage (#A6CDC6), Petrol (#16404D), Amber (#DDA853)
- **Fonts**: Playfair Display (headlines), Inter (body)
- **Language**: German with informal "Du" form
- **3 Courses**: A (Beginner) → B (Advanced) → C (Masterclass)
- **Dates**: Displayed directly with each course

---

## Starting the Project

```bash
# Checkout branch
git checkout 010-layout-improvement

# Install dependencies
npm install

# Start dev server
npm run dev
```

---

## Important Files

| File                  | Purpose                      |
| --------------------- | ---------------------------- |
| `lib/theme.ts`        | MUI theme with Hemera design |
| `lib/fonts.ts`        | Font configuration (NEW)     |
| `app/globals.css`     | CSS variables for colors     |
| `app/page.tsx`        | Homepage (one-page landing)  |
| `components/landing/` | Landing components (NEW)     |

---

## Color Palette

```css
:root {
  --hemera-cream: #fbf5dd; /* Background */
  --hemera-sage: #a6cdc6; /* Secondary, Course A */
  --hemera-petrol: #16404d; /* Text, Course B */
  --hemera-amber: #dda853; /* CTA, Course C */
}
```

---

## Course Structure

| Course       | Level                       | Badge Color      |
| ------------ | --------------------------- | ---------------- |
| **Course A** | Grundkurs (Beginner)        | Sage (#A6CDC6)   |
| **Course B** | Fortgeschrittene (Advanced) | Petrol (#16404D) |
| **Course C** | Masterclass                 | Amber (#DDA853)  |

Progression: **A → B → C** (visually represented with arrows)

---

## Page Structure (One-Page)

```
┌─────────────────────────────────────┐
│         NAVIGATION                  │
├─────────────────────────────────────┤
│         HERO SECTION                │
│   "Überzeuge mit deinen            │
│    vielschichtigen Kräften"        │
│   [Entdecke die Kurse] [Mehr...]   │
├─────────────────────────────────────┤
│         CONCEPT SECTION             │ ← #konzept
│   "Das Hemera-Konzept"             │
│   Du verdienst mehr...             │
├─────────────────────────────────────┤
│         COURSE PROGRESSION          │ ← #kurse
│   "Dein Weg zur erfolgreichen      │
│    Verhandlung"                    │
│                                     │
│   ┌─────┐  →  ┌─────┐  →  ┌─────┐  │
│   │Kurs │     │Kurs │     │Kurs │  │
│   │  A  │     │  B  │     │  C  │  │
│   │     │     │     │     │     │  │
│   │15.01│     │05.02│     │08.03│  │
│   └─────┘     └─────┘     └─────┘  │
├─────────────────────────────────────┤
│         CTA SECTION                 │
│   "Bereit für den nächsten Schritt?"│
│         [Jetzt starten]             │
└─────────────────────────────────────┘
```

---

## Language & Tone

- **Language**: German
- **Addressing**: Informal "Du" form (personal, inviting)
- **Examples**:
  - ✅ "Du verdienst mehr"
  - ✅ "Entdecke die Kurse"
  - ✅ "Dein Weg zur erfolgreichen Verhandlung"
  - ❌ "Sie verdienen mehr" (formal)
  - ❌ "Discover courses" (English)

---

## Running Tests

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# All tests
npm run test:all
```

---

## Next Steps

1. **T001**: Font configuration (`lib/fonts.ts`)
2. **T002**: CSS variables (`app/globals.css`)
3. **T003**: Theme configuration (`lib/theme.ts`)

See [tasks.md](./tasks.md) for complete task list.

---

## References

- [Spec](./spec.md) - Feature specification
- [Plan](./plan.md) - Implementation plan
- [Data Model](./data-model.md) - Theme configuration
- [Component Contracts](./contracts/landing-components.md) - Component interfaces
- [Color Palette](https://colorhunt.co/palette/fbf5dda6cdc616404ddda853) - colorhunt.co
