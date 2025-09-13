#!/bin/bash

# Test script for the simplified deployment process
# This simulates what the GitHub Actions workflow will do

set -e  # Exit on any error

echo "🧪 Testing simplified deployment process..."
echo "=============================================="

# Step 1: Install Python dependencies
echo "📦 Installing Python dependencies..."
python -m pip install --upgrade pip
pip install -r requirements-simple.txt

# Step 2: Run Simple Revenue Pipeline
echo "📊 Running simple revenue pipeline..."
python simple_revenue_pipeline.py

# Step 3: Run Simple EBITDA Pipeline
echo "💰 Running simple EBITDA pipeline..."
python simple_ebitda_pipeline.py

# Step 4: Verify financial data generated
echo "🔍 Verifying generated revenue data..."
if [ -f "website/src/data/revenue_audit_trail.json" ]; then
    echo "✅ Website src/data revenue_audit_trail.json generated"
else
    echo "❌ Website src/data revenue_audit_trail.json missing"
    exit 1
fi

echo "🔍 Verifying generated EBITDA data..."
if [ -f "website/src/data/ebitda_audit_trail.json" ]; then
    echo "✅ Website src/data ebitda_audit_trail.json generated"
else
    echo "❌ Website src/data ebitda_audit_trail.json missing"
    exit 1
fi

# Step 5: Test website build
echo "🏗️  Testing website build..."
cd website

# Install Node.js dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install
fi

# Build the website
echo "🔨 Building Next.js website..."
npm run build

if [ -d "out" ]; then
    echo "✅ Website build successful - out directory created"
    echo "📁 Build output contents:"
    ls -la out/
else
    echo "❌ Website build failed - no out directory"
    exit 1
fi

echo ""
echo "🎉 Simplified deployment test completed successfully!"
echo "=============================================="
echo "✅ Python dependencies installed"
echo "✅ Simple revenue pipeline executed"
echo "✅ Simple EBITDA pipeline executed"
echo "✅ Revenue data file generated in correct location"
echo "✅ EBITDA data file generated in correct location"
echo "✅ Website build completed"
echo ""
echo "The simplified workflow with both pipelines is ready for GitHub Actions!"
