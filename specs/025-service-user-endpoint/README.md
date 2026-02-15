# 025 Service User Endpoint - Git Speckit Commands

## Overview

This document provides Git Speckit commands for managing the 025-service-user-endpoint specification.

## Available Commands

### `/clarify`
Ask clarifying questions about the specification before implementation.

**Usage:**
```
/clarify What authentication method should be used for service users?
```

### `/plan`
Generate or update the implementation plan based on the specification.

**Usage:**
```
/plan
```

### `/tasks`
Generate or update the task breakdown for implementation.

**Usage:**
```
/tasks
```

### `/implement`
Start implementing the specification based on the plan and tasks.

**Usage:**
```
/implement
```

### `/test`
Generate or run tests for the implemented feature.

**Usage:**
```
/test
```

### `/review`
Request a review of the specification or implementation.

**Usage:**
```
/review
```

### `/status`
Check the current status of the specification and implementation.

**Usage:**
```
/status
```

---

## Workflow

1. **Clarify Requirements** (if needed)
   ```
   /clarify [your question]
   ```

2. **Review Specification**
   - Read [`spec.md`](spec.md)
   - Check acceptance criteria

3. **Review Implementation Plan**
   - Read [`plan.md`](plan.md)
   - Understand architecture decisions

4. **Review Tasks**
   - Read [`tasks.md`](tasks.md)
   - Understand task breakdown (15 tasks, 3-4 days)

5. **Start Implementation**
   ```
   /implement
   ```

6. **Run Tests**
   ```
   /test
   ```

7. **Request Review**
   ```
   /review
   ```

---

## Current Status

- **Branch:** `025-service-user-endpoint`
- **Specification:** ✅ Complete
- **Plan:** ✅ Complete
- **Tasks:** ✅ Complete (15 tasks defined)
- **Implementation:** ⏳ Not started
- **Tests:** ⏳ Not started

---

## Quick Links

- [Specification](spec.md)
- [Implementation Plan](plan.md)
- [Task Breakdown](tasks.md)
- [Architecture Plan (German)](../../plans/aither-hemera-api-integration.md)

---

## Notes

- This feature enables Aither and Gaia apps to access Hemera API
- Two service users will be created: `aither-service` and `gaia-service`
- New role `api-client` with restricted permissions
- 4 new endpoints under `/api/service/*`
- Rate limiting: 100 req/min per service user
