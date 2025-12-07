# Performance Contracts

This feature does not introduce new API endpoints. Performance contracts are defined as Lighthouse
CI assertions.

## Lighthouse CI Performance Contract

The following performance budgets are enforced via Lighthouse CI in GitHub Actions:

```yaml
# .github/workflows/deploy.yml - Performance Gate
- name: Lighthouse CI
  run: npx @lhci/cli autorun
```

## Assertions (lighthouserc.js)

| Metric                   | Type  | Threshold | Action        |
| ------------------------ | ----- | --------- | ------------- |
| first-contentful-paint   | warn  | 1800ms    | Warning in CI |
| largest-contentful-paint | error | 2500ms    | Fail CI       |
| cumulative-layout-shift  | error | 0.1       | Fail CI       |
| total-blocking-time      | warn  | 200ms     | Warning in CI |
| interactive              | warn  | 3800ms    | Warning in CI |

## Component Loading Contract

### Critical Path Components (must load < 500ms)

- `Navigation` - Header navigation
- `Hero` - Landing page hero section
- Primary CTA buttons

### Deferred Components (load after FCP)

- `MonitoringInit` - Rollbar initialization
- Below-fold sections via lazy loading

## Test Contracts

See `tests/e2e/performance.spec.ts` for E2E performance validation.
