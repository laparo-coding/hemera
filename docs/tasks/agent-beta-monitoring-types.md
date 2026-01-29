# Agent Beta: Monitoring & Analytics Types

## Assignment Details

- **PR Number**: #2
- **Branch**: `chore/monitoring-types`
- **Priority**: High
- **Estimated Time**: 5-7 hours
- **Estimated Warnings Fixed**: ~35

## Objective

Add proper TypeScript types for all monitoring, observability, and analytics code.

## Files to Update

### 1. lib/monitoring/rollbar-official.ts

**Current Issues**: Rollbar SDK objects typed as `any` **Tasks**:

- [ ] Install types: `npm install --save-dev @types/rollbar` (if not present)
- [ ] Import Rollbar types properly
- [ ] Type error payloads and custom data
- [ ] Type configuration objects
- [ ] Type callback functions

**Example**:

```typescript
import Rollbar from 'rollbar';

interface RollbarConfig {
  accessToken: string;
  environment: string;
  captureUncaught: boolean;
  captureUnhandledRejections: boolean;
  payload?: {
    server?: {
      host?: string;
      root?: string;
    };
    client?: {
      javascript?: {
        source_map_enabled?: boolean;
      };
    };
  };
}

export function initRollbar(config: RollbarConfig): Rollbar { ... }

// Type custom data
interface ErrorContext {
  requestId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export function logError(error: Error, context?: ErrorContext): void { ... }
```

### 2. lib/monitoring/deployment-monitor.ts

**Current Issues**: Service health checks return `any` **Tasks**:

- [ ] Define `ServiceStatus` interface
- [ ] Define `HealthCheckResult` interface
- [ ] Type deployment info properly
- [ ] Type monitoring callbacks

**Example**:

```typescript
interface ServiceStatus {
  name: string;
  healthy: boolean;
  responseTime?: number;
  error?: string;
  lastCheck: Date;
}

interface HealthCheckResult {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  services: ServiceStatus[];
  timestamp: Date;
}

interface DeploymentInfo {
  version: string;
  commitSha: string;
  deployedAt: Date;
  environment: 'production' | 'preview' | 'development';
}

export class DeploymentMonitor {
  async performHealthChecks(): Promise<HealthCheckResult> { ... }
  getDeploymentStatus(): DeploymentInfo { ... }
}
```

### 3. lib/monitoring/deployment-alerts.ts

**Current Issues**: Alert data structures use `any` **Tasks**:

- [ ] Define `AlertLevel` type
- [ ] Define `AlertChannel` interface
- [ ] Type alert payloads
- [ ] Type notification handlers

**Example**:

```typescript
type AlertLevel = 'info' | 'warning' | 'error' | 'critical';

interface Alert {
  level: AlertLevel;
  title: string;
  message: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

interface AlertChannel {
  name: string;
  send: (alert: Alert) => Promise<void>;
}

export class AlertManager {
  registerChannel(channel: AlertChannel): void { ... }
  async sendAlert(alert: Alert): Promise<void> { ... }
}
```

### 4. lib/monitoring/web-vitals.ts

**Current Issues**: Web vitals metrics typed as `any` **Tasks**:

- [ ] Use the `Metric` type from `web-vitals` module (already defined in types/)
- [ ] Type vitals collection properly
- [ ] Type reporting callbacks
- [ ] Type aggregation data

**Example**:

```typescript
import { Metric } from 'web-vitals';

interface WebVitalsReport {
  metrics: Metric[];
  url: string;
  timestamp: Date;
  sessionId: string;
}

export function collectWebVitals(
  callback: (report: WebVitalsReport) => void
): void { ... }

interface AggregatedMetrics {
  cls: { p50: number; p75: number; p95: number };
  fcp: { p50: number; p75: number; p95: number };
  lcp: { p50: number; p75: number; p95: number };
  // ... other metrics
}
```

### 5. lib/analytics/request-analytics.ts

**Current Issues**: Analytics events use `any` for properties **Tasks**:

- [ ] Define base `AnalyticsEvent` interface
- [ ] Define specific event types (PageView, CustomEvent, etc.)
- [ ] Type event properties with discriminated unions
- [ ] Type aggregation queries

**Example**:

```typescript
interface BaseAnalyticsEvent {
  timestamp: Date;
  sessionId: string;
  userId?: string;
  requestId?: string;
}

interface PageViewEvent extends BaseAnalyticsEvent {
  type: 'pageview';
  path: string;
  referrer?: string;
  userAgent?: string;
}

interface CustomEvent extends BaseAnalyticsEvent {
  type: 'custom';
  name: string;
  properties: Record<string, string | number | boolean>;
}

type AnalyticsEvent = PageViewEvent | CustomEvent;

// Aggregation types
interface EventAggregation {
  eventType: string;
  count: number;
  uniqueUsers: number;
  timeRange: {
    start: Date;
    end: Date;
  };
}

export class RequestAnalytics {
  track(event: AnalyticsEvent): void { ... }
  aggregate(timeRange: { start: Date; end: Date }): EventAggregation[] { ... }
}
```

### 6. lib/utils/api-logger.ts

**Current Issues**: Log metadata uses `any` **Tasks**:

- [ ] Define `LogLevel` type
- [ ] Type log entry structure
- [ ] Type context data
- [ ] Type logger configuration

**Example**:

```typescript
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: LogContext;
}

interface LogContext {
  requestId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

interface LoggerConfig {
  minLevel: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
}

export class ApiLogger {
  constructor(config: LoggerConfig) { ... }
  log(level: LogLevel, message: string, context?: LogContext): void { ... }
  info(message: string, context?: LogContext): void { ... }
  error(message: string, error: unknown, context?: LogContext): void { ... }
}
```

### 7. components/monitoring/DeploymentMonitoringDashboard.tsx

**Current Issues**: Component props and state use `any` **Tasks**:

- [ ] Type all component props
- [ ] Type dashboard state
- [ ] Type chart data structures
- [ ] Type event handlers

**Example**:

```typescript
interface DashboardProps {
  refreshInterval?: number;
  showAlerts?: boolean;
}

interface DashboardState {
  healthStatus: HealthCheckResult | null;
  deploymentInfo: DeploymentInfo | null;
  loading: boolean;
  error: string | null;
}

interface ChartDataPoint {
  timestamp: Date;
  value: number;
  label?: string;
}

export default function DeploymentMonitoringDashboard({
  refreshInterval = 60000,
  showAlerts = true,
}: DashboardProps) {
  const [state, setState] = useState<DashboardState>({ ... });
  // ...
}
```

## Testing Requirements

### Unit Tests

- [ ] Rollbar integration initializes correctly
- [ ] Health checks return proper status
- [ ] Alerts are sent through correct channels
- [ ] Web vitals are collected accurately
- [ ] Analytics events are tracked properly
- [ ] Logger writes to correct outputs

### Integration Tests

- [ ] End-to-end monitoring workflow
- [ ] Alert notifications work
- [ ] Dashboard displays data correctly
- [ ] Web vitals are reported to backend

## Verification Checklist

Before creating PR:

- [ ] Run `npm run lint:ci` - verify warning reduction
- [ ] Run `npx tsc --noEmit` - ensure TypeScript compiles
- [ ] Run `npm test` - all tests pass
- [ ] Verify Rollbar integration still works (check dev console)
- [ ] Test dashboard in dev mode
- [ ] Check that monitoring data is properly typed in IDE

## Common Patterns

### Discriminated Union for Events

```typescript
type MonitoringEvent =
  | { type: 'health_check'; data: HealthCheckResult }
  | { type: 'alert'; data: Alert }
  | { type: 'metric'; data: Metric };

function handleEvent(event: MonitoringEvent) {
  switch (event.type) {
    case 'health_check':
      // TypeScript knows event.data is HealthCheckResult
      break;
    case 'alert':
      // TypeScript knows event.data is Alert
      break;
  }
}
```

### Optional Chaining for Nested Data

```typescript
interface DeploymentStatus {
  info?: DeploymentInfo;
  health?: HealthCheckResult;
}

function getVersion(status: DeploymentStatus): string {
  return status.info?.version ?? 'unknown';
}
```

### Type-Safe Configuration

```typescript
interface MonitoringConfig {
  rollbar: RollbarConfig;
  alerts: {
    enabled: boolean;
    channels: AlertChannel[];
  };
  healthChecks: {
    interval: number;
    services: string[];
  };
}
```

## Expected Results

**Before**: ~35 warnings in monitoring/analytics code **After**: 0-5 warnings (only in complex edge
cases) **Impact**: Better observability, type-safe monitoring, easier debugging

## Resources

- [Rollbar TypeScript Guide](https://docs.rollbar.com/docs/nodejs)
- [Web Vitals Library](https://github.com/GoogleChrome/web-vitals)
- [TypeScript Discriminated Unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)

## Support

If blocked or need clarification, comment on the PR or reach out to the lead developer.
