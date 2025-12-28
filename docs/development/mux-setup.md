# Mux & Résumé Upload Setup

## Required Packages

- `@vercel/blob` (already installed) for résumé storage in Vercel Blob.
- `@mux/mux-node` (install) for server-side asset management and playback ID retrieval.
- `@mux/mux-player-react` (install) for rendering Mux videos inside React components.

Install missing packages:

```bash
npm install @mux/mux-node @mux/mux-player-react
```

## Environment Variables

Add the following to `.env.local` (and Vercel environment) with least-privilege scopes:

- `MUX_TOKEN_ID` / `MUX_TOKEN_SECRET` – access token for Mux Video API.
- `MUX_WEBHOOK_SECRET` – validates incoming Mux webhooks (if used).
- `MUX_ENVIRONMENT` – label to distinguish environments (e.g., `development`, `production`).
- `NEXT_PUBLIC_MUX_ENV_KEY` – optional public key if using viewer analytics.
- `VERCEL_BLOB_READ_WRITE_TOKEN` – enables server uploads via Vercel Blob.

## Résumé Upload Rules

- Accept **PDF only** with max size **10 MB**.
- Enforce **single active résumé per booking** – new uploads must mark the old file inactive and remove shared access URL.
- Store file metadata (filename, size, mime type, blob key) for audit and cleanup.
- Trigger structured Rollbar logs for all upload/delete attempts including `userId`, `bookingId`, and `participationId` context.

## Mux Asset Management

- Store default course summary assets in Prisma `CourseSummaryAsset` records with Mux asset & playback IDs.
- Allow booking-level overrides via dedicated participation override table.
- Skip rendering the Summary step if neither defaults nor overrides exist.
- Log first-view timestamps to support progress tracking.

## Verification Checklist

1. `npm install` includes the Mux packages above and regenerates lockfile.
2. `.env.local` contains all required Mux and Vercel Blob secrets.
3. Upload attempts with invalid type/size raise validation errors and Rollbar events.
4. Summary assets render via `<MuxPlayer />` with playback IDs sourced from the database.
