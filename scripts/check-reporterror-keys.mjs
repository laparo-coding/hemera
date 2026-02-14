#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const WHITELIST = new Set([
  'context',
  'requestId',
  'sessionId',
  'bookingId',
  'courseId',
  'userId',
  'paymentIntentId',
  'disputeId',
  'amount',
  'reason',
  'recipientCount',
  'errorType',
  'issueCount',
  'issues',
  'receivedDataSummary',
  'recipientEmail',
  'operation',
  'duration',
  'performanceIssue',
  'slowApiCall',
  'timestamp',
]);

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (['node_modules', '.git', '.next'].includes(e.name)) continue;
      walk(full);
    } else if (e.isFile()) {
      if (/\.(js|ts|mjs|mts|tsx|jsx)$/.test(e.name)) scanFile(full);
    }
  }
}

function scanFile(file) {
  const content = fs.readFileSync(file, 'utf8');
  const hits = [];
  let idx = 0;
  while ((idx = content.indexOf('additionalData', idx)) !== -1) {
    // find opening brace after ':'
    const colon = content.indexOf(':', idx);
    const brace = content.indexOf('{', colon);
    if (colon === -1 || brace === -1) { idx += 11; continue; }
    // extract block by balancing braces
    let i = brace;
    let depth = 0;
    let end = -1;
    for (; i < content.length; i++) {
      const ch = content[i];
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) { end = i; break; }
      }
    }
    if (end === -1) { idx = brace + 1; continue; }
    const block = content.slice(brace + 1, end);
    const keys = Array.from(block.matchAll(/([\w$-]+)\s*:/g)).map(m => m[1]);
    if (keys.length > 0) hits.push({ start: brace, end, keys });
    idx = end + 1;
  }

  if (hits.length === 0) return;

  const problems = [];
  for (const h of hits) {
    for (const k of h.keys) {
      if (!WHITELIST.has(k)) problems.push(k);
    }
  }

  if (problems.length > 0) {
    console.log('\n[REPORTERROR] File:', path.relative(ROOT, file));
    console.log('  Unlisted keys in additionalData:', Array.from(new Set(problems)).join(', '));
  }
}

console.log('Scanning repository for reportError additionalData keys...');
walk(ROOT);
console.log('\nScan complete. See above for any unlisted keys.');
process.exit(0);
