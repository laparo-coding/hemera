# Database setup options

Für Hemera benötigst du eine PostgreSQL‑Datenbank. Wähle eine der folgenden Optionen.

## Option A — Neon (empfohlen für Previews)

1. Projekt anlegen: [Neon](https://neon.tech) → neues Project → Database + Role werden erzeugt.
1. Connection Details öffnen → "Pooled" (Serverless Pooler) auswählen.
1. Verbindungs‑URL kopieren und den Schema‑Parameter ergänzen:

- `?sslmode=require&schema=hemera`

1. In `.env.local` setzen:

```bash
DATABASE_URL=postgres://USER:PASS@ep-xxxx-pooler.eu-central-1.aws.neon.tech/DBNAME?sslmode=require&schema=hemera
```

1. Migration + Seed lokal ausführen:

```bash
npx prisma migrate dev --name init
node prisma/seed.ts
```

Hinweis: Für Vercel solltest du ebenfalls die gepoolte DSN nutzen.

## Option B — Vercel Postgres (falls verfügbar)

1. Vercel Dashboard → Project → Storage → Postgres hinzufügen.
1. Unter "Connect" die Connection Pooling URL wählen (nicht die direkte).
1. In Project → Settings → Environment Variables `DATABASE_URL` setzen.
1. Lokal die Env synchronisieren (optional):

```bash
vercel env pull .env.local
```

1. Migration + Seed lokal ausführen:

```bash
npx prisma migrate dev --name init
node prisma/seed.ts
```

## Option C — Lokal per Docker Compose (empfohlen)

Die einfachste Methode für lokale Entwicklung nutzt Docker Compose mit persistenten Daten.

### Voraussetzungen

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installiert und gestartet

### Schnellstart

1. PostgreSQL Container starten:

```bash
npm run db:docker:start
```

2. `.env.local` setzen (oder von `.env.local.example` kopieren):

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/hemera?schema=hemera
```

3. Migration + Seed ausführen:

```bash
npm run db:migrate
npm run db:seed
```

4. Entwicklung starten:

```bash
npm run dev
```

### Docker-Befehle

| Befehl | Beschreibung |
|--------|--------------|
| `npm run db:docker:start` | Container starten (Port 5432) |
| `npm run db:docker:stop` | Container stoppen (Daten bleiben erhalten) |
| `npm run db:docker:reset` | Container und Daten löschen, neu starten |
| `npm run db:docker:logs` | Container-Logs anzeigen |

### Datenpersistenz

- Daten werden in einem Docker Volume (`hemera-postgres-data`) gespeichert
- `db:docker:stop` behält die Daten bei
- `db:docker:reset` löscht alle Daten und startet frisch

### Port-Konflikt (5432 belegt)

Falls Port 5432 bereits belegt ist:

1. In `docker-compose.yml` den Port ändern:
   ```yaml
   ports:
     - "5433:5432"  # Alternativer Port
   ```

2. `DATABASE_URL` in `.env.local` anpassen:
   ```bash
   DATABASE_URL=postgres://postgres:postgres@localhost:5433/hemera?schema=hemera
   ```

## Wo wird `DATABASE_URL` genutzt?

- `prisma/schema.prisma` → `datasource db` liest `env("DATABASE_URL")`.
- Prisma Migrations und Seed verwenden dieselbe URL.

## Troubleshooting

- SSL Fehler: Setze `sslmode=require` (Neon/Vercel) in der URL.
- Schema fehlt: Ergänze `schema=hemera` in der Query.
- Verbindungsfehler lokal: Prüfe Docker‑Container läuft (`docker ps`) und Port 5432 ist frei.
- Prisma schema validation / get-config (wasm): Stelle sicher, dass die richtige `.env` geladen ist.
  Verwende die npm‑Skripte:
  - `npm run db:status`
  - `npm run db:migrate`
  - `npm run db:deploy`
  - `npm run db:seed`

## Preview‑Datenbanken pro PR

- GitHub Actions Workflow: `.github/workflows/preview-db.yml`
- Erfordert GitHub Secret `PREVIEW_DATABASE_URL` (gepoolte Postgres‑DSN)
- Provisionierung: `scripts/preview/provision-db.js` erstellt ein Schema `hemera_pr_<PR>`, führt
  Migrationen und Seed aus.
- Teardown: `scripts/preview/teardown-db.js` löscht das Schema beim Schließen der PR.
