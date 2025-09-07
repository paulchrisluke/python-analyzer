# Website Integration with ETL Pipeline

This directory contains the Cloudflare Pages website that automatically integrates with the ETL pipeline for real-time business data updates.

## 🎯 Overview

The website automatically loads the latest ETL pipeline data and displays it to potential buyers. It includes fallback mechanisms to ensure the site always works, even if the ETL pipeline data is temporarily unavailable.

## 📁 File Structure

```
website/
├── index.html                    # Main landing page
├── due_diligence.html           # Due diligence documents page
├── business_sale_data.json      # Latest ETL pipeline data (auto-updated)
├── due_diligence_coverage.json  # Data coverage analysis (auto-updated)
├── equipment_analysis.json      # Equipment analysis (auto-updated)
├── js/
│   ├── business-data-loader.js  # Data loading and fallback logic
│   └── website-integration.js   # Website data integration
├── wrangler.toml               # Cloudflare Pages configuration
├── package.json                # Project configuration
└── README.md                   # This file
```

## 🚀 Deployment Process

### Automatic Deployment

1. **Run the ETL Pipeline**:
   ```bash
   cd 05_ANALYSIS_TOOLS
   python run_pipeline.py
   ```

2. **Deploy to Website**:
   ```bash
   ./deploy_website.sh
   ```

### Manual Deployment

1. **Copy ETL Data**:
   ```bash
   python 05_ANALYSIS_TOOLS/deploy_to_website.py
   ```

2. **Deploy to Cloudflare**:
   ```bash
   cd website
   wrangler pages deploy . --project-name cranberry-business-sale
   ```

## 🔧 Data Integration

### Data Loading Process

1. **Primary Data Source**: `business_sale_data.json` (from ETL pipeline)
2. **Additional Data**: Due diligence coverage and equipment analysis

### Data Flow

```
ETL Pipeline → business_sale_data.json → Website → Cloudflare Pages
```

## 📊 Data Structure

### Main Business Data (`business_sale_data.json`)

```json
{
  "metadata": {
    "generated_at": "2025-09-06T19:23:02.190087",
    "data_period": "2023-2025 Q2",
    "analysis_period": "Jan 1, 2023 to June 30, 2025"
  },
  "financials": {
    "revenue": {
      "total_revenue": 2389810.85,
      "annual_projection": 955924.34,
      "monthly_average": 79660.36
    },
    "ebitda": {
      "estimated_annual": 248138.61,
      "margin_percentage": 0.87
    }
  },
  "valuation": {
    "asking_price": 650000,
    "market_value": 974239.4,
    "discount_percentage": 33.28
  }
}
```

### Due Diligence Coverage (`due_diligence_coverage.json`)

```json
{
  "overall_coverage": {
    "completeness_score": 85.5,
    "status": "Good",
    "missing_documents": []
  },
  "data_sources": {
    "sales_data": {
      "coverage": "Complete",
      "quality": "High"
    }
  }
}
```

## 🌐 Website Features

### Automatic Data Updates

- **Real-time Integration**: Website automatically loads latest ETL data
- **Error Handling**: Graceful degradation with user-friendly messages

### Data Display

- **Financial Metrics**: Revenue, EBITDA, ROI calculations
- **Valuation Information**: Asking price, market value, discounts
- **Location Analysis**: Performance by location
- **Due Diligence**: Document coverage and completeness

### Responsive Design

- **Mobile Optimized**: Works on all device sizes
- **Fast Loading**: Optimized for performance
- **SEO Friendly**: Proper meta tags and structure

## 🔄 Update Workflow

### Daily Updates

1. **Run ETL Pipeline**: Process latest business data
2. **Deploy to Website**: Update website with new data
3. **Verify Deployment**: Check website functionality

### Weekly Updates

1. **Data Quality Review**: Check ETL pipeline output
2. **Website Performance**: Monitor loading times
3. **User Experience**: Test on different devices

## 🛠️ Development

### Local Development

1. **Start Local Server**:
   ```bash
   cd website
   python3 -m http.server 8000
   ```

2. **View Website**: Open `http://localhost:8000`

### Testing

1. **Test Data Loading**: Verify ETL data loads correctly
2. **Test Error Handling**: Ensure graceful degradation when data unavailable
3. **Test Responsiveness**: Check on different screen sizes

## 📱 Cloudflare Pages Configuration

### Wrangler Configuration (`wrangler.toml`)

```toml
name = "cranberry-business-sale"
compatibility_date = "2025-01-27"

[pages]
pages_build_output_dir = "."
```

### Deployment Commands

```bash
# Deploy to Cloudflare Pages
wrangler pages deploy . --project-name cranberry-business-sale

# View deployment status
wrangler pages deployment list --project-name cranberry-business-sale
```

## 🔒 Security & Privacy

### Data Protection

- **No Sensitive Data**: Only business metrics, no personal information
- **Anonymized Data**: All customer data removed
- **Public Information**: Only data suitable for business sale

### Access Control

- **Public Website**: Accessible to potential buyers
- **No Authentication**: No login required
- **Read-Only**: No data modification capabilities

## 📈 Performance

### Optimization

- **Static Files**: Fast loading with Cloudflare CDN
- **Compressed Data**: JSON files optimized for size
- **Caching**: Browser and CDN caching enabled

### Monitoring

- **Uptime**: 99.9% availability with Cloudflare
- **Speed**: Fast loading times globally
- **Analytics**: Basic usage tracking available

## 🆘 Troubleshooting

### Common Issues

1. **Data Not Loading**:
   - Check if ETL pipeline ran successfully
   - Verify JSON files exist in website directory
   - Check browser console for errors

2. **Website Not Updating**:
   - Run deployment script again
   - Check Cloudflare Pages deployment status
   - Clear browser cache

3. **Data Loading Issues**:
   - Check if ETL pipeline ran successfully
   - Verify JSON file format
   - Check file permissions

### Support

- **ETL Pipeline Issues**: Check `05_ANALYSIS_TOOLS/logs/`
- **Website Issues**: Check browser console
- **Deployment Issues**: Check Cloudflare Pages dashboard

## 🎯 Best Practices

### Data Management

- **Regular Updates**: Run ETL pipeline daily
- **Version Control**: Track changes to website files

### Performance

- **Optimize Images**: Compress images for web
- **Minimize Files**: Keep file sizes small
- **Test Regularly**: Check website functionality

### Security

- **No Sensitive Data**: Only include public business metrics
- **Regular Reviews**: Check for any accidental data exposure
- **Access Monitoring**: Monitor website access patterns

---

**Note**: This website is designed for business sale purposes and contains only public business metrics. All sensitive data has been removed or anonymized.