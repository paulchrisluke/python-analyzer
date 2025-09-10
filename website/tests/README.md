# Test Setup Guide

This guide explains how to set up and run the Playwright tests for the Cranberry Hearing and Balance Center website.

## Environment Variables

The tests use environment variables for authentication credentials to avoid committing sensitive data. You must set up the following environment variables before running tests:

### Required Environment Variables

Create a `.env` file in the website root directory with the following variables. You can use `tests/env.example` as a template:

**Note**: Use `.env` for test credentials (not `.dev.vars`). The `.dev.vars` file is for Cloudflare Workers configuration, while `.env` is for the Next.js application that the tests run against.

### Environment File Differences

- **`.env`** - Next.js application environment variables (used by tests)
- **`.dev.vars`** - Cloudflare Workers local development variables (Better Auth, D1 database)

```bash
# Admin user credentials
ADMIN_EMAIL=<your-admin-email>
ADMIN_PASSWORD=<your-secure-admin-password>
ADMIN_NAME=<admin-display-name>

# Buyer user credentials  
BUYER_EMAIL=<your-buyer-email>
BUYER_PASSWORD=<your-secure-buyer-password>
BUYER_NAME=<buyer-display-name>

# Viewer user credentials
VIEWER_EMAIL=<your-viewer-email>
VIEWER_PASSWORD=<your-secure-viewer-password>
VIEWER_NAME=<viewer-display-name>
```

**Note**: This file can be used as `.env.example` - actual credentials should be set via a real `.env` file that is not committed to version control.

### Security Notes

- **Never commit real credentials** to version control
- Use test-specific email addresses and passwords
- Consider using a separate test database for testing
- The `.env` file should be in `.gitignore`

## Test Structure

The tests are organized into role-based test files:

- `admin-role-system.spec.ts` - Tests for admin user functionality
- `buyer-role.spec.ts` - Tests for buyer user access restrictions
- `viewer-role.spec.ts` - Tests for viewer user access restrictions
- `auth-flow.spec.ts` - General authentication flow tests
- `landing-page.spec.ts` - Public page tests

## Authentication Setup

The tests use Playwright's storage state feature to avoid repeated login flows:

1. **Setup Phase**: `auth.setup.ts` authenticates each user role and saves the session state
2. **Test Phase**: Tests load the appropriate storage state and start already authenticated

### Storage State Files

Authentication states are saved in `tests/auth-states/`:
- `admin-state.json` - Admin user session
- `buyer-state.json` - Buyer user session  
- `viewer-state.json` - Viewer user session

These files are generated automatically and should not be committed to version control.

## Running Tests

### Prerequisites

1. Set up environment variables (see above)
2. Ensure the development server is running: `npm run dev`
3. Install dependencies: `npm install`

### Running All Tests

```bash
npm run test
```

### Running Specific Test Suites

```bash
# Run only admin tests
npx playwright test --project=admin-tests

# Run only buyer tests  
npx playwright test --project=buyer-tests

# Run only viewer tests
npx playwright test --project=viewer-tests

# Run setup (authentication) only
npx playwright test --project=setup
```

### Running Individual Test Files

```bash
# Run admin role tests
npx playwright test admin-role-system.spec.ts

# Run buyer role tests
npx playwright test buyer-role.spec.ts

# Run viewer role tests
npx playwright test viewer-role.spec.ts
```

## Test Configuration

The Playwright configuration (`playwright.config.ts`) includes:

- **Setup Project**: Runs authentication setup before other tests
- **Role-based Projects**: Separate projects for admin, buyer, and viewer tests
- **Storage State**: Each role project loads its corresponding authentication state
- **Dependencies**: Role tests depend on the setup project completing first

## Troubleshooting

### Environment Variable Errors

If you see errors about missing environment variables:

1. Check that your `.env` file exists in the website root
2. Verify all required variables are set
3. Ensure no typos in variable names
4. Restart your terminal/IDE after creating the `.env` file

### Authentication Failures

If tests fail during authentication:

1. Verify the test users exist in your database
2. Check that credentials in `.env` match the database
3. Ensure the development server is running
4. Check for any authentication middleware issues

### Storage State Issues

If storage state files are missing or corrupted:

1. Delete the `tests/auth-states/` directory
2. Run the setup project: `npx playwright test --project=setup`
3. Verify the state files are created
4. Run your tests again

### Test User Setup

To create test users in your database, you can use the existing scripts:

```bash
# Create admin user
node scripts/create-admin-user.js

# Initialize database with test data
node scripts/init-local-db.js
```

## Best Practices

1. **Use Environment Variables**: Never hardcode credentials in test files
2. **Separate Test Data**: Use dedicated test users, not production accounts
3. **Clean State**: Tests should be independent and not rely on previous test state
4. **Storage States**: Use storage states for authenticated tests to improve performance
5. **Error Handling**: Tests should provide clear error messages for setup issues

## CI/CD Considerations

For continuous integration:

1. Set environment variables in your CI system's secrets
2. Use test-specific database instances
3. Ensure the setup project runs before role-based tests
4. Consider using headless mode for faster execution

## File Structure

```
tests/
├── README.md                    # This file
├── env.example                  # Environment variables template
├── auth.setup.ts               # Authentication setup
├── fixtures/
│   └── test-users.ts           # Test user utilities
├── auth-states/                # Generated storage states
│   └── .gitkeep
├── admin-role-system.spec.ts   # Admin functionality tests
├── buyer-role.spec.ts          # Buyer access restriction tests
├── viewer-role.spec.ts         # Viewer access restriction tests
├── auth-flow.spec.ts           # General auth tests
└── landing-page.spec.ts        # Public page tests
```
