# Contributing Guide

Thank you for contributing! Please follow these operational requirements in addition to code style
and tests.

## Operational Requirements

- Live-monitor Deploy workflows using the GitHub Actions VS Code extension (constitutional
  requirement):
  - Keep the run view open, follow logs until completion.
  - Verify final status and capture the deployment URL.
  - Review artifacts (e.g., Playwright report) when present.
- Branch hygiene after merge and successful production deploy:
  - Remove obsolete local and remote branches (keep `main`).
  - Document branch cleanup briefly in the PR or run notes.

## Qodo PR Review Process (Constitutional Requirement)

**After opening a pull request, ALWAYS:**

1. Wait for Qodo bots to post their reviews (qodo-code-review, qodo-free-for-open-source-projects)
2. Read the **PR Compliance Guide** comment for security issues (🔴 = must fix)
3. Read the **PR Code Suggestions** comment for improvements
4. Fix all 🔴 (red) compliance issues before merging
5. Consider implementing suggested code improvements (especially security-related)

**Common Qodo issues to watch for:**
- Error handling without context
- Sensitive data in logs
- Hardcoded values that should be dynamic
- Missing input validation
- Transaction/atomicity concerns

## Development

- Follow the specs-first workflow under `specs/`.
- Ensure Quality Gates pass locally (lint, typecheck, build, tests) before opening a PR.
- Use Stripe in test mode only during development.

## Security

- Never commit secrets or real API keys. Real secret-bearing `.env*` files (e.g. `.env.local`, `.env.production`) must not be committed.
- Committed example files that contain only placeholders and explanatory comments (for example `.env.example` or `.env.local.example`) are allowed and recommended to document required variables and formats.
- Use GitHub Secrets and environment management workflows to store runtime secrets.
