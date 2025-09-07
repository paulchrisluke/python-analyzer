"""
Data validation utilities for ETL pipeline.
"""

import pandas as pd
from typing import Dict, List, Any, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class DataValidator:
    """Data validation class for ETL pipeline."""
    
    def __init__(self, business_rules: Dict[str, Any]):
        self.business_rules = business_rules
        self.validation_errors = []
        self.validation_warnings = []
    
    def validate_sales_data(self, df: pd.DataFrame) -> bool:
        """
        Validate sales data against business rules.
        
        Args:
            df: Sales DataFrame
            
        Returns:
            bool: True if validation passes
        """
        logger.info("Starting sales data validation...")
        
        # Baseline current error/warning counts to avoid state leakage
        initial_error_count = len(self.validation_errors)
        initial_warning_count = len(self.validation_warnings)
        
        # Check required fields
        required_fields = self.business_rules.get('data_quality', {}).get('required_fields', [])
        missing_fields = [field for field in required_fields if field not in df.columns]
        
        if missing_fields:
            error_msg = f"Missing required fields: {missing_fields}"
            self.validation_errors.append(error_msg)
            logger.error(error_msg)
        
        # Validate transaction amounts
        if 'total_price' in df.columns:
            min_amount = self.business_rules.get('data_quality', {}).get('min_transaction_amount', 0.01)
            max_amount = self.business_rules.get('data_quality', {}).get('max_transaction_amount', 50000.00)
            
            # Coerce to numeric, treating non-numeric values as NaN
            numeric_prices = pd.to_numeric(df['total_price'], errors='coerce')
            nan_count = numeric_prices.isna().sum()
            
            # Check for invalid amounts (NaN, too low, or too high)
            invalid_mask = numeric_prices.isna() | (numeric_prices < min_amount) | (numeric_prices > max_amount)
            invalid_amounts = df[invalid_mask]
            
            if len(invalid_amounts) > 0:
                warning_msg = f"Found {len(invalid_amounts)} transactions with invalid amounts (including {nan_count} non-numeric values)"
                self.validation_warnings.append(warning_msg)
                logger.warning(warning_msg)
        
        # Validate dates
        if 'sale_date' in df.columns:
            try:
                # Parse dates without mutating original DataFrame
                parsed_dates = pd.to_datetime(df['sale_date'], errors='coerce')
                unparseable_count = parsed_dates.isna().sum()
                
                if unparseable_count > 0:
                    warning_msg = f"Found {unparseable_count} unparseable date values"
                    self.validation_warnings.append(warning_msg)
                    logger.warning(warning_msg)
                
                # Check date range using date_range or data_range from business rules (root level)
                # Prefer 'date_range' then fallback to 'data_range' for backward compatibility
                date_range = self.business_rules.get('date_range', self.business_rules.get('data_range', {}))
                
                if 'start' in date_range:
                    start_date = pd.to_datetime(date_range['start'])
                    invalid_dates = parsed_dates[parsed_dates < start_date]
                    if len(invalid_dates) > 0:
                        warning_msg = f"Found {len(invalid_dates)} transactions before start date"
                        self.validation_warnings.append(warning_msg)
                        logger.warning(warning_msg)
                
                if 'end' in date_range:
                    end_date = pd.to_datetime(date_range['end'])
                    invalid_dates = parsed_dates[parsed_dates > end_date]
                    if len(invalid_dates) > 0:
                        warning_msg = f"Found {len(invalid_dates)} transactions after end date"
                        self.validation_warnings.append(warning_msg)
                        logger.warning(warning_msg)
                        
            except Exception as e:
                error_msg = f"Date validation failed: {str(e)}"
                self.validation_errors.append(error_msg)
                logger.exception(error_msg)
        
        # Check for duplicate transactions
        if 'invoice_no' in df.columns:
            duplicates = df[df['invoice_no'].duplicated(keep=False)]
            if len(duplicates) > 0:
                warning_msg = f"Found {len(duplicates)} duplicate invoice numbers"
                self.validation_warnings.append(warning_msg)
                logger.warning(warning_msg)
        
        # Validate clinic names
        if 'clinic_name' in df.columns:
            valid_clinics = []
            for location in self.business_rules.get('locations', {}).values():
                valid_clinics.extend(location.get('names', []))
            
            invalid_clinics = df[~df['clinic_name'].isin(valid_clinics)]
            if len(invalid_clinics) > 0:
                warning_msg = f"Found {len(invalid_clinics)} transactions with unrecognized clinic names"
                self.validation_warnings.append(warning_msg)
                logger.warning(warning_msg)
        
        # Check if new errors were added during this validation call
        new_errors = len(self.validation_errors) - initial_error_count
        validation_passed = new_errors == 0
        
        if validation_passed:
            logger.info("Sales data validation passed")
        else:
            logger.error(f"Sales data validation failed with {new_errors} new errors")
        
        return validation_passed
    
    def validate_financial_data(self, df: pd.DataFrame) -> bool:
        """
        Validate financial data.
        
        Args:
            df: Financial DataFrame
            
        Returns:
            bool: True if validation passes
        """
        logger.info("Starting financial data validation...")
        
        # Baseline current error/warning counts to avoid state leakage
        initial_error_count = len(self.validation_errors)
        initial_warning_count = len(self.validation_warnings)
        
        # Check for required fields
        required_fields = ['account_name', 'amount', 'date']
        missing_fields = [field for field in required_fields if field not in df.columns]
        
        if missing_fields:
            error_msg = f"Missing required financial fields: {missing_fields}"
            self.validation_errors.append(error_msg)
            logger.error(error_msg)
        
        # Validate amounts
        if 'amount' in df.columns:
            if df['amount'].isna().any():
                warning_msg = "Found null amounts in financial data"
                self.validation_warnings.append(warning_msg)
                logger.warning(warning_msg)
        
        # Check if new errors were added during this validation call
        new_errors = len(self.validation_errors) - initial_error_count
        validation_passed = new_errors == 0
        
        if validation_passed:
            logger.info("Financial data validation passed")
        else:
            logger.error(f"Financial data validation failed with {new_errors} new errors")
        
        return validation_passed
    
    def get_validation_summary(self) -> Dict[str, Any]:
        """Get validation summary."""
        return {
            'errors': self.validation_errors,
            'warnings': self.validation_warnings,
            'error_count': len(self.validation_errors),
            'warning_count': len(self.validation_warnings),
            'validation_passed': len(self.validation_errors) == 0
        }
