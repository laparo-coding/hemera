/**
 * Environment Variable Prefix Resolver
 *
 * The Vercel-Rollbar integration creates env vars with timestamp suffixes
 * (e.g. ROLLBAR_HEMERA_SERVER_TOKEN_1769716944). This helper resolves the
 * exact name first, then falls back to any key starting with the prefix.
 */

/**
 * Find an environment variable by prefix.
 * Checks exact matches first, then searches for keys with timestamp suffixes.
 * Skips Vercel-deleted variables (prefixed with "(DELETED)_").
 */
export function findEnvByPrefix(...prefixes: string[]): string | undefined {
  // 1) Check exact matches first (fastest path)
  for (const prefix of prefixes) {
    const exact = process.env[prefix];
    if (exact && exact.trim().length > 0) return exact;
  }

  // 2) Search for Vercel-Rollbar integration keys (PREFIX_<timestamp>)
  const allKeys = Object.keys(process.env);
  for (const prefix of prefixes) {
    const pattern = `${prefix}_`;
    const matchingKeys: string[] = [];

    for (const key of allKeys) {
      // Skip deleted variables (Vercel marks them with "(DELETED)_" prefix)
      if (key.startsWith('(DELETED)')) continue;
      if (key.startsWith(pattern)) {
        const val = process.env[key];
        if (val && val.trim().length > 0) {
          matchingKeys.push(key);
        }
      }
    }

    matchingKeys.sort((left, right) => {
      const leftSuffix = Number.parseInt(left.slice(pattern.length), 10);
      const rightSuffix = Number.parseInt(right.slice(pattern.length), 10);

      if (Number.isFinite(leftSuffix) && Number.isFinite(rightSuffix)) {
        return rightSuffix - leftSuffix;
      }

      return right.localeCompare(left);
    });

    if (matchingKeys.length > 0) {
      return process.env[matchingKeys[0]!];
    }
  }

  return undefined;
}
