#!/bin/bash

# Development script that ensures data is available before starting Next.js dev server
# This is useful for development when you want fresh data

set -e  # Exit on any error

echo "🚀 Starting development server with fresh ETL data..."

# Get the project root directory (parent of website directory)
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
echo "📁 Project root: $PROJECT_ROOT"

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
