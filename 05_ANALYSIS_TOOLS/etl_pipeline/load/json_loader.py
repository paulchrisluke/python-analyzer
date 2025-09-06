"""
JSON data loader for ETL pipeline.
"""

import json
import pandas as pd
from typing import Dict, Any, List, Optional
import logging
from pathlib import Path
from datetime import datetime
from .base_loader import BaseLoader
from ..utils.file_utils import FileUtils

logger = logging.getLogger(__name__)

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
            FileUtils.save_json(raw_data['equipment'], str(equipment_file))
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
            FileUtils.save_json(normalized_data['equipment'], str(equipment_file))
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
        """Load equipment data."""
        # Equipment data is already handled in _load_business_data
        pass
    
    def _load_coverage_analysis(self, coverage_analysis: Dict[str, Any]) -> None:
        """Load coverage analysis data."""
        final_dir = self.output_dir / "final"
        final_dir.mkdir(exist_ok=True)
        
        # Save coverage analysis
        coverage_file = final_dir / "due_diligence_coverage.json"
        FileUtils.save_json(coverage_analysis, str(coverage_file))
        self.load_results['due_diligence_coverage'] = str(coverage_file)
        logger.info(f"Due diligence coverage analysis saved to: {coverage_file}")
    
    def _create_business_sale_data(self, business_metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Create comprehensive business sale data structure."""
        
        # Extract metrics
        sales_metrics = business_metrics.get('sales', {})
        financial_metrics = business_metrics.get('financial', {})
        operational_metrics = business_metrics.get('operational', {})
        valuation_metrics = business_metrics.get('valuation', {})
        performance_metrics = business_metrics.get('performance', {})
        
        # Create business sale data structure
        business_sale_data = {
            "metadata": {
                "generated_at": datetime.now().isoformat(),
                "data_period": "2023-2025 Q2",
                "months_analyzed": financial_metrics.get('revenue_metrics', {}).get('analysis_period_months', 30),
                "data_source": "ETL Pipeline - Real Business Data",
                "analysis_period": "Jan 1, 2023 to June 30, 2025"
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
        return {
            "equipment_summary": {
                "total_value": equipment_metrics.get('total_value', 0),
                "items": [
                    {
                        "name": "Cello Audiometer System",
                        "description": "Advanced hearing testing",
                        "category": "Diagnostic Equipment"
                    },
                    {
                        "name": "Trumpet REM System",
                        "description": "Real ear measurement",
                        "category": "Measurement Equipment"
                    },
                    {
                        "name": "CL12BLP Equipment",
                        "description": "Professional diagnostic tools",
                        "category": "Diagnostic Equipment"
                    },
                    {
                        "name": "AUD System",
                        "description": "Complete audiology suite",
                        "category": "Complete System"
                    }
                ]
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
                
                # Convert datetime columns to strings
                for col in df_copy.columns:
                    if df_copy[col].dtype == 'datetime64[ns]':
                        df_copy[col] = df_copy[col].dt.strftime('%Y-%m-%d %H:%M:%S')
                    elif 'datetime' in str(df_copy[col].dtype):
                        df_copy[col] = df_copy[col].astype(str)
                
                converted_data[key] = {
                    'data': df_copy.to_dict('records'),
                    'columns': list(value.columns),
                    'shape': value.shape,
                    'dtypes': {k: str(v) for k, v in value.dtypes.to_dict().items()}
                }
            elif isinstance(value, dict):
                # Recursively convert nested dictionaries
                converted_data[key] = self._convert_dataframes_to_dict(value)
            else:
                # Keep other types as-is
                converted_data[key] = value
        
        return converted_data
