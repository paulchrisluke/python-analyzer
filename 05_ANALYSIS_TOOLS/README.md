# ETL Pipeline & Analysis Tools

This directory contains the complete ETL pipeline for business analysis and valuation.

## 🚀 Quick Start

```bash
# Run the pipeline
python run_pipeline.py

# Run tests
python test_pipeline.py

# Deploy to website
python deploy_to_website.py
```

## 📁 Structure

```
etl_pipeline/           # Core ETL pipeline modules
├── config/             # Configuration files
├── extract/            # Data extraction modules
├── transform/          # Data transformation modules
├── load/               # Data loading modules
└── utils/              # Utility functions

data/                   # Pipeline output data
logs/                   # Pipeline execution logs
reports/                # Generated reports
```

## 🔧 Configuration

- `etl_pipeline/config/business_rules.yaml` - Business logic and parameters
- `etl_pipeline/config/data_sources.yaml` - Data source configuration

## 📊 Output Files

- `data/final/business_sale_data.json` - Main business metrics
- `data/final/due_diligence_coverage.json` - Data coverage analysis
- `data/final/equipment_analysis.json` - Equipment valuation

## 🧪 Testing

The test suite validates:
- Data completeness and integrity
- Financial calculations accuracy
- Business metrics correctness
- Data coverage analysis

## 🌐 Website Integration

The pipeline automatically integrates with the Cloudflare Pages website:
- Copies latest data to website directory
- Creates JavaScript data loaders
- Provides fallback mechanisms
- Enables real-time updates