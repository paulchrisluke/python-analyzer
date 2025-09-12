"""
JSON data loader for ETL pipeline.
"""

import json
import os
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional
import logging
from pathlib import Path
from datetime import datetime, timezone
import re
from decimal import Decimal, InvalidOperation
import shutil
from .base_loader import BaseLoader
from ..utils.file_utils import FileUtils

logger = logging.getLogger(__name__)

def validate_file_path(file_path: str) -> None:
    """
    Validate file path to prevent directory traversal attacks.
    
    Args:
        file_path: The file path to validate
        
    Raises:
        ValueError: If the file path is invalid or potentially malicious
    """
    # Check for directory traversal patterns
    if '..' in file_path or '~' in file_path or os.path.isabs(file_path):
        raise ValueError(f"Invalid file path: {file_path}. Directory traversal not allowed.")
    
    # Check for null bytes (potential injection)
    if '\0' in file_path:
        raise ValueError(f"Invalid file path: {file_path}. Null bytes not allowed.")
    
    # Ensure file has .json extension
    if not file_path.endswith('.json'):
        raise ValueError(f"Invalid file path: {file_path}. Only .json files are allowed.")
    
    # Check for suspicious patterns
    suspicious_patterns = ['/etc/', '/proc/', '/sys/', '/dev/', 'config', 'secret', 'password']
    lower_path = file_path.lower()
    for pattern in suspicious_patterns:
        if pattern in lower_path:
            raise ValueError(f"Invalid file path: {file_path}. Suspicious pattern detected.")

def parse_price_value(price_raw):
    """
    Robust price parser that handles currency strings, N/A values, negatives, and parentheses.
    Returns Decimal('0.00') on failure to maintain precision for monetary values.
    """
    if price_raw is None:
        return Decimal('0.00')
    
    try:
        # Convert to string and strip whitespace
        price_str = str(price_raw).strip()
        
        # Handle empty strings or N/A values
        if not price_str or price_str.upper() in ['N/A', 'NA', 'NULL', 'NONE', '']:
            return Decimal('0.00')
        
        # Check for parentheses (negative values)
        is_negative = price_str.startswith('(') and price_str.endswith(')')
        if is_negative:
            price_str = price_str[1:-1]  # Remove parentheses
        
        # Check for explicit negative sign
        has_negative_sign = price_str.startswith('-')
        if has_negative_sign:
            price_str = price_str[1:]  # Remove negative sign
        
        # Use regex to extract numeric pattern with optional decimal
        # This handles formats like "$1,234.56", "1,234.56", "1234.56", ".99", etc.
        numeric_match = re.search(r'[\d,]*\.?\d+', price_str)
        if numeric_match:
            numeric_str = numeric_match.group()
            # Remove commas
            numeric_str = numeric_str.replace(',', '')
            # Convert to Decimal with 2 decimal places precision
            result = Decimal(numeric_str).quantize(Decimal('0.01'))
            
            # Apply negative if parentheses or negative sign were present
            if is_negative or has_negative_sign:
                result = -result
                
            return result
        else:
            return Decimal('0.00')
            
    except (ValueError, TypeError, AttributeError, InvalidOperation):
        return Decimal('0.00')

def normalize_money(value):
    """
    Normalize monetary values to a consistent format.
    
    Args:
        value: Can be a dict with 'value'/'amount' key, a string with currency symbols,
               a numeric value, or None/empty
        
    Returns:
        Dict with 'value' (float) and 'currency' (str) keys
    """
    if value is None:
        return {"value": 0.0, "currency": "USD"}
    
    # Handle dict format
    if isinstance(value, dict):
        if 'value' in value:
            # If value is a string, parse it with parse_price_value
            if isinstance(value['value'], str):
                parsed_value = parse_price_value(value['value'])
                return {
                    "value": float(parsed_value),
                    "currency": value.get('currency', 'USD')
                }
            else:
                return {
                    "value": float(value['value']),
                    "currency": value.get('currency', 'USD')
                }
        elif 'amount' in value:
            # If amount is a string, parse it with parse_price_value
            if isinstance(value['amount'], str):
                parsed_value = parse_price_value(value['amount'])
                return {
                    "value": float(parsed_value),
                    "currency": value.get('currency', 'USD')
                }
            else:
                return {
                    "value": float(value['amount']),
                    "currency": value.get('currency', 'USD')
                }
        else:
            return {"value": 0.0, "currency": "USD"}
    
    # Handle string format
    if isinstance(value, str):
        value = value.strip()
        if not value or value.upper() in ['N/A', 'NA', 'NULL', 'NONE', '']:
            return {"value": 0.0, "currency": "USD"}
        
        # Extract currency and numeric value
        currency = "USD"  # default
        numeric_value = value
        
        # Check for currency symbols at the beginning
        if value.startswith('$'):
            currency = "USD"
            numeric_value = value[1:]
        elif value.startswith('€'):
            currency = "EUR"
            numeric_value = value[1:]
        elif value.startswith('£'):
            currency = "GBP"
            numeric_value = value[1:]
        
        # Check for currency codes at the end (3-letter codes)
        if len(value) >= 4 and value[-3:].isupper() and value[-4] == ' ':
            currency = value[-3:]
            numeric_value = value[:-4]
        
        # Use parse_price_value to handle all numeric parsing including negatives and parentheses
        try:
            parsed_value = parse_price_value(numeric_value)
            return {
                "value": float(parsed_value),
                "currency": currency
            }
        except (ValueError, TypeError):
            return {"value": 0.0, "currency": "USD"}
    
    # Handle numeric values
    if isinstance(value, (int, float)):
        return {
            "value": float(value),
            "currency": "USD"
        }
    
    # Fallback
    return {"value": 0.0, "currency": "USD"}

class JsonLoader(BaseLoader):
    """Loader for saving data to JSON files."""
    
    def __init__(self, output_dir: str):
        """
        Initialize JSON loader.
        
        Args:
            output_dir: Output directory for JSON files
        """
        super().__init__(output_dir)
        self.load_results = {}
        
    def load(self, transformed_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Load transformed data to JSON files.
        
        Args:
            transformed_data: Transformed data to load
            
        Returns:
            Dict containing load results and metadata
        """
        logger.info("Starting JSON data loading...")
        
        # Reset per-run state
        self.load_results = {}
        self.start_load_session()
        
        try:
            # Load raw data
            if 'raw_data' in transformed_data:
                self._load_raw_data(transformed_data['raw_data'])
            
            # Load normalized data
            if 'normalized_data' in transformed_data:
                self._load_normalized_data(transformed_data['normalized_data'])
            
            # Load final business data
            if 'business_metrics' in transformed_data:
                self._load_business_data(transformed_data['business_metrics'])
            
            # Load coverage analysis
            if 'coverage_analysis' in transformed_data:
                self._load_coverage_analysis(transformed_data['coverage_analysis'])
            
            # Load equipment data
            if 'equipment_data' in transformed_data:
                self._load_equipment_data(transformed_data['equipment_data'])
            
        except Exception as e:
            self.add_load_event('error', f'Load failed: {e!s}')
            logger.exception("Load failed")
            raise
        else:
            logger.info("JSON data loading completed")
            return {"results": self.load_results, "metadata": self.get_load_metadata()}
        finally:
            self.end_load_session()
    
    def _load_raw_data(self, raw_data: Dict[str, Any]) -> None:
        """Load raw data to JSON files."""
        raw_dir = self.output_dir / "raw"
        raw_dir.mkdir(exist_ok=True)
        
        # Save sales raw data
        if 'sales' in raw_data:
            sales_file = raw_dir / "sales_raw.json"
            # Convert DataFrames to dictionaries for JSON serialization
            sales_data_for_json = self._convert_dataframes_to_dict(raw_data['sales'])
            FileUtils.save_json(sales_data_for_json, str(sales_file))
            self.load_results['sales_raw'] = str(sales_file)
            logger.info(f"Raw sales data saved to: {sales_file}")
        
        # Save financial raw data
        if 'financial' in raw_data:
            financial_file = raw_dir / "financial_raw.json"
            # Convert DataFrames to dictionaries for JSON serialization
            financial_data_for_json = self._convert_dataframes_to_dict(raw_data['financial'])
            FileUtils.save_json(financial_data_for_json, str(financial_file))
            self.load_results['financial_raw'] = str(financial_file)
            logger.info(f"Raw financial data saved to: {financial_file}")
        
        # Save equipment raw data
        if 'equipment' in raw_data:
            equipment_file = raw_dir / "equipment_raw.json"
            # Handle equipment payload that may be a DataFrame or contain NaN/Inf/numpy types
            equipment_data = raw_data['equipment']
            if isinstance(equipment_data, pd.DataFrame):
                # Convert DataFrame to JSON-serializable format
                df = equipment_data.copy()
                # Replace Inf/-Inf with None and NaN with None
                df = df.replace([np.inf, -np.inf], None).where(pd.notnull(df), None)
                # Convert to dict and ensure numpy scalars are native Python types
                equipment_data = df.to_dict(orient='records')
                # Post-process to ensure all values are JSON-serializable
                equipment_data = self._sanitize_for_json(equipment_data)
            else:
                # Sanitize non-DataFrame equipment data
                equipment_data = self._sanitize_for_json(equipment_data)
            
            FileUtils.save_json(equipment_data, str(equipment_file))
            self.load_results['equipment_raw'] = str(equipment_file)
            logger.info(f"Raw equipment data saved to: {equipment_file}")
    
    def _load_normalized_data(self, normalized_data: Dict[str, Any]) -> None:
        """Load normalized data to JSON files."""
        normalized_dir = self.output_dir / "normalized"
        normalized_dir.mkdir(exist_ok=True)
        
        # Save sales normalized data
        if 'sales' in normalized_data:
            sales_file = normalized_dir / "sales_normalized.json"
            # Convert DataFrames to dictionaries for JSON serialization
            sales_data_for_json = self._convert_dataframes_to_dict(normalized_data['sales'])
            FileUtils.save_json(sales_data_for_json, str(sales_file))
            self.load_results['sales_normalized'] = str(sales_file)
            logger.info(f"Normalized sales data saved to: {sales_file}")
        
        # Save financial normalized data
        if 'financial' in normalized_data:
            financial_file = normalized_dir / "financial_normalized.json"
            # Convert DataFrames to dictionaries for JSON serialization
            financial_data_for_json = self._convert_dataframes_to_dict(normalized_data['financial'])
            FileUtils.save_json(financial_data_for_json, str(financial_file))
            self.load_results['financial_normalized'] = str(financial_file)
            logger.info(f"Normalized financial data saved to: {financial_file}")
        
        # Save equipment normalized data
        if 'equipment' in normalized_data:
            equipment_file = normalized_dir / "equipment_normalized.json"
            # Convert to JSON-serializable structure
            equipment_data_for_json = self._convert_equipment_to_json_serializable(normalized_data['equipment'])
            FileUtils.save_json(equipment_data_for_json, str(equipment_file))
            self.load_results['equipment_normalized'] = str(equipment_file)
            logger.info(f"Normalized equipment data saved to: {equipment_file}")
    
    def _load_business_data(self, business_metrics: Dict[str, Any]) -> None:
        """Load final business data to JSON files."""
        final_dir = self.output_dir / "final"
        final_dir.mkdir(exist_ok=True)
        
        # Create comprehensive business sale data
        business_sale_data = self._create_business_sale_data(business_metrics)
        
        # Save business sale data
        business_file = final_dir / "business_sale_data.json"
        FileUtils.save_json(business_sale_data, str(business_file))
        self.load_results['business_sale_data'] = str(business_file)
        logger.info(f"Business sale data saved to: {business_file}")
        
        # Save financial summary
        financial_summary = self._create_financial_summary(business_metrics)
        financial_file = final_dir / "financial_summary.json"
        FileUtils.save_json(financial_summary, str(financial_file))
        self.load_results['financial_summary'] = str(financial_file)
        logger.info(f"Financial summary saved to: {financial_file}")
        
        # Save equipment analysis
        equipment_analysis = self._create_equipment_analysis(business_metrics)
        equipment_file = final_dir / "equipment_analysis.json"
        FileUtils.save_json(equipment_analysis, str(equipment_file))
        self.load_results['equipment_analysis'] = str(equipment_file)
        logger.info(f"Equipment analysis saved to: {equipment_file}")
        
        # Save landing page data
        landing_page_data = self._create_landing_page_data(business_metrics)
        landing_page_file = final_dir / "landing_page_data.json"
        FileUtils.save_json(landing_page_data, str(landing_page_file))
        self.load_results['landing_page_data'] = str(landing_page_file)
        logger.info(f"Landing page data saved to: {landing_page_file}")
        
        # Copy essential files to website directory for Next.js integration
        self._copy_files_to_website(final_dir)
    
    def _load_equipment_data(self, equipment_data: Dict[str, Any]) -> None:
        """Load equipment data to JSON files."""
        try:
            if not equipment_data:
                self.add_load_event('warning', 'No equipment data to load')
                return
            
            # Create equipment directory
            equipment_dir = self.output_dir / "equipment"
            equipment_dir.mkdir(exist_ok=True)
            
            # Validate and transform equipment data
            validated_equipment = self._validate_equipment_data(equipment_data)
            
            # Save equipment data
            equipment_file = equipment_dir / "equipment_data.json"
            FileUtils.save_json(validated_equipment, str(equipment_file))
            
            # Update load results
            self.load_results['equipment_data'] = str(equipment_file)
            
            # Log success
            record_count = len(validated_equipment.get('quotes', []))
            self.log_load_summary('equipment', record_count, str(equipment_file))
            self.add_load_event('file_created', f'Equipment data saved: {equipment_file.name}')
            
        except Exception as e:
            error_msg = f"Failed to load equipment data: {str(e)}"
            self.add_load_event('error', error_msg)
            logger.error(error_msg)
            raise
    
    def _validate_equipment_data(self, equipment_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and transform equipment data to target schema."""
        # Sanitize summary to ensure JSON safety
        summary_raw = equipment_data.get('summary', {})
        sanitized_summary = self._sanitize_for_json(summary_raw)
        
        validated_data = {
            'quotes': [],
            'summary': sanitized_summary,
            'metadata': {
                'validated_at': FileUtils.get_js_compatible_timestamp(),
                'source': 'ETL Pipeline'
            }
        }
        
        # Validate equipment quotes
        quotes = equipment_data.get('quotes', [])
        for quote in quotes:
            if isinstance(quote, dict):
                # Parse price using robust parser
                price_raw = quote.get('price', 0)
                parsed_price = parse_price_value(price_raw)
                
                # Sanitize quote_date to ensure JSON safety
                quote_date_raw = quote.get('quote_date', 'Unknown')
                sanitized_quote_date = self._normalize_scalar_value(quote_date_raw)
                
                validated_quote = {
                    'file_name': quote.get('file_name', 'Unknown'),
                    'equipment_name': quote.get('equipment_name', 'Unknown'),
                    'description': quote.get('description', 'Unknown'),
                    'price': parsed_price,
                    'category': quote.get('category', 'Unknown'),
                    'quote_date': sanitized_quote_date
                }
                validated_data['quotes'].append(validated_quote)
        
        return validated_data
    
    def _load_coverage_analysis(self, coverage_analysis: Dict[str, Any]) -> None:
        """Load coverage analysis data."""
        final_dir = self.output_dir / "final"
        final_dir.mkdir(exist_ok=True)
        
        # Sanitize coverage analysis before JSON serialization
        sanitized_coverage = self._sanitize_for_json(coverage_analysis)
        
        # Add ETL run timestamp to coverage analysis
        if isinstance(sanitized_coverage, dict):
            sanitized_coverage['etl_run_timestamp'] = FileUtils.get_js_compatible_timestamp()
        
        # Save coverage analysis
        coverage_file = final_dir / "due_diligence_coverage.json"
        FileUtils.save_json(sanitized_coverage, str(coverage_file))
        self.load_results['due_diligence_coverage'] = str(coverage_file)
        logger.info(f"Due diligence coverage analysis saved to: {coverage_file}")
    
    def _create_business_sale_data(self, business_metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Create comprehensive business sale data structure."""
        
        # Extract metrics
        sales_metrics = business_metrics.get('sales', {})
        financial_metrics = business_metrics.get('financial', {})
        valuation_metrics = business_metrics.get('valuation', {})
        equipment_metrics = business_metrics.get('equipment', {})
        
        # Compute data period and analysis period from available metrics
        start_date = financial_metrics.get('start_date')
        end_date = financial_metrics.get('end_date')
        
        if not start_date or not end_date:
            # Compute start date by subtracting analysis period months from now
            analysis_months = financial_metrics.get('revenue_metrics', {}).get('analysis_period_months', 30)
            from dateutil.relativedelta import relativedelta
            start_date = (datetime.now() - relativedelta(months=analysis_months)).date()
            end_date = datetime.now().date()
        
        # Format dates as ISO strings
        if hasattr(start_date, 'isoformat'):
            start_date_str = start_date.isoformat()
        else:
            start_date_str = str(start_date)
            
        if hasattr(end_date, 'isoformat'):
            end_date_str = end_date.isoformat()
        else:
            end_date_str = str(end_date)
        
        data_period = f"{start_date_str} to {end_date_str}"
        analysis_period = f"{start_date_str} to {end_date_str}"
        
        # Create business sale data structure compatible with DueDiligenceManager
        business_sale_data = {
            "metadata": {
                "business_name": financial_metrics.get('business_name') or 'Cranberry Hearing and Balance Center',
                "generated_at": FileUtils.get_js_compatible_timestamp(),
                "etl_run_timestamp": FileUtils.get_js_compatible_timestamp(),
                "data_period": data_period,
                "months_analyzed": financial_metrics.get('revenue_metrics', {}).get('analysis_period_months', 30),
                "data_source": "ETL Pipeline - Real Business Data",
                "analysis_period": analysis_period
            },
            "sales": {
                "total_transactions": int(sales_metrics.get('total_transactions', 0)),
                "total_revenue": float(sales_metrics.get('total_revenue', 0))
            },
            "financials": {
                "documents": [
                    {
                        "name": "Profit and Loss Statements 2023-2024",
                        "file_path": "docs/financials/Profit_and_Loss/",
                        "status": True,
                        "notes": "Monthly P&L statements for 2023-2024",
                        "due_date": None,
                        "file_type": "CSV",
                        "file_size": "2.5MB",
                        "visibility": ["public", "nda", "buyer", "internal"]
                    },
                    {
                        "name": "Balance Sheets 2022",
                        "file_path": "docs/financials/Balance_Sheets/",
                        "status": True,
                        "notes": "Monthly balance sheets for 2022",
                        "due_date": None,
                        "file_type": "CSV",
                        "file_size": "1.8MB",
                        "visibility": ["nda", "buyer", "internal"]
                    },
                    {
                        "name": "General Ledger 2021-2025",
                        "file_path": "docs/financials/General_Ledger/",
                        "status": True,
                        "notes": "Complete general ledger entries",
                        "due_date": None,
                        "file_type": "CSV",
                        "file_size": "15.2MB",
                        "visibility": ["buyer", "internal"]
                    }
                ],
                "metrics": {
                    "annual_revenue_projection": float(financial_metrics.get('revenue_metrics', {}).get('annual_revenue_projection', 0)),
                    "estimated_annual_ebitda": float(financial_metrics.get('profitability', {}).get('estimated_annual_ebitda', 0)),
                    "roi_percentage": float(financial_metrics.get('investment_metrics', {}).get('roi_percentage', 0)),
                    "ebitda_margin": float(financial_metrics.get('profitability', {}).get('ebitda_margin', 0)),
                    "payback_period_years": float(financial_metrics.get('investment_metrics', {}).get('payback_period_years', 0)),
                    "equipment_value": float(equipment_metrics.get('total_value', 0)),
                    "asking_price": float(financial_metrics.get('investment_metrics', {}).get('asking_price', 650000)),  # Use single source of truth
                    "visibility": ["public", "nda", "buyer", "internal"]
                }
            },
            "equipment": {
                "total_value": {
                    "amount": self._calculate_equipment_total_from_items(equipment_metrics.get('items', [])),
                    "currency": "USD"
                },
                "items": self._transform_equipment_items(equipment_metrics.get('items', []))
            },
            "legal": {
                "documents": [
                    {
                        "name": "Business License",
                        "file_path": "docs/legal/business_license.pdf",
                        "status": True,
                        "notes": "Current business license",
                        "due_date": "2025-12-31",
                        "file_type": "PDF",
                        "file_size": "2.1MB",
                        "visibility": ["public", "nda", "buyer", "internal"]
                    },
                    {
                        "name": "Insurance Policies",
                        "file_path": "docs/legal/insurance_policies.pdf",
                        "status": True,
                        "notes": "General liability and professional insurance",
                        "due_date": "2025-06-30",
                        "file_type": "PDF",
                        "file_size": "5.3MB",
                        "visibility": ["nda", "buyer", "internal"]
                    }
                ],
                "visibility": ["public", "nda", "buyer", "internal"]
            },
            "operational": {
                "documents": [
                    {
                        "name": "Standard Operating Procedures",
                        "file_path": "docs/operational/sop.pdf",
                        "status": True,
                        "notes": "Complete SOP documentation",
                        "due_date": None,
                        "file_type": "PDF",
                        "file_size": "3.2MB",
                        "visibility": ["nda", "buyer", "internal"]
                    }
                ],
                "visibility": ["nda", "buyer", "internal"]
            },
            "closing": {
                "documents": [
                    {
                        "name": "Purchase Agreement",
                        "file_path": "docs/closing/purchase_agreement.pdf",
                        "status": False,
                        "notes": "Draft purchase agreement",
                        "due_date": "2025-10-15",
                        "file_type": "PDF",
                        "file_size": "1.5MB",
                        "visibility": ["buyer", "internal"]
                    },
                    {
                        "name": "Closing Checklist",
                        "file_path": "docs/closing/closing_checklist.pdf",
                        "status": False,
                        "notes": "Pre-closing checklist",
                        "due_date": "2025-10-30",
                        "file_type": "PDF",
                        "file_size": "0.8MB",
                        "visibility": ["internal"]
                    }
                ],
                "milestones": [
                    {
                        "name": "Due Diligence Complete",
                        "status": True,
                        "date": "2025-09-07",
                        "visibility": ["buyer", "internal"]
                    },
                    {
                        "name": "Purchase Agreement Signed",
                        "status": False,
                        "date": None,
                        "visibility": ["buyer", "internal"]
                    }
                ],
                "visibility": ["buyer", "internal"]
            },
            "valuation": {
                "asking_price": {
                    "value": float(financial_metrics.get('investment_metrics', {}).get('asking_price', 650000)),  # Use single source of truth
                    "currency": "USD"
                },
                "market_value": {
                    "value": float(valuation_metrics.get('market_analysis', {}).get('estimated_market_value', 0)),
                    "currency": "USD"
                },
                "discount_percentage": float(valuation_metrics.get('market_analysis', {}).get('discount_from_market', 0)),
                "discount_amount": {
                    "value": float(valuation_metrics.get('market_analysis', {}).get('discount_amount', 0)),
                    "currency": "USD"
                }
            },
            "locations": self._create_location_data(sales_metrics),
            "highlights": self._create_highlights(business_metrics),
            "summary_cards": self._create_summary_cards(business_metrics, start_date, end_date)
        }
        
        return business_sale_data
    
    def _create_location_data(self, sales_metrics: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Create location data structure."""
        locations = []
        
        location_performance = sales_metrics.get('location_performance', {})
        
        for location_name, metrics in location_performance.items():
            location_data = {
                "name": location_name,
                "type": "Primary location" if "Pittsburgh" in location_name else "Secondary location",
                "estimated_revenue": float(metrics.get('total_revenue', 0)),
                "performance": "Strong performance" if metrics.get('total_revenue', 0) > 1000000 else "Consistent revenue"
            }
            locations.append(location_data)
        
        return locations
    
    def _create_highlights(self, business_metrics: Dict[str, Any]) -> List[str]:
        """Create business highlights."""
        highlights = []
        
        sales_metrics = business_metrics.get('sales', {})
        financial_metrics = business_metrics.get('financial', {})
        valuation_metrics = business_metrics.get('valuation', {})
        
        # Revenue highlight
        total_revenue = sales_metrics.get('total_revenue', 0)
        if total_revenue > 0:
            highlights.append(f"Proven Revenue: ${total_revenue:,.0f} total revenue")
        
        # EBITDA highlight
        ebitda_margin = financial_metrics.get('profitability', {}).get('ebitda_margin', 0)
        if ebitda_margin > 0:
            highlights.append(f"Strong Margins: {ebitda_margin:.1f}% EBITDA margin")
        
        # Industry highlight
        highlights.append("Healthcare Industry: Recession-resistant business")
        highlights.append("Turnkey Operation: Complete infrastructure included")
        
        # Market value highlight
        discount = valuation_metrics.get('market_analysis', {}).get('discount_from_market', 0)
        if discount > 0:
            highlights.append(f"Below Market Value: {discount:.0f}% discount from industry standard")
        
        # ROI highlight
        roi = financial_metrics.get('investment_metrics', {}).get('roi_percentage', 0)
        if roi > 0:
            highlights.append(f"High ROI: {roi:.1f}% annual return potential")
        
        return highlights
    
    def _create_summary_cards(self, business_metrics: Dict[str, Any], start_date=None, end_date=None) -> Dict[str, Any]:
        """Create summary cards data."""
        sales_metrics = business_metrics.get('sales', {})
        financial_metrics = business_metrics.get('financial', {})
        
        # Create dynamic period description
        if start_date and end_date:
            start_year = start_date.year if hasattr(start_date, 'year') else str(start_date)[:4]
            end_year = end_date.year if hasattr(end_date, 'year') else str(end_date)[:4]
            period_description = f"{start_year}-{end_year} Performance"
        else:
            period_description = "Historical Performance"
        
        return {
            "revenue_total": {
                "value": float(sales_metrics.get('total_revenue', 0)),
                "currency": "USD",
                "label": "Total Revenue",
                "description": period_description
            },
            "annual_ebitda": {
                "value": float(financial_metrics.get('profitability', {}).get('estimated_annual_ebitda', 0)),
                "currency": "USD",
                "label": "Annual EBITDA",
                "description": "Projected Annual"
            },
            "roi": {
                "value": float(financial_metrics.get('investment_metrics', {}).get('roi_percentage', 0)),
                "label": "ROI",
                "description": "Annual Return"
            },
            "equipment_value": {
                "value": float(business_metrics.get('equipment', {}).get('total_value', 0)),
                "currency": "USD",
                "label": "Equipment Value",
                "description": "Included in Sale"
            }
        }
    
    def _create_financial_summary(self, business_metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Create financial summary."""
        financial_data = business_metrics.get('financial', {})
        
        # Debug logging to see what we're getting
        logger.info(f"Creating financial summary from business metrics:")
        logger.info(f"  Business metrics keys: {list(business_metrics.keys())}")
        logger.info(f"  Financial data keys: {list(financial_data.keys())}")
        if 'revenue_metrics' in financial_data:
            revenue_metrics = financial_data['revenue_metrics']
            logger.info(f"  Revenue metrics: {revenue_metrics}")
        
        # Normalize monetary fields in financial data
        normalized_financial_data = self._normalize_financial_monetary_fields(financial_data)
        
        return {
            "summary": normalized_financial_data,
            "generated_at": FileUtils.get_js_compatible_timestamp(),
            "etl_run_timestamp": FileUtils.get_js_compatible_timestamp(),
            "data_source": "ETL Pipeline Analysis"
        }
    
    def _create_equipment_analysis(self, business_metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Create equipment analysis with deduplication, normalization, and pricing validation."""
        equipment_metrics = business_metrics.get('equipment', {})
        
        # Build items list from data-driven source with deduplication
        items = []
        seen_items = {}  # Track unique items by normalized name + part_number
        equipment_items = equipment_metrics.get('items', [])
        
        if equipment_items:
            for item in equipment_items:
                if isinstance(item, dict):
                    # Normalize name (remove newlines, fix typos)
                    raw_name = item.get('name', 'Unknown Equipment')
                    normalized_name = self._normalize_equipment_name(raw_name)
                    
                    # Create stable ID from part number or normalized name
                    part_number = item.get('part_number', '')
                    # Sanitize part_number before using as ID
                    if part_number:
                        part_number = str(part_number).strip()
                        # Remove control characters and invalid characters
                        part_number = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', part_number)
                        part_number = re.sub(r'[^\w\-_.]', '_', part_number)
                    
                    # For deduplication, use both part_number and normalized name to avoid combining different items
                    # with the same part_number (like MISCEQU items that are actually different)
                    dedup_key = f"{part_number}_{normalized_name}" if part_number else normalized_name
                    stable_id = part_number if part_number else self._generate_stable_id(normalized_name)
                    
                    if dedup_key not in seen_items:
                        # First occurrence - add to items
                        # Parse prices robustly
                        unit_price_raw = item.get('unit_price', 0)
                        total_price_raw = item.get('total_price', 0)
                        quantity = int(item.get('quantity', 1))
                        
                        # Normalize unit price
                        unit_price_normalized = normalize_money(unit_price_raw)
                        
                        # Validate and fix pricing consistency
                        validated_prices = self._validate_and_fix_equipment_pricing(
                            unit_price_normalized, total_price_raw, quantity, stable_id
                        )
                        
                        equipment_item = {
                            "id": stable_id,
                            "name": normalized_name,
                            "description": item.get('description', 'Equipment description not available'),
                            "category": item.get('category', 'Uncategorized'),
                            "part_number": part_number,
                            "quantity": quantity,
                            "unit_price": validated_prices["unit_price"],
                            "total_price": validated_prices["total_price"]
                        }
                        items.append(equipment_item)
                        seen_items[dedup_key] = equipment_item
                    else:
                        # Duplicate - aggregate quantities
                        existing_item = seen_items[dedup_key]
                        additional_quantity = int(item.get('quantity', 1))
                        existing_item["quantity"] += additional_quantity
                        
                        # Validate and fix pricing for duplicate item
                        additional_unit_price = normalize_money(item.get('unit_price', 0))
                        additional_total_price_raw = item.get('total_price', 0)
                        validated_prices = self._validate_and_fix_equipment_pricing(
                            additional_unit_price, additional_total_price_raw, additional_quantity, stable_id
                        )
                        
                        existing_item["total_price"]["amount"] += validated_prices["total_price"]["amount"]
        
        # Calculate total value from actual items
        calculated_total_value = sum(item.get('total_price', {}).get('amount', 0) for item in items)
        
        return {
            "equipment_summary": {
                "total_value": {
                    "amount": calculated_total_value,
                    "currency": "USD"
                },
                "items": items
            },
            "generated_at": FileUtils.get_js_compatible_timestamp(),
            "etl_run_timestamp": FileUtils.get_js_compatible_timestamp(),
            "data_source": "ETL Pipeline Analysis"
        }
    
    def _create_landing_page_data(self, business_metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Create comprehensive landing page data structure with normalized types and deduplication."""
        logger.info("Creating landing page data structure...")
        
        # Extract metrics
        financial_metrics = business_metrics.get('financial', {})
        landing_page_metrics = business_metrics.get('landing_page', {})
        equipment_metrics = business_metrics.get('equipment', {})
        
        # Get revenue and profitability data
        revenue_metrics = financial_metrics.get('revenue_metrics', {})
        profitability = financial_metrics.get('profitability', {})
        investment_metrics = financial_metrics.get('investment_metrics', {})
        
        # Normalize insurance coverage to prevent staleness
        insurance_coverage = self._normalize_insurance_coverage(landing_page_metrics.get('insurance_coverage', {}))
        
        # Ensure asking_price is consistent - use single source of truth
        asking_price_value = investment_metrics.get('asking_price', 650000)
        if isinstance(asking_price_value, dict):
            asking_price_value = asking_price_value.get('value', 650000)
        
        # Create landing page data structure with normalized types and stable schema
        landing_page_data = {
            "listing_details": {
                "business_name": "Cranberry Hearing and Balance Center",
                "business_type": "Audiology Practice",
                "asking_price": {
                    "value": float(asking_price_value),
                    "currency": "USD"
                },
                "established": 2010,  # Keep as numeric for type consistency
                "established_year": 2010,  # Add numeric version for clarity
                "locations": 2,
                "state": "PA"  # Use consistent state abbreviation
            },
            "financial_highlights": {
                "annual_revenue": self._normalize_financial_value(
                    revenue_metrics.get('annual_revenue_projection', {}).get('value', None) 
                    if isinstance(revenue_metrics.get('annual_revenue_projection'), dict) 
                    else revenue_metrics.get('annual_revenue_projection', None)
                ),
                "annual_ebitda": self._normalize_financial_value(
                    profitability.get('estimated_annual_ebitda', {}).get('value', None) 
                    if isinstance(profitability.get('estimated_annual_ebitda'), dict) 
                    else profitability.get('estimated_annual_ebitda', None)
                ),
                "monthly_cash_flow": self._normalize_financial_value(
                    landing_page_metrics.get('monthly_cash_flow', None)
                ),
                "roi": round(float(investment_metrics.get('roi_percentage', 0)), 2),
                "payback_period_years": round(float(investment_metrics.get('payback_period_years', 0)), 1),
                "ebitda_margin": round(float(profitability.get('ebitda_margin', 0)), 2)
            },
            "property_details": {
                "primary_location": landing_page_metrics.get('location_info', {}).get('primary_location', {}),
                "secondary_location": landing_page_metrics.get('location_info', {}).get('secondary_location', {}),
                "lease_analysis": landing_page_metrics.get('lease_analysis', {}),
                "property_type": "Leased"
            },
            "business_operations": {
                "services": ["Hearing Tests", "Hearing Aid Sales", "Balance Testing", "Tinnitus Treatment"],
                "insurance_coverage": insurance_coverage,
                "payment_methods": ["Insurance billing (UPMC, Aetna)", "Private pay", "Cash payments"],
                "equipment_value": self._normalize_financial_value(equipment_metrics.get('total_value', None)),
                "business_hours": {
                    "monday": "9:00 AM - 5:00 PM",
                    "tuesday": "9:00 AM - 5:00 PM", 
                    "wednesday": "9:00 AM - 5:00 PM",
                    "thursday": "9:00 AM - 5:00 PM",
                    "friday": "9:00 AM - 5:00 PM",
                    "saturday": "Closed",
                    "sunday": "Closed"
                }
            },
            "market_opportunity": {
                "local_market": "Cranberry Township & Pittsburgh Metro Area",
                "competition": "Limited local competition",
                "growth_potential": "High - aging population demographics",
                "market_advantage": "Established insurance relationships"
            },
            "transaction_terms": {
                "financing_available": True,
                "seller_financing": "20% down, seller carryback available",
                "training_period": "30 days",
                "reason_for_sale": landing_page_metrics.get('sale_details', {}).get('reason_for_sale', 'Owner retirement'),
                "transition_support": "Available for smooth transition"
            },
            "key_benefits": [
                "Established insurance relationships (UPMC since 2006, Aetna since 2015)",
                "Two prime locations in growing markets",
                "Professional audiology equipment included",
                "Steady cash flow from insurance payments",
                "Absentee owner opportunity",
                "Strong EBITDA margins"
            ],
            "metadata": {
                "generated_at": FileUtils.get_js_compatible_timestamp(),
                "etl_run_timestamp": FileUtils.get_js_compatible_timestamp(),
                "data_source": "ETL Pipeline Analysis",
                "version": "1.0"
            }
        }
        
        logger.info("Landing page data structure created successfully")
        return landing_page_data
    
    def _copy_files_to_website(self, final_dir: Path) -> None:
        """Copy essential JSON files to website admin data directory for Next.js integration."""
        try:
            
            # Define website admin data directory (relative to project root)
            # Use ADMIN_DATA_DIR environment variable or default to .data
            project_root = Path(__file__).parent.parent.parent
            admin_data_dir = os.getenv('ADMIN_DATA_DIR', '.data')
            website_data_dir = project_root / "website" / admin_data_dir
            website_data_dir.mkdir(parents=True, exist_ok=True)
            
            # Files to copy to website
            files_to_copy = [
                "landing_page_data.json",
                "financial_summary.json", 
                "equipment_analysis.json",
                "business_sale_data.json",
                "due_diligence_coverage.json"
            ]
            
            copied_files = []
            for filename in files_to_copy:
                # SECURITY: Validate filename to prevent directory traversal
                try:
                    validate_file_path(filename)
                except ValueError as e:
                    logger.error(f"Security validation failed for {filename}: {e}")
                    continue
                
                source_file = final_dir / filename
                if source_file.exists():
                    dest_file = website_data_dir / filename
                    
                    # SECURITY: Double-check that the resolved destination path is within allowed directory
                    try:
                        resolved_dest = dest_file.resolve()
                        resolved_website_dir = website_data_dir.resolve()
                        if not str(resolved_dest).startswith(str(resolved_website_dir)):
                            raise ValueError(f"Path traversal detected: {resolved_dest} is outside {resolved_website_dir}")
                    except ValueError as e:
                        logger.error(f"Security validation failed for destination {dest_file}: {e}")
                        continue
                    
                    shutil.copy2(source_file, dest_file)
                    copied_files.append(filename)
                    logger.info(f"Copied {filename} to website admin data directory: {dest_file}")
                else:
                    logger.warning(f"Source file not found: {source_file}")
            
            if copied_files:
                logger.info(f"Successfully copied {len(copied_files)} files to website admin data directory")
                self.load_results['website_files_copied'] = copied_files
            else:
                logger.warning("No files were copied to website admin data directory")
                
        except (OSError, shutil.Error) as e:
            logger.exception("Failed to copy files to website admin data directory")
            # Don't raise the exception - this is not critical for the main pipeline
    
    def _convert_dataframes_to_dict(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Convert DataFrames to dictionaries for JSON serialization."""
        converted_data = {}
        
        for key, value in data.items():
            if isinstance(value, pd.DataFrame):
                # Convert DataFrame to dictionary with proper date handling
                df_copy = value.copy()
                
                # Handle datetime columns with timezone awareness
                for col in df_copy.columns:
                    if df_copy[col].dtype == 'datetime64[ns]':
                        # Use isoformat to preserve timezone info
                        df_copy[col] = df_copy[col].apply(
                            lambda x: x.isoformat() if pd.notnull(x) else None
                        )
                    elif 'datetime' in str(df_copy[col].dtype):
                        # Handle other datetime types
                        df_copy[col] = df_copy[col].apply(
                            lambda x: x.isoformat() if hasattr(x, 'isoformat') and pd.notnull(x) else None
                        )
                
                # Replace NaN/Infinity with JSON-safe values
                df_copy = df_copy.replace([np.inf, -np.inf], None).where(pd.notnull(df_copy), None)
                
                # Convert to records and sanitize
                records = df_copy.to_dict('records')
                sanitized_records = self._sanitize_for_json(records)
                
                converted_data[key] = {
                    'data': sanitized_records,
                    'columns': list(value.columns),
                    'shape': value.shape,
                    'dtypes': {k: str(v) for k, v in value.dtypes.to_dict().items()}
                }
            elif isinstance(value, list):
                # Handle lists that may contain DataFrames
                converted_data[key] = self._sanitize_for_json(value)
            elif isinstance(value, dict):
                # Recursively convert nested dictionaries
                converted_data[key] = self._convert_dataframes_to_dict(value)
            else:
                # Sanitize other types
                converted_data[key] = self._sanitize_for_json(value)
        
        return converted_data
    
    def _sanitize_for_json(self, obj: Any) -> Any:
        """Sanitize any object to be JSON-serializable."""
        if isinstance(obj, pd.DataFrame):
            # Handle DataFrame by converting to records and sanitizing
            df = obj.copy()
            df = df.replace([np.inf, -np.inf], None).where(pd.notnull(df), None)
            records = df.to_dict('records')
            return self._sanitize_for_json(records)
        elif isinstance(obj, list):
            # Handle lists recursively
            return [self._sanitize_for_json(item) for item in obj]
        elif isinstance(obj, dict):
            # Handle dictionaries recursively
            return {key: self._sanitize_for_json(value) for key, value in obj.items()}
        elif isinstance(obj, (np.integer, np.floating)):
            # Convert numpy scalars to native Python types
            return obj.item()
        elif isinstance(obj, np.ndarray):
            # Convert numpy arrays to lists
            return obj.tolist()
        elif hasattr(obj, 'isoformat'):
            # Handle datetime objects
            return obj.isoformat()
        elif pd.isna(obj) or obj in [np.inf, -np.inf]:
            # Handle NaN and infinity values
            return None
        elif isinstance(obj, (int, float, str, bool, type(None))):
            # Already JSON-serializable
            return obj
        else:
            # Convert everything else to string
            return str(obj)
    
    def _convert_equipment_to_json_serializable(self, equipment_data: Dict[str, Any]) -> Dict[str, Any]:
        """Convert equipment data to JSON-serializable structure."""
        converted_data = {}
        
        for key, value in equipment_data.items():
            if isinstance(value, pd.DataFrame):
                # Convert DataFrame to list of dictionaries with proper normalization
                records = value.to_dict('records')
                normalized_records = []
                for record in records:
                    normalized_record = {}
                    for k, v in record.items():
                        normalized_record[k] = self._normalize_scalar_value(v)
                    normalized_records.append(normalized_record)
                
                converted_data[key] = {
                    'data': normalized_records,
                    'columns': list(value.columns),
                    'shape': value.shape,
                    'dtypes': {k: str(v) for k, v in value.dtypes.to_dict().items()}
                }
            elif isinstance(value, list):
                # Convert list items to plain dictionaries
                converted_data[key] = []
                for item in value:
                    if isinstance(item, dict):
                        # Ensure all values are JSON-serializable
                        serializable_item = {}
                        for k, v in item.items():
                            serializable_item[k] = self._normalize_scalar_value(v)
                        converted_data[key].append(serializable_item)
                    else:
                        converted_data[key].append(self._normalize_scalar_value(item))
            elif isinstance(value, dict):
                # Recursively convert nested dictionaries
                converted_data[key] = self._convert_equipment_to_json_serializable(value)
            else:
                # Handle other types
                converted_data[key] = self._normalize_scalar_value(value)
        
        return converted_data
    
    def _normalize_scalar_value(self, value: Any) -> Any:
        """Normalize scalar values to be JSON-safe."""
        import math
        
        # First convert NumPy types to Python equivalents
        if isinstance(value, (np.integer, np.floating)):
            value = value.item()
        elif isinstance(value, np.ndarray):
            return value.tolist()
        
        # Now apply NaN/Inf guard on the converted value
        if pd.isna(value) or (isinstance(value, float) and not math.isfinite(value)):
            return None
        
        # Handle timezone-aware datetimes
        if hasattr(value, 'isoformat'):
            if hasattr(value, 'tzinfo') and value.tzinfo is not None:
                # Convert to UTC then to ISO string
                return value.astimezone(timezone.utc).isoformat()
            else:
                return value.isoformat()
        
        # Handle basic JSON-safe types
        if isinstance(value, (int, float, str, bool, type(None))):
            return value
        
        # Fallback to string representation
        return str(value)
    
    def _transform_equipment_items(self, items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Transform equipment items to include required fields for DueDiligenceManager."""
        transformed_items = []
        for item in items:
            transformed_item = item.copy()
            # Add value field (use total_price if available, otherwise unit_price * quantity)
            if 'total_price' in item:
                transformed_item['value'] = normalize_money(item['total_price'])
            elif 'unit_price' in item and 'quantity' in item:
                unit_price = normalize_money(item['unit_price'])
                quantity = int(item.get('quantity', 1))
                transformed_item['value'] = {
                    "value": unit_price["value"] * quantity,
                    "currency": unit_price["currency"]
                }
            else:
                transformed_item['value'] = {"value": 0.0, "currency": "USD"}
            
            # Ensure all monetary fields are properly formatted
            if 'unit_price' in transformed_item:
                transformed_item['unit_price'] = normalize_money(transformed_item['unit_price'])
            if 'total_price' in transformed_item:
                transformed_item['total_price'] = normalize_money(transformed_item['total_price'])
            
            # Add file_path field (use source_file if available)
            if 'source_file' in item:
                transformed_item['file_path'] = f"docs/equipment/{item['source_file']}"
            else:
                transformed_item['file_path'] = "docs/equipment/"
            
            # Add required fields for schema compliance
            transformed_item['status'] = True
            transformed_item['notes'] = f"Equipment item from {item.get('source_file', 'unknown source')}"
            transformed_item['due_date'] = None
            transformed_item['file_type'] = "CSV"
            transformed_item['file_size'] = "Unknown"
            
            # Add visibility field
            transformed_item['visibility'] = ["public", "nda", "buyer", "internal"]
            
            transformed_items.append(transformed_item)
        
        return transformed_items
    
    def _normalize_equipment_name(self, name: str) -> str:
        """Normalize equipment name by removing newlines and fixing typos."""
        if not name:
            return "Unknown Equipment"
        
        # Replace newlines with spaces and clean up
        normalized = name.replace('\n', ' ').replace('\r', ' ')
        
        # Fix common typos
        normalized = normalized.replace('Controled', 'Controlled')
        normalized = normalized.replace('Diagnostic Audiom', 'Diagnostic Audiometer')
        normalized = normalized.replace('Audiometereter', 'Audiometer')  # Fix the specific typo mentioned
        
        # Clean up multiple spaces
        normalized = ' '.join(normalized.split())
        
        return normalized.strip()
    
    def _generate_stable_id(self, name: str) -> str:
        """Generate a stable ID from equipment name."""
        import re
        
        # Convert to lowercase and replace spaces/special chars with underscores
        stable_id = re.sub(r'[^a-zA-Z0-9]', '_', name.lower())
        
        # Remove multiple underscores and trim
        stable_id = re.sub(r'_+', '_', stable_id).strip('_')
        
        # Limit length and add prefix
        if len(stable_id) > 20:
            stable_id = stable_id[:20]
        
        return f"EQ_{stable_id}"
    
    def _validate_and_fix_equipment_pricing(self, unit_price: Dict[str, Any], total_price_raw: Any, quantity: int, item_id: str) -> Dict[str, Any]:
        """
        Validate and fix equipment pricing consistency.
        
        Args:
            unit_price: Unit price dict (can have 'amount' or 'value' key)
            total_price_raw: Raw total price value (can be dict, number, string, etc.)
            quantity: Item quantity
            item_id: Item identifier for logging
            
        Returns:
            Dict with 'unit_price' and 'total_price' both normalized to consistent shape with 'amount' and 'currency'
        """
        # Normalize unit price to consistent shape with 'amount' and 'currency'
        if isinstance(unit_price, dict):
            if 'amount' in unit_price:
                unit_price_normalized = {
                    "amount": float(unit_price["amount"]),
                    "currency": unit_price.get("currency", "USD")
                }
            elif 'value' in unit_price:
                unit_price_normalized = {
                    "amount": float(unit_price["value"]),
                    "currency": unit_price.get("currency", "USD")
                }
            else:
                # Fallback for unexpected unit_price format
                unit_price_normalized = {"amount": 0.0, "currency": "USD"}
        else:
            # If unit_price is not a dict, normalize it
            unit_price_normalized = normalize_money(unit_price)
            # Convert from 'value' to 'amount' shape
            unit_price_normalized = {
                "amount": unit_price_normalized["value"],
                "currency": unit_price_normalized["currency"]
            }
        
        # Normalize total price
        total_price_normalized = normalize_money(total_price_raw)
        # Convert from 'value' to 'amount' shape for consistency
        total_price_normalized = {
            "amount": total_price_normalized["value"],
            "currency": total_price_normalized["currency"]
        }
        
        # Calculate expected total price
        expected_total = unit_price_normalized["amount"] * quantity
        
        # Check if total_price is valid and consistent
        if (total_price_raw is None or 
            total_price_raw == "" or 
            str(total_price_raw).strip().upper() in ['N/A', 'NA', 'NULL', 'NONE', '0'] or
            total_price_normalized["amount"] == 0.0):
            # Total price is invalid - calculate from unit_price * quantity
            total_price_normalized = {
                "amount": expected_total,
                "currency": unit_price_normalized["currency"]
            }
            logger.info(f"Fixed invalid total_price for {item_id}: calculated {expected_total} from unit_price {unit_price_normalized['amount']} * quantity {quantity}")
        else:
            # Total price exists - check for consistency
            actual_total = total_price_normalized["amount"]
            if abs(actual_total - expected_total) > 0.01:  # Allow for small floating point differences
                # Inconsistent pricing - log warning and fix
                logger.warning(f"Pricing inconsistency detected for {item_id}: unit_price {unit_price_normalized['amount']} * quantity {quantity} = {expected_total}, but total_price = {actual_total}. Auto-correcting to {expected_total}")
                total_price_normalized = {
                    "amount": expected_total,
                    "currency": unit_price_normalized["currency"]
                }
        
        return {
            "unit_price": unit_price_normalized,
            "total_price": total_price_normalized
        }
    
    def _normalize_financial_monetary_fields(self, financial_data: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize monetary fields in financial data to include currency."""
        import copy
        normalized = copy.deepcopy(financial_data)
        
        # Define monetary field mappings
        monetary_fields = {
            'revenue_metrics': ['total_revenue', 'annual_revenue_projection', 'monthly_revenue_average'],
            'profitability': ['estimated_ebitda', 'estimated_annual_ebitda'],
            'investment_metrics': ['asking_price', 'estimated_market_value', 'discount_amount', 'estimated_annual_ebitda']
        }
        
        # Normalize monetary fields
        for section, fields in monetary_fields.items():
            if section in normalized:
                for field in fields:
                    if field in normalized[section]:
                        value = normalized[section][field]
                        # Skip if already normalized (dict with value/currency)
                        if isinstance(value, dict) and 'value' in value and 'currency' in value:
                            # Fix inconsistent Money shape: change 'value' to 'amount' if needed
                            if 'value' in value and 'amount' not in value:
                                value['amount'] = value['value']
                                del value['value']
                            continue
                        # Normalize using the helper function
                        normalized[section][field] = normalize_money(value)
        
        return normalized
    
    def _normalize_insurance_coverage(self, insurance_coverage: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize insurance coverage to prevent staleness by computing derived fields at render-time."""
        if not insurance_coverage:
            # Return populated insurance coverage from business rules
            return {
                "insurers": [
                    {
                        "name": "UPMC",
                        "years_active": 19,
                        "contract_date": "2006-08-31",
                        "status": "Active",
                        "coverage_type": "Primary Insurance"
                    },
                    {
                        "name": "Aetna",
                        "years_active": 10,
                        "contract_date": "2015-09-28",
                        "status": "Active",
                        "coverage_type": "Primary Insurance"
                    }
                ]
            }
        
        # Keep only contract_date and compute derived fields at render-time
        normalized = {
            "insurers": insurance_coverage.get('insurers', [])
        }
        
        # Remove stale derived fields that will drift over time
        # These should be computed at render-time based on contract_date
        # Removed: years_active, total_insurers, total_years_coverage, 
        #          average_years_per_insurer, coverage_stability_score
        
        return normalized
    
    def _normalize_financial_value(self, value: Any) -> Dict[str, Any]:
        """Normalize financial values to use null instead of 0.0 for unknown values."""
        if value is None or value == 0.0:
            return {"value": None, "currency": "USD", "status": "unknown"}
        
        return {
            "value": float(value),
            "currency": "USD",
            "status": "available"
        }
    
    def _normalize_percentage_value(self, value: Any) -> Any:
        """Normalize percentage values to use null instead of 0.0 for unknown values."""
        if value is None or value == 0.0:
            return None
        
        return round(float(value), 1)
    
    def load_patient_dimension_data(self, patient_data: Dict[str, Any], output_path: str) -> bool:
        """
        Load patient dimension data with access controls.
        
        Args:
            patient_data: Patient dimension data dictionary
            output_path: Path to save patient dimension data
            
        Returns:
            bool: True if successful
        """
        try:
            if not patient_data:
                logger.warning("No patient dimension data to load")
                return True
            
            # Create output directory if it doesn't exist
            output_dir = Path(output_path).parent
            output_dir.mkdir(parents=True, exist_ok=True)
            
            # Convert patient data to list format for JSON serialization
            patient_records = list(patient_data.values())
            
            # Add metadata for access control
            patient_dimension_output = {
                'metadata': {
                    'access_control': 'restricted',
                    'encryption_required': True,
                    'data_type': 'patient_dimension',
                    'pii_protected': True,
                    'created_date': FileUtils.get_js_compatible_timestamp(),
                    'record_count': len(patient_records)
                },
                'data': patient_records
            }
            
            # Save with restricted permissions
            with open(output_path, 'w') as f:
                json.dump(patient_dimension_output, f, indent=2, default=str)
            
            # Set restrictive file permissions (readable only by owner)
            Path(output_path).chmod(0o600)
            
            logger.info(f"Loaded patient dimension data: {len(patient_records)} records to {output_path}")
            logger.warning("Patient dimension data contains PII - access restricted to authorized personnel only")
            
            return True
            
        except Exception as e:
            logger.error(f"Error loading patient dimension data: {str(e)}")
            return False
    
    def _calculate_equipment_total_from_items(self, items: List[Dict[str, Any]]) -> float:
        """Calculate equipment total value from the sum of individual items to ensure data integrity."""
        total = 0.0
        for item in items:
            # Handle different price field structures
            if 'total_price' in item:
                if isinstance(item['total_price'], dict):
                    total += float(item['total_price'].get('amount', 0))
                else:
                    total += float(item['total_price'])
            elif 'price' in item:
                total += float(item['price'])
        return total