# Tasks: 002-public-seo-pages

Branch: `002-public-seo-pages`  
Scope: Public pages (landing, courses) with SSG/ISR, SEO meta/OG/JSON-LD, sitemap/robots.  
Note: Follow Constitution v1.7.0 (Public vs Non-Public). Tests first (TDD).

## Pre-flight

- [ ] T000 Constitution check reaffirmed (Public only, SEO critical).  
  Files: `/.specify/memory/constitution.md`, `specs/002-public-seo-pages/plan.md`

## Tests first

- [ ] T001 Create E2E tests for public pages SEO (Playwright) [P]  
  Files: `tests/e2e/public-seo.spec.ts`  
  Assert: `/` and `/courses` have title, description, OG tags, JSON-LD presence; status 200.
- [ ] T002 Create E2E tests for sitemap and robots [P]  
  Files: `tests/e2e/sitemap-robots.spec.ts`  
  Assert: `/sitemap.xml` includes only public routes; `/robots.txt` allows public crawl; no
  non-public patterns.
- [ ] T003 Unit tests for metadata builders (if extracted) [P]  
  Files: `tests/unit/seo-metadata.spec.ts`  
  Assert: functions build expected meta fields and JSON-LD snippets.

## Implementation (make tests pass)

- [ ] T010 Implement landing page route with SSG  
  Files: `app/(routes)/page.tsx`  
  Include: `generateMetadata` with title/description/OG; inject JSON-LD as needed.
- [ ] T011 Implement courses page route with ISR (revalidate 300s)  
  Files: `app/(routes)/courses/page.tsx`  
  Include: `export const revalidate = 300;` and `generateMetadata` + JSON-LD.
- [ ] T012 Implement sitemap and robots for public routes  
  Files: `app/sitemap.ts`, `app/robots.ts`  
  Ensure: include `/`, `/courses`; exclude non-public paths; correct robots policy.
- [ ] T013 Extract SEO helpers (optional) [P]  
  Files: `app/lib/seo.ts`  
  Helpers to compose meta and JSON-LD (used by pages and tests).

## Quality gates & docs

- [ ] T020 Docs: Update feature README/plan with revalidate values and SEO coverage  
  Files: `specs/002-public-seo-pages/plan.md`
- [ ] T021 CI docs gates pass (markdown lint, spelling DE/EN, link check)  
  Files: `.github/workflows/docs-quality.yml`, `.markdownlint.json`, `cspell.json`,
  `.lychee.toml`
- [ ] T022 Optional note: add Lighthouse/SEO manual check in PR description template  
  Files: `.github/PULL_REQUEST_TEMPLATE.md`

## Done criteria

- Public pages render via SSG/ISR with correct meta/OG/JSON-LD.
- Sitemap/robots reflect only public routes.
- E2E and unit tests green; docs gates green.
