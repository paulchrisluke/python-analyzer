#!/usr/bin/env node

/**
 * Script to create an admin user using the Better-Auth Admin API
 * Based on: https://www.better-auth.com/docs/plugins/admin#api
 */

const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || "admin@example.com";
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || "admin123!";
const ADMIN_NAME = "Admin User";

async function createAdminUser() {
  try {
    console.log("Creating admin user...");
    
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const response = await fetch(`${appUrl}/api/admin/create-admin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        name: ADMIN_NAME,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to create admin user");
    }

    console.log("✅ Admin user created successfully!");
    console.log("Email:", ADMIN_EMAIL);
    console.log("Password:", ADMIN_PASSWORD);
    console.log("Role: admin");
    console.log("\nYou can now use these credentials to test admin access.");
    
  } catch (error) {
    console.error("❌ Error creating admin user:", error.message);
    
    if (error.message.includes("User already exists")) {
      console.log("ℹ️  Admin user already exists. You can use the existing credentials:");
      console.log("Email:", ADMIN_EMAIL);
      console.log("Password:", ADMIN_PASSWORD);
    }
  }
}

// Alternative: Create admin user directly via Better-Auth API
async function createAdminViaAuthAPI() {
  try {
    console.log("Creating admin user via Better-Auth API...");
    
    // First, create a regular user
    const authUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:8787";
    const signUpResponse = await fetch(`${authUrl}/api/auth/sign-up/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        name: ADMIN_NAME,
      }),
    });

    const signUpResult = await signUpResponse.json();

    if (!signUpResponse.ok) {
      throw new Error(signUpResult.error?.message || "Failed to create user");
    }

    console.log("✅ User created successfully!");
    console.log("User ID:", signUpResult.data?.user?.id);
    console.log("Email:", ADMIN_EMAIL);
    console.log("Password:", ADMIN_PASSWORD);
    console.log("\nNote: You'll need to manually update the role to 'admin' in the database.");
    console.log("Or use the Better-Auth Admin API to promote the user to admin.");
    
  } catch (error) {
    console.error("❌ Error creating user via Better-Auth API:", error.message);
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("Better-Auth Admin User Creation Script");
  console.log("=====================================\n");
  
  // Try the Next.js API first, fallback to direct Better-Auth API
  createAdminUser().catch(() => {
    console.log("\nFalling back to direct Better-Auth API...\n");
    createAdminViaAuthAPI();
  });
}
