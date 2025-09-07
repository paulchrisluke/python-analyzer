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
│   ├── utils/                   # Utility functions
│   └── pipeline_runner.py       # Internal pipeline runner
├── data/                        # Data storage and processing
│   ├── final/                   # Processed output data
│   ├── normalized/              # Normalized data files
│   ├── raw/                     # Raw input data
│   └── pipeline_summary.json    # Pipeline execution summary
├── reports/                     # Generated analysis reports
├── logs/                        # Pipeline execution logs
├── tests/                       # Test suite
├── examples/                    # Example scripts and usage
├── docs/                        # Documentation
├── website/                     # Cloudflare Pages website
├── run_pipeline.py              # Main pipeline runner
├── deploy_to_website.py         # Website deployment script
├── deploy_website.sh            # Website deployment shell script
├── requirements.txt             # Python dependencies
├── ETL_PIPELINE_TECHNICAL_DOCUMENTATION.md  # Technical documentation
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

- **Anonymized Data Only**: All business data in this repository is anonymized/synthetic for demonstration purposes
- **Production Pipeline**: Real business data is processed only in a separate, secured production pipeline with proper safeguards
- **Comprehensive Git Ignore**: Prevents accidental commits of sensitive data

## 📝 License

MIT License - see LICENSE file for details.

---

**Note**: This system demonstrates ETL pipeline functionality using anonymized/synthetic data. Real business data is processed only in a separate, secured production pipeline with proper data handling and privacy controls.