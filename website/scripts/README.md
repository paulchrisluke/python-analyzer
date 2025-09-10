# Database Scripts

This directory contains Node.js scripts for local database management.

## Scripts

### `init-local-db.js`
Initializes the local SQLite database with migrations and creates an admin user.

**Requirements:**
- `ADMIN_PASSWORD_HASH` environment variable (bcrypt hash of admin password)
- `ADMIN_EMAIL` environment variable (optional, defaults to `admin@cranberryhearing.com`)

**Usage:**
```bash
# Generate a password hash first
npm run db:hash

# Set the environment variable
export ADMIN_PASSWORD_HASH="your-bcrypt-hash-here"

# Initialize the database
npm run db:init
```

### `generate-password-hash.js`
Interactive script to generate bcrypt hashes for admin passwords.

**Usage:**
```bash
npm run db:hash
```

### `create-admin-user.js`
Generates SQL commands for creating admin users in D1 database (Cloudflare Workers).

**Usage:**
```bash
node scripts/create-admin-user.js
```

## Security Notes

- Never commit password hashes to version control
- Use strong, unique passwords for admin accounts
- The `init-local-db.js` script requires a pre-computed bcrypt hash for security
- Plaintext passwords are never logged or stored

## Database Configuration

The local database uses:
- **WAL mode** for better concurrency and durability
- **Foreign key constraints** enabled for data integrity
- **Transactions** for atomic migration application
- **Deterministic path** relative to script location
