/**
 * Audit logging utilities
 * Records critical admin actions for security and compliance
 */

import { serverInstance } from '@/lib/monitoring/rollbar-official';
import { filterAuditEvent } from './log-sanitizer';

export type AuditActionType =
  | 'COURSE_MATERIAL_CREATE'
  | 'COURSE_MATERIAL_UPDATE'
  | 'COURSE_MATERIAL_DELETE'
  | 'IMAGE_UPLOAD'
  | 'CONTENT_FETCH'
  | 'AUTH_BYPASS_ATTEMPT';

export interface AuditLog {
  action: AuditActionType;
  userId: string;
  resourceId?: string;
  resourceType: string;
  status: 'success' | 'failure';
  details?: Record<string, unknown>;
  error?: string;
  timestamp: string;
}

/**
 * Log critical admin actions with user identity
 * Never logs PII or sensitive content
 */
export function logAuditEvent(
  action: AuditActionType,
  userId: string,
  resourceId: string | undefined,
  resourceType: string,
  status: 'success' | 'failure',
  options?: {
    error?: string;
    details?: Record<string, unknown>;
  }
): void {
  const timestamp = new Date().toISOString();
  const auditLog: AuditLog = {
    action,
    userId,
    resourceId,
    resourceType,
    status,
    timestamp,
    ...options,
  };

  // Log to Rollbar with "audit" tag for easy filtering
  // Note: userId remains only in structured metadata, not in human-readable message
  // Sanitize sensitive fields before spreading to prevent information disclosure
  const auditRecord: Record<string, unknown> = { ...auditLog };
  let sanitizedAudit: Record<string, unknown>;
  try {
    sanitizedAudit = filterAuditEvent(auditRecord);
  } catch (err) {
    serverInstance.error('filterAuditEvent failed', {
      error: err instanceof Error ? err.message : 'Unknown error',
      action,
    });
    sanitizedAudit = {
      action,
      status,
      resourceType,
      timestamp,
    };
  }

  if (status === 'failure') {
    serverInstance.warning(`Audit: ${action} failed`, sanitizedAudit);
  } else {
    serverInstance.info(`Audit: ${action} completed`, sanitizedAudit);
  }
}

/**
 * Validate that Clerk is only disabled in safe contexts (E2E/CI)
 * Prevents accidental production auth bypass
 */
export function validateClerkDisableContext(): {
  allowed: boolean;
  reason?: string;
} {
  // E2E_TEST uses '1' (our convention), CI uses 'true' (GitHub Actions default)
  const isE2E = process.env.E2E_TEST === '1';
  const isCI = process.env.CI === 'true';

  // Only allow NEXT_PUBLIC_DISABLE_CLERK if we're explicitly in E2E or CI mode
  if (process.env.NEXT_PUBLIC_DISABLE_CLERK === '1') {
    if (!isE2E && !isCI) {
      return {
        allowed: false,
        reason: 'NEXT_PUBLIC_DISABLE_CLERK is set outside of E2E/CI context',
      };
    }
  }

  return { allowed: true };
}
