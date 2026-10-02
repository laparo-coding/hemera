import { execFileSync } from 'node:child_process';

// Resolves <NAME>_KEYCHAIN_SERVICE references into <NAME> via the macOS Keychain.
export function resolveKeychainEnv(
  env = process.env,
  platform = process.platform
) {
  for (const key of Object.keys(env)) {
    if (!key.endsWith('_KEYCHAIN_SERVICE')) continue;
    const name = key.slice(0, -'_KEYCHAIN_SERVICE'.length);
    const service = env[key];
    if (!name || !service || env[name]?.trim()) continue;
    if (platform !== 'darwin') continue;
    try {
      const secret = execFileSync(
        'security',
        ['find-generic-password', '-s', service, '-w'],
        {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'ignore'],
          timeout: 5000,
        }
      ).trim();
      if (secret) env[name] = secret;
    } catch {
      process.emitWarning(`Unable to read Keychain entry for ${name}`);
    }
  }
  return env;
}
