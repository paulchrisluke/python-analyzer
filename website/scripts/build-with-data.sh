#!/bin/bash

# Build script that runs ETL pipeline and then builds Next.js website
# This ensures data is available in public/data/ before the build

set -e  # Exit on any error

echo "🚀 Starting build process with ETL data pipeline..."

# Get the project root directory (parent of website directory)
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
echo "📁 Project root: $PROJECT_ROOT"

# Change to project root
cd "$PROJECT_ROOT"

# Step 1: Run ETL pipeline to generate and copy data
echo "📊 Running ETL pipeline..."
python run_pipeline.py

# Check if ETL pipeline succeeded
if [ $? -eq 0 ]; then
    echo "✅ ETL pipeline completed successfully"
else
    echo "❌ ETL pipeline failed"
    exit 1
fi

# Step 2: Verify data files exist in website/public/data/
echo "🔍 Verifying data files..."
WEBSITE_DATA_DIR="$PROJECT_ROOT/website/public/data"
REQUIRED_FILES=(
    "business_sale_data.json"
    "due_diligence_coverage.json"
    "equipment_analysis.json"
    "financial_summary.json"
    "landing_page_data.json"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$WEBSITE_DATA_DIR/$file" ]; then
        echo "✅ Found: $file"
    else
        echo "❌ Missing: $file"
        exit 1
    fi
done

# Step 3: Build Next.js website
echo "🏗️  Building Next.js website..."
cd "$PROJECT_ROOT/website"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the website
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Next.js build completed successfully"
    echo "🎉 Build process completed! Website is ready for deployment."
else
    echo "❌ Next.js build failed"
    exit 1
fi
