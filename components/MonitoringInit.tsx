'use client';

import { usePathname } from 'next/navigation';
import * as React from 'react';
import {
  initWebVitals,
  type WebVitalMetric,
} from '@/lib/monitoring/web-vitals';

function sendMetric(metric: WebVitalMetric & { path?: string }) {
  const payload = JSON.stringify({
    name: metric.name,
    value: metric.value,
    id: metric.id,
    label: metric.label,
    path: metric.path,
    timestamp: new Date().toISOString(),
  });

  try {
    if (
      typeof navigator !== 'undefined' &&
      typeof navigator.sendBeacon === 'function'
    ) {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon('/api/monitoring/vitals', blob);
      return;
    }
  } catch {
    // navigator.sendBeacon failed, fall back to fetch keepalive below
  }

  void fetch('/api/monitoring/vitals', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: payload,
    keepalive: true,
  }).catch(() => {
    // Swallow network errors for telemetry to avoid impacting UX
  });
}

export default function MonitoringInit() {
  const pathname = usePathname();
  const initializedRef = React.useRef(new Set<string>());

  React.useEffect(() => {
    if (!pathname || initializedRef.current.has(pathname)) {
      return;
    }

    let subscribed = true;

    const setup = async () => {
      const initialized = await initWebVitals(
        metric => {
          if (!subscribed) return;
          sendMetric({ ...metric, path: pathname });
        },
        { path: pathname }
      );

      if (initialized) {
        initializedRef.current.add(pathname);
      }
    };

    void setup();

    return () => {
      subscribed = false;
    };
  }, [pathname]);

  return null;
}
