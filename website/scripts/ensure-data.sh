#!/bin/bash

# Script to ensure data files are available for build
# This is used in CI/CD environments where data might not be present

set -e  # Exit on any error

# Use ADMIN_DATA_DIR environment variable or default to .data
ADMIN_DATA_DIR="${ADMIN_DATA_DIR:-.data}"

# Function to validate file paths and prevent directory traversal
validate_file_path() {
    local file_path="$1"
    
    # Check for directory traversal patterns
    if [[ "$file_path" == *".."* ]] || [[ "$file_path" == *"~"* ]] || [[ "$file_path" == /* ]]; then
        echo "❌ Invalid file path: $file_path. Directory traversal not allowed."
        return 1
    fi
    
    # Note: Null byte checking is handled at the application level
    
    # Ensure file has .json extension
    if [[ "$file_path" != *.json ]]; then
        echo "❌ Invalid file path: $file_path. Only .json files are allowed."
        return 1
    fi
    
    # Check for suspicious patterns
    local lower_path=$(echo "$file_path" | tr '[:upper:]' '[:lower:]')
    local suspicious_patterns=("/etc/" "/proc/" "/sys/" "/dev/" "config" "secret" "password")
    
    for pattern in "${suspicious_patterns[@]}"; do
        if [[ "$lower_path" == *"$pattern"* ]]; then
            echo "❌ Invalid file path: $file_path. Suspicious pattern detected."
            return 1
        fi
    done
    
    return 0
}

echo "🔍 Checking for data files in $ADMIN_DATA_DIR/..."

# Get the project root directory (parent of website directory)
PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
echo "📁 Project root: $PROJECT_ROOT"

# Check if data files exist in admin data directory
WEBSITE_DATA_DIR="$PROJECT_ROOT/website/$ADMIN_DATA_DIR"

# Handle case where artifact downloads into data/final/ subfolder
if [ -d "$WEBSITE_DATA_DIR/data/final" ]; then
    echo "🔄 Found data/final/ subfolder, flattening files to $ADMIN_DATA_DIR/..."
    # Move all JSON files from data/final/ to admin data directory
    find "$WEBSITE_DATA_DIR/data/final" -name "*.json" -exec mv {} "$WEBSITE_DATA_DIR/" \;
    # Remove the now-empty data/final/ directory
    rm -rf "$WEBSITE_DATA_DIR/data"
    echo "✅ Flattened data files from data/final/ to $ADMIN_DATA_DIR/"
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
    # SECURITY: Validate file path before processing
    if ! validate_file_path "$file"; then
        echo "❌ Skipping invalid file: $file"
        missing_files+=("$file")
        continue
    fi
    
    if [ ! -f "$WEBSITE_DATA_DIR/$file" ]; then
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -eq 0 ]; then
    echo "✅ All required data files found in $ADMIN_DATA_DIR/"
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
