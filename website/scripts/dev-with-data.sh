#!/bin/bash

# Development script that ensures data is available before starting Next.js dev server
# This is useful for development when you want fresh data

set -e  # Exit on any error

echo "🚀 Starting development server with fresh ETL data..."

# Get the project root directory using git when available, fallback to script's parent
SCRIPT_DIR="$(dirname "${BASH_SOURCE[0]}")"
if command -v git >/dev/null 2>&1; then
    # Try to get repository root from git
    GIT_ROOT="$(cd "$SCRIPT_DIR" && git rev-parse --show-toplevel 2>/dev/null || true)"
    if [ -n "$GIT_ROOT" ]; then
        PROJECT_ROOT="$GIT_ROOT"
        echo "📁 Project root (from git): $PROJECT_ROOT"
    else
        # Git not in a repository, fallback to script's parent directory
        PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
        echo "📁 Project root (from script parent): $PROJECT_ROOT"
    fi
else
    # Git not available, fallback to script's parent directory
    PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
    echo "📁 Project root (from script parent, git not available): $PROJECT_ROOT"
fi

# Change to project root
cd "$PROJECT_ROOT"

# Step 1: Run ETL pipeline to generate and copy data
echo "📊 Running ETL pipeline for development..."
python run_pipeline.py

# Check if ETL pipeline succeeded
if [ $? -eq 0 ]; then
    echo "✅ ETL pipeline completed successfully"
else
    echo "❌ ETL pipeline failed"
    exit 1
fi

# Step 2: Start Next.js development server
echo "🏗️  Starting Next.js development server..."
cd "$PROJECT_ROOT/website"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the development server
npm run dev
