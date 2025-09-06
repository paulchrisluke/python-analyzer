"""
Sales data extractor for ETL pipeline.
"""

import pandas as pd
from typing import Dict, Any, List, Optional
import logging
from pathlib import Path
from .base_extractor import BaseExtractor

logger = logging.getLogger(__name__)

class SalesExtractor(BaseExtractor):
    """Extractor for sales data from CSV files."""
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize sales extractor.
        
        Args:
            config: Configuration dictionary
        """
        super().__init__(config)
        self.sales_data = {}
        
    def extract(self) -> Dict[str, Any]:
        """
        Extract sales data from all sales-related CSV files.
        
        Returns:
            Dict containing extracted sales data
        """
        logger.info("Starting sales data extraction...")
        
        if not self.validate_config():
            raise ValueError("Invalid configuration for sales extractor")
        
        # Extract main sales data
        main_sales = self._extract_main_sales()
        if main_sales is not None:
            self.sales_data['main_sales'] = main_sales
        
        # Extract related sales data
        related_data = self._extract_related_sales_data()
        self.sales_data.update(related_data)
        
        # Calculate summary statistics
        summary = self._calculate_summary_stats()
        self.sales_data['summary'] = summary
        
        self.log_extraction_summary(
            len(main_sales) if main_sales is not None else 0,
            "Sales CSV files"
        )
        
        return self.sales_data
    
    def _extract_main_sales(self) -> Optional[pd.DataFrame]:
        """Extract main sales data."""
        try:
            sales_file = Path(self.config['path'])
            if not sales_file.exists():
                logger.error(f"Sales file not found: {sales_file}")
                return None
            
            # Load CSV with proper encoding and error handling
            df = pd.read_csv(
                sales_file,
                encoding=self.config.get('encoding', 'utf-8'),
                low_memory=False,
                na_values=['', 'NULL', 'null', 'N/A', 'n/a']
            )
            
            logger.info(f"Loaded main sales data: {len(df)} records")
            
            # Add extraction metadata
            self.metadata['main_sales'] = {
                'file_path': str(sales_file),
                'record_count': len(df),
                'columns': list(df.columns),
                'date_range': self._get_date_range(df),
                'file_size': sales_file.stat().st_size
            }
            
            return df
            
        except Exception as e:
            logger.error(f"Error extracting main sales data: {str(e)}")
            return None
    
    def _extract_related_sales_data(self) -> Dict[str, pd.DataFrame]:
        """Extract related sales data (returns, exchanges, etc.)."""
        related_data = {}
        
        # Define related data types
        related_types = {
            'returns': 'report-371-1755757545-returns.csv',
            'exchanges': 'report-371-1755757545-exchanges.csv',
            'replacements': 'report-371-1755757545-replacements.csv',
            'cancelled': 'report-371-1755757545-cancelled.csv',
            'conversions': 'report-371-1755757545-conversions.csv'
        }
        
        base_path = Path(self.config['path']).parent
        
        for data_type, filename in related_types.items():
            try:
                file_path = base_path / filename
                if file_path.exists():
                    df = pd.read_csv(
                        file_path,
                        encoding=self.config.get('encoding', 'utf-8'),
                        low_memory=False,
                        na_values=['', 'NULL', 'null', 'N/A', 'n/a']
                    )
                    related_data[data_type] = df
                    logger.info(f"Loaded {data_type} data: {len(df)} records")
                    
                    self.metadata[data_type] = {
                        'file_path': str(file_path),
                        'record_count': len(df),
                        'columns': list(df.columns)
                    }
                else:
                    logger.warning(f"Related data file not found: {file_path}")
                    
            except Exception as e:
                logger.error(f"Error extracting {data_type} data: {str(e)}")
        
        return related_data
    
    def _get_date_range(self, df: pd.DataFrame) -> Dict[str, str]:
        """Get date range from sales data."""
        try:
            if 'Sale Date' in df.columns:
                df['Sale Date'] = pd.to_datetime(df['Sale Date'], errors='coerce')
                valid_dates = df['Sale Date'].dropna()
                if len(valid_dates) > 0:
                    return {
                        'start': valid_dates.min().strftime('%Y-%m-%d'),
                        'end': valid_dates.max().strftime('%Y-%m-%d')
                    }
        except Exception as e:
            logger.warning(f"Could not determine date range: {str(e)}")
        
        return {'start': 'Unknown', 'end': 'Unknown'}
    
    def _calculate_summary_stats(self) -> Dict[str, Any]:
        """Calculate summary statistics for sales data."""
        summary = {}
        
        if 'main_sales' in self.sales_data:
            df = self.sales_data['main_sales']
            
            # Basic statistics
            summary['total_records'] = len(df)
            summary['total_columns'] = len(df.columns)
            
            # Revenue statistics
            if 'Total Price' in df.columns:
                df['Total Price'] = pd.to_numeric(df['Total Price'], errors='coerce')
                valid_prices = df['Total Price'].dropna()
                if len(valid_prices) > 0:
                    summary['total_revenue'] = float(valid_prices.sum())
                    summary['average_transaction'] = float(valid_prices.mean())
                    summary['min_transaction'] = float(valid_prices.min())
                    summary['max_transaction'] = float(valid_prices.max())
            
            # Location statistics
            if 'Clinic Name' in df.columns:
                location_counts = df['Clinic Name'].value_counts().to_dict()
                summary['locations'] = location_counts
                summary['unique_locations'] = len(location_counts)
            
            # Staff statistics
            if 'Staff Name' in df.columns:
                staff_counts = df['Staff Name'].value_counts().to_dict()
                summary['staff'] = staff_counts
                summary['unique_staff'] = len(staff_counts)
            
            # Date statistics
            if 'Sale Date' in df.columns:
                df['Sale Date'] = pd.to_datetime(df['Sale Date'], errors='coerce')
                valid_dates = df['Sale Date'].dropna()
                if len(valid_dates) > 0:
                    summary['date_range'] = self._get_date_range(df)
                    summary['unique_years'] = valid_dates.dt.year.nunique()
                    summary['unique_months'] = valid_dates.dt.to_period('M').nunique()
        
        return summary
