/**
 * Web Vitals gating (prod + public-only)
 * - Enabled only when NODE_ENV=production and NEXT_PUBLIC_ENABLE_WEB_VITALS is true/1
 * - Sends metrics only for public routes (simple heuristic)
 * - Uses dynamic import('web-vitals') to avoid hard dep at runtime
 */

export type WebVitalMetric = {
  name: string;
  value: number;
  id?: string;
  label?: string;
};

export function isWebVitalsEnabled(): boolean {
  const isProd = process.env.NODE_ENV === "production";
  const flag = process.env.NEXT_PUBLIC_ENABLE_WEB_VITALS;
  const enabled = flag === "1" || flag === "true";
  return isProd && enabled;
}

export function isPublicPath(pathname: string | undefined): boolean {
  if (!pathname) return true;
  // Heuristic: treat these prefixes as private areas
  const privatePrefixes = [
    "/auth",
    "/protected",
    "/admin",
    "/sign-in",
    "/sign-up",
  ];
  return !privatePrefixes.some((prefix) => pathname.startsWith(prefix));
}

/**
 * Initialize Web Vitals collection if gated and on public routes.
 * Returns true if initialized (metrics will be sent), otherwise false.
 */
export async function initWebVitals(
  sender: (metric: WebVitalMetric) => void,
  opts?: { path?: string },
): Promise<boolean> {
  if (!isWebVitalsEnabled()) return false;
  if (!isPublicPath(opts?.path)) return false;

  try {
    const mod = (await import("web-vitals")) as {
      onCLS?: (
        handler: (metric: {
          name: string;
          value: number;
          id: string;
          label?: string;
        }) => void,
      ) => void;
      onFCP?: (
        handler: (metric: {
          name: string;
          value: number;
          id: string;
          label?: string;
        }) => void,
      ) => void;
      onLCP?: (
        handler: (metric: {
          name: string;
          value: number;
          id: string;
          label?: string;
        }) => void,
      ) => void;
      onINP?: (
        handler: (metric: {
          name: string;
          value: number;
          id: string;
          label?: string;
        }) => void,
      ) => void;
      onTTFB?: (
        handler: (metric: {
          name: string;
          value: number;
          id: string;
          label?: string;
        }) => void,
      ) => void;
    };
    const handler = (metric: {
      name: string;
      value: number;
      id: string;
      label?: string;
    }) =>
      sender({
        name: metric.name,
        value: metric.value,
        id: metric.id,
        label: metric.label,
      });

    mod.onCLS?.(handler);
    mod.onFCP?.(handler);
    mod.onLCP?.(handler);
    mod.onINP?.(handler);
    mod.onTTFB?.(handler);
    return true;
  } catch {
    // If web-vitals not available, silently skip
    return false;
  }
}
