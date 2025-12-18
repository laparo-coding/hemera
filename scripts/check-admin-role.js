#!/usr/bin/env node

import { config } from 'dotenv';

config({ path: '.env.local' });

console.log('🔍 Checking Admin Configuration...\n');

console.log('📋 Clerk Configuration:');
console.log(
  `   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ${process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? '✅ Set' : '❌ Missing'}`
);
console.log(
  `   CLERK_SECRET_KEY: ${process.env.CLERK_SECRET_KEY ? '✅ Set' : '❌ Missing'}`
);

console.log('\n📝 To set admin role in Clerk Dashboard:');
console.log('   1. Go to: https://dashboard.clerk.com');
console.log('   2. Select your application');
console.log('   3. Go to Users → Select your user');
console.log('   4. Click "Metadata" tab');
console.log('   5. In "Public metadata" section, add:');
console.log('      {');
console.log('        "role": "admin"');
console.log('      }');
console.log('   6. Save changes');

console.log('\n🔗 URLs to access:');
console.log('   Admin Index:   http://localhost:3000/admin');
console.log('   Course Admin:  http://localhost:3000/admin/courses');

console.log('\n⚠️  Important:');
console.log('   - You must be logged in with a Clerk account');
console.log('   - The account must have publicMetadata.role = "admin"');
console.log('   - After setting metadata, log out and log in again');
console.log('   - Clear browser cache if issues persist\n');
