#!/bin/bash

# Script to ensure data files are available for build
# This is used in CI/CD environments where data might not be present

set -e  # Exit on any error

echo "🔍 Checking for data files in public/data/..."

# Get the project root directory (parent of website directory)
PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
echo "📁 Project root: $PROJECT_ROOT"

# Check if data files exist in public/data/
WEBSITE_DATA_DIR="$PROJECT_ROOT/website/public/data"

# Handle case where artifact downloads into data/final/ subfolder
if [ -d "$WEBSITE_DATA_DIR/data/final" ]; then
    echo "🔄 Found data/final/ subfolder, flattening files to public/data/..."
    # Move all JSON files from data/final/ to public/data/
    find "$WEBSITE_DATA_DIR/data/final" -name "*.json" -exec mv {} "$WEBSITE_DATA_DIR/" \;
    # Remove the now-empty data/final/ directory
    rm -rf "$WEBSITE_DATA_DIR/data"
    echo "✅ Flattened data files from data/final/ to public/data/"
fi
REQUIRED_FILES=(
    "business_sale_data.json"
    "due_diligence_coverage.json"
    "equipment_analysis.json"
    "financial_summary.json"
    "landing_page_data.json"
)

missing_files=()
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$WEBSITE_DATA_DIR/$file" ]; then
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -eq 0 ]; then
    echo "✅ All required data files found in public/data/"
    exit 0
fi

echo "⚠️  Missing data files: ${missing_files[*]}"
echo "🔄 Attempting to generate data files..."

# Change to project root
cd "$PROJECT_ROOT"

# Check if Python and requirements are available
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo "❌ Python not found. Cannot generate data files."
    echo "Please ensure the ETL pipeline has run and data files are available."
    exit 1
fi

# Check if requirements.txt exists
if [ ! -f "requirements.txt" ]; then
    echo "❌ requirements.txt not found. Cannot install dependencies."
    echo "Please ensure the ETL pipeline has run and data files are available."
    exit 1
fi

# Try to install dependencies and run pipeline
echo "📦 Installing Python dependencies..."
$PYTHON_CMD -m pip install --upgrade pip
$PYTHON_CMD -m pip install -r requirements.txt

echo "🚀 Running ETL pipeline..."
$PYTHON_CMD run_pipeline.py

# Check again if files are now available
echo "🔍 Re-checking for data files..."
all_found=true
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$WEBSITE_DATA_DIR/$file" ]; then
        echo "❌ Still missing: $file"
        all_found=false
    else
        echo "✅ Found: $file"
    fi
done

if [ "$all_found" = true ]; then
    echo "✅ All data files are now available!"
    exit 0
else
    echo "❌ Some data files are still missing after running ETL pipeline."
    echo "Please check the ETL pipeline logs for errors."
    exit 1
fi
