# PR Operations Governance

Use this skill when operational pull request execution needs to be prepared, assessed, or safeguarded.

## Purpose

This skill consolidates the rules for:

- local checks before a PR recommendation or merge decision
- review handling and open PR conversations
- branch-protection requirements
- bypass approvals as tightly scoped exceptions

## When To Apply This Skill

Use this skill when at least one of the following is true:

- a change needs to be made merge-ready
- an open PR still has unanswered or unresolved review comments
- local verification is required before CI or before merge
- branch protection is blocking merge
- a bypass approval is being discussed or documented

## Operational Mode

Work in execution mode by default, not in plan-only mode.

- Execute concrete checks and changes directly when the assignment is clear.
- Hold back questions unless additional information is required for a safe decision.
- Do not rely on a formal planning phase when operational execution is already authorized.

## Local Checks

Before recommending merge or review readiness:

1. Identify the smallest meaningful validation for the affected scope.
2. Run focused checks first, such as relevant tests, lint, or typecheck.
3. Expand scope only when the focused check requires it.
4. Record briefly what was executed and what could not be executed.

Check priority:

1. Affected tests
2. Affected lint or typecheck scope
3. Relevant build or runtime check
4. Broader project checks only after that

## Reviews And Open PR Conversations

Before recommending merge:

1. Check whether open review comments or unanswered conversations exist.
2. Treat unresolved threads as blockers until they are explicitly answered or dismissed.
3. Distinguish between informational comments and merge-blocking issues.
4. Summarize the remaining status precisely: open, answered, implemented, or intentionally deferred.

When review feedback exists:

- fix concrete defects directly when possible
- do not answer with intent alone when a change can be made
- call out risks that remain without a code change

## Branch Protection

Branch protection is the default, not an optional process step.

Pay attention in particular to:

- required status checks
- required reviews
- blocking conversations
- linear-history or otherwise protected merge requirements in the repository

Recommendation:

- Do not state that a PR is ready when branch protection is still objectively unmet.
- Instead, name the exact missing condition.

## Bypass Approval

A bypass is only acceptable as an explicit exception.

A bypass should only be recommended or documented when all of the following are true:

1. The reason is concrete and time-sensitive.
2. The residual risk is named.
3. The unmet standard conditions are listed explicitly.
4. A responsible approval authority is identified.
5. Follow-up obligations are defined.

Minimum documentation for a bypass:

- affected PR or branch
- specific protection rule being bypassed
- reason for the exception
- risk assessment
- approving person or role
- required follow-up work with ownership

## Expected Output

When applying this skill, provide a concise operational assessment with:

1. current merge status
2. open blockers
3. checks already executed
4. missing checks or unresolved conversations
5. bypass need only when standard approval is not reachable

## Do Not

- downplay branch protection implicitly
- ignore open review threads
- present a bypass as the normal path
- run broad checklists when a narrower, reliable check is enough
