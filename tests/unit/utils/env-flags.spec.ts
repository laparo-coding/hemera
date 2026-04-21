import { describe, expect, it } from '@jest/globals';

import {
  isCiEnvironment,
  isEnvFlagDisabled,
  isEnvFlagEnabled,
  isProcessEnvFlagDisabled,
  isProcessEnvFlagEnabled,
} from '../../../lib/utils/env-flags';

describe('env-flags', () => {
  describe('isEnvFlagEnabled', () => {
    it.each(['1', 'true', 'TRUE', ' yes ', 'on'])('treats %s as enabled', value => {
      expect(isEnvFlagEnabled(value)).toBe(true);
    });

    it.each([undefined, null, '', '0', 'false', 'off', 'random'])('treats %s as not enabled', value => {
      expect(isEnvFlagEnabled(value)).toBe(false);
    });
  });

  describe('isEnvFlagDisabled', () => {
    it.each(['0', 'false', 'FALSE', ' no ', 'off'])('treats %s as disabled', value => {
      expect(isEnvFlagDisabled(value)).toBe(true);
    });

    it.each([undefined, null, '', '1', 'true', 'on', 'random'])('treats %s as not disabled', value => {
      expect(isEnvFlagDisabled(value)).toBe(false);
    });
  });

  describe('process env helpers', () => {
    const originalCi = process.env.CI;
    const originalGithubActions = process.env.GITHUB_ACTIONS;
    const originalRunnerOs = process.env.RUNNER_OS;
    const originalRollbarEnabled = process.env.ROLLBAR_ENABLED;

    afterEach(() => {
      process.env.CI = originalCi;
      process.env.GITHUB_ACTIONS = originalGithubActions;
      process.env.RUNNER_OS = originalRunnerOs;
      process.env.ROLLBAR_ENABLED = originalRollbarEnabled;
    });

    it('reads enabled flags from process.env', () => {
      process.env.ROLLBAR_ENABLED = 'true';

      expect(isProcessEnvFlagEnabled('ROLLBAR_ENABLED')).toBe(true);
      expect(isProcessEnvFlagDisabled('ROLLBAR_ENABLED')).toBe(false);
    });

    it('reads disabled flags from process.env', () => {
      process.env.ROLLBAR_ENABLED = '0';

      expect(isProcessEnvFlagEnabled('ROLLBAR_ENABLED')).toBe(false);
      expect(isProcessEnvFlagDisabled('ROLLBAR_ENABLED')).toBe(true);
    });

    it('treats missing process env flags as not enabled or disabled', () => {
      delete process.env.ROLLBAR_ENABLED;

      expect(isProcessEnvFlagEnabled('ROLLBAR_ENABLED')).toBe(false);
      expect(isProcessEnvFlagDisabled('ROLLBAR_ENABLED')).toBe(false);
    });

    it('detects CI from boolean flags or runner presence', () => {
      process.env.CI = '1';
      process.env.GITHUB_ACTIONS = 'false';
      delete process.env.RUNNER_OS;
      expect(isCiEnvironment()).toBe(true);

      process.env.CI = '0';
      process.env.GITHUB_ACTIONS = 'true';
      expect(isCiEnvironment()).toBe(true);

      process.env.CI = '0';
      process.env.GITHUB_ACTIONS = '0';
      process.env.RUNNER_OS = 'Linux';
      expect(isCiEnvironment()).toBe(true);
    });

    it('returns false when no CI indicators are present', () => {
      process.env.CI = '0';
      process.env.GITHUB_ACTIONS = '0';
      delete process.env.RUNNER_OS;

      expect(isCiEnvironment()).toBe(false);
    });
  });
});