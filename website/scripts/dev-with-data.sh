#!/bin/bash

# Development script that ensures data is available before starting Next.js dev server
# This is useful for development when you want fresh data

set -euo pipefail  # Exit on any error, unset variables, and pipeline failures
IFS=$'\n\t'  # Safe IFS for word splitting

echo "🚀 Starting development server with fresh ETL data..."

# Get the project root directory using git when available, fallback to script's parent
SCRIPT_DIR="$(dirname "${BASH_SOURCE[0]}")"

# Resolve SCRIPT_DIR to absolute physical path to handle symlinks
if command -v realpath >/dev/null 2>&1; then
    SCRIPT_DIR_RESOLVED="$(realpath "$SCRIPT_DIR")"
elif command -v readlink >/dev/null 2>&1; then
    SCRIPT_DIR_RESOLVED="$(readlink -f "$SCRIPT_DIR")"
else
    # Portable fallback: resolve symlinks manually
    SCRIPT_DIR_RESOLVED="$SCRIPT_DIR"
    while [ -L "$SCRIPT_DIR_RESOLVED" ]; do
        SCRIPT_DIR_RESOLVED="$(readlink "$SCRIPT_DIR_RESOLVED")"
        # If readlink returns relative path, make it absolute
        case "$SCRIPT_DIR_RESOLVED" in
            /*) ;;
            *) SCRIPT_DIR_RESOLVED="$(dirname "$SCRIPT_DIR")/$SCRIPT_DIR_RESOLVED" ;;
        esac
    done
fi

if command -v git >/dev/null 2>&1; then
    # Try to get repository root from git without changing directories
    GIT_ROOT="$(git -C "$SCRIPT_DIR_RESOLVED" rev-parse --show-toplevel 2>/dev/null || true)"
    if [ -n "$GIT_ROOT" ]; then
        PROJECT_ROOT="$GIT_ROOT"
        echo "📁 Project root (from git): $PROJECT_ROOT"
    else
        # Git not in a repository, fallback to script's parent directory
        PROJECT_ROOT="$(dirname "$SCRIPT_DIR_RESOLVED")"
        echo "📁 Project root (from script parent): $PROJECT_ROOT"
    fi
else
    # Git not available, fallback to script's parent directory
    PROJECT_ROOT="$(dirname "$SCRIPT_DIR_RESOLVED")"
    echo "📁 Project root (from script parent, git not available): $PROJECT_ROOT"
fi

# Change to project root
cd "$PROJECT_ROOT"

# Step 1: Run ETL pipeline to generate and copy data
echo "📊 Running ETL pipeline for development..."
if python run_pipeline.py; then
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
