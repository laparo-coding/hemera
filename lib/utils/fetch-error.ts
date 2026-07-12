/**
 * Extracts an error message from a failed fetch Response.
 * Falls back to `fallback` if the body is not valid JSON or has no message.
 */
export async function extractErrorMessage(
  response: Response,
  fallback: string
): Promise<string> {
  try {
    const error = await response.json();
    return error?.error?.message || error?.message || error?.error || fallback;
  } catch {
    return fallback;
  }
}
