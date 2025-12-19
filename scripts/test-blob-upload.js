#!/usr/bin/env node

/**
 * Test Vercel Blob Upload
 *
 * Tests if BLOB_READ_WRITE_TOKEN works by uploading a test file
 */

import { put } from '@vercel/blob';
import { config } from 'dotenv';

config({ path: '.env.local' });

console.log('🧪 Testing Vercel Blob Upload...\n');

// Check if token is configured
if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error('❌ BLOB_READ_WRITE_TOKEN not found in environment');
  process.exit(1);
}

console.log('✅ BLOB_READ_WRITE_TOKEN found');
console.log(
  `   Token: ${process.env.BLOB_READ_WRITE_TOKEN.substring(0, 20)}...\n`
);

async function testUpload() {
  try {
    console.log('📤 Uploading test file...');

    // Create a simple test file content
    const testContent = 'Test upload from hemera admin interface';
    const testBlob = new Blob([testContent], { type: 'text/plain' });

    // Upload to Vercel Blob
    const blob = await put('test-upload.txt', testBlob, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    console.log('✅ Upload successful!\n');
    console.log('📋 Blob Details:');
    console.log(`   URL: ${blob.url}`);
    console.log(`   Size: ${blob.size} bytes`);
    console.log(`   Upload Time: ${blob.uploadedAt}\n`);

    console.log('🧹 Cleaning up...');

    // Try to delete the test file
    const { del } = await import('@vercel/blob');
    await del(blob.url, { token: process.env.BLOB_READ_WRITE_TOKEN });

    console.log('✅ Test file deleted\n');
    console.log('✅ Blob storage is working correctly!');
    console.log('   You can now upload course thumbnails\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Upload failed:', error.message);

    if (error.message.includes('token')) {
      console.error('\n💡 Token issue detected. Try:');
      console.error('   1. Verify token in Vercel Dashboard → Storage → Blob');
      console.error('   2. Run: vercel env pull .env.local');
      console.error('   3. Restart your development server\n');
    }

    process.exit(1);
  }
}

testUpload();
