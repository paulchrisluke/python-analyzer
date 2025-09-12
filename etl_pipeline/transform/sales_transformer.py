"""
Sales data transformer for ETL pipeline.
"""

import pandas as pd
import re
import hashlib
import hmac
import base64
from typing import Dict, Any, List, Optional
import logging
from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from .base_transformer import BaseTransformer
from ..utils.file_utils import FileUtils

logger = logging.getLogger(__name__)

class SalesTransformer(BaseTransformer):
    """Transformer for sales data normalization."""
    
    def __init__(self, business_rules: Dict[str, Any]):
        """
        Initialize sales transformer.
        
        Args:
            business_rules: Business rules configuration
        """
        super().__init__(business_rules)
        self.normalized_sales = {}
        self.patient_dimension_data = {}
        
    def transform(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transform raw sales data to normalized format.
        
        Args:
            raw_data: Raw extracted sales data
            
        Returns:
            Dict containing normalized sales data
        """
        logger.info("Starting sales data transformation...")
        
        # Reset instance attributes to prevent stale data from previous runs
        self.normalized_sales = {}
        self.patient_dimension_data = {}
        
        if not self.validate_business_rules():
            raise ValueError("Invalid business rules for sales transformer")
        
        # Initialize main_sales_normalized to avoid reference before assignment
        main_sales_normalized = None
        
        # Transform main sales data
        if 'main_sales' in raw_data and raw_data['main_sales'] is not None:
            main_sales_normalized, patient_data = self._transform_main_sales(raw_data['main_sales'])
            if main_sales_normalized is not None:
                self.normalized_sales['main_sales'] = main_sales_normalized
                self.patient_dimension_data = patient_data
        else:
            logger.info("No sales data provided - will set all sales metrics to 0")
        
        # Transform related sales data
        related_data = self._transform_related_sales_data(raw_data)
        self.normalized_sales.update(related_data)
        
        # Calculate business metrics
        business_metrics = self._calculate_business_metrics()
        self.normalized_sales['business_metrics'] = business_metrics
        
        # Add patient dimension data to output
        if self.patient_dimension_data:
            self.normalized_sales['patient_dimension'] = self.patient_dimension_data
        
        input_count = len(raw_data.get('main_sales', [])) if 'main_sales' in raw_data else 0
        output_count = len(main_sales_normalized) if main_sales_normalized is not None else 0
        
        self.log_transformation_summary(input_count, output_count, "Sales Normalization")
        
        return self.normalized_sales
    
    def _transform_main_sales(self, df: pd.DataFrame) -> tuple[Optional[pd.DataFrame], Dict[str, Any]]:
        """Transform main sales data."""
        try:
            if df is None or df.empty:
                logger.warning("No main sales data to transform")
                return None, {}
        except (AttributeError, TypeError) as e:
            logger.exception("Invalid input data type for main sales transformation: %s", type(df).__name__)
            return None, {}
        else:
            try:
                # Create a copy to avoid modifying original
                df_transformed = df.copy()
                
                # Standardize column names
                df_transformed = self._standardize_column_names(df_transformed)
                
                # Extract and hash PII data before cleaning
                patient_data = self._extract_and_hash_pii(df_transformed)
                
                # Clean and normalize data (PII fields will be removed/hashed)
                df_transformed = self._clean_sales_data(df_transformed)
                
                # Add derived fields
                df_transformed = self._add_derived_fields(df_transformed)
                
                # Apply business rules
                df_transformed = self._apply_business_rules(df_transformed)
                
                logger.info("Transformed main sales data: %d records", len(df_transformed))
                logger.info("Extracted patient dimension data: %d unique patients", len(patient_data))
                return df_transformed, patient_data
                
            except (KeyError, ValueError, pd.errors.DataError) as e:
                logger.exception("Data processing error in main sales transformation: %s", str(e))
                return None, {}
            except Exception as e:
                logger.exception("Unexpected error in main sales transformation: %s", str(e))
                return None, {}
    
    def _standardize_column_names(self, df: pd.DataFrame) -> pd.DataFrame:
        """Standardize column names."""
        column_mapping = {
            'Sale Date': 'sale_date',
            'Delivery Date': 'delivery_date',
            'Return Date': 'return_date',
            'Staff Name': 'staff_name',
            'Patient Name': 'patient_name',
            'Patient ID': 'patient_id',
            'Patient ZIP': 'patient_zip',
            'Clinic Name': 'clinic_name',
            'Referral Source': 'referral_source',
            'Subcategory': 'subcategory',
            'Ref Description': 'ref_description',
            'Campaign': 'campaign',
            'Units': 'units',
            'Type': 'type',
            'Product': 'product',
            'Description': 'description',
            'S/N': 'serial_number',
            'Notes': 'notes',
            'Invoice No.': 'invoice_no',
            'CPT Code': 'cpt_code',
            'Gross Price': 'gross_price',
            'Discount': 'discount',
            'Discount Type 1': 'discount_type_1',
            'Discount Amount 1': 'discount_amount_1',
            'Discount Type 2': 'discount_type_2',
            'Discount Amount 2': 'discount_amount_2',
            'Discount Type 3': 'discount_type_3',
            'Discount Amount 3': 'discount_amount_3',
            'Net Price': 'net_price',
            'Sales Tax': 'sales_tax',
            'Total Price': 'total_price',
            'Receipt Paid': 'receipt_paid'
        }
        
        # Rename columns
        df = df.rename(columns=column_mapping)
        
        # Convert column names to lowercase
        df.columns = df.columns.str.lower()
        
        return df
    
    def _extract_and_hash_pii(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Extract PII data and create hashed identifiers for analytics."""
        patient_data = {}
        
        if 'patient_id' in df.columns:
            # Create hashed patient IDs for analytics
            df['patient_id_hash'] = df['patient_id'].apply(
                lambda x: self._hash_patient_id(str(x)) if pd.notna(x) else None
            )
            
            # Get privacy allowlist from business rules
            allowed_fields = self.business_rules.get('privacy', {}).get('patient_dimension_fields', [])
            
            # Extract unique patient data for dimension table
            # Always include patient_id for hashing, but only include other PII if explicitly allowed
            required_columns = ['patient_id']
            optional_pii_columns = ['patient_name', 'patient_zip']
            
            # Build list of columns to extract based on availability and privacy rules
            columns_to_extract = []
            for col in required_columns:
                if col in df.columns:
                    columns_to_extract.append(col)
            
            for col in optional_pii_columns:
                if col in df.columns and col in allowed_fields:
                    columns_to_extract.append(col)
            
            if columns_to_extract:
                unique_patients = df[columns_to_extract].drop_duplicates()
            else:
                logger.warning("No PII columns found in dataframe, skipping patient dimension data extraction")
                return patient_data
            
            for _, row in unique_patients.iterrows():
                if pd.notna(row.get('patient_id')):
                    patient_id_hash = self._hash_patient_id(str(row['patient_id']))
                    
                    # Start with required fields
                    patient_record = {
                        'patient_id_hash': patient_id_hash,
                        'created_date': FileUtils.get_js_compatible_timestamp(),
                        'last_updated': FileUtils.get_js_compatible_timestamp()
                    }
                    
                    # Add allowed PII fields only if explicitly permitted
                    if 'patient_name' in allowed_fields and 'patient_name' in row:
                        patient_record['patient_name'] = row.get('patient_name') if pd.notna(row.get('patient_name')) else None
                    
                    if 'patient_zip' in allowed_fields and 'patient_zip' in row:
                        patient_record['patient_zip'] = row.get('patient_zip') if pd.notna(row.get('patient_zip')) else None
                    
                    patient_data[patient_id_hash] = patient_record
        
        return patient_data
    
    def _hash_patient_id(self, patient_id: str) -> str:
        """Create a consistent hash for patient ID."""
        # Use SHA-256 with a salt for consistent hashing
        salt = "cranberry_hearing_salt_2024"  # In production, use environment variable
        combined = f"{patient_id}_{salt}"
        return hashlib.sha256(combined.encode()).hexdigest()[:16]  # Use first 16 chars
    
    def _convert_date_column_with_error_handling(self, df: pd.DataFrame, column_name: str) -> pd.Series:
        """
        Convert date column with detailed error handling and logging.
        
        Args:
            df: DataFrame containing the column
            column_name: Name of the date column to convert
            
        Returns:
            Series with converted dates (invalid dates become NaT)
        """
        try:
            # Store original values for error reporting
            original_values = df[column_name].copy()
            
            # Convert to datetime with coerce to handle invalid dates
            converted_dates = pd.to_datetime(df[column_name], errors='coerce')
            
            # Identify invalid dates (NaT values that weren't originally null)
            original_not_null = original_values.notna()
            converted_is_nat = converted_dates.isna()
            invalid_dates_mask = original_not_null & converted_is_nat
            
            # Log warnings for invalid dates
            if invalid_dates_mask.any():
                invalid_count = invalid_dates_mask.sum()
                invalid_values = original_values[invalid_dates_mask].unique()
                
                logger.warning(
                    f"Date conversion failed for {invalid_count} records in column '{column_name}'. "
                    f"Invalid date formats found: {list(invalid_values)[:10]}"  # Show first 10 examples
                )
                
                # Log specific examples for debugging
                if len(invalid_values) <= 5:
                    logger.warning(f"All invalid date values in '{column_name}': {list(invalid_values)}")
                else:
                    logger.warning(f"Sample invalid date values in '{column_name}': {list(invalid_values)[:5]}")
                
                # Log row indices for the first few invalid dates for debugging
                invalid_indices = df[invalid_dates_mask].index.tolist()[:5]
                if invalid_indices:
                    logger.warning(f"Row indices with invalid dates in '{column_name}': {invalid_indices}")
            
            # Log summary statistics
            total_records = len(df)
            valid_dates = converted_dates.notna().sum()
            invalid_dates = invalid_dates_mask.sum()
            originally_null = original_values.isna().sum()
            
            logger.info(
                f"Date conversion summary for '{column_name}': "
                f"{valid_dates} valid dates, {invalid_dates} invalid formats, "
                f"{originally_null} originally null values (total: {total_records})"
            )
            
            return converted_dates
            
        except (KeyError, AttributeError) as e:
            logger.exception("Column access error converting date column '%s': %s", column_name, str(e))
            # Fallback to basic conversion
            return pd.to_datetime(df[column_name], errors='coerce')
        except Exception as e:
            logger.exception("Unexpected error converting date column '%s': %s", column_name, str(e))
            # Fallback to basic conversion
            return pd.to_datetime(df[column_name], errors='coerce')
    
    def _clean_sales_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean and normalize sales data."""
        # Convert date columns with error handling
        date_columns = ['sale_date', 'delivery_date', 'return_date']
        for col in date_columns:
            if col in df.columns:
                df[col] = self._convert_date_column_with_error_handling(df, col)
        
        # Convert numeric columns
        numeric_columns = ['units', 'gross_price', 'discount', 'discount_amount_1', 
                          'discount_amount_2', 'discount_amount_3', 'net_price', 
                          'sales_tax', 'total_price']
        
        for col in numeric_columns:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')
        
        # Clean text columns
        text_columns = ['staff_name', 'patient_name', 'clinic_name', 'referral_source', 
                       'product', 'description', 'type']
        
        for col in text_columns:
            if col in df.columns:
                # Capture which rows were originally missing before any string casts
                na_mask = df[col].isna()
                
                # Fill NaN with empty string and strip whitespace
                df[col] = df[col].fillna('').astype(str).str.strip()
                
                # Remove literal 'nan' strings
                df[col] = df[col].replace('nan', '')
                
                # Only assign None back for rows where na_mask is True (original NaN values)
                # This preserves genuine empty strings while converting original NaN values to None
                df.loc[na_mask, col] = None
        
        # Clean boolean columns
        if 'receipt_paid' in df.columns:
            # Capture original nulls before any operations
            original_nulls = df['receipt_paid'].isnull()
            
            # Perform string coercion, strip, and lowercase
            df['receipt_paid'] = df['receipt_paid'].astype(str).str.strip().str.lower()
            
            # Create boolean mask for valid values
            boolean_mask = df['receipt_paid'].isin(['yes', 'true', '1', 'y'])
            
            # Apply boolean mask and restore original nulls
            df['receipt_paid'] = boolean_mask
            df.loc[original_nulls, 'receipt_paid'] = None
        
        # Remove original PII fields after hashing (PII protection)
        pii_fields_to_remove = ['patient_name', 'patient_id', 'patient_zip']
        for field in pii_fields_to_remove:
            if field in df.columns:
                df = df.drop(columns=[field])
                logger.info(f"Removed PII field '{field}' from sales data for privacy protection")
        
        return df
    
    def _add_derived_fields(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add derived fields to sales data."""
        # Add year, month, quarter
        if 'sale_date' in df.columns:
            df['year'] = df['sale_date'].dt.year
            df['month'] = df['sale_date'].dt.month
            df['quarter'] = df['sale_date'].dt.quarter
        
        # Add transaction type category
        if 'type' in df.columns:
            df['transaction_type'] = df['type'].apply(self._categorize_transaction_type)
        
        # Add product category
        if 'product' in df.columns:
            df['product_category'] = df['product'].apply(self._categorize_product)
        
        # Calculate total discounts
        discount_columns = ['discount_amount_1', 'discount_amount_2', 'discount_amount_3']
        df['total_discounts'] = 0
        for col in discount_columns:
            if col in df.columns:
                df['total_discounts'] += df[col].fillna(0)
        
        # Add transaction ID
        df['transaction_id'] = df.index.astype(str)
        
        return df
    
    def _categorize_transaction_type(self, transaction_type: str) -> str:
        """Categorize transaction type."""
        if pd.isna(transaction_type):
            return 'Unknown'
        
        transaction_type = str(transaction_type).lower()
        
        if 'fee' in transaction_type:
            return 'Service'
        elif 'hearing' in transaction_type or 'aid' in transaction_type:
            return 'Hearing Aid'
        elif 'accessory' in transaction_type or 'battery' in transaction_type:
            return 'Accessory'
        elif 'repair' in transaction_type or 'warranty' in transaction_type:
            return 'Repair'
        else:
            return 'Other'
    
    def _categorize_product(self, product: str) -> str:
        """Categorize product type."""
        if pd.isna(product):
            return 'Unknown'
        
        product = str(product).lower()
        
        if 'hearing' in product or 'aid' in product:
            return 'Hearing Aid'
        elif 'battery' in product:
            return 'Battery'
        elif 'mold' in product or 'ear' in product:
            return 'Ear Mold'
        elif 'accessory' in product:
            return 'Accessory'
        elif 'service' in product or 'consultation' in product:
            return 'Service'
        else:
            return 'Other'
    
    def _apply_business_rules(self, df: pd.DataFrame) -> pd.DataFrame:
        """Apply business rules to sales data."""
        # Normalize clinic names
        if 'clinic_name' in df.columns:
            df['clinic_name'] = df['clinic_name'].apply(self._normalize_clinic_name)
        
        # Filter to only include locations that are for sale
        df = self._filter_sale_locations(df)
        
        # Apply data quality rules
        min_amount = self.business_rules.get('data_quality', {}).get('min_transaction_amount', 0.01)
        max_amount = self.business_rules.get('data_quality', {}).get('max_transaction_amount', 50000.00)
        
        if 'total_price' in df.columns:
            # Filter out transactions outside normal range
            original_count = len(df)
            df = df[(df['total_price'] >= min_amount) & (df['total_price'] <= max_amount)]
            filtered_count = len(df)
            
            if original_count != filtered_count:
                logger.warning(f"Filtered out {original_count - filtered_count} transactions outside normal price range")
        
        return df
    
    def _filter_sale_locations(self, df: pd.DataFrame) -> pd.DataFrame:
        """Filter data to only include locations that are for sale."""
        if 'clinic_name' not in df.columns:
            return df
        
        # Get locations that are for sale
        sale_locations = []
        for location_key, location_data in self.business_rules.get('locations', {}).items():
            if location_data.get('for_sale', False):
                sale_locations.extend(location_data.get('names', []))
        
        if sale_locations:
            # Create a mask for locations that are for sale
            # Use regex-escaped join to handle names with regex metacharacters
            pattern = '|'.join(re.escape(name) for name in sale_locations)
            # Remove .str.lower() and use flags=re.IGNORECASE for case-insensitive matching
            location_mask = df['clinic_name'].str.contains(pattern, na=False, regex=True, flags=re.IGNORECASE)
            df_filtered = df[location_mask]
            
            logger.info(f"Filtered to sale locations only: {len(df_filtered)} records (from {len(df)} total)")
            logger.info(f"Sale locations: {sale_locations}")
            
            return df_filtered
        
        return df
    
    def _normalize_clinic_name(self, clinic_name: str) -> str:
        """Normalize clinic names according to business rules."""
        if pd.isna(clinic_name):
            return 'Unknown'
        
        clinic_name = str(clinic_name).strip()
        
        # Map to standardized names
        location_mapping = self.business_rules.get('locations', {})
        
        for location_key, location_data in location_mapping.items():
            location_names = location_data.get('names', [])
            for name in location_names:
                if name.lower() in clinic_name.lower():
                    return location_key.title()
        
        return clinic_name
    
    def _transform_related_sales_data(self, raw_data: Dict[str, Any]) -> Dict[str, pd.DataFrame]:
        """Transform related sales data."""
        related_data = {}
        
        related_types = ['returns', 'exchanges', 'replacements', 'cancelled', 'conversions']
        
        for data_type in related_types:
            if data_type in raw_data:
                try:
                    df = raw_data[data_type]
                    if df is not None and not df.empty:
                        # Apply same transformations as main sales
                        df_transformed = self._standardize_column_names(df)
                        df_transformed = self._clean_sales_data(df_transformed)
                        df_transformed = self._add_derived_fields(df_transformed)
                        df_transformed = self._apply_business_rules(df_transformed)
                        
                        related_data[data_type] = df_transformed
                        logger.info(f"Transformed {data_type} data: {len(df_transformed)} records")
                except (KeyError, ValueError, pd.errors.DataError) as e:
                    logger.exception("Data processing error transforming %s data: %s", data_type, str(e))
                except Exception as e:
                    logger.exception("Unexpected error transforming %s data: %s", data_type, str(e))
        
        return related_data
    
    def _calculate_business_metrics(self) -> Dict[str, Any]:
        """Calculate business metrics from normalized data."""
        metrics = {}
        
        if 'main_sales' in self.normalized_sales:
            df = self.normalized_sales['main_sales']
            
            # Check if we have actual transaction data (not financial statement data)
            if df is not None and not df.empty and 'total_price' in df.columns:
                # Basic metrics from actual transaction data
                metrics['total_revenue'] = Decimal(str(df['total_price'].sum())).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
                metrics['total_transactions'] = len(df)
                metrics['average_transaction'] = Decimal(str(df['total_price'].mean())).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
            else:
                # No actual transaction data available
                logger.warning("No actual sales transaction data available - setting metrics to 0")
                metrics['total_revenue'] = Decimal('0.00')
                metrics['total_transactions'] = 0
                metrics['average_transaction'] = Decimal('0.00')
        else:
            # No sales data at all
            logger.warning("No sales data available - setting metrics to 0")
            metrics['total_revenue'] = Decimal('0.00')
            metrics['total_transactions'] = 0
            metrics['average_transaction'] = Decimal('0.00')
            
        # Set empty structures for all metrics when no data is available
        if metrics['total_transactions'] == 0:
            # No transaction data - set all metrics to empty structures
            metrics['data_quality'] = {}
            metrics['revenue_by_location'] = {
                'revenue': {},
                'transactions': {},
                'average': {}
            }
            metrics['revenue_by_staff'] = {
                'revenue': {},
                'transactions': {},
                'average': {}
            }
            metrics['revenue_by_year'] = {}
            metrics['growth_rates'] = {}
            metrics['revenue_by_product_category'] = {}
        else:
            # We have transaction data - calculate detailed metrics
            df = self.normalized_sales['main_sales']
            
            # Data quality metrics for date columns
            metrics['data_quality'] = self._calculate_date_quality_metrics(df)
            
            # Location metrics
            if 'clinic_name' in df.columns:
                location_revenue = df.groupby('clinic_name')['total_price'].agg(['sum', 'count', 'mean'])
                metrics['revenue_by_location'] = {
                    'revenue': {k: Decimal(str(v)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP) for k, v in location_revenue['sum'].items()},
                    'transactions': location_revenue['count'].to_dict(),
                    'average': {k: Decimal(str(v)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP) for k, v in location_revenue['mean'].items()}
                }
            else:
                logger.warning("'clinic_name' column not found in dataframe, setting revenue_by_location to empty structure")
                metrics['revenue_by_location'] = {
                    'revenue': {},
                    'transactions': {},
                    'average': {}
                }
            
            # Staff metrics
            if 'staff_name' in df.columns:
                staff_revenue = df.groupby('staff_name')['total_price'].agg(['sum', 'count', 'mean']).to_dict()
                metrics['revenue_by_staff'] = {
                    'revenue': staff_revenue['sum'],
                    'transactions': staff_revenue['count'],
                    'average': staff_revenue['mean']
                }
            else:
                logger.warning("'staff_name' column not found in dataframe, setting revenue_by_staff to empty structure")
                metrics['revenue_by_staff'] = {
                    'revenue': {},
                    'transactions': {},
                    'average': {}
                }
            
            # Time-based metrics
            if 'year' in df.columns:
                yearly_revenue = df.groupby('year')['total_price'].sum().to_dict()
                metrics['revenue_by_year'] = yearly_revenue
                
                # Calculate growth rates
                years = sorted(yearly_revenue.keys())
                growth_rates = {}
                for i in range(1, len(years)):
                    current_year = years[i]
                    previous_year = years[i-1]
                    current_revenue = yearly_revenue[current_year]
                    previous_revenue = yearly_revenue[previous_year]
                    
                    if previous_revenue > 0:
                        growth_rate = ((current_revenue - previous_revenue) / previous_revenue) * 100
                        growth_rates[f"{previous_year}_to_{current_year}"] = growth_rate
                
                metrics['growth_rates'] = growth_rates
            
            # Product metrics
            if 'product_category' in df.columns:
                product_revenue = df.groupby('product_category')['total_price'].sum().to_dict()
                metrics['revenue_by_product_category'] = product_revenue
        
        return metrics
    
    def _calculate_date_quality_metrics(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Calculate data quality metrics for date columns.
        
        Args:
            df: DataFrame to analyze
            
        Returns:
            Dict containing date quality metrics
        """
        date_quality = {}
        date_columns = ['sale_date', 'delivery_date', 'return_date']
        
        for col in date_columns:
            if col in df.columns:
                total_records = len(df)
                null_count = df[col].isna().sum()
                valid_count = total_records - null_count
                
                # Calculate quality percentage
                quality_percentage = (valid_count / total_records * 100) if total_records > 0 else 0
                
                date_quality[col] = {
                    'total_records': total_records,
                    'valid_dates': valid_count,
                    'null_dates': null_count,
                    'quality_percentage': round(quality_percentage, 2)
                }
                
                # Add warning if quality is below threshold
                if quality_percentage < 95:  # Less than 95% valid dates
                    logger.warning(
                        f"Date quality issue in '{col}': {quality_percentage:.1f}% valid dates "
                        f"({valid_count}/{total_records} records)"
                    )
        
        # Overall date quality summary
        if date_quality:
            all_valid = sum(metrics['valid_dates'] for metrics in date_quality.values())
            all_total = sum(metrics['total_records'] for metrics in date_quality.values())
            overall_quality = (all_valid / all_total * 100) if all_total > 0 else 0
            
            date_quality['overall'] = {
                'total_date_fields': all_total,
                'valid_date_fields': all_valid,
                'overall_quality_percentage': round(overall_quality, 2)
            }
        
        return date_quality
