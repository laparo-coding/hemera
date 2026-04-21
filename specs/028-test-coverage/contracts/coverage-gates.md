# Coverage and CI Gate Contract (Spec 028)

**Date**: 2026-04-17 | **Plan**: [../plan.md](../plan.md)

## 1. Coverage Measurement Contract

Feature 028 must treat coverage as a combination of:

- global measurable improvement
- stronger coverage in named critical areas

### Coverage Sources

| Source | Purpose |
| ------ | ------- |
| Jest coverage (V8 provider) | Primary numeric coverage measurement |
| Contract test results | API behavior confidence |
| Playwright results | Critical journey confidence |

### Initial Scope Contract

| Scope | Required |
| ----- | -------- |
| Global coverage movement | Yes |
| Critical-area coverage movement | Yes |
| Backend logic | Yes |
| API behavior | Yes |
| Dashboard/authenticated journeys | Yes |

## 2. Critical-Area Contract

The first implementation increment must not focus on only one layer.

It must include a mixed-priority view across:

- business-critical backend logic
- API behavior
- dashboard or authenticated user journeys

## 3. CI Gate Contract

Feature 028 must result in CI-enforced quality gating.

### Gate Rollout

| Phase | Expectation |
| ----- | ----------- |
| Planning | CI gate direction defined |
| Implementation | Coverage checks wired into CI |
| Enforcement | Exact thresholds activated after baseline review |

### Hard Rules

- CI gating is in scope for this feature.
- Exact threshold numbers are intentionally deferred until baseline analysis is complete.
- Gate design must avoid rewarding low-value tests that inflate percentages without improving
  confidence.

## 4. Failure Contract

The future CI gate must fail when one or more of the following conditions are met:

- required coverage reports are missing
- agreed gate values are violated
- critical-area verification is missing for in-scope workstreams
- implementation increases test count without materially improving agreed confidence signals

## 5. Acceptance Signals

Feature 028 planning is contract-complete when:

- all test layers are explicitly in scope
- global and critical-area measurement are both required
- mixed initial priority is documented
- CI gating is mandatory
- exact thresholds are deferred to measured planning rather than guessed in advance
