#!/bin/bash
# Deploy ETL Pipeline Data to Cloudflare Pages

echo "🚀 Deploying ETL Pipeline Data to Website..."

# Step 1: Copy latest ETL data to website
echo "📋 Copying ETL pipeline data..."
python3 05_ANALYSIS_TOOLS/deploy_to_website.py

# Step 2: Deploy to Cloudflare Pages
echo "🌐 Deploying to Cloudflare Pages..."
cd website
wrangler pages deploy . --project-name cranberry-business-sale

echo "✅ Deployment complete!"
echo "🌍 Website: https://cranberry-business-sale.pages.dev"
