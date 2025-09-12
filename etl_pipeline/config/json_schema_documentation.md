# ETL Pipeline JSON Export Schema Documentation

## Overview

This document describes the complete JSON export schema for the ETL pipeline with full traceability metadata. The schema includes field mappings, calculation lineage, document registry, and coverage analysis.

## Schema Version

- **Version**: 1.0.0
- **Last Updated**: 2025-09-12
- **Traceability Enabled**: Yes

## Main Export Files

### 1. business_sale_data.json

The primary business data export with comprehensive traceability.

```json
{
  "metadata": {
    "business_name": "Cranberry Hearing and Balance Center",
    "generated_at": "2025-09-12T10:02:50.060127+00:00",
    "etl_run_timestamp": "2025-09-12T10:02:50.060127+00:00",
    "data_period": "2023-01-01 to 2025-06-30",
    "months_analyzed": 30,
    "data_source": "ETL Pipeline - Real Business Data",
    "analysis_period": "2023-01-01 to 2025-06-30"
  },
  "traceability": {
    "field_mappings": {
      "sales_mappings": {
        "Sale Date": "sale_date",
        "Total Price": "total_price",
        "Patient Name": "patient_name"
      },
      "financial_mappings": {
        "5017 · Sales": "sales_revenue",
        "5017 · Sales - Other": "sales_revenue_other"
      },
      "equipment_mappings": {
        "Cello": "cello_audiometer",
        "Trumpet": "trumpet_rem"
      },
      "traceability_log": [
        {
          "raw_field": "Sale Date",
          "normalized_field": "sale_date",
          "source_file": "sales_2024.csv",
          "transformation": "normalize_column_name",
          "transformation_description": "Column name standardization",
          "timestamp": "2025-09-12T10:02:50.060127+00:00"
        }
      ],
      "traceability_summary": {
        "total_mappings": 32,
        "source_files": ["sales_2024.csv", "2023_P&L.csv"],
        "transformations": {
          "normalize_column_name": 25,
          "equipment_name_mapping": 7
        },
        "categories": {
          "sales": 20,
          "financial": 8,
          "equipment": 4
        }
      },
      "transformation_types": {
        "normalize_column_name": "Column name standardization",
        "normalize_date": "Date format standardization",
        "equipment_name_mapping": "Equipment name pattern matching"
      }
    },
    "calculation_lineage": {
      "calculation_lineage": [
        {
          "metric_name": "annual_revenue_projection",
          "description": "Calculate annual revenue projection from sales data",
          "steps": [
            {
              "step": 1,
              "operation": "input",
              "field": "total_revenue",
              "value": 450000,
              "description": "Total revenue from sales data",
              "timestamp": "2025-09-12T10:02:50.060127+00:00"
            },
            {
              "step": 2,
              "operation": "divide",
              "field": "total_revenue",
              "value": 37500,
              "divisor": 12,
              "description": "Calculate monthly revenue average",
              "timestamp": "2025-09-12T10:02:50.060127+00:00"
            },
            {
              "step": 3,
              "operation": "annualize",
              "field": "monthly_revenue_average",
              "value": 450000,
              "factor": 12,
              "description": "Annualize monthly revenue average",
              "timestamp": "2025-09-12T10:02:50.060127+00:00"
            }
          ],
          "start_time": "2025-09-12T10:02:50.060127+00:00",
          "final_value": 450000,
          "end_time": "2025-09-12T10:02:50.060127+00:00"
        }
      ],
      "lineage_summary": {
        "total_calculations": 5,
        "metrics_calculated": ["annual_revenue_projection", "monthly_ebitda"],
        "total_steps": 15
      }
    },
    "document_registry": {
      "documents": [
        {
          "name": "2024-01-01_to_2024-01-31_ProfitAndLoss_CranberryHearing.CSV",
          "category": "financials",
          "file_type": ".csv",
          "file_path": "docs/financials/Profit_and_Loss/2024-01-01_to_2024-01-31_ProfitAndLoss_CranberryHearing.CSV",
          "file_size": "3.3 KB",
          "file_size_bytes": 3379,
          "last_modified": "2025-09-08T06:01:05.416819+00:00",
          "created_date": "2025-09-08T06:01:05.416819+00:00",
          "file_hash": "a1b2c3d4e5f6789...",
          "status": true,
          "expected": true,
          "notes": null,
          "registered_at": "2025-09-12T10:02:50.060127+00:00"
        }
      ],
      "coverage_analysis": {
        "financials": {
          "expected": 6,
          "found": 4,
          "missing": ["Tax Returns", "COGS Analysis"],
          "coverage_percentage": 66.7,
          "missing_count": 2
        },
        "legal": {
          "expected": 6,
          "found": 2,
          "missing": ["Insurance Policies", "Business Licenses", "Professional Licenses", "Employee Agreements"],
          "coverage_percentage": 33.3,
          "missing_count": 4
        }
      },
      "registry_summary": {
        "total_documents": 121,
        "found_documents": 121,
        "missing_documents": 0,
        "expected_documents": 121,
        "categories": {
          "financials": 45,
          "legal": 12,
          "equipment": 8,
          "operational": 35,
          "data": 21
        },
        "file_types": {
          ".csv": 67,
          ".pdf": 32,
          ".xlsx": 22
        },
        "coverage_percentage": 100.0
      }
    },
    "etl_pipeline_version": "1.0.0",
    "traceability_enabled": true
  },
  "sales": {
    "total_transactions": 124,
    "total_revenue": 4732.0
  },
  "financials": {
    "annual_revenue_projection": 450000,
    "monthly_ebitda": 11250,
    "ebitda_margin": 0.256
  },
  "equipment": {
    "total_value": 125000,
    "quotes_count": 8
  },
  "valuation": {
    "asking_price": 750000,
    "market_value": 850000,
    "discount_from_market": 11.8
  }
}
```

### 2. due_diligence_coverage.json

Enhanced coverage analysis with document tracking.

```json
{
  "metadata": {
    "analysis_timestamp": "2025-09-12T10:02:50.060127+00:00",
    "analyzer_version": "enhanced_v1.0",
    "total_documents_analyzed": 136
  },
  "base_coverage": {
    "sales": {
      "status": "good",
      "completeness_score": 86.7,
      "missing_periods": ["2023-02", "2023-03"],
      "data_quality_issues": ["Missing 4 months of data"],
      "coverage_details": {
        "total_expected_months": 30,
        "actual_months": 26,
        "missing_months": 4,
        "date_range": "2023-01-12 to 2025-06-19",
        "total_transactions": 124,
        "total_revenue": "4732.00"
      }
    },
    "financial": {
      "status": "good",
      "completeness_score": 75.0
    },
    "equipment": {
      "status": "excellent",
      "completeness_score": 95.0
    }
  },
  "document_coverage": {
    "by_category": {
      "financials": {
        "category": "financials",
        "total_expected": 6,
        "total_found": 4,
        "required_expected": 4,
        "required_found": 3,
        "coverage_percentage": 66.7,
        "required_coverage_percentage": 75.0,
        "found_documents": [
          {
            "name": "Profit & Loss Statements",
            "required": true,
            "frequency": "monthly",
            "period": "24_months",
            "found_documents": ["2024-01-01_to_2024-01-31_ProfitAndLoss_CranberryHearing.CSV"],
            "count": 1
          }
        ],
        "missing_documents": [
          {
            "name": "Tax Returns",
            "required": true,
            "frequency": "annual",
            "period": "3_years",
            "impact": "critical"
          }
        ],
        "status": "mostly_complete"
      }
    },
    "by_requirement": {
      "required": {
        "expected": 16,
        "found": 9,
        "missing": 7,
        "coverage_percentage": 56.3
      },
      "optional": {
        "expected": 8,
        "found": 2,
        "missing": 6,
        "coverage_percentage": 25.0
      }
    },
    "missing_critical": [
      {
        "name": "Insurance Policies",
        "category": "legal",
        "frequency": "annual",
        "period": "current",
        "impact": "critical",
        "recommendation": "Obtain Insurance Policies for legal category"
      }
    ],
    "missing_optional": [
      {
        "name": "Employee Agreements",
        "category": "legal",
        "frequency": "as_needed",
        "period": "current",
        "impact": "optional",
        "recommendation": "Consider obtaining Employee Agreements for legal category"
      }
    ],
    "coverage_summary": {
      "total_expected_documents": 24,
      "total_found_documents": 11,
      "total_missing_documents": 13,
      "overall_coverage_percentage": 45.8,
      "required_expected_documents": 16,
      "required_found_documents": 9,
      "required_missing_documents": 7,
      "required_coverage_percentage": 56.3,
      "due_diligence_readiness": "fair"
    }
  },
  "overall_assessment": {
    "overall_score": 32.1,
    "due_diligence_readiness": "fair",
    "critical_gaps": 5,
    "optional_gaps": 8,
    "recommendations": [
      "URGENT: Obtain missing critical documents to proceed with due diligence",
      "- Obtain Insurance Policies for legal category",
      "- Obtain Business Licenses for legal category",
      "Improve legal document coverage (currently 33.3%)",
      "Overall document coverage is below 75% - consider additional document collection"
    ],
    "next_steps": [
      "1. Focus on obtaining critical missing documents",
      "2. Contact relevant parties for missing legal and financial documents",
      "3. Review and organize existing documents",
      "4. Identify additional sources for missing document types"
    ]
  },
  "traceability": {
    "field_mappings": {
      "sales_mappings": {...},
      "financial_mappings": {...},
      "equipment_mappings": {...},
      "traceability_log": [...],
      "traceability_summary": {...}
    },
    "document_registry": {
      "documents": [...],
      "coverage_analysis": {...},
      "registry_summary": {...}
    },
    "etl_pipeline_version": "1.0.0",
    "traceability_enabled": true
  },
  "etl_run_timestamp": "2025-09-12T10:02:50.060127+00:00"
}
```

## Field Mapping Schema

### Field Mappings Structure

```json
{
  "field_mappings": {
    "sales_mappings": {
      "raw_field_name": "normalized_field_name"
    },
    "financial_mappings": {
      "raw_field_name": "normalized_field_name"
    },
    "equipment_mappings": {
      "raw_field_name": "normalized_field_name"
    },
    "traceability_log": [
      {
        "raw_field": "string",
        "normalized_field": "string",
        "source_file": "string",
        "transformation": "string",
        "transformation_description": "string",
        "timestamp": "ISO 8601 timestamp"
      }
    ],
    "traceability_summary": {
      "total_mappings": "number",
      "source_files": ["string"],
      "transformations": {
        "transformation_type": "count"
      },
      "categories": {
        "category": "count"
      }
    },
    "transformation_types": {
      "transformation_name": "description"
    }
  }
}
```

## Calculation Lineage Schema

### Calculation Lineage Structure

```json
{
  "calculation_lineage": [
    {
      "metric_name": "string",
      "description": "string",
      "steps": [
        {
          "step": "number",
          "operation": "string",
          "field": "string",
          "value": "number",
          "description": "string",
          "timestamp": "ISO 8601 timestamp",
          "additional_metadata": "object"
        }
      ],
      "start_time": "ISO 8601 timestamp",
      "final_value": "number",
      "end_time": "ISO 8601 timestamp"
    }
  ],
  "lineage_summary": {
    "total_calculations": "number",
    "metrics_calculated": ["string"],
    "total_steps": "number"
  }
}
```

## Document Registry Schema

### Document Registry Structure

```json
{
  "document_registry": {
    "documents": [
      {
        "name": "string",
        "category": "string",
        "file_type": "string",
        "file_path": "string",
        "file_size": "string",
        "file_size_bytes": "number",
        "last_modified": "ISO 8601 timestamp",
        "created_date": "ISO 8601 timestamp",
        "file_hash": "string",
        "status": "boolean",
        "expected": "boolean",
        "notes": "string|null",
        "registered_at": "ISO 8601 timestamp"
      }
    ],
    "coverage_analysis": {
      "category": {
        "expected": "number",
        "found": "number",
        "missing": ["string"],
        "coverage_percentage": "number",
        "missing_count": "number"
      }
    },
    "registry_summary": {
      "total_documents": "number",
      "found_documents": "number",
      "missing_documents": "number",
      "expected_documents": "number",
      "categories": {
        "category": "count"
      },
      "file_types": {
        "file_type": "count"
      },
      "coverage_percentage": "number"
    }
  }
}
```

## Usage Examples

### Accessing Field Mappings

```javascript
// Get all sales field mappings with safe fallback
const salesMappings = data?.traceability?.field_mappings?.sales_mappings || {};

// Get traceability log for a specific field with safe array handling
const fieldLog = (data?.traceability?.field_mappings?.traceability_log || [])
  .filter(log => log.normalized_field === 'sale_date');

// Get transformation summary with safe fallback
const summary = data?.traceability?.field_mappings?.traceability_summary || {};
```

### Accessing Calculation Lineage

```javascript
// Get calculation steps for a specific metric with safe access
const revenueCalculation = (data?.traceability?.calculation_lineage || [])
  .find(calc => calc.metric_name === 'annual_revenue_projection');

// Get all calculation steps with safe fallback
const allSteps = revenueCalculation?.steps || [];

// Get final value with safe fallback
const finalValue = revenueCalculation?.final_value || null;
```

### Accessing Document Registry

```javascript
// Get all documents in a category with safe access
const financialDocs = (data?.traceability?.document_registry?.documents || [])
  .filter(doc => doc.category === 'financials');

// Get coverage analysis with safe fallback
const coverage = data?.traceability?.document_registry?.coverage_analysis || {};

// Get missing documents with safe fallback
const missingDocs = coverage?.financials?.missing || [];
```

## Migration Notes

### From Previous Schema

If migrating from a previous schema version:

1. **Field mappings** are now nested under `traceability.field_mappings`
2. **Calculation lineage** is now nested under `traceability.calculation_lineage`
3. **Document registry** is now nested under `traceability.document_registry`
4. **ETL pipeline version** is now tracked in `traceability.etl_pipeline_version`
5. **Traceability enabled flag** indicates if full traceability is active

### Backward Compatibility

The schema maintains backward compatibility by:
- Preserving existing top-level fields
- Adding new traceability fields without breaking existing structure
- Providing fallback values for missing traceability data
- Maintaining existing field names and types

## Validation

### Required Fields

- `metadata.etl_run_timestamp`
- `traceability.etl_pipeline_version`
- `traceability.traceability_enabled`

### Optional Fields

All traceability fields are optional and will be populated when available.

### Data Types

- All timestamps use ISO 8601 format
- All monetary values are numbers (not strings)
- All file sizes include both human-readable and byte formats
- All percentages are numbers (0-100 range)
