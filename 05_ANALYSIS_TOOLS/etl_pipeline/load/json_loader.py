"""
JSON data loader for ETL pipeline.
"""

import json
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional
import logging
from pathlib import Path
from datetime import datetime, timezone
import re
from .base_loader import BaseLoader
from ..utils.file_utils import FileUtils

logger = logging.getLogger(__name__)

def parse_price_value(price_raw):
    """
    Robust price parser that handles currency strings, N/A values, and various formats.
    Returns 0.0 on failure.
    """
    if price_raw is None:
        return 0.0
    
    try:
        # Convert to string and strip whitespace
        price_str = str(price_raw).strip()
        
        # Handle empty strings or N/A values
        if not price_str or price_str.upper() in ['N/A', 'NA', 'NULL', 'NONE', '']:
            return 0.0
        
        # Use regex to extract the first numeric pattern
        # This handles formats like "$1,234.56", "1,234.56", "1234.56", etc.
        numeric_match = re.search(r'[\d,]+\.?\d*', price_str)
        if numeric_match:
            numeric_str = numeric_match.group()
            # Remove commas
            numeric_str = numeric_str.replace(',', '')
            # Convert to float
            return float(numeric_str)
        else:
            return 0.0
            
    except (ValueError, TypeError, AttributeError):
        return 0.0

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
            Dict containing load results
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
            
            logger.info("JSON data loading completed")
            return self.load_results
            
        except Exception as e:
            self.add_load_event('error', f'Load failed: {str(e)}')
            raise
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
                'validated_at': datetime.now().isoformat(),
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
        
        # Create business sale data structure
        business_sale_data = {
            "metadata": {
                "generated_at": datetime.now().isoformat(),
                "data_period": data_period,
                "months_analyzed": financial_metrics.get('revenue_metrics', {}).get('analysis_period_months', 30),
                "data_source": "ETL Pipeline - Real Business Data",
                "analysis_period": analysis_period
            },
            "financials": {
                "revenue": {
                    "total_revenue": sales_metrics.get('total_revenue', 0),
                    "annual_projection": financial_metrics.get('revenue_metrics', {}).get('annual_revenue_projection', 0),
                    "monthly_average": financial_metrics.get('revenue_metrics', {}).get('monthly_revenue_average', 0),
                    "currency": "USD"
                },
                "ebitda": {
                    "estimated_annual": financial_metrics.get('profitability', {}).get('estimated_annual_ebitda', 0),
                    "margin_percentage": financial_metrics.get('profitability', {}).get('ebitda_margin', 0)
                },
                "profitability": {
                    "roi_percentage": financial_metrics.get('investment_metrics', {}).get('roi_percentage', 0),
                    "profit_margin": financial_metrics.get('profitability', {}).get('ebitda_margin', 0)
                }
            },
            "valuation": {
                "asking_price": valuation_metrics.get('market_analysis', {}).get('asking_price', 650000),
                "market_value": valuation_metrics.get('market_analysis', {}).get('estimated_market_value', 0),
                "discount_percentage": valuation_metrics.get('market_analysis', {}).get('discount_from_market', 0),
                "discount_amount": valuation_metrics.get('market_analysis', {}).get('discount_amount', 0)
            },
            "locations": self._create_location_data(sales_metrics),
            "highlights": self._create_highlights(business_metrics),
            "summary_cards": self._create_summary_cards(business_metrics)
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
                "estimated_revenue": metrics.get('total_revenue', 0),
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
    
    def _create_summary_cards(self, business_metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Create summary cards data."""
        sales_metrics = business_metrics.get('sales', {})
        financial_metrics = business_metrics.get('financial', {})
        
        return {
            "revenue_total": {
                "value": sales_metrics.get('total_revenue', 0),
                "label": "Total Revenue",
                "description": "2021-2025 Performance"
            },
            "annual_ebitda": {
                "value": financial_metrics.get('profitability', {}).get('estimated_annual_ebitda', 0),
                "label": "Annual EBITDA",
                "description": "Projected Annual"
            },
            "roi": {
                "value": financial_metrics.get('investment_metrics', {}).get('roi_percentage', 0),
                "label": "ROI",
                "description": "Annual Return"
            },
            "equipment_value": {
                "value": business_metrics.get('equipment', {}).get('total_value', 0),
                "label": "Equipment Value",
                "description": "Included in Sale"
            }
        }
    
    def _create_financial_summary(self, business_metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Create financial summary."""
        return {
            "summary": business_metrics.get('financial', {}),
            "generated_at": datetime.now().isoformat(),
            "data_source": "ETL Pipeline Analysis"
        }
    
    def _create_equipment_analysis(self, business_metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Create equipment analysis."""
        equipment_metrics = business_metrics.get('equipment', {})
        
        # Build items list from data-driven source
        items = []
        equipment_items = equipment_metrics.get('items', [])
        
        if equipment_items:
            # Use data from business metrics
            for item in equipment_items:
                if isinstance(item, dict):
                    items.append({
                        "name": item.get('name', 'Unknown Equipment'),
                        "description": item.get('description', 'Equipment description not available'),
                        "category": item.get('category', 'Uncategorized')
                    })
        else:
            # Fallback to empty list if no data available
            items = []
        
        return {
            "equipment_summary": {
                "total_value": equipment_metrics.get('total_value', 0),
                "items": items
            },
            "generated_at": datetime.now().isoformat(),
            "data_source": "ETL Pipeline Analysis"
        }
    
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
        
        # Handle numpy scalars
        if isinstance(value, (np.integer, np.floating)):
            return value.item()
        
        # Handle numpy arrays
        if isinstance(value, np.ndarray):
            return value.tolist()
        
        # Handle NaN/Inf values
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
