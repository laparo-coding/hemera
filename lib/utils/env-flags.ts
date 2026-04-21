const TRUE_ENV_FLAG_VALUES = new Set(['1', 'true', 'yes', 'on']);
const FALSE_ENV_FLAG_VALUES = new Set(['0', 'false', 'no', 'off']);

function normalizeEnvFlagValue(value: string | null | undefined) {
  return value?.trim().toLowerCase();
}

export function isEnvFlagEnabled(value: string | null | undefined): boolean {
  const normalizedValue = normalizeEnvFlagValue(value);
  return normalizedValue ? TRUE_ENV_FLAG_VALUES.has(normalizedValue) : false;
}

export function isEnvFlagDisabled(value: string | null | undefined): boolean {
  const normalizedValue = normalizeEnvFlagValue(value);
  return normalizedValue ? FALSE_ENV_FLAG_VALUES.has(normalizedValue) : false;
}

export function isProcessEnvFlagEnabled(envName: string): boolean {
  return isEnvFlagEnabled(process.env[envName]);
}

export function isProcessEnvFlagDisabled(envName: string): boolean {
  return isEnvFlagDisabled(process.env[envName]);
}

export function isCiEnvironment(): boolean {
  return (
    isProcessEnvFlagEnabled('CI') ||
    isProcessEnvFlagEnabled('GITHUB_ACTIONS') ||
    // RUNNER_OS contains the runner OS name, not a boolean flag, so we check
    // its presence directly instead of routing through isProcessEnvFlagEnabled().
    Boolean(process.env.RUNNER_OS)
  );
}
