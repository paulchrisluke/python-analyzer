#!/bin/bash
# Deploy ETL Pipeline Data to Cloudflare Pages

# Enable strict mode for better error handling
set -euo pipefail

echo "🚀 Deploying ETL Pipeline Data to Website..."

# Step 1: Copy latest ETL data to website
echo "📋 Copying ETL pipeline data..."
python3 deploy_to_website.py

# Step 2: Deploy to Cloudflare Pages
echo "🌐 Deploying to Cloudflare Pages..."
cd website || { echo "Failed to cd to website directory"; exit 1; }
wrangler pages deploy . --project-name cranberry-business-sale

echo "✅ Deployment complete!"
echo "🌍 Website: https://cranberry-business-sale.pages.dev"
