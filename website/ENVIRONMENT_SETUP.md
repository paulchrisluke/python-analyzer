# Environment Setup Guide

This guide explains how to properly configure environment variables for the Better-Auth Admin plugin setup.

## Quick Start

1. **Copy the example file:**
   ```bash
   cp .dev.vars.example .dev.vars
   ```

2. **Update `.dev.vars` with your actual values:**
   ```bash
   # Edit .dev.vars with your actual credentials
   nano .dev.vars
   ```

3. **Never commit `.dev.vars` to version control:**
   ```bash
   # .dev.vars is already in .gitignore
   ```

## Environment Variables

### Required for Local Development

| Variable | Description | Example |
|----------|-------------|---------|
| `BETTER_AUTH_SECRET` | Secret key for Better-Auth | `your-secret-key-here` |
| `BETTER_AUTH_URL` | Better-Auth worker URL | `http://localhost:8787` |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID | `fa3dc6c06433f6b0ea78d95bce23ad91` |
| `CLOUDFLARE_D1_DATABASE_ID` | D1 database ID | `6e3eab94-840f-484f-900f-a2ddd78196d7` |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token | `your-api-token` |

### Admin Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `ADMIN_EMAILS` | Comma-separated admin emails | `admin@yourdomain.com,admin2@yourdomain.com` |

### Test Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `TEST_USER_EMAIL` | Test user email | `testuser@example.com` |
| `TEST_USER_PASSWORD` | Test user password | `testpass123!` |
| `TEST_ADMIN_EMAIL` | Test admin email | `admin@example.com` |
| `TEST_ADMIN_PASSWORD` | Test admin password | `admin123!` |

### Application URLs

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_APP_URL` | Next.js app URL | `http://localhost:3000` |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | Better-Auth worker URL | `http://localhost:8787` |

## File Structure

```
website/
├── .dev.vars.example          # Template for local development
├── .dev.vars                  # Your local credentials (DO NOT COMMIT)
├── env.example                # Template for production
├── wrangler.toml              # Cloudflare Worker configuration
└── playwright.config.ts       # Test configuration
```

## Security Best Practices

### ✅ DO:
- Use `.dev.vars` for local development
- Set production secrets using `wrangler secret put`
- Use environment-specific values
- Keep credentials out of version control

### ❌ DON'T:
- Commit `.dev.vars` to git
- Hardcode credentials in source code
- Use production credentials in development
- Share credentials in plain text

## Production Deployment

### 1. Set Secrets
```bash
wrangler secret put BETTER_AUTH_SECRET
wrangler secret put CLOUDFLARE_API_TOKEN
```

### 2. Update Environment Variables
```bash
wrangler secret put ADMIN_EMAILS
wrangler secret put TEST_USER_EMAIL
# ... etc
```

### 3. Deploy
```bash
wrangler deploy
```

## Troubleshooting

### Common Issues:

1. **"Environment variable not found"**
   - Check if `.dev.vars` exists and has the correct variable name
   - Ensure the variable is defined in `wrangler.toml`

2. **"Admin emails not working"**
   - Verify `ADMIN_EMAILS` is set correctly
   - Check that emails are comma-separated without spaces

3. **"Tests failing with wrong URLs"**
   - Ensure `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_BETTER_AUTH_URL` are set
   - Check that ports match your running services

### Debug Commands:

```bash
# Check environment variables
wrangler dev --env development

# Test with specific environment
NEXT_PUBLIC_APP_URL=http://localhost:3001 npm run test

# Verify secrets are set
wrangler secret list
```

## Environment-Specific Configurations

### Development
- Use `.dev.vars` file
- Local URLs (localhost:3000, localhost:8787)
- Test credentials

### Production
- Use `wrangler secret put`
- Production URLs
- Secure credentials
- Admin emails from your domain

### Testing
- Use test-specific credentials
- Isolated test database
- Mock external services
