# Deprecation Cleanup: ESLint 9 + Transitives

This document outlines the plan for removing install-time deprecations and modernizing our lint
setup with minimal disruption. (Engine mismatch previously resolved.)

## Goals

- Eliminate engine mismatch warning (done in PR #127).
- Remove Husky v9 prepare deprecation (done in PR #127).
- Address npm deprecation warnings: `@human-who-codes/*`, `glob@7`, `rimraf@3`, `eslint@8`.

## Scope (Phase 1 — ESLint 9 Migration)

- Upgrade ESLint to v9 and migrate to flat config (`eslint.config.mjs`).
- Replace `.eslintrc.json` and nested overrides by equivalent flat-config rules.
- Keep rule parity where practical; defer new rule enablement (like stricter Next rules) to Phase 2.
- Update scripts: use `eslint .` with cache and CI flags.

### Proposed devDependencies changes

- eslint: ^9.x
- @eslint/js: ^9.x
- typescript-eslint: ^8.x (meta package)
- eslint-config-next: ^15.x (compatible with ESLint 9)

### Config draft (flat)

- Base: `@eslint/js` recommended
- Next: `@next/eslint-plugin-next` core-web-vitals
- TS: `typescript-eslint` with parser and project `tsconfig.json`
- Rules: preserve existing `no-console` policy and file-based overrides.
- Ignores: `.next`, node_modules, playwright reports, test-results.

### Risks

- New/changed rules may surface existing lint errors (acceptable for now — fix in follow-up or
  relax).
- Local tools that read `.eslintrc*` will need docs update.

## Scope (Phase 2 — Transitive deprecations)

- `glob@7` and `rimraf@3` come from transitive deps. Likely resolved by:
  - Updating eslint-related tooling and prettier plugins.
  - Consider Jest 30 → 30.x latest or 31 when stable (if it removes rimraf 3).
- If transitive deps persist, evaluate direct pin upgrades or replacements.

## Acceptance Criteria

- `npm install` emits no engine mismatch and no Husky deprecation warning.
- `npm install` deprecation list reduced; no direct deprecations from our own deps.
- `npm run lint:ci` executes with ESLint 9 flat config.

## Rollback Plan

- Keep `.eslintrc.json` in history; easy revert by restoring previous devDependencies and scripts.

## Task List

- [ ] Update devDependencies (ESLint 9 stack)
- [ ] Add `eslint.config.mjs` and remove `.eslintrc.json`
- [ ] Merge nested `.eslintrc.json` overrides into flat config
- [ ] Update scripts and husky hook invocation if needed
- [ ] Fix or suppress lint rule deltas minimally
- [ ] CI green
