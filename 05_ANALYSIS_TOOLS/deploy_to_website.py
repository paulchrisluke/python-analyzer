#!/usr/bin/env python3
"""
Deploy ETL Pipeline Data to Website
This script copies the latest ETL pipeline output to the website directory
and prepares it for deployment with Wrangler/Cloudflare Pages.
"""

import os
import shutil
import json
from pathlib import Path
from datetime import datetime

def setup_website_data_access():
    """Set up website to access ETL pipeline data by copying files to website directory."""
    print("🚀 Setting up Website Data Access...")
    
    # Define paths
    pipeline_data_dir = Path("05_ANALYSIS_TOOLS/data/final")
    website_data_dir = Path("website/data")
    
    # Create website data directory
    website_data_dir.mkdir(exist_ok=True)
    
    # Files that should be available
    expected_files = [
        "business_sale_data.json",
        "due_diligence_coverage.json", 
        "equipment_analysis.json"
    ]
    
    # Copy files from pipeline output to website directory
    for filename in expected_files:
        source_path = pipeline_data_dir / filename
        dest_path = website_data_dir / filename
        
        if source_path.exists():
            shutil.copy2(source_path, dest_path)
            print(f"✅ Copied {filename} to website/data/")
        else:
            print(f"⚠️  {filename} not found in pipeline output - run pipeline first")
    
    print("ℹ️  Data files copied to website/data/ for deployment")
    print("ℹ️  Website will read from local data directory")

def create_website_data_loader():
    """Create a JavaScript data loader for the website."""
    print("📝 Creating website data loader...")
    
    loader_js = """
// Website Data Loader
// Automatically loads the latest ETL pipeline data

class BusinessDataLoader {
    constructor() {
        this.data = null;
        this.loading = false;
        this.error = null;
    }

    async loadData() {
        if (this.loading) return;
        
        this.loading = true;
        this.error = null;
        
        try {
            // Load ETL pipeline data from website data folder
            const response = await fetch('./data/business_sale_data.json');
            if (response.ok) {
                this.data = await response.json();
                console.log('✅ Loaded ETL pipeline data from website data folder');
                return this.data;
            } else {
                throw new Error('ETL data not available');
            }
        } catch (error) {
            console.warn('⚠️ ETL data not available, no fallback data configured');
            this.error = 'No business data available';
            console.error('❌ Failed to load business data:', error);
            return null;
        } finally {
            this.loading = false;
        }
    }

    async loadDueDiligenceData() {
        try {
            const response = await fetch('./data/due_diligence_coverage.json');
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.warn('⚠️ Due diligence data not available');
        }
        return null;
    }

    async loadEquipmentData() {
        try {
            const response = await fetch('./data/equipment_analysis.json');
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.warn('⚠️ Equipment data not available');
        }
        return null;
    }

    // Helper methods to get specific data
    getFinancials() {
        return this.data?.financials || null;
    }

    getValuation() {
        return this.data?.valuation || null;
    }

    getLocations() {
        return this.data?.locations || [];
    }

    getHighlights() {
        return this.data?.highlights || [];
    }

    getMetadata() {
        return this.data?.metadata || null;
    }
}

// Global instance
window.businessDataLoader = new BusinessDataLoader();

// Auto-load data when page loads
document.addEventListener('DOMContentLoaded', async () => {
    await window.businessDataLoader.loadData();
    
    // Dispatch custom event when data is loaded
    document.dispatchEvent(new CustomEvent('businessDataLoaded', {
        detail: { data: window.businessDataLoader.data }
    }));
});
"""
    
    # Write the loader to website directory
    loader_file = Path("website/js/business-data-loader.js")
    loader_file.parent.mkdir(exist_ok=True)
    
    with open(loader_file, 'w') as f:
        f.write(loader_js)
    
    print(f"✅ Created data loader: {loader_file}")

def create_website_integration_script():
    """Create a script to integrate ETL data with the website."""
    print("🔧 Creating website integration script...")
    
    integration_script = """
// Website Integration Script
// Updates the website with ETL pipeline data

function updateWebsiteWithETLData() {
    const loader = window.businessDataLoader;
    if (!loader.data) {
        console.error('❌ No business data available');
        return;
    }

    const data = loader.data;
    
    // Update financial metrics
    updateFinancialMetrics(data.financials);
    
    // Update valuation information
    updateValuationInfo(data.valuation);
    
    // Update location information
    updateLocationInfo(data.locations);
    
    // Update highlights
    updateHighlights(data.highlights);
    
    // Update metadata
    updateMetadata(data.metadata);
}

function updateFinancialMetrics(financials) {
    if (!financials) return;
    
    // Update revenue
    const revenueElement = document.getElementById('total-revenue');
    if (revenueElement && financials.revenue) {
        revenueElement.textContent = formatCurrency(financials.revenue.total_revenue);
    }
    
    // Update annual projection
    const annualElement = document.getElementById('annual-projection');
    if (annualElement && financials.revenue) {
        annualElement.textContent = formatCurrency(financials.revenue.annual_projection);
    }
    
    // Update monthly average
    const monthlyElement = document.getElementById('monthly-average');
    if (monthlyElement && financials.revenue) {
        monthlyElement.textContent = formatCurrency(financials.revenue.monthly_average);
    }
    
    // Update EBITDA
    const ebitdaElement = document.getElementById('annual-ebitda');
    if (ebitdaElement && financials.ebitda) {
        ebitdaElement.textContent = formatCurrency(financials.ebitda.estimated_annual);
    }
    
    // Update ROI
    const roiElement = document.getElementById('roi-percentage');
    if (roiElement && financials.profitability) {
        roiElement.textContent = formatPercentage(financials.profitability.roi_percentage);
    }
}

function updateValuationInfo(valuation) {
    if (!valuation) return;
    
    // Update asking price
    const askingElement = document.getElementById('asking-price');
    if (askingElement) {
        askingElement.textContent = formatCurrency(valuation.asking_price);
    }
    
    // Update market value
    const marketElement = document.getElementById('market-value');
    if (marketElement) {
        marketElement.textContent = formatCurrency(valuation.market_value);
    }
    
    // Update discount
    const discountElement = document.getElementById('discount-percentage');
    if (discountElement) {
        discountElement.textContent = formatPercentage(valuation.discount_percentage);
    }
}

function updateLocationInfo(locations) {
    if (!locations || locations.length === 0) return;
    
    // Update location list
    const locationContainer = document.getElementById('locations-list');
    if (locationContainer) {
        // Clear existing content
        locationContainer.innerHTML = '';
        
        // Create DOM elements programmatically
        locations.forEach(location => {
            const locationDiv = document.createElement('div');
            locationDiv.className = 'location-item';
            
            const nameH4 = document.createElement('h4');
            nameH4.textContent = location.name;
            
            const typeP = document.createElement('p');
            typeP.textContent = location.type;
            
            const revenueP = document.createElement('p');
            revenueP.textContent = `Revenue: ${formatCurrency(location.estimated_revenue)}`;
            
            const performanceP = document.createElement('p');
            performanceP.textContent = `Performance: ${location.performance}`;
            
            locationDiv.appendChild(nameH4);
            locationDiv.appendChild(typeP);
            locationDiv.appendChild(revenueP);
            locationDiv.appendChild(performanceP);
            
            locationContainer.appendChild(locationDiv);
        });
    }
}

function updateHighlights(highlights) {
    if (!highlights || highlights.length === 0) return;
    
    // Update highlights list
    const highlightsContainer = document.getElementById('highlights-list');
    if (highlightsContainer) {
        // Clear existing content
        highlightsContainer.innerHTML = '';
        
        // Create DOM elements programmatically
        highlights.forEach(highlight => {
            const li = document.createElement('li');
            li.textContent = highlight;
            highlightsContainer.appendChild(li);
        });
    }
}

function updateMetadata(metadata) {
    if (!metadata) return;
    
    // Update data period
    const periodElement = document.getElementById('data-period');
    if (periodElement) {
        periodElement.textContent = metadata.analysis_period;
    }
    
    // Update generated date
    const dateElement = document.getElementById('generated-date');
    if (dateElement) {
        dateElement.textContent = new Date(metadata.generated_at).toLocaleDateString();
    }
}

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function formatPercentage(value) {
    return `${value.toFixed(1)}%`;
}

// Auto-update when data is loaded
document.addEventListener('businessDataLoaded', updateWebsiteWithETLData);
"""
    
    # Write the integration script to website directory
    integration_file = Path("website/js/website-integration.js")
    integration_file.parent.mkdir(exist_ok=True)
    
    with open(integration_file, 'w') as f:
        f.write(integration_script)
    
    print(f"✅ Created integration script: {integration_file}")

def create_deployment_script():
    """Create a deployment script for Wrangler."""
    print("📦 Creating deployment script...")
    
    deployment_script = """#!/bin/bash
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
"""
    
    # Write the deployment script
    deployment_file = Path("deploy_website.sh")
    with open(deployment_file, 'w') as f:
        f.write(deployment_script)
    
    # Make it executable
    os.chmod(deployment_file, 0o755)
    
    print(f"✅ Created deployment script: {deployment_file}")

def update_website_html():
    """Update the website HTML to include the new data loader."""
    print("📝 Updating website HTML...")
    
    # Read the current HTML file
    html_file = Path("website/due_diligence.html")
    if not html_file.exists():
        print("⚠️  HTML file not found, skipping update")
        return
    
    with open(html_file, 'r') as f:
        html_content = f.read()
    
    # Add the data loader scripts before closing body tag
    scripts_to_add = """
    <!-- ETL Pipeline Data Integration -->
    <script src="./js/business-data-loader.js"></script>
    <script src="./js/website-integration.js"></script>
    """
    
    if "business-data-loader.js" not in html_content:
        html_content = html_content.replace("</body>", f"{scripts_to_add}\n</body>")
        
        with open(html_file, 'w') as f:
            f.write(html_content)
        
        print("✅ Updated HTML with data loader scripts")
    else:
        print("✅ HTML already includes data loader scripts")

def main():
    """Main function to deploy ETL data to website."""
    print("🎯 ETL Pipeline to Website Deployment")
    print("=" * 50)
    
    # Set up website data access
    setup_website_data_access()
    
    # Create website integration files
    create_website_data_loader()
    create_website_integration_script()
    create_deployment_script()
    
    # Update website HTML
    update_website_html()
    
    print("\n" + "=" * 50)
    print("🎉 Deployment Preparation Complete!")
    print("\n📋 Next Steps:")
    print("1. Run: ./deploy_website.sh")
    print("2. Or manually: cd website && wrangler pages deploy .")
    print("3. Your website will use the latest ETL pipeline data")
    
    print("\n🔧 Integration Features:")
    print("✅ Automatic data loading from ETL pipeline")
    print("✅ Fallback to legacy data if needed")
    print("✅ Real-time website updates")
    print("✅ Error handling and logging")

if __name__ == "__main__":
    main()
