---
description: Evaluates operational PR readiness including local checks, open reviews, branch protection, and tightly scoped bypass exceptions.
---

# PR Operations Governance Prompt

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before execution when it is not empty.

## Task

Assess the operational readiness of a pull request or a specific change.

Do not stay in plan-only mode once the request can be validated locally. Work in execution mode.

## Goal

Provide a defensible conclusion covering:

- whether the change is merge-ready
- which blockers are still open
- which local checks were actually executed
- whether review or branch-protection requirements are still missing
- whether a bypass is excluded, unnecessary, or only defensible as a justified exception

## Required Flow

1. Determine the affected change scope.
2. Identify the smallest meaningful local validation.
3. Check open review comments and unresolved PR conversations.
4. Compare the status against branch-protection requirements.
5. Only then summarize the readiness status.

## Local Checks

Use this priority order:

1. focused tests for the affected scope
2. focused lint or typecheck for the affected scope
3. relevant build or runtime check
4. broader project checks only when the narrower check is insufficient

If checks cannot be executed, document:

- which check is missing
- why it could not be run
- which risk remains open because of that gap

## Review And Conversation Rules

Before recommending merge:

- treat open PR conversations as blockers until they are answered, implemented, or explicitly dismissed
- distinguish informational comments from true merge blockers
- fix locally verifiable defects directly when that is within the current assignment

## Branch Protection

Only declare a change merge-ready when the objective protection requirements are satisfied.

At minimum, when enabled in the repository, this includes:

- required status checks
- required reviews
- no blocking open conversations
- no other protected merge blockers

If anything is missing, name the exact missing condition.

## Bypass Rule

A bypass is only acceptable as a documented exception.

Only consider it when:

1. there is a concrete exception reason
2. the bypassed protection requirements are explicitly named
3. the residual risk is described briefly
4. a responsible approval role can be named
5. mandatory follow-up work is defined

If a bypass is being considered, always document:

- exception reason
- bypassed protection rule
- risk
- approving role or person
- mandatory follow-up work

## Output Format

Respond concisely and operationally with exactly these points:

1. Status: merge-ready, not merge-ready, or bypass-only
2. Blockers: concrete open issues
3. Verification: executed checks and results
4. Review status: open or resolved conversations
5. Next action: smallest meaningful next step

## Do Not

- ignore open review threads
- downplay branch protection
- present a bypass as a standard path
- run broad checklists before focused verification without need <!-- EOF -->
