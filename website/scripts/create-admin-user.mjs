#!/usr/bin/env node

/**
 * Script to create an admin user using Better Auth's built-in admin plugin
 * Uses the official Better Auth admin plugin endpoints for secure admin creation
 * Based on: https://www.better-auth.com/docs/plugins/admin
 */

const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || "admin@example.com";
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || "admin123!";
const ADMIN_NAME = "Admin User";

// Timeout configuration (in milliseconds)
const REQUEST_TIMEOUT = 10000; // 10 seconds

/**
 * Robustly detects if an error indicates an existing user condition
 * Checks structured properties first, then falls back to safe string matching
 */
function isExistingUserError(error) {
  if (!error) return false;
  
  // Check structured properties first (most reliable)
  if (error.code === 'UserExists' || error.name === 'UserExists') {
    return true;
  }
  
  // Check for other common structured error indicators
  if (error.code === 'USER_EXISTS' || error.name === 'USER_EXISTS') {
    return true;
  }
  
  // Check for HTTP status codes that typically indicate existing user
  if (error.status === 409 || error.statusCode === 409) { // Conflict
    return true;
  }
  
  // Fallback to safe string matching on error message
  if (error.message && typeof error.message === 'string') {
    const message = error.message.toLowerCase();
    // Use regex for more flexible matching
    const existingUserPatterns = [
      /user already exists/i,
      /user exists/i,
      /already exists/i,
      /duplicate user/i,
      /user already registered/i,
      /email already in use/i,
      /account already exists/i
    ];
    
    return existingUserPatterns.some(pattern => pattern.test(message));
  }
  
  return false;
}

async function createAdminUser() {
  try {
    console.log("Creating admin user using Better Auth admin plugin...");
    
    const authUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:8787";
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    
    // Use Better Auth admin plugin endpoint
    const response = await fetch(`${authUrl}/api/auth/admin/create-user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        name: ADMIN_NAME,
        role: "admin", // Set role to admin
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to create admin user");
    }

    console.log("✅ Admin user created successfully using Better Auth admin plugin!");
    console.log("Email:", ADMIN_EMAIL);
    console.log("Role: admin");
    console.log("\nAdmin credentials have been securely stored and are ready for use.");
    console.log("Note: Password is not displayed for security reasons.");
    
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error("❌ Request timed out after", REQUEST_TIMEOUT / 1000, "seconds");
    } else {
      console.error("❌ Error creating admin user:", error.message);
    }
    
    // Check if this is an existing user error using robust detection
    if (isExistingUserError(error)) {
      console.log("ℹ️  Admin user already exists. You can use the existing credentials:");
      console.log("Email:", ADMIN_EMAIL);
      console.log("Note: Password is not displayed for security reasons.");
    }
    
    // Re-throw the error so the fallback can handle it
    throw error;
  }
}

// Alternative: Create admin user via regular signup then promote to admin
async function createAdminViaAuthAPI() {
  try {
    console.log("Creating admin user via regular signup...");
    
    const authUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:8787";
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    
    // First, create a regular user
    const signUpResponse = await fetch(`${authUrl}/api/auth/sign-up/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        name: ADMIN_NAME,
        role: "admin", // Set role during signup
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    const signUpResult = await signUpResponse.json();

    if (!signUpResponse.ok) {
      throw new Error(signUpResult.error?.message || "Failed to create user");
    }

    console.log("✅ Admin user created successfully via regular signup!");
    console.log("User ID:", signUpResult.data?.user?.id);
    console.log("Email:", ADMIN_EMAIL);
    console.log("Role: admin");
    console.log("Note: Password is not displayed for security reasons.");
    
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error("❌ Better-Auth API request timed out after", REQUEST_TIMEOUT / 1000, "seconds");
    } else {
      console.error("❌ Error creating user via Better-Auth API:", error.message);
    }
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("Better Auth Admin User Creation Script");
  console.log("=====================================\n");
  
  // Try the Better Auth admin plugin endpoint first, fallback to regular signup
  let originalError = null;
  createAdminUser().catch((error) => {
    originalError = error;
    console.log("\nFalling back to regular signup with admin role...\n");
    console.log("Original error:", error.message);
    return createAdminViaAuthAPI();
  }).catch((fallbackError) => {
    console.error("\n❌ Both methods failed:");
    console.error("Primary method error:", originalError?.message || "Unknown error");
    console.error("Fallback method error:", fallbackError.message);
    process.exit(1);
  });
}
