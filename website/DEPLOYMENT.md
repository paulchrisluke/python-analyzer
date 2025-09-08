# Deployment Guide

This document explains how to set up automated deployment for the Cranberry Auth Worker.

## 🚀 GitHub Actions Setup

### 1. Create Cloudflare API Token

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. Click "Create Token"
3. Use "Custom token" template
4. Set permissions:
   - **Account**: `Cloudflare Workers:Edit`
   - **Zone**: `Zone:Read` (if using custom domain)
5. Set account resources to your account
6. Copy the token

### 2. Get Cloudflare Account ID

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Select your account
3. Copy the Account ID from the right sidebar

### 3. Set GitHub Secrets

In your GitHub repository:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add these repository secrets:
   - `CLOUDFLARE_API_TOKEN`: Your API token from step 1
   - `CLOUDFLARE_ACCOUNT_ID`: Your account ID from step 2

### 4. Set Worker Secrets

The GitHub Actions will handle deployment, but you need to set the Better Auth secret manually:

```bash
# Set the secret for your worker
wrangler secret put BETTER_AUTH_SECRET --name cranberry-auth-worker
```

## 🔄 Deployment Flow

### Automatic Deployment

- **Trigger**: Push to `main` or `master` branch
- **Process**:
  1. Run tests automatically
  2. Deploy to Cloudflare Workers (only if tests pass)
  3. Worker available at: `https://cranberry-auth-worker.paulchrisluke.workers.dev`

### Pull Request Testing

- **Trigger**: Open/update pull request
- **Process**:
  1. Run tests automatically
  2. No deployment (tests only)

## 🛠️ Local Development

For local development:

```bash
# Copy example configuration
cp wrangler.toml.example wrangler.toml

# Edit wrangler.toml with your settings:
# - Update database_id
# - Update BETTER_AUTH_URL

# Set local secrets
wrangler secret put BETTER_AUTH_SECRET

# Start development server
npm run dev
```

## 🧪 Testing

### Local Testing
```bash
npm test
```

### CI Testing
Tests run automatically on:
- Pull requests
- Main branch pushes

## 🔧 Configuration Files

### Required Files
- `wrangler.toml` - Worker configuration (ignored in git)
- `wrangler.toml.example` - Template for production setup

### Environment Variables
- `BETTER_AUTH_SECRET` - Set via `wrangler secret put`
- `BETTER_AUTH_URL` - Configured in `wrangler.toml`

## 🚨 Troubleshooting

### Deployment Fails
1. Check GitHub Actions logs
2. Verify secrets are set correctly
3. Ensure `wrangler.toml` exists and is valid

### Tests Fail
1. Check test logs in GitHub Actions
2. Run tests locally: `npm test`
3. Verify Playwright configuration

### Worker Not Accessible
1. Check Cloudflare Workers dashboard
2. Verify worker is deployed and active
3. Check worker logs for errors

## 📝 Notes

- The `wrangler.toml` file is ignored in git to prevent committing sensitive data
- Use `wrangler.toml.example` as a template for production setup
- Database migrations should be run manually when needed
- All sensitive data (secrets, database IDs) should be managed through Cloudflare's secret management
