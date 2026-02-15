#!/usr/bin/env node
import process from 'process';
import fs from 'fs';
import path from 'path';

function loadEnvFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
      if (!m) continue;
      let [, k, v] = m;
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (!process.env[k]) process.env[k] = v;
    }
    console.log(`Loaded env from ${filePath}`);
  } catch (err) {
    // ignore missing
  }
}

const cwd = process.cwd();
loadEnvFile(path.join(cwd, '.env'));
loadEnvFile(path.join(cwd, '.env.local'));
// try sibling aither
loadEnvFile(path.join(cwd, '..', 'aither', '.env'));
loadEnvFile(path.join(cwd, '..', 'aither', '.env.local'));

const key = process.env.CONTEXT7_API_KEY;
if (!key || key.startsWith('ctx7sk_your')) {
  console.log('CONTEXT7_API_KEY not set or using placeholder. Set a real key to run the test.');
  console.log('Example (temporary):');
  console.log("  CONTEXT7_API_KEY=ctx7sk_... node scripts/test-context7.mjs");
  process.exit(0);
}

try {
  const { Context7 } = await import('@upstash/context7-sdk');
  const client = new Context7({ apiKey: key });

  console.log('Searching for /vercel/next.js (query: "App Router middleware")...');
  const libs = await client.searchLibrary('App Router middleware', 'next');
  if (!libs || libs.length === 0) {
    console.log('No libraries found for "next".');
    process.exit(0);
  }
  const lib = libs[0];
  console.log(`Found library: ${lib.title || lib.name} (${lib.id}) - ${lib.totalSnippets || lib.codeSnippets || 0} snippets`);

  console.log('Fetching context text (first 200 chars)...');
  const ctx = await client.getContext('How to implement middleware authentication in the App Router', lib.id, { type: 'txt' });
  if (!ctx) {
    console.log('No context returned');
    process.exit(0);
  }
  const text = typeof ctx === 'string' ? ctx : (ctx[0]?.content || JSON.stringify(ctx).slice(0,200));
  console.log(text.substring(0, 200) + (text.length > 200 ? '...' : ''));
  console.log('Test completed successfully.');
} catch (err) {
  console.error('Error during Context7 test:', err.message || err);
  process.exit(1);
}
