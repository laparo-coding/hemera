# Rollbar-Dashboard Setup für Hemera-Projekt

Für die verifizierten lokalen Token-Namen und Minimalchecks siehe auch
`docs/monitoring/rollbar-local-checklist.md`.

## Monitoring-Konfiguration

### 1. Dashboard-Übersicht

**Hauptmetriken zu überwachen:**

- Request Volume (Anfragen pro Minute/Stunde)
- Error Rate (Fehlerrate in %)
- Response Time (Durchschnittliche Antwortzeit)
- Request ID-Coverage (Abdeckung der Request-Verfolgung)

### 2. Alerts-Konfiguration

**Kritische Alerts:**

```yaml
error_rate_alert:
  threshold: '> 5% in 5 minutes'
  notification: 'Email + Slack'

response_time_alert:
  threshold: '> 2 seconds average in 10 minutes'
  notification: 'Email'

volume_spike_alert:
  threshold: '> 500% increase in 5 minutes'
  notification: 'Slack'
```

**API-spezifische Alerts:**

```yaml
auth_failures:
  threshold: '> 10 failures in 5 minutes'
  routes: ['/api/auth/*']

database_errors:
  threshold: '> 3 database errors in 5 minutes'

payment_failures:
  threshold: '> 1 payment error'
  immediate: true
```

### 3. Custom Dashboard-Widgets

**Request ID-Tracking Widget:**

- Zeigt Request IDs mit zugehörigen Logs
- Filtermöglichkeiten nach Zeitraum, Route, User
- Drill-down zu vollständigen Request-Traces

**API Route Performance:**

```javascript
// Custom Rollbar query für API-Performance
{
  "query": {
    "and": [
      {"field": "custom.requestId", "operation": "exists"},
      {"field": "custom.context.method", "operation": "eq", "value": "GET"}
    ]
  },
  "groupBy": "custom.context.url",
  "metrics": ["count", "avg(custom.responseTime)"]
}
```

**User Journey Tracking:**

```javascript
// Request ID-basierte User Journey
{
  "query": {
    "field": "custom.context.userId",
    "operation": "eq",
    "value": "$userId"
  },
  "sortBy": "timestamp",
  "includeContext": true
}
```

### 4. Error-Categorization

**Error-Kategorien für bessere Übersicht:**

1. **Authentication Errors**
   - UNAUTHORIZED (401)
   - FORBIDDEN (403)
2. **Client Errors**
   - INVALID_INPUT (400)
   - NOT_FOUND (404)
3. **Server Errors**
   - INTERNAL_ERROR (500)
   - DATABASE_CONNECTION (503)

4. **Business Logic Errors**
   - PAYMENT_FAILED
   - BOOKING_CONFLICT
   - CAPACITY_EXCEEDED

### 5. Rollbar-Integration Code

**Erweiterte Error-Tracking Konfiguration:**

```typescript
// In lib/monitoring/rollbar-dashboard.ts
export const rollbarDashboardConfig = {
  alertRules: [
    {
      name: 'High Error Rate',
      query: 'level:error',
      threshold: 'count > 10',
      timeWindow: '5 minutes',
    },
    {
      name: 'API Response Time',
      query: 'custom.responseTime exists',
      threshold: 'avg(custom.responseTime) > 2000',
      timeWindow: '10 minutes',
    },
  ],

  customFields: [
    'custom.requestId',
    'custom.context.method',
    'custom.context.url',
    'custom.context.userId',
    'custom.responseTime',
  ],
};
```

### 6. Deployment-Integration

**Post-Deployment Monitoring:**

```bash
# Nach jedem Deployment ausführen
curl -X POST https://api.rollbar.com/api/1/deploy/ \
  -H "X-Rollbar-Access-Token: $ROLLBAR_ACCESS_TOKEN" \
  -d environment=$DEPLOY_ENV \
  -d revision=$GIT_SHA \
  -d rollbar_name="$USER" \
  -d local_username="$USER"
```

### 7. Request ID-basierte Debugging

**Debug-Workflow mit Request IDs:**

1. User meldet Problem
2. User teilt Request ID mit (aus Response-Header)
3. Dashboard-Suche nach Request ID
4. Vollständige Request-Trace verfügbar
5. Root-Cause-Analyse möglich

**Rollbar-Query für Request ID:**

```
custom.requestId:"abc123def456"
```

### 8. Performance-Monitoring

**API-Endpunkt Performance-Tracking:**

```typescript
// Automatische Performance-Metriken
export function trackApiPerformance(
  requestId: string,
  method: string,
  url: string,
  startTime: number
) {
  const responseTime = Date.now() - startTime;

  serverInstance.info('API Performance Metric', {
    requestId,
    responseTime,
    method,
    url,
    timestamp: new Date().toISOString(),
  });
}
```

### 9. Team-Notifications

**Notification-Channels:**

- **Critical Errors:** Immediate Slack + Email
- **Performance Issues:** Email (15min delay)
- **Deployment Events:** Slack
- **Weekly Summary:** Email Dashboard

### 10. Maintenance-Dashboard

**Wartungs-Metriken:**

- Request ID-Coverage: >95%
- Log-Completeness: 100% für Errors
- API-Response-Standardization: 100%
- Performance-Baseline: <2s avg response

## Quick-Setup Checklist

- [ ] Rollbar Project erstellt
- [ ] Access Tokens konfiguriert
- [ ] Alert Rules definiert
- [ ] Custom Fields aktiviert
- [ ] Dashboard Widgets erstellt
- [ ] Team Notifications eingerichtet
- [ ] Deployment Integration getestet
- [ ] Request ID-Queries gespeichert
- [ ] Performance Baselines gesetzt
- [ ] Dokumentation geteilt

## Rollbar-Dashboard URLs

```
Production Dashboard: https://rollbar.com/hemera-production/
Staging Dashboard: https://rollbar.com/hemera-staging/
Request ID Search: https://rollbar.com/hemera-production/items/?query=custom.requestId%3A
API Performance: https://rollbar.com/hemera-production/rql/?query=custom.responseTime+exists
```

Diese Konfiguration bietet vollständige Überwachung der implementierten Verbesserungen und
ermöglicht proaktives Monitoring der Anwendung in Production.
