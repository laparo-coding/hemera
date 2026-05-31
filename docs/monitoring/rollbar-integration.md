# Rollbar Error Monitoring Integration

Rollbar ist in Hemera für getrennte Environments konfiguriert: development, preview und production.
Local development nutzt ein eigenes Rollbar-Development-Environment und bleibt standardmäßig aus,
bis es explizit aktiviert wird.

Für die verifizierte lokale Soll-Konfiguration von Gaia, Hemera und Aither siehe auch
`docs/monitoring/rollbar-local-checklist.md`.

## 🎯 Übersicht

Rollbar ist vollständig in das Hemera Error Handling System integriert und bietet:

- **Automatische Error Reporting**: Alle BaseError-Instanzen werden automatisch gemeldet
- **Request Context**: Vollständige Request-Verfolgung mit User-Kontext
- **Performance Monitoring**: Slow API Response Tracking
- **React Integration**: @rollbar/react für optimierte React Error Boundaries
- **Client & Server**: Vollständige Coverage für Frontend und Backend
- **Smart Categorization**: Automatische Severity-Klassifizierung
- **Environment Separation**: Development, Preview und Production bleiben voneinander getrennt
- **Development Opt-in**: Lokale Telemetrie ist nur mit explizitem Enable-Flag aktiv
- **Production Ready**: Optimiert für Vercel Deployment

## 📦 Installierte Pakete

```bash
npm install rollbar@4.53.0 @rollbar/react@0.12.0
```

- **rollbar**: Core Rollbar library für Server und Client
- **@rollbar/react**: React-spezifische Integration mit Error Boundaries und Hooks

## 📋 Setup & Konfiguration

### 1. Environment Variables

Füge zu deiner `.env.local` Datei hinzu:

```bash
# Rollbar Configuration
# Verwende lokal ausschließlich Development-Tokens.
ROLLBAR_HEMERA_SERVER_TOKEN=your_rollbar_development_server_token
NEXT_PUBLIC_ROLLBAR_HEMERA_CLIENT_TOKEN=your_rollbar_development_client_token

# Development ist Default-off und braucht explizites Opt-in.
ROLLBAR_ENABLED=1
NEXT_PUBLIC_ROLLBAR_ENABLED=1

# Optional: Für lokale Doku-/Debug-Szenarien, Vercel setzt diesen Wert selbst.
NEXT_PUBLIC_VERCEL_ENV=development
```

Ohne gültigen Server-Token oder ohne Enable-Flag bleibt Rollbar in lokaler Entwicklung deaktiviert.
Preview- und Production-Deployments nutzen weiter die jeweilige Deployment-Umgebung.

### 2. Rollbar Dashboard Setup

1. Registriere dich bei [rollbar.com](https://rollbar.com)
2. Erstelle getrennte Projekte oder getrennte Access-Tokens für development und production
3. Kopiere die Access Tokens:
   - **Server Access Token**: Für Server-side Error Reporting
   - **Client Access Token**: Für Browser-side Error Reporting
4. Verwende lokal ausschließlich die Development-Tokens

### 3. Vercel Deployment

Rollbar nutzt automatisch Vercel Environment Variables:

```bash
VERCEL_GIT_COMMIT_SHA    # Für Release Tracking
VERCEL_GIT_COMMIT_REF    # Branch Information
VERCEL_URL              # Deployment URL
VERCEL_DEPLOYMENT_ID    # Unique Deployment ID
VERCEL_REGION          # Region Information
```

Die Environment-Zuordnung in Hemera ist:

- `production`: `VERCEL_ENV=production` oder produktiver Runtime-Kontext
- `preview`: `VERCEL_ENV=preview`
- `development`: lokales Development oder Fallback ohne Vercel-Deployment-Kontext

## 🔒 Aktivierungsregeln

Rollbar initialisiert nur, wenn alle folgenden Bedingungen erfüllt sind:

1. Kein E2E-Lauf aktiv ist
2. Rollbar nicht explizit deaktiviert wurde
3. Ein gültiger Server-Token vorhanden ist
4. In local development zusätzlich ein explizites Enable-Flag gesetzt ist

Disable-Flags:

```bash
NEXT_PUBLIC_DISABLE_ROLLBAR=1
NEXT_PUBLIC_ROLLBAR_ENABLED=0
ROLLBAR_ENABLED=0
```

Enable-Flags für lokales Development:

```bash
ROLLBAR_ENABLED=1
NEXT_PUBLIC_ROLLBAR_ENABLED=1
```

Empfehlung:

- Setze serverseitig mindestens `ROLLBAR_ENABLED=1`.
- Setze `NEXT_PUBLIC_ROLLBAR_ENABLED=1`, wenn auch Browser-Fehler im Development-Environment landen sollen.
- Verwende niemals Production-Tokens in `.env.local`.

## 🔧 Verwendung

### Automatisches Error Reporting

Alle `BaseError`-Instanzen werden automatisch gemeldet:

```typescript
import { CourseNotFoundError } from '@/lib/errors/domain';

// Wird automatisch an Rollbar gemeldet
throw new CourseNotFoundError('Course not found', { courseId: '123' });
```

### Manuelles Error Reporting

```typescript
import { reportError, ErrorSeverity } from '@/lib/monitoring/rollbar-official';

// Server-side manual reporting
reportError(
  new Error('Custom error'),
  {
    userId: 'user123',
    route: '/api/courses',
    additionalData: { customField: 'value' },
  },
  ErrorSeverity.WARNING
);
```

### Client-side Error Reporting mit @rollbar/react

```typescript
import { reportClientError, useRollbarError } from '@/lib/monitoring/rollbar-react';

// Funktional
reportClientError(
  new Error('Frontend error'),
  {
    component: 'CourseCard',
    userId: 'user123',
    additionalData: { props: courseProps },
  },
  'error'
);

// Als Hook
function MyComponent() {
  const reportError = useRollbarError();

  const handleError = (error: Error) => {
    reportError(error, { component: 'MyComponent' });
  };
}
```

### React Error Boundary Integration

```tsx
import { RollbarProviderWrapper, RollbarErrorBoundaryWrapper } from '@/lib/monitoring/rollbar-react';

// App-Level (bereits in layout.tsx integriert)
<RollbarProviderWrapper>
  <App />
</RollbarProviderWrapper>

// Component-Level Error Boundary
<RollbarErrorBoundaryWrapper context={{ page: 'courses' }}>
  <CourseList />
</RollbarErrorBoundaryWrapper>
```

### Performance Monitoring

```typescript
import { reportPerformanceIssue } from '@/lib/monitoring/rollbar-official';

const startTime = Date.now();
// ... slow operation
const duration = Date.now() - startTime;

reportPerformanceIssue('database-query', duration, 1000);
```

### User Action Tracking

```typescript
import { recordUserAction } from '@/lib/monitoring/rollbar-official';
import { recordClientUserAction } from '@/lib/monitoring/rollbar-react';

// Server-side
recordUserAction('course-enrollment', userId, { courseId });

// Client-side
recordClientUserAction('button-click', userId, { button: 'enroll' });
```

## 📊 Error Categorization

### Automatische Severity Mapping

```typescript
// HTTP Status → Rollbar Severity
500+ → CRITICAL     // Server errors
401/403 → CRITICAL  // Security errors
400-499 → WARNING   // Client errors
< 400 → INFO        // Informational
```

### Error Categories

```typescript
// Domain Errors → Rollbar Context
BusinessError → { category: 'business', severity: 'warning' }
ValidationError → { category: 'validation', severity: 'warning' }
InfrastructureError → { category: 'infrastructure', severity: 'critical' }
AuthError → { category: 'auth', severity: 'critical' }
```

## 🔍 Monitoring Features

### Request Tracking

Jeder Request erhält automatisch:

```json
{
  "requestId": "uuid-v4",
  "userId": "clerk-user-id",
  "route": "/api/courses",
  "method": "GET",
  "userAgent": "Mozilla/5.0...",
  "timestamp": "2024-10-11T10:30:00Z"
}
```

### Performance Alerts

- **Slow API Calls**: > 2 Sekunden
- **Database Operations**: Automatisch durch Prisma Error Mapping
- **Custom Thresholds**: Konfigurierbar per Operation

### Security Monitoring

```typescript
import { reportSecurityIncident } from '@/lib/monitoring/rollbar-official';

// Automatische Security Alerts
reportSecurityIncident('unauthorized-access-attempt', {
  userId,
  ip: request.ip,
  route: request.url,
});
```

## 🚀 Integration Points

### 1. API Routes

Alle API Routes verwenden automatisch `withApiErrorHandling`:

```typescript
export const GET = withApiErrorHandling(async context => {
  // Automatic error reporting + performance tracking
  const courses = await getCourses();
  return NextResponse.json(courses);
});
```

### 2. Server Actions

Alle Server Actions verwenden `withServerActionErrorHandling`:

```typescript
export const updateProfile = withServerActionErrorHandling(async (data: ProfileData) => {
  // Automatic error reporting
  return await updateUserProfile(data);
});
```

### 3. Prisma Operations

Alle Database-Fehler werden automatisch zugeordnet:

```typescript
// Prisma Error → Domain Error → Rollbar Report
await prisma.user.findUniqueOrThrow({ where: { id } });
// UserNotFoundError → Rollbar mit Context
```

## 📈 Dashboard & Alerts

### Rollbar Dashboard Insights

1. **Error Frequency**: Trending und Spikes
2. **User Impact**: Betroffene User pro Error
3. **Deployment Tracking**: Release-spezifische Errors
4. **Performance**: Slow Request Monitoring
5. **Geography**: Regional Error Distribution

### Empfohlene Alerts

```yaml
Critical Alerts:
  - New Critical Errors: Immediate notification
  - Error Rate Spike: > 10 errors/minute
  - Security Incidents: Immediate notification

Warning Alerts:
  - Performance Issues: > 5 slow requests/hour
  - Validation Errors: > 50 errors/hour
  - New Error Types: Daily digest
```

## 🔧 Konfiguration

### Environment-spezifische Settings

```typescript
// Production
ROLLBAR_ENABLED = true;
captureUncaught = true;
captureUnhandledRejections = true;
maxItems = 1000;

// Development
ROLLBAR_ENABLED = true;
verbose = true;
reportLevel = debug;
```

### Custom Fingerprinting

Errors werden intelligent gruppiert:

```typescript
fingerprint: payload => {
  const { body } = payload;
  if (body.trace?.exception?.class && body.trace?.exception?.message) {
    return `${body.trace.exception.class}:${body.trace.exception.message}`;
  }
  return undefined;
};
```

## 🛡️ Security & Privacy

### Data Filtering

Sensitive Daten werden automatisch gefiltert:

```typescript
// Ignored in reports
ignoredMessages: ['Script error.', 'Network request failed', 'Load failed'];

// No sensitive headers or cookies reported
```

### User Context

Nur notwendige User-Informationen:

```json
{
  "person": {
    "id": "clerk-user-id",
    "email": "user@example.com" // Optional
  }
}
```

## 📝 Best Practices

### 1. Error Context

Füge immer relevanten Kontext hinzu:

```typescript
throw new CourseNotFoundError('Course not found', {
  courseId,
  userId,
  searchCriteria,
});
```

### 2. Performance Thresholds

Definiere sinnvolle Schwellenwerte:

```typescript
// API Routes: 2s
// Database: 1s
// File Operations: 5s
```

### 3. Rate Limiting

Verhindere Spam durch Rate Limiting:

```typescript
maxItems: 1000,        // Pro Minute
itemsPerMinute: 60     // Server-side
```

## 🚨 Troubleshooting

### Häufige Probleme

1. **Token nicht gesetzt**:

   ```bash
   ⚠️ ROLLBAR_SERVER_ACCESS_TOKEN not set in production
   ```

2. **Client-side Errors nicht gemeldet**:
   - Prüfe `NEXT_PUBLIC_ROLLBAR_CLIENT_ACCESS_TOKEN`
   - Verifiziere CSP Headers

3. **Zu viele Errors**:
   - Adjustiere `ignoredMessages`
   - Erhöhe Filter-Threshold

### Debug Mode

```typescript
// Aktiviere verbose logging
ROLLBAR_ENABLED = true;
verbose = true;
reportLevel = debug;
```

## 🔗 Links

- [Rollbar Documentation](https://docs.rollbar.com/)
- [Next.js Integration Guide](https://docs.rollbar.com/docs/nextjs)
- [Vercel Deployment](https://vercel.com/docs/integrations/rollbar)

---

**Status**: ✅ Phase 3 Complete - Production Error Monitoring Setup **Integration**: Vollständig
integriert in Hemera Error Architecture **Coverage**: 100% Server + Client Error Monitoring
