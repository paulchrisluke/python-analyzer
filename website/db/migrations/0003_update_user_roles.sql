-- Update user roles to match UserRole enum
-- Add buyer and viewer roles, update existing roles

-- First, update existing 'user' role to 'viewer' to match the enum
UPDATE users SET role = 'viewer' WHERE role = 'user';

-- Update the role column to include all enum values
-- Note: SQLite doesn't support ALTER COLUMN with enum changes directly
-- We'll need to recreate the table or use a different approach

-- For now, we'll just update the existing data
-- The application will handle the enum validation
