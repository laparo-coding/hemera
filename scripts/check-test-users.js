#!/usr/bin/env node

import https from "node:https";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

if (!CLERK_SECRET_KEY) {
  console.error("CLERK_SECRET_KEY environment variable is required");
  process.exit(1);
}

// Function to check if user exists
function checkUser(email) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.clerk.com",
      port: 443,
      path: `/v1/users?email_address=${encodeURIComponent(email)}`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${CLERK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    };

    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const response = JSON.parse(data);
          resolve({ status: res.statusCode, data: response });
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.end();
  });
}

async function checkTestUsers() {
  const emails = [
    "e2e.test@example.com",
    "e2e.duplicate@example.com",
    "e2e.dashboard@example.com",
  ];

  console.log("🔍 Checking test users in Clerk...\n");

  for (const email of emails) {
    try {
      console.log(`Checking ${email}...`);
      const result = await checkUser(email);

      if (result.status === 200) {
        if (result.data.length > 0) {
          const user = result.data[0];
          console.log(`✅ User found: ${user.id}`);
          console.log(`   Email: ${user.email_addresses[0]?.email_address}`);
          console.log(
            `   Created: ${new Date(user.created_at).toLocaleString()}`,
          );
          console.log(
            `   Email verified: ${user.email_addresses[0]?.verification?.status === "verified"}`,
          );
        } else {
          console.log(`❌ User not found`);
        }
      } else {
        console.log(`❌ Error checking user: ${result.status}`);
        console.log(result.data);
      }
      console.log("");
    } catch (error) {
      console.error(`❌ Error checking ${email}:`, error.message);
      console.log("");
    }
  }
}

checkTestUsers().catch((error) => {
  console.error("Script error:", error);
  process.exit(1);
});
