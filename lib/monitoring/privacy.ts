/**
 * Privacy & Consent helpers for telemetry/monitoring.
 * Default: No PII attached unless explicit consent is granted.
 */

/**
 * Returns whether telemetry consent is granted.
 * Currently environment-driven; future: derive from a persisted consent state (e.g., cookie/local storage).
 */
export function isTelemetryConsentGranted(): boolean {
  return (
    process.env.NEXT_PUBLIC_TELEMETRY_CONSENT === '1' ||
    process.env.TELEMETRY_CONSENT === '1' ||
    process.env.ROLLBAR_ALLOW_PII === '1'
  );
}
