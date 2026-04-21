# Hemera Constitution

<!--
SYNC IMPACT REPORT - Constitution Amendment
Version Change: 1.10.0 → 1.11.0
Amendment Date: 2026-04-21
Amendment Type: MINOR (Course data authority and no-placeholder rule added)

Modified Sections:
- Enhanced: Feature Development Workflow (course data authority)
- Enhanced: Code Organization (database-only course sourcing)
- Enhanced: Constitution Enforcement (course data compliance)

Key Changes:
- Development and Production course content must always come from the database
- Placeholder or hardcoded course data is forbidden in runtime application flows
- Missing database configuration must fail explicitly instead of falling back to placeholder clients
- Backup restores for course recovery must preserve database authority

Rationale: Course listings and detail content are business-critical and must never silently degrade
to placeholders or mock data in runtime environments. Explicit database authority reduces hidden
content drift and makes backup-based recovery reliable.
-->

<!--
SYNC IMPACT REPORT - Constitution Amendment
Version Change: 1.9.0 → 1.10.0
Amendment Date: 2025-10-28
Amendment Type: MINOR (Add Stripe Integration Fundamentals as a dedicated section)

Modified Sections:
- Added: VII. Stripe Integration Fundamentals (new section consolidating payment rules)

Key Changes:
- Formalized end-to-end Stripe rules: configuration, intent flow, metadata, security, webhooks,
  localization, testing, and observability
- Clarified server-side authority for amount/currency and course resolution (id or slug)
- Documented booking lifecycle (PENDING → CONFIRMED) and duplicate booking protection

Rationale: Centralize critical payment integration standards in one section to ensure consistent,
secure, and testable payment flows across features and environments.
-->

<!--
SYNC IMPACT REPORT - Constitution Amendment
Version Change: 1.8.0 → 1.9.0
Amendment Date: 2025-10-18
Amendment Type: MINOR (Mandatory live monitoring of Deploy workflow via GitHub Actions VS Code extension)

Modified Sections:
- Enhanced: GitHub Actions Workflow Requirements (added live monitoring mandate via VS Code extension)
- Enhanced: Governance → Constitution Enforcement (implicit monitoring enforcement)

Key Changes:
- Mandatory live monitoring of the Deploy workflows (Preview/Production) using the GitHub Actions VS Code extension
- Engineers must keep the run view open, follow logs until completion, and verify artifacts
- Monitoring is part of the deployment acceptance and audit trail

Rationale: Ensures proactive oversight of deployments, faster incident response, and complete
traceability directly from the development environment.
-->

<!--
SYNC IMPACT REPORT - Constitution Amendment
Version Change: 1.7.0 → 1.8.0
Amendment Date: 2025-10-12
Amendment Type: MINOR (Mandatory Rollbar Error Logging requirement added)

Modified Sections:
- Enhanced: Error Prevention & Detection (added mandatory Rollbar error logging requirement)
- Enhanced: Holistic Error Handling & Observability (strengthened error logging standards)

Key Changes:
- Mandatory Rollbar error logging for ALL error scenarios (replaces console.error)
- Explicit requirement to use serverInstance.error() from @/lib/monitoring/rollbar-official
- Structured context data required for all error logs (userId, requestId, timestamp, error details)
- Prohibition of console.error statements in production code
- Error severity level maintenance (critical, error, warning, info, debug)
- Constitutional violation status for console.error usage in new code

Rationale: Ensuring consistent, structured, and centralized error logging through Rollbar
for better observability, debugging, and production issue resolution. Eliminates scattered
console.error statements that provide no actionable production insights.
-->

<!--
SYNC IMPACT REPORT - Constitution Amendment
Version Change: 1.6.0 → 1.7.0
Amendment Date: 2025-10-11
Amendment Type: MINOR (GitHub Actions exclusive deployment mandate added)

Modified Sections:
- Enhanced: Deployment Standards (added GitHub Actions exclusive deployment requirement)
- Enhanced: GitHub Actions Workflow Requirements (strengthened workflow-only deployment enforcement)
- Enhanced: Constitution Enforcement (added deployment compliance monitoring)

Key Changes:
- Mandatory GitHub Actions workflows for ALL deployments (preview and production)
- Explicit prohibition of manual CLI deployments (vercel --prod, npm run deploy, etc.)
- Workflow-only access to deployment tokens and secrets
- Deployment audit trail through GitHub Actions logs required
- Constitutional violation status for manual deployments
- Enhanced monitoring and compliance verification for deployment activities

Rationale: Ensuring all deployments follow constitutional quality gates and audit trails
while preventing unauthorized manual deployments that bypass security and quality controls.
Standardizes deployment process and maintains complete traceability for all releases.
-->

<!--
SYNC IMPACT REPORT - Constitution Amendment
Version Change: 1.5.0 → 1.6.0
Amendment Date: 2025-10-11
Amendment Type: MINOR (Holistic Error Handling framework added)

Modified Sections:
- Enhanced: VI. Error Monitoring & Observability → VI. Holistic Error Handling & Observability
- Added: Comprehensive error prevention, detection, classification, and recovery strategies
- Added: User-centric error handling with graceful degradation patterns
- Enhanced: Error monitoring with proactive prevention and automated recovery
- Added: Privacy and security considerations for error handling
- Enhanced: Development integration standards for error handling validation

Key Changes:
- Complete lifecycle error management from prevention to recovery
- User experience focused error handling with meaningful recovery options
- Proactive error prevention through TypeScript guards and validation layers
- Graceful degradation and progressive enhancement strategies
- Comprehensive error classification system with severity levels
- Auto-recovery mechanisms for transient failures
- Privacy-first error reporting with PII filtering
- CI/CD integration for error handling validation
- Team training and documentation requirements for error scenarios

Rationale: Evolving from reactive error monitoring to proactive holistic error handling
ensures exceptional user experience even when things go wrong, while maintaining
constitutional standards for reliability, security, and development quality.
-->

<!--
SYNC IMPACT REPORT - Constitution Amendment
Version Change: 1.4.0 → 1.5.0
Amendment Date: 2025-10-11
Amendment Type: MINOR (Perplexity MCP server integration added)

Modified Sections:
- Enhanced: Core Technologies (added Perplexity MCP for AI research assistance)

Key Changes:
- Perplexity MCP server and Context7 integration for enhanced research and documentation
- AI-powered research capabilities for spec development and technical decisions
- Integration with existing research workflows in specs/*/research.md

Rationale: Adding Perplexity MCP and Context7 integration enhances research quality and technical decision-making
while maintaining constitutional standards for documentation and research processes.
-->

<!--
SYNC IMPACT REPORT - Constitution Amendment
Version Change: 1.3.0 → 1.4.0
Amendment Date: 2025-10-11
Amendment Type: MINOR (Rollbar error monitoring integration standards added)

Modified Sections:
- Enhanced: Core Technologies (added Rollbar for error monitoring)
- Enhanced: Authentication & Security (added Rollbar monitoring and error reporting security)
- Enhanced: Feature Development Workflow (added error monitoring integration)
- Enhanced: Testing Requirements (added error monitoring tests)
- Enhanced: Code Organization (added Rollbar integration standards)
- Enhanced: Testing Compliance (added error monitoring validation)
- Added: Error Monitoring & Observability (new section VI for comprehensive error tracking)

Key Changes:
- Rollbar integration mandatory for all production applications
- Client-side React Error Boundaries for component error capture
- Server-side error tracking for all API routes and functions
- Performance monitoring for critical user flows
- Security incident tracking and authentication failure monitoring
- Environment-specific Rollbar project separation
- Real-time alerting for critical errors and performance issues
- Data privacy protection in error reports (PII filtering)
- CI/CD integration testing for error monitoring functionality

Rationale: Adding Rollbar error monitoring standards ensures comprehensive observability
and production reliability while maintaining constitutional quality standards for all
error tracking and performance monitoring functionality.
-->

<!--
SYNC IMPACT REPORT - Constitution Amendment
Version Change: 1.2.0 → 1.3.0
Amendment Date: 2025-10-11
Amendment Type: MINOR (Vibe-Check Protocol added)

Modified Sections:
- Added: Vibe-Check Protocol (new section in Governance for team wellness and culture health)
- Enhanced: Testing Compliance (extended governance framework)

Key Changes:
- Vibe-Check Protocol for sustainable development practices
- Team wellness and culture health monitoring
- Burnout prevention measures
- Collaboration spirit guidelines
- Work-life balance enforcement
- Innovation encouragement framework

Rationale: Adding Vibe-Check Protocol ensures sustainable team health and positive
development culture while maintaining constitutional quality standards. Recognizes
that code quality depends on team wellness and sustainable practices.
-->

<!--
SYNC IMPACT REPORT - Constitution Amendment
Version Change: 1.1.0 → 1.2.0
Amendment Date: 2025-10-09
Amendment Type: MINOR (Stripe payment integration standards added)

Modified Sections:
- Enhanced: Core Technologies (added Stripe payment processing)
- Enhanced: Authentication & Security (added payment security standards)
- Enhanced: Test-First Development (added payment testing requirements)
- Enhanced: Feature Development Workflow (added payment integration requirements)
- Enhanced: Testing Requirements (added payment integration testing)
- Enhanced: Code Organization (added payment processing standards)
- Enhanced: Deployment Standards (added payment configuration management)
- Enhanced: GitHub Actions Workflow Requirements (added payment security)
- Enhanced: Testing Compliance (added payment flow testing)

Key Changes:
- Stripe integration mandatory for all payment processing
- PCI DSS compliance requirements for payment flows
- Test/live mode separation for development and production
- Webhook security validation requirements
- Payment flow testing standards
- Secure payment configuration management

Rationale: Adding Stripe payment integration standards ensures secure, compliant
payment processing while maintaining constitutional quality standards for all
payment-related functionality.
-->

<!--
SYNC IMPACT REPORT - Constitution Amendment
Version Change: 1.0.0 → 1.1.0
Amendment Date: 2025-10-05
Amendment Type: MINOR (new deployment standards and GitHub Actions workflow requirements added)

Modified Sections:
- Added: Deployment Standards (new section with CI/CD pipeline requirements)
- Added: GitHub Actions Workflow Requirements (new section defining deployment workflow standards)
- Enhanced: Technology Stack Requirements (expanded Development Tools section)

New Files Created:
- .github/workflows/deploy.yml (GitHub Actions deployment workflow)

Templates Requiring Updates:
✅ Constitution updated with deployment standards
✅ Deployment workflow created with quality gates
⚠ Templates may need review for deployment-related guidance

Key Changes:
- Mandatory quality gates for all deployments (TypeScript, Prettier, ESLint, tests, build)
- Automatic preview deployments for pull requests via Vercel
- Production deployment restricted to main branch only
- Post-deployment E2E testing against production environment
- Proper secret management for Vercel integration

Rationale: Adding structured deployment process ensures constitutional compliance extends
to production releases, maintaining code quality and testing standards throughout the
entire software delivery lifecycle.
-->

<!-- Next.js Learning Platform with Clerk Authentication -->

## Core Principles

### I. Test-First Development (NON-NEGOTIABLE)

Test-Driven Development is mandatory for all features and components:

- **Contract Tests First**: All new features must start with failing contract tests that define
  expected behavior
- **Unit Tests Required**: Every component, utility, and service must have comprehensive unit tests
- **TDD Cycle**: Red (failing tests) → Green (minimal implementation) → Refactor → Repeat
- **Test Coverage**: Minimum 80% code coverage for critical paths, 90% for authentication and
  payment flows
- **Payment Testing**: All Stripe integration must use test mode for development with mock payment
  scenarios
- **Prettier Tests**: Code formatting tests ensure consistent style across the entire codebase

### II. Code Quality & Formatting

Consistent code quality and formatting standards are enforced:

- **Prettier Integration**: All code must pass Prettier formatting checks before commit
- **ESLint Compliance**: Zero warnings policy for production code
- **Pre-commit Hooks**: Automated formatting and linting on every commit via Husky
- **CI/CD Gates**: GitHub Actions workflows block merges for formatting violations
- **TypeScript Strict Mode**: Full type safety with strict TypeScript configuration

### III. Feature Development Workflow

Every feature follows a structured development process:

- **Specification First**: Features start with detailed specifications in `specs/` directory
- **Contract Definition**: API contracts and component interfaces defined before implementation
- **Payment Integration**: All payment flows integrate with Stripe using secure webhook handling
- **Authentication Integration**: All protected features integrate with Clerk authentication system
- **Database Migration**: Schema changes require proper Prisma migrations with rollback strategy
- **Course Data Authority**: Course content shown in Development and Production MUST be loaded from
  the database as the single source of truth; runtime hardcoded, seeded placeholder, or mock course
  data is forbidden outside explicit test fixtures
- **Performance Testing**: Load testing for user-facing features, especially authentication and
  payment flows
- **Payment Security Testing**: Stripe webhook validation and secure checkout flow testing
- **Error Monitoring Integration**: Rollbar error tracking configured for development and production
  environments

### VI. Holistic Error Handling & Observability

Comprehensive error management across the entire application lifecycle with proactive monitoring,
graceful degradation, and user-centric recovery strategies:

#### Error Prevention & Detection

- **Rollbar Integration**: Mandatory error tracking for all production applications with official
  Next.js patterns
- **Mandatory Rollbar Error Logging**: All error logging MUST use Rollbar instead of console.error
  - Use `serverInstance.error()` from `@/lib/monitoring/rollbar-official` for all server-side errors
  - Include structured context data (userId, requestId, timestamp, error details)
  - Replace all `console.error` statements with appropriate Rollbar logging calls
  - Maintain error severity levels (critical, error, warning, info, debug)
- **Client-Side Monitoring**: React Error Boundaries with `useRollbar` hooks capture component
  errors
- **Server-Side Tracking**: All API routes, middleware, and server functions report to Rollbar
- **Global Error Handlers**: App Router `error.tsx` and `global-error.tsx` for comprehensive
  coverage
- **Instrumentation**: Next.js `instrumentation.ts` for uncaught exceptions and unhandled rejections
- **Performance Monitoring**: Track critical user flows, Core Web Vitals, and performance
  bottlenecks
- **TypeScript Guards**: Strict type checking prevents runtime errors at compile time
- **Validation Layers**: Zod schemas for API input/output validation with detailed error messages

#### Error Classification & Response

- **Severity Levels**: Critical (system down), Error (feature broken), Warning (degraded), Info
  (tracking)
- **Error Categories**: Authentication, Payment, Database, Network, Validation, Security,
  Performance
- **User-Facing Errors**: Meaningful error messages with actionable recovery steps
- **Silent Monitoring**: Background errors logged without disrupting user experience
- **Cascade Prevention**: Circuit breakers prevent error propagation across services
- **Graceful Degradation**: Fallback mechanisms when external services are unavailable

#### Recovery & User Experience

- **Error Boundaries**: Isolate component failures with recovery options (retry, refresh, fallback
  UI)
- **Progressive Enhancement**: Core functionality works even when advanced features fail
- **Offline Resilience**: Service workers cache critical assets and provide offline experiences
- **User Feedback Loops**: Error reporting mechanisms with user context and reproduction steps
- **Auto-Recovery**: Automatic retry mechanisms for transient failures (network, rate limits)
- **Maintenance Mode**: Graceful handling of planned downtime with informative messaging

#### Monitoring & Alerting

- **Real-Time Alerts**: Immediate notifications for critical errors affecting user experience
- **Trend Analysis**: Error rate monitoring and anomaly detection across time periods
- **Environment Separation**: Isolated Rollbar projects for development, staging, and production
- **Dashboard Visibility**: Error metrics integrated into development and operations dashboards
- **Escalation Procedures**: Automated escalation paths based on error severity and impact
- **Post-Incident Reviews**: Structured analysis of major incidents with prevention planning

#### Privacy & Security

- **Data Privacy**: PII, tokens, and sensitive data filtered from all error reports
- **Security Incident Tracking**: Enhanced monitoring for authentication failures and breaches
- **Audit Trails**: Comprehensive logging of security-related events and error responses
- **Access Controls**: Restricted access to error monitoring data based on team roles
- **Compliance**: Error handling aligned with GDPR, CCPA, and industry security standards

#### Development Integration

- **CI/CD Validation**: Error monitoring functionality tested in all deployment pipelines
- **Development Tools**: Local error simulation and testing capabilities
- **Documentation**: Runbooks for common error scenarios and resolution procedures
- **Team Training**: Regular education on error handling best practices and incident response
- **Metrics Integration**: Error rates included in definition of done for all features

### IV. Authentication & Security

Security-first approach to user authentication, payment processing, data protection, and error
monitoring:

- **Clerk Integration**: All authentication flows use Clerk APIs and middleware
- **Stripe Security**: Payment processing through Stripe with PCI DSS compliance and webhook
  verification
- **Rollbar Monitoring**: Comprehensive error tracking with client-side and server-side monitoring
- **Role-Based Access**: User roles (student, instructor, admin) enforce proper access control
- **Protected Routes**: Middleware validation for all `/protected` routes
- **Session Management**: Secure session handling with proper token validation
- **Payment Security**: Stripe secret keys managed through environment variables with test/live mode
  separation
- **Error Reporting Security**: Rollbar integration with proper data filtering and access token
  management
- **CVE Monitoring**: Regular dependency vulnerability scanning and updates

### V. Component Architecture

Modular, reusable component design principles:

- **Material-UI Integration**: All UI components follow Material-UI design system
- **Theme Consistency**: Centralized theme management for dark/light mode support
- **Component Testing**: Each UI component has dedicated unit tests for behavior and rendering
- **Accessibility Standards**: WCAG 2.1 AA compliance for all interactive elements
- **Performance Optimization**: Lazy loading, code splitting, and bundle optimization

### VII. Stripe Integration Fundamentals

Constitutional rules for secure, reliable, and localized payment processing with Stripe.

#### Configuration & Keys

- Server-side secret key MUST be configured via `STRIPE_SECRET_KEY` and NEVER exposed to client
  code.
- Client-side publishable key MUST be configured via `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
- A runtime guard (e.g., `isStripeConfigured()`) MUST block payment endpoints when keys are missing
  and respond with a clear service-unavailable message.
- Test/Live mode separation MUST be respected with environment-specific keys.

#### Payment Intent Flow (Server Authority)

- Amounts MUST be computed server-side from the authoritative source of truth (e.g., course price)
  using minor units (cents); client-provided amounts MUST be ignored.
- Course references MAY be id or slug in requests; the server MUST resolve them (id OR slug) and
  operate on the canonical `course.id`.
- A booking record MUST be created with status `PENDING` before creating the PaymentIntent.
- PaymentIntent metadata MUST include `courseId`, `userId`, `bookingId`, and `courseName` for audit
  and reconciliation.
- Idempotency keys SHOULD be used for intent-creation requests to protect against duplicate posts.
- Currency normalization: Stripe API calls MUST use lowercase currency (e.g., `eur`), storage and
  presentation MAY use uppercase (`EUR`), with formatting via the appropriate locale.

#### Client Integration (Stripe Elements)

- Elements MUST be instantiated with the `clientSecret` returned from the server, locale set to
  `'de'`, and the publishable key from `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
- Secret keys MUST NOT be embedded client-side.
- After confirmation, clients SHOULD call a server confirmation endpoint to persist final booking
  updates and return a user-facing success route.

#### Webhooks & State Transitions

- Webhook endpoints MUST verify Stripe signatures and handle at minimum succeeded, failed, canceled
  events.
- On successful payment (`payment_intent.succeeded`), the related booking MUST transition from
  `PENDING` to `CONFIRMED` (or `PAID` depending on domain terms) and persist the Stripe IDs.
- Duplicate booking protection MUST be enforced at the database layer (e.g., unique
  `userId_courseId`).

#### Security & Observability

- Never trust client-provided prices, currency, or discounts—server authoritative only.
- All payment-related errors MUST be logged through the central monitoring solution (Rollbar) with
  structured context (userId, requestId, bookingId, courseId, timestamp, error details).
- Sensitive data (PII, tokens) MUST be excluded from logs and events.

#### Localization & UX

- Currency values MUST be formatted using
  `Intl.NumberFormat('de-DE', { style: 'currency', currency })` with amounts in minor units
  converted to major units for display.
- User-facing messages MUST be localized to German and provide clear recovery guidance for
  processing/failed states.

#### Testing & Environments

- Development and E2E testing MUST use Stripe test mode.
- If Stripe is not configured in an environment, the app MUST display a clear, user-friendly
  unavailability message without breaking the overall UX.
- E2E tests MAY exercise a simplified Elements flow and MUST avoid real network calls in CI unless
  explicitly configured.

## Development Standards

### Testing Requirements

- **Unit Tests**: Located in `tests/unit/` with `.spec.ts` extension
- **E2E Tests**: Playwright tests in `tests/e2e/` covering critical user journeys
- **Contract Tests**: API and component contract validation before implementation
- **Prettier Tests**: Automated formatting validation with `npm run test:prettier`
- **Performance Tests**: Load testing for authentication and course enrollment flows
- **Payment Integration Tests**: Stripe webhook testing and checkout flow validation
- **Error Handling Tests**: Comprehensive error scenario testing including boundary conditions,
  recovery flows, and graceful degradation
- **Error Monitoring Tests**: Rollbar integration testing for error capture, classification, and
  reporting across all error types
- **Security Tests**: Vulnerability scanning and penetration testing for auth flows

### Code Organization

- **Feature Folders**: Group related components, tests, and utilities by feature
- **Shared Libraries**: Common utilities in `lib/` directory with proper TypeScript exports
- **Database Layer**: Prisma ORM with type-safe database operations
- **Database-Only Course Sourcing**: Public and admin course surfaces must read course content from
  database-backed services. If the database is unavailable or misconfigured, the application must
  fail explicitly or show an empty/error state rather than inventing placeholder course data or
  placeholder database clients. Backup restores for course recovery must preserve database
  authority by restoring the database as the only valid course source; restore flows must never
  reactivate placeholder or hardcoded runtime course data, and they must fail explicitly or emit
  operational alerts when the restored environment lacks valid database configuration after
  recovery.
- **API Routes**: Next.js API routes with proper error handling and validation
- **Payment Processing**: Stripe integration with secure webhook endpoints and proper error handling
- **Holistic Error Handling**: Comprehensive error management with prevention, detection, graceful
  recovery, and user-centric error experiences
- **Component Structure**: Separate presentational and container components

### Quality Gates

All code changes must pass these gates before merge:

- **Prettier Formatting**: `npm run format:check` must pass
- **ESLint Validation**: `npm run lint:ci` with zero warnings
- **Type Checking**: TypeScript compilation without errors
- **Unit Test Coverage**: Minimum 80% coverage for new code
- **E2E Test Suite**: Critical path tests must pass
- **Build Verification**: `npm run build` completes successfully
- **Deployment Pipeline**: GitHub Actions deployment workflow must complete successfully
- **Preview Testing**: All pull requests must deploy successfully to preview environment

## Deployment Requirements

### CI/CD Pipeline Standards

All deployments follow the GitHub Actions workflow (`.github/workflows/deploy.yml`):

- **Quality Gates First**: No deployment without passing all quality checks
- **Preview Environment**: Every PR gets a unique Vercel preview deployment
- **Production Deployment**: Only main branch triggers production releases
- **Post-Deployment Validation**: E2E tests run against live production environment
- **Rollback Capability**: Failed deployments trigger immediate rollback procedures

## Technology Stack Requirements

### Core Technologies

- **Frontend**: Next.js 14+ with App Router, React 18+, TypeScript 5+
- **Authentication**: Clerk for user management and session handling
- **Payments**: Stripe for secure payment processing and subscription management
- **Database**: PostgreSQL with Prisma ORM for type-safe operations
- **Styling**: Material-UI (MUI) with custom theme support
- **Testing**: Playwright for E2E, Jest/Vitest for unit tests
- **Error Monitoring**: Rollbar for comprehensive error tracking and performance monitoring
- **AI Research Assistant**: Perplexity MCP server and Context7 for enhanced research and
  documentation
- **Code Quality**: Prettier, ESLint, Husky for pre-commit hooks

### Development Tools

- **Package Manager**: npm with package-lock.json for reproducible builds
- **Version Control**: Git with conventional commit messages
- **CI/CD**: GitHub Actions for automated testing and deployment
- **Code Editor**: VSCode with recommended extensions for Prettier and ESLint
- **Database Migration**: Prisma migrations with proper versioning

### Deployment Standards

All deployments follow a structured CI/CD pipeline with mandatory quality gates and exclusive GitHub
Actions enforcement:

- **GitHub Workflow Mandate**: ALL deployments (preview and production) MUST be executed exclusively
  through GitHub Actions workflows - manual deployments via CLI are strictly prohibited
- **No Manual Deployments**: Direct use of `vercel --prod`, `npm run deploy`, or any manual
  deployment commands is forbidden
- **Workflow-Only Access**: Production environment access is restricted to GitHub Actions workflows
  with proper authentication tokens
- **Quality Gates**: Every deployment must pass TypeScript compilation, Prettier formatting, ESLint
  validation, unit tests, and build verification through automated pipelines
- **Preview Deployments**: All pull requests automatically deploy to Vercel preview environments
  with unique URLs via GitHub Actions
- **Production Deployment**: Only `main` branch pushes trigger production deployments to Vercel
  through GitHub Actions workflows
- **Post-Deployment Testing**: E2E tests run against production environment after successful
  deployment via automated workflows
- **Rollback Strategy**: Failed deployments must be immediately rolled back through GitHub Actions
  with incident documentation
- **Environment Secrets**: All sensitive configuration managed through Vercel environment variables
  and GitHub secrets within workflow context
- **Payment Configuration**: Stripe keys (test/live) managed securely with environment-based mode
  switching through GitHub Actions secrets
- **Deployment Audit Trail**: All deployments must be traceable through GitHub Actions logs with
  proper commit SHA tracking

### GitHub Actions Workflow Requirements

The deployment workflow (`.github/workflows/deploy.yml`) enforces constitutional compliance and is
the EXCLUSIVE deployment mechanism:

- **Sole Deployment Authority**: GitHub Actions is the only authorized method for all deployments -
  no exceptions for manual CLI deployments
- **Multi-Stage Pipeline**: Separate jobs for quality gates, preview deployment, production
  deployment, and E2E validation
- **Dependency Chain**: Production deployment only occurs after all quality gates pass in automated
  sequence
- **Access Control**: Deployment tokens and secrets are exclusively available to GitHub Actions
  runners
- **Automated PR Comments**: Preview deployment URLs automatically posted to pull request comments
  through workflow automation
- **Artifact Management**: Playwright reports uploaded for debugging failed E2E tests via workflow
  artifacts
- **Security**: VERCEL_TOKEN, VERCEL_ORG_ID, and VERCEL_PROJECT_ID managed as GitHub repository
  secrets with workflow-only access
- **Payment Security**: Stripe webhook secrets and API keys secured in repository secrets with
  proper test/live separation and workflow-restricted access
- **Deployment Verification**: Every deployment includes automated health checks and error
  monitoring validation
- **Failure Handling**: Automated rollback procedures triggered by workflow failure detection

- **Live Monitoring (MANDATORY)**: All Deploy workflows (Preview and Production) MUST be actively
  monitored using the official GitHub Actions VS Code extension. The responsible engineer keeps the
  workflow run view open, follows logs until completion, verifies the final status, reviews
  artifacts (e.g., Playwright report), and captures the deployment URL when applicable. Failure to
  monitor constitutes a process violation.

## Governance

### Constitution Enforcement

This constitution supersedes all other development practices and must be followed strictly:

- **PR Reviews**: All pull requests must verify constitutional compliance including deployment
  workflow adherence
- **Quality Gates**: Automated checks enforce formatting, testing, and build requirements through
  GitHub Actions exclusively
- **Deployment Compliance**: Manual deployments are constitutional violations and must be
  immediately reported and reversed
- **Course Data Compliance**: Any Development or Production code path that injects placeholder,
  demo, or hardcoded runtime course data instead of database content is a constitutional violation
- **Workflow Monitoring**: All deployment activities are logged and audited through GitHub Actions
  for compliance verification
- **Exception Process**: Any deviation requires explicit justification and team approval - NO
  exceptions for deployment workflow bypass
- **Regular Audits**: Monthly reviews of compliance and process effectiveness including deployment
  workflow adherence

### Amendment Process

- **Documentation Required**: All changes must be documented with clear rationale
- **Team Approval**: Constitutional changes require unanimous team agreement
- **Migration Plan**: Breaking changes need detailed migration and rollback strategies
- **Version Control**: All amendments are tracked with proper versioning

### Testing Compliance

- **Unit Test Mandate**: No feature implementation without corresponding unit tests
- **Prettier Compliance**: All code must pass `npm run test:prettier` validation
- **Contract Validation**: API and component contracts must be tested before implementation
- **Payment Flow Testing**: Stripe checkout and webhook flows must be validated in test mode
- **Error Handling Validation**: All error scenarios must have tested recovery paths and graceful
  degradation
- **Error Monitoring Validation**: Rollbar error tracking tested for prevention, detection,
  classification, and recovery workflows
- **Performance Benchmarks**: Authentication flows must meet sub-100ms response requirements
- **Security Validation**: All auth-related code requires security review and testing
- **Payment Security Compliance**: All Stripe integrations must follow PCI DSS guidelines and use
  secure webhook handling

### Vibe-Check Protocol

Team wellness and code culture health checks ensure sustainable development practices:

- **Daily Standup Vibes**: Team energy assessment during daily meetings - are we energized or burned
  out?
- **Code Review Atmosphere**: Constructive, supportive feedback culture over harsh criticism
- **Feature Delivery Pressure**: Sustainable pace over crunch mode - no shipping broken code under
  pressure
- **Learning Environment**: Mistakes are learning opportunities, not blame targets
- **Work-Life Balance**: Respect for boundaries - no expectation for weekend or late-night coding
- **Technical Debt Acknowledgment**: Regular honest assessment of code quality without shame
- **Collaboration Spirit**: "We build together" mentality over individual hero culture
- **Innovation Encouragement**: Safe space for experimenting with new ideas and approaches
- **Celebration Moments**: Acknowledge wins, both technical achievements and personal growth
- **Burnout Prevention**: Watch for signs of exhaustion and address them proactively

**Vibe-Check Triggers**:

- Weekly team retrospectives include explicit vibe assessment
- Pull request comments that feel harsh trigger team discussion
- Multiple late-night commits in a week trigger workload review
- Repeated "quick fixes" without tests trigger technical debt discussion
- Team member expressing frustration triggers one-on-one check-in

**Version**: 1.11.0 | **Ratified**: 2025-10-04 | **Last Amended**: 2026-04-21
