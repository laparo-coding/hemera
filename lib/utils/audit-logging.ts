/**
 * Audit logging utilities
 * Records critical admin actions for security and compliance
 */

import { serverInstance } from '@/lib/monitoring/rollbar-official';

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
  const auditLog: AuditLog = {
    action,
    userId,
    resourceId,
    resourceType,
    status,
    timestamp: new Date().toISOString(),
    ...options,
  };

  // Log to Rollbar with "audit" tag for easy filtering
  if (status === 'failure') {
    serverInstance.warning(`Audit: ${action} failed for user ${userId}`, {
      ...auditLog,
    });
  } else {
    serverInstance.info(`Audit: ${action} completed`, {
      ...auditLog,
    });
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
