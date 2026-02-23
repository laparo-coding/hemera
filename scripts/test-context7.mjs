#!/usr/bin/env node
import process from 'process';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

function loadEnvFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`Env file not found: ${filePath}`);
      return;
    }
    const content = fs.readFileSync(filePath, 'utf8');
    const parsed = dotenv.parse(content);
    for (const [k, v] of Object.entries(parsed)) {
      if (process.env[k] === undefined) process.env[k] = String(v);
    }
    console.log(`Loaded env from ${filePath}`);
  } catch (err) {
    console.error(`Failed to load env from ${filePath}:`, err.message || err);
    // Non-critical: continue without this env file
  }
}

const cwd = process.cwd();
loadEnvFile(path.join(cwd, '.env'));
loadEnvFile(path.join(cwd, '.env.local'));

// Try sibling aither path; make configurable via SIBLING_AITHER_PATH env var
const siblingAither = process.env.SIBLING_AITHER_PATH || path.join(cwd, '..', 'aither');
const aitherEnv = path.join(siblingAither, '.env');
const aitherEnvLocal = path.join(siblingAither, '.env.local');
if (fs.existsSync(siblingAither)) {
  loadEnvFile(aitherEnv);
  loadEnvFile(aitherEnvLocal);
} else {
  console.warn(`Sibling path for aither not found: ${siblingAither}`);
}

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

  let text = '';
  if (typeof ctx === 'string') {
    text = ctx;
  } else if (Array.isArray(ctx) && ctx.length > 0 && typeof ctx[0]?.content === 'string') {
    text = ctx[0].content;
  } else if (ctx && typeof ctx.content === 'string') {
    text = ctx.content;
  } else {
    try {
      text = JSON.stringify(ctx).slice(0, 200);
    } catch (e) {
      text = String(ctx).slice(0, 200);
    }
  }

  if (typeof text !== 'string') text = String(text || '');
  console.log(text.substring(0, 200) + (text.length > 200 ? '...' : ''));
  console.log('Test completed successfully.');
} catch (err) {
  console.error('Error during Context7 test:', err.message || err);
  process.exit(1);
}
