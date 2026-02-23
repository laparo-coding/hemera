import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { reportError } from '@/lib/monitoring/rollbar-official';

export interface PersistedApiLog {
  serviceUserId: string;
  endpoint: string;
  method: string;
  responseStatus: number;
  requestId?: string;
  ipAddress?: string | null;
  metadata?: Record<string, unknown> | null;
}

export async function persistServiceApiLog(
  log: PersistedApiLog
): Promise<void> {
  try {
    await prisma.apiLog.create({
      data: {
        serviceUserId: log.serviceUserId,
        endpoint: log.endpoint,
        method: log.method,
        responseStatus: log.responseStatus,
        ipAddress: log.ipAddress ?? null,
        metadata:
          log.metadata != null
            ? (log.metadata as Prisma.InputJsonValue)
            : Prisma.DbNull,
      },
    });
  } catch (err) {
    // Don't throw from audit persistence - report and continue
    const error = err instanceof Error ? err : new Error(String(err));
    try {
      reportError(error, {
        additionalData: { context: 'persistServiceApiLog' },
      });
    } catch {
      // swallow
    }
  }
}
