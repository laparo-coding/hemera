import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { describe, expect, it } from '@jest/globals';

const workspaceRoot = path.resolve(__dirname, '../../..');
const detectorScript = path.join(
  workspaceRoot,
  'scripts/detect-vercel-protection.sh'
);

function runDetector(responseBody: string): number {
  return spawnSync('bash', [detectorScript], {
    cwd: workspaceRoot,
    input: responseBody,
    encoding: 'utf8',
  }).status ?? 1;
}

describe('detect-vercel-protection.sh', () => {
  it('matches a Vercel login page', () => {
    const html = `
      <html>
        <body>
          <a href="https://vercel.com/login">Continue</a>
          <p>Authentication required</p>
        </body>
      </html>
    `;

    expect(runDetector(html)).toBe(0);
  });

  it('matches Vercel preview protection with access denied copy', () => {
    const html = `
      <html>
        <body>
          <h1>Preview Deployment Protection</h1>
          <p>Access denied</p>
          <small>Protected by Vercel</small>
        </body>
      </html>
    `;

    expect(runDetector(html)).toBe(0);
  });

  it('matches human verification only when paired with a Vercel marker', () => {
    const html = `
      <html>
        <body>
          <h1>Vercel Security Checkpoint</h1>
          <p>Verify you are human before continuing</p>
        </body>
      </html>
    `;

    expect(runDetector(html)).toBe(0);
  });

  it('does not match a generic captcha page without Vercel markers', () => {
    const html = `
      <html>
        <body>
          <h1>Security checkpoint</h1>
          <p>Verify you are human</p>
        </body>
      </html>
    `;

    expect(runDetector(html)).toBe(1);
  });

  it('does not match a generic application auth page', () => {
    const html = `
      <html>
        <body>
          <h1>Authentication required</h1>
          <p>Please sign in to continue.</p>
        </body>
      </html>
    `;

    expect(runDetector(html)).toBe(1);
  });
});