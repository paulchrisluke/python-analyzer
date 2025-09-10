import { getTestUser } from '../auth.setup';
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
