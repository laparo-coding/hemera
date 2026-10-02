/**
 * Abort-signal helpers for outbound fetch calls.
 *
 * `AbortSignal.timeout()` is not available in every runtime the app
 * executes in, so fall back to a plain AbortController timer.
 */

export function createFetchTimeoutSignal(timeoutMs: number): AbortSignal {
  if (typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(timeoutMs);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);
  controller.signal.addEventListener(
    'abort',
    () => {
      clearTimeout(timeoutId);
    },
    {
      once: true,
    }
  );
  return controller.signal;
}
