import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.resolve(__dirname, '../../.env') });

// Type-safe test user configuration
export interface TestUser {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'buyer' | 'viewer';
}

// Get a single test user by role
export const getTestUser = (role: 'admin' | 'buyer' | 'viewer'): TestUser => {
  const userMap = {
    admin: {
      email: process.env.ADMIN_EMAIL!,
      password: process.env.ADMIN_PASSWORD!,
      name: process.env.ADMIN_NAME || 'Test Admin User',
      role: 'admin' as const,
    },
    buyer: {
      email: process.env.BUYER_EMAIL!,
      password: process.env.BUYER_PASSWORD!,
      name: process.env.BUYER_NAME || 'Test Buyer User',
      role: 'buyer' as const,
    },
    viewer: {
      email: process.env.VIEWER_EMAIL!,
      password: process.env.VIEWER_PASSWORD!,
      name: process.env.VIEWER_NAME || 'Test Viewer User',
      role: 'viewer' as const,
    },
  };

  const user = userMap[role];
  if (!user.email || !user.password) {
    throw new Error(`Missing environment variables for ${role} user. Required: ${role.toUpperCase()}_EMAIL, ${role.toUpperCase()}_PASSWORD.`);
  }
  return user;
};

// Get test users with environment variable validation
export const getTestUsers = (): Record<string, TestUser> => {
  try {
    return {
      admin: getTestUser('admin'),
      buyer: getTestUser('buyer'),
      viewer: getTestUser('viewer'),
    };
  } catch (error) {
    console.error('Failed to load test users:', error);
    throw error;
  }
};

// Validate that all required environment variables are set
export const validateTestEnvironment = (): void => {
  const requiredVars = [
    'ADMIN_EMAIL', 'ADMIN_PASSWORD',
    'BUYER_EMAIL', 'BUYER_PASSWORD', 
    'VIEWER_EMAIL', 'VIEWER_PASSWORD'
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please set these in your .env file or environment. See tests/README.md for setup instructions.'
    );
  }
};
