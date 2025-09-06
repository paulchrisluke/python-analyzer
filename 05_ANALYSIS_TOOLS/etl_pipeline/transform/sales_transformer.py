"""
Sales data transformer for ETL pipeline.
"""

import pandas as pd
from typing import Dict, Any, List, Optional
import logging
from datetime import datetime
from .base_transformer import BaseTransformer

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
        
    def transform(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transform raw sales data to normalized format.
        
        Args:
            raw_data: Raw extracted sales data
            
        Returns:
            Dict containing normalized sales data
        """
        logger.info("Starting sales data transformation...")
        
        if not self.validate_business_rules():
            raise ValueError("Invalid business rules for sales transformer")
        
        # Transform main sales data
        if 'main_sales' in raw_data:
            main_sales_normalized = self._transform_main_sales(raw_data['main_sales'])
            if main_sales_normalized is not None:
                self.normalized_sales['main_sales'] = main_sales_normalized
        
        # Transform related sales data
        related_data = self._transform_related_sales_data(raw_data)
        self.normalized_sales.update(related_data)
        
        # Calculate business metrics
        business_metrics = self._calculate_business_metrics()
        self.normalized_sales['business_metrics'] = business_metrics
        
        input_count = len(raw_data.get('main_sales', [])) if 'main_sales' in raw_data else 0
        output_count = len(main_sales_normalized) if main_sales_normalized is not None else 0
        
        self.log_transformation_summary(input_count, output_count, "Sales Normalization")
        
        return self.normalized_sales
    
    def _transform_main_sales(self, df: pd.DataFrame) -> Optional[pd.DataFrame]:
        """Transform main sales data."""
        try:
            if df is None or df.empty:
                logger.warning("No main sales data to transform")
                return None
            
            # Create a copy to avoid modifying original
            df_transformed = df.copy()
            
            # Standardize column names
            df_transformed = self._standardize_column_names(df_transformed)
            
            # Clean and normalize data
            df_transformed = self._clean_sales_data(df_transformed)
            
            # Add derived fields
            df_transformed = self._add_derived_fields(df_transformed)
            
            # Apply business rules
            df_transformed = self._apply_business_rules(df_transformed)
            
            logger.info(f"Transformed main sales data: {len(df_transformed)} records")
            return df_transformed
            
        except Exception as e:
            logger.error(f"Error transforming main sales data: {str(e)}")
            return None
    
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
    
    def _clean_sales_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean and normalize sales data."""
        # Convert date columns
        date_columns = ['sale_date', 'delivery_date', 'return_date']
        for col in date_columns:
            if col in df.columns:
                df[col] = pd.to_datetime(df[col], errors='coerce')
        
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
                # Handle NaN values before string operations
                df[col] = df[col].fillna('').astype(str).str.strip()
                df[col] = df[col].replace('nan', '')
                df[col] = df[col].replace('', None)
        
        # Clean boolean columns
        if 'receipt_paid' in df.columns:
            df['receipt_paid'] = df['receipt_paid'].str.lower().isin(['yes', 'true', '1', 'y'])
        
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
            location_mask = df['clinic_name'].str.lower().str.contains('|'.join([name.lower() for name in sale_locations]), na=False)
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
                except Exception as e:
                    logger.error(f"Error transforming {data_type} data: {str(e)}")
        
        return related_data
    
    def _calculate_business_metrics(self) -> Dict[str, Any]:
        """Calculate business metrics from normalized data."""
        metrics = {}
        
        if 'main_sales' in self.normalized_sales:
            df = self.normalized_sales['main_sales']
            
            # Basic metrics
            metrics['total_revenue'] = float(df['total_price'].sum())
            metrics['total_transactions'] = len(df)
            metrics['average_transaction'] = float(df['total_price'].mean())
            
            # Location metrics
            location_revenue = df.groupby('clinic_name')['total_price'].agg(['sum', 'count', 'mean']).to_dict()
            metrics['revenue_by_location'] = {
                'revenue': location_revenue['sum'],
                'transactions': location_revenue['count'],
                'average': location_revenue['mean']
            }
            
            # Staff metrics
            staff_revenue = df.groupby('staff_name')['total_price'].agg(['sum', 'count', 'mean']).to_dict()
            metrics['revenue_by_staff'] = {
                'revenue': staff_revenue['sum'],
                'transactions': staff_revenue['count'],
                'average': staff_revenue['mean']
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
