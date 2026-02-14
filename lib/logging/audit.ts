import { prisma } from '@/lib/db/prisma';
import { reportError } from '@/lib/monitoring/rollbar-official';

export interface PersistedApiLog {
  serviceUserId: string;
  endpoint: string;
  method: string;
  responseStatus: number;
  ipAddress?: string | null;
  metadata?: any;
}

export async function persistServiceApiLog(log: PersistedApiLog) {
  try {
    await prisma.apiLog.create({
      data: {
        serviceUserId: log.serviceUserId,
        endpoint: log.endpoint,
        method: log.method,
        responseStatus: log.responseStatus,
        ipAddress: log.ipAddress ?? null,
        metadata: log.metadata ?? null,
      },
    });
  } catch (err) {
    // Don't throw from audit persistence - report and continue
    try {
      reportError(err as Error, {
        additionalData: { context: 'persistServiceApiLog' },
      });
    } catch {
      // swallow
    }
  }
}
