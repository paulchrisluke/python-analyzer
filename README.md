# ETL Pipeline for Business Analysis

A comprehensive Extract, Transform, Load (ETL) pipeline for business analysis and valuation, with specialized features for due diligence data management.

## 🚀 Quick Start

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the pipeline**:
   ```bash
   python run_pipeline.py
   ```

3. **Deploy to website**:
   ```bash
   ./deploy_website.sh
   ```

## 📁 Repository Structure

```
├── etl_pipeline/                # Core ETL pipeline modules
│   ├── config/                  # Configuration files
│   ├── extract/                 # Data extraction modules
│   ├── transform/               # Data transformation modules
│   ├── load/                    # Data loading modules
│   └── utils/                   # Utility functions
├── tests/                       # Test suite
├── examples/                    # Example scripts and usage
├── docs/                        # Documentation
├── website/                     # Cloudflare Pages website
├── run_pipeline.py              # Main pipeline runner
├── deploy_to_website.py         # Website deployment script
├── requirements.txt             # Python dependencies
└── README.md                    # This file
```

## ✨ Key Features

- **Multi-Source Data Processing**: CSV files, PDF documents, financial statements
- **Configurable Business Rules**: Location filtering, date ranges, financial metrics
- **Real Financial Calculations**: EBITDA, ROI, revenue projections
- **Data Coverage Analysis**: Due diligence completeness assessment
- **Website Integration**: Automatic deployment to Cloudflare Pages

## 🔧 Configuration

Configure business rules and data sources in `etl_pipeline/config/`:

- `business_rules.yaml` - Business logic and analysis parameters
- `data_sources.yaml` - Data source paths and processing options

## 📊 Output

The pipeline generates:
- `business_sale_data.json` - Main business metrics
- `due_diligence_coverage.json` - Data coverage analysis
- `equipment_analysis.json` - Equipment valuation

## 🧪 Testing

```bash
python -m pytest tests/
```

## 🔒 Privacy & Security

- **No Real Data**: All business data anonymized/removed
- **Sample Data Only**: Includes anonymized data for testing
- **Comprehensive Git Ignore**: Prevents accidental commits of sensitive data

## 📝 License

MIT License - see LICENSE file for details.

---

**Note**: This is an open source version with all sensitive business data removed and replaced with sample data for demonstration purposes.