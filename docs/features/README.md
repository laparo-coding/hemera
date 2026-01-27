# Hemera Academy - Feature Documentation

Zentrale Übersicht aller implementierten Features mit Verlinkung zur jeweiligen Dokumentation.

---

## Features Index

### ✅ Implementiert

#### 021 - Learning Path & PRE_BOOKED Workflow

**Status:** Production-Ready (UI-Komponenten fehlen noch)  
**Branch:** `021-learning-path`  
**Last Updated:** 2026-01-27

Strukturierte Kursabfolgen mit Voraussetzungsprüfung. Wenn Voraussetzungen fehlen, wird eine PRE_BOOKED-Buchung erstellt, die auf Admin-Genehmigung wartet.

**Dokumentation:**
- 📖 [Feature Overview](./021-learning-path/README.md)
- 🚀 [Quick Start Guide](./021-learning-path/QUICK_START.md)
- 📋 [Complete Workflow Documentation](./021-learning-path/PRE_BOOKED_APPROVAL_WORKFLOW.md)

**Kern-Features:**
- Prerequisite-Checking basierend auf Kurs-Level
- PRE_BOOKED Status für Admin-Review
- Email-Benachrichtigungen (Admin + Customer)
- Orchestrator-Pattern für komplexe Workflows
- 25 Unit-Tests + Contract-Tests

**TODO:**
- [ ] Admin-Dashboard für PRE_BOOKED Liste
- [ ] Customer UI für Status-Anzeige
- [ ] E2E-Tests

---

### 🚧 In Entwicklung

_(Keine Features aktuell in Entwicklung)_

---

### 📋 Geplant

_(Siehe `plans/` Verzeichnis für geplante Features)_

---

## Dokumentations-Struktur

```
docs/
├── features/                      # Feature-spezifische Dokumentation
│   ├── README.md                  # Dieser Index
│   └── 021-learning-path/         # Learning Path Feature
│       ├── README.md              # Feature-Übersicht & Navigation
│       ├── QUICK_START.md         # 5-Min Quick Start
│       └── PRE_BOOKED_APPROVAL_WORKFLOW.md  # Vollständige Workflow-Docs
├── api/                           # API-Dokumentation
├── auth/                          # Authentication & Authorization
├── development/                   # Entwicklungs-Guidelines
├── monitoring/                    # Monitoring & Error Tracking
├── ops/                           # Operations & Deployment
├── performance/                   # Performance-Guidelines
└── tests/                         # Test-Dokumentation
```

---

## Wie man Feature-Dokumentation hinzufügt

### Neue Feature-Dokumentation erstellen

1. **Verzeichnis erstellen:**
   ```bash
   mkdir docs/features/{feature-number}-{feature-name}
   ```

2. **Basis-Dateien erstellen:**
   - `README.md` - Feature-Übersicht mit Navigation
   - `QUICK_START.md` - Schnelleinstieg für Entwickler
   - `WORKFLOW.md` (optional) - Detaillierte Workflow-Beschreibung

3. **Index aktualisieren:**
   - Füge Feature zu diesem Index hinzu
   - Verlinke relevante Specs aus `specs/`

4. **Verlinkung:**
   - Von Code → Docs: `@see docs/features/...`
   - Von Docs → Code: Relative Pfade mit Zeilennummern
   - Von Docs → Tests: Verweise auf relevante Test-Dateien

### Template für Feature README.md

```markdown
# {Feature Name} - Feature Documentation

**Status:** {Implementiert/In Entwicklung/Geplant}
**Branch:** `{branch-name}`
**Last Updated:** {YYYY-MM-DD}

## Übersicht
{Kurze Beschreibung des Features}

## Dokumentations-Index
- [Quick Start Guide](./QUICK_START.md)
- [Workflow Documentation](./WORKFLOW.md)

## Kern-Komponenten
{Liste wichtigster Dateien}

## API Endpoints
{Liste der Endpoints}

## Status & TODOs
{Was fehlt noch?}
```

---

## Best Practices

### Dokumentations-Prinzipien

1. **Zielgruppen-orientiert:**
   - Quick Start für Entwickler, die schnell produktiv sein wollen
   - Vollständige Docs für tiefes Verständnis & Troubleshooting

2. **Code-Verlinkung:**
   - Immer relevante Code-Abschnitte verlinken (mit Zeilennummern)
   - `@see`-Kommentare im Code zu Docs hinzufügen

3. **Aktualität:**
   - "Last Updated" Datum pflegen
   - Bei Code-Änderungen Docs aktualisieren
   - TODO-Listen konsistent halten

4. **Beispiele:**
   - Code-Snippets für häufige Use Cases
   - Request/Response-Beispiele für APIs
   - Diagramme für komplexe Workflows

### Markdown-Konventionen

- **Überschriften:** `#` für Haupttitel, `##` für Abschnitte
- **Code-Blöcke:** Immer mit Sprache annotieren (```typescript)
- **Listen:** `-` für ungeordnete, `1.` für geordnete Listen
- **Tabellen:** Für strukturierte Übersichten
- **Emojis:** ✅ (done), ⚠️ (todo), 🚀 (quick start), 📖 (docs), 🧪 (tests)

---

## Weitere Dokumentations-Ressourcen

- [API Documentation](../api/)
- [Test Documentation](../tests/)
- [Performance Guidelines](../performance/)
- [Monitoring Setup](../monitoring/)

---

**Maintainer:** Development Team  
**Fragen?** Erstelle ein GitHub Issue mit Label `documentation`
