# Database Scripts

This directory contains Node.js scripts for local database management.

## Scripts

### `init-local-db.js`
Initializes the local SQLite database with migrations and creates an admin user.

**Features:**
- Applies database migrations automatically
- Creates admin user with pre-hashed password
- **Does NOT print plaintext passwords** (secure approach)
- Uses `DATABASE_PATH` environment variable for custom database location

**Requirements:**
- `ADMIN_PASSWORD_HASH` environment variable (bcrypt hash of admin password)
- `ADMIN_EMAIL` environment variable (optional, defaults to `admin@cranberryhearing.com`)
- `DATABASE_PATH` environment variable (optional, defaults to `../local.db`)

**Usage:**
```bash
# Generate a password hash first
npm run db:hash

# Set the environment variable
export ADMIN_PASSWORD_HASH="your-bcrypt-hash-here"

# Initialize the database
npm run db:init

# With custom database location
DATABASE_PATH="/custom/path/db.sqlite" npm run db:init
```

**Security Notes:**
- ✅ **Secure approach** - requires pre-computed password hash
- ✅ **No plaintext passwords** are printed or logged
- ✅ **Safe for production** when used with proper password hash generation

### `generate-password-hash.js`
Interactive script to generate bcrypt hashes for admin passwords.

**Usage:**
```bash
npm run db:hash
```

### `create-admin-user.js`
Generates SQL commands for creating admin users in D1 database (Cloudflare Workers).

**Features:**
- Generates a cryptographically-strong random password
- Prints the plaintext password for one-time use
- Creates SQL commands for both user and account tables

**Environment Variables:**
- `ADMIN_EMAIL` - Admin user email (default: admin@cranberryhearing.com)
- `ADMIN_NAME` - Admin user name (default: System Administrator)

**Usage:**
```bash
# Basic usage (uses default email/name)
node scripts/create-admin-user.js

# With custom admin credentials
ADMIN_EMAIL="admin@example.com" ADMIN_NAME="Custom Admin" node scripts/create-admin-user.js
```

**Security Notes:**
- ⚠️ **This script prints a plaintext password** - save it securely immediately
- ⚠️ **Never run in production** - use secure password generation methods instead
- ⚠️ **Change password after first login** for additional security
- The generated password is cryptographically strong but should be changed immediately

### `create-test-users.mjs`
Creates test users in the local SQLite database for testing purposes.

**Environment Variables:**
- `ADMIN_EMAIL` - Admin user email (default: admin@cranberryhearing.com)
- `ADMIN_PASSWORD` - Admin user password (default: Superman12!)
- `ADMIN_NAME` - Admin user name (default: Test Admin User)
- `BUYER_EMAIL` - Buyer user email (default: buyer@test.local)
- `BUYER_PASSWORD` - Buyer user password (default: test-buyer-password-123)
- `BUYER_NAME` - Buyer user name (default: Test Buyer User)
- `VIEWER_EMAIL` - Viewer user email (default: viewer@test.local)
- `VIEWER_PASSWORD` - Viewer user password (default: test-viewer-password-123)
- `VIEWER_NAME` - Viewer user name (default: Test Viewer User)

**Usage:**
```bash
# Create .env file with test user credentials (see env.example)
node scripts/create-test-users.mjs
```

## Security Notes

- Never commit password hashes to version control
- Use strong, unique passwords for admin accounts
- The `init-local-db.js` script requires a pre-computed bcrypt hash for security
- Plaintext passwords are not logged or stored by default, but may be output by scripts that generate them (e.g., `create-admin-user.js`)
- Avoid running password-generating scripts in shared environments or with output redirection
- Securely record or rotate any printed passwords immediately after generation

## Database Configuration

The local database uses:
- **WAL mode** for better concurrency and durability
- **Foreign key constraints** enabled for data integrity
- **Transactions** for atomic migration application
- **Deterministic path** relative to script location
