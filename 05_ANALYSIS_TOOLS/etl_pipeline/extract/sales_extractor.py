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
            # Check if path is a directory (use pattern) or file (direct path)
            path = Path(self.config['path'])
            
            if path.is_dir():
                # Use pattern to find the most recent sales file
                pattern = self.config.get('sales_pattern', '*sales*.csv')
                matching_files = list(path.glob(pattern))
                
                if not matching_files:
                    logger.error(f"No sales files found matching pattern '{pattern}' in {path}")
                    return None
                
                # Get the most recent file
                sales_file = max(matching_files, key=lambda f: f.stat().st_mtime)
                logger.info(f"Using most recent sales file: {sales_file.name}")
            else:
                # Direct file path
                sales_file = path
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
        
        # Define related data types with configurable patterns
        related_types = {
            'returns': self.config.get('returns_pattern', '*returns*.csv'),
            'exchanges': self.config.get('exchanges_pattern', '*exchanges*.csv'),
            'replacements': self.config.get('replacements_pattern', '*replacements*.csv'),
            'cancelled': self.config.get('cancelled_pattern', '*cancelled*.csv'),
            'conversions': self.config.get('conversions_pattern', '*conversions*.csv')
        }
        
        # Detect whether config path is a directory or file
        config_path = Path(self.config['path'])
        if config_path.is_dir():
            base_path = config_path
        else:
            base_path = config_path.parent
        
        for data_type, pattern in related_types.items():
            try:
                # Find files matching the pattern
                matching_files = list(base_path.glob(pattern))
                
                if matching_files:
                    # Get the most recent file
                    latest_file = max(matching_files, key=lambda f: f.stat().st_mtime)
                    
                    df = pd.read_csv(
                        latest_file,
                        encoding=self.config.get('encoding', 'utf-8'),
                        low_memory=False,
                        na_values=['', 'NULL', 'null', 'N/A', 'n/a']
                    )
                    related_data[data_type] = df
                    logger.info(f"Loaded {data_type} data: {len(df)} records from {latest_file.name}")
                    
                    self.metadata[data_type] = {
                        'file_path': str(latest_file),
                        'record_count': len(df),
                        'columns': list(df.columns),
                        'pattern_used': pattern,
                        'files_found': len(matching_files)
                    }
                else:
                    logger.warning(f"No files found matching pattern '{pattern}' for {data_type} data")
                    
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
