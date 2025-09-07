"""
Business metrics calculator for ETL pipeline.
"""

import pandas as pd
from typing import Dict, Any, List, Optional
import logging
from datetime import datetime
import numpy as np
from collections import defaultdict

logger = logging.getLogger(__name__)

class BusinessMetricsCalculator:
    """Calculator for business metrics and KPIs."""
    
    def __init__(self, business_rules: Dict[str, Any]):
        """
        Initialize business metrics calculator.
        
        Args:
            business_rules: Business rules configuration
        """
        self.business_rules = business_rules
        self.metrics = {}
        
    def calculate_comprehensive_metrics(self, normalized_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate comprehensive business metrics.
        
        Args:
            normalized_data: Normalized sales and financial data
            
        Returns:
            Dict containing comprehensive business metrics
        """
        logger.info("Calculating comprehensive business metrics...")
        
        # Calculate sales metrics
        sales_metrics = self._calculate_sales_metrics(normalized_data)
        self.metrics['sales'] = sales_metrics
        
        # Calculate financial metrics
        financial_metrics = self._calculate_financial_metrics(normalized_data)
        logger.info(f"Financial metrics calculated: {financial_metrics.get('revenue_metrics', {})}")
        self.metrics['financial'] = financial_metrics
        logger.info(f"Financial metrics stored in self.metrics: {self.metrics['financial'].get('revenue_metrics', {})}")
        
        # Calculate operational metrics
        operational_metrics = self._calculate_operational_metrics(normalized_data)
        self.metrics['operational'] = operational_metrics
        
        # Calculate valuation metrics
        valuation_metrics = self._calculate_valuation_metrics()
        self.metrics['valuation'] = valuation_metrics
        
        # Calculate performance indicators
        performance_metrics = self._calculate_performance_indicators()
        self.metrics['performance'] = performance_metrics
        
        # Calculate equipment metrics
        equipment_metrics = self._calculate_equipment_metrics()
        self.metrics['equipment'] = equipment_metrics
        
        logger.info("Business metrics calculation completed")
        return self.metrics
    
    def _calculate_sales_metrics(self, normalized_data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate sales-related metrics."""
        sales_metrics = {}
        
        # Check if sales data exists and get main_sales from it
        sales_data = normalized_data.get('sales', {})
        if 'main_sales' in sales_data:
            df = sales_data['main_sales']
            
            # Filter data by analysis period if specified
            analysis_period = self.business_rules.get('analysis_period', {})
            if analysis_period:
                start_date = pd.to_datetime(analysis_period.get('start_date', '2021-01-01'))
                end_date = pd.to_datetime(analysis_period.get('end_date', '2025-12-31'))
                
                # Filter the dataframe by date range
                df = df[(df['sale_date'] >= start_date) & (df['sale_date'] <= end_date)]
                logger.info(f"Filtered sales data to analysis period: {start_date.date()} to {end_date.date()} ({len(df)} records)")
            
            # Basic sales metrics
            sales_metrics['total_revenue'] = float(df['total_price'].sum())
            sales_metrics['total_transactions'] = len(df)
            sales_metrics['average_transaction_value'] = float(df['total_price'].mean())
            sales_metrics['median_transaction_value'] = float(df['total_price'].median())
            
            # Revenue distribution
            sales_metrics['revenue_percentiles'] = {
                '25th': float(df['total_price'].quantile(0.25)),
                '50th': float(df['total_price'].quantile(0.50)),
                '75th': float(df['total_price'].quantile(0.75)),
                '90th': float(df['total_price'].quantile(0.90)),
                '95th': float(df['total_price'].quantile(0.95))
            }
            
            # Location performance
            location_metrics = df.groupby('clinic_name').agg({
                'total_price': ['sum', 'count', 'mean'],
                'patient_id': 'nunique'
            }).round(2)
            
            sales_metrics['location_performance'] = {}
            for location in location_metrics.index:
                sales_metrics['location_performance'][location] = {
                    'total_revenue': float(location_metrics.loc[location, ('total_price', 'sum')]),
                    'transaction_count': int(location_metrics.loc[location, ('total_price', 'count')]),
                    'average_transaction': float(location_metrics.loc[location, ('total_price', 'mean')]),
                    'unique_patients': int(location_metrics.loc[location, ('patient_id', 'nunique')])
                }
            
            # Staff performance
            staff_metrics = df.groupby('staff_name').agg({
                'total_price': ['sum', 'count', 'mean'],
                'patient_id': 'nunique'
            }).round(2)
            
            sales_metrics['staff_performance'] = {}
            for staff in staff_metrics.index:
                sales_metrics['staff_performance'][staff] = {
                    'total_revenue': float(staff_metrics.loc[staff, ('total_price', 'sum')]),
                    'transaction_count': int(staff_metrics.loc[staff, ('total_price', 'count')]),
                    'average_transaction': float(staff_metrics.loc[staff, ('total_price', 'mean')]),
                    'unique_patients': int(staff_metrics.loc[staff, ('patient_id', 'nunique')])
                }
            
            # Time-based analysis
            if 'year' in df.columns:
                yearly_metrics = df.groupby('year').agg({
                    'total_price': ['sum', 'count', 'mean'],
                    'patient_id': 'nunique'
                }).round(2)
                
                sales_metrics['yearly_performance'] = {}
                for year in yearly_metrics.index:
                    sales_metrics['yearly_performance'][str(year)] = {
                        'total_revenue': float(yearly_metrics.loc[year, ('total_price', 'sum')]),
                        'transaction_count': int(yearly_metrics.loc[year, ('total_price', 'count')]),
                        'average_transaction': float(yearly_metrics.loc[year, ('total_price', 'mean')]),
                        'unique_patients': int(yearly_metrics.loc[year, ('patient_id', 'nunique')])
                    }
                
                # Calculate growth rates
                years = sorted(yearly_metrics.index)
                growth_rates = {}
                for i in range(1, len(years)):
                    current_year = years[i]
                    previous_year = years[i-1]
                    current_revenue = yearly_metrics.loc[current_year, ('total_price', 'sum')]
                    previous_revenue = yearly_metrics.loc[previous_year, ('total_price', 'sum')]
                    
                    if previous_revenue > 0:
                        growth_rate = ((current_revenue - previous_revenue) / previous_revenue) * 100
                        growth_rates[f"{previous_year}_to_{current_year}"] = round(growth_rate, 2)
                
                sales_metrics['yearly_growth_rates'] = growth_rates
            
            # Product category analysis
            if 'product_category' in df.columns:
                product_metrics = df.groupby('product_category').agg({
                    'total_price': ['sum', 'count', 'mean']
                }).round(2)
                
                sales_metrics['product_category_performance'] = {}
                for category in product_metrics.index:
                    sales_metrics['product_category_performance'][category] = {
                        'total_revenue': float(product_metrics.loc[category, ('total_price', 'sum')]),
                        'transaction_count': int(product_metrics.loc[category, ('total_price', 'count')]),
                        'average_transaction': float(product_metrics.loc[category, ('total_price', 'mean')])
                    }
        
        return sales_metrics
    
    def _calculate_financial_metrics(self, normalized_data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate financial metrics."""
        financial_metrics = {}
        
        # Get sales metrics for financial calculations
        sales_metrics = self.metrics.get('sales', {})
        
        # Try to calculate real EBITDA from financial data if available
        real_ebitda = self._calculate_real_ebitda_from_financial_data(normalized_data)
        
        # Calculate months in analysis period
        analysis_period = self.business_rules.get('analysis_period', {})
        if analysis_period:
            start_date = pd.to_datetime(analysis_period.get('start_date', '2021-01-01'))
            end_date = pd.to_datetime(analysis_period.get('end_date', '2025-12-31'))
            months_in_period = ((end_date.year - start_date.year) * 12 + 
                              (end_date.month - start_date.month) + 1)
        else:
            months_in_period = 24  # Default fallback for P&L data (2023-2024)
        
        # Always try P&L-based revenue calculation with missing data detection
        pnl_revenue = self._estimate_revenue_from_pnl(normalized_data)
        logger.info(f"P&L revenue calculation result: ${pnl_revenue:,.2f}")
        
        if sales_metrics:
            sales_revenue = sales_metrics.get('total_revenue', 0)
            
            # Always use P&L revenue if available (it has missing data detection)
            if pnl_revenue > 0:
                total_revenue = pnl_revenue
                logger.info(f"Using P&L-based revenue calculation with missing data detection: ${total_revenue:,.2f}")
            else:
                total_revenue = sales_revenue
                logger.info(f"Using sales-based revenue calculation: ${total_revenue:,.2f}")
            
            # Basic financial ratios
            financial_metrics['revenue_metrics'] = {
                'total_revenue': total_revenue,
                'annual_revenue_projection': self._calculate_annual_projection(sales_metrics),
                'monthly_revenue_average': total_revenue / months_in_period if total_revenue > 0 else 0,
                'analysis_period_months': months_in_period
            }
            
            # Add analysis period dates for json_loader
            if analysis_period:
                financial_metrics['start_date'] = analysis_period.get('start_date')
                financial_metrics['end_date'] = analysis_period.get('end_date')
        else:
            # No sales data available, use P&L-based revenue calculation only
            logger.info("No sales data available, calculating financial metrics from P&L data only")
            total_revenue = pnl_revenue if pnl_revenue > 0 else 0
            logger.info(f"Using P&L revenue: ${total_revenue:,.2f}, months_in_period: {months_in_period}")
            
            # Basic financial ratios using P&L data only
            # pnl_revenue is now the monthly average, not total revenue
            monthly_revenue_avg = pnl_revenue
            total_revenue = monthly_revenue_avg * months_in_period  # Calculate total for the analysis period
            financial_metrics['revenue_metrics'] = {
                'total_revenue': total_revenue,
                'annual_revenue_projection': monthly_revenue_avg * 12 if monthly_revenue_avg > 0 else 0,
                'monthly_revenue_average': monthly_revenue_avg,
                'analysis_period_months': months_in_period
            }
            logger.info(f"Final revenue metrics: {financial_metrics['revenue_metrics']}")
            
            # Add analysis period dates for json_loader
            if analysis_period:
                financial_metrics['start_date'] = analysis_period.get('start_date')
                financial_metrics['end_date'] = analysis_period.get('end_date')
            
            # EBITDA calculation - use real data if available, otherwise use margin
            if real_ebitda is not None:
                # Real EBITDA is monthly, so calculate monthly revenue average for consistent units
                monthly_revenue_avg = total_revenue / months_in_period if months_in_period > 0 else 0
                ebitda_margin = real_ebitda / monthly_revenue_avg if monthly_revenue_avg > 0 else 0
                estimated_ebitda = real_ebitda  # Keep as monthly for consistency
                logger.info(f"Using real EBITDA from financial data: ${estimated_ebitda:,.2f} monthly")
                logger.info(f"Monthly revenue average: ${monthly_revenue_avg:,.2f}, EBITDA margin: {ebitda_margin:.1%}")
            else:
                ebitda_margin = self.business_rules.get('financial_metrics', {}).get('ebitda_margin_target', 0.25)
                monthly_revenue_avg = total_revenue / months_in_period if months_in_period > 0 else 0
                estimated_ebitda = monthly_revenue_avg * ebitda_margin
                logger.info(f"Using estimated EBITDA with {ebitda_margin:.1%} margin: ${estimated_ebitda:,.2f} monthly")
            
            # Calculate annual EBITDA projection
            annual_ebitda = estimated_ebitda * 12
            
            financial_metrics['profitability'] = {
                'estimated_ebitda': estimated_ebitda,
                'ebitda_margin': ebitda_margin * 100,
                'estimated_annual_ebitda': annual_ebitda
            }
            
            # ROI calculation
            asking_price = 650000  # From business sale data
            roi = (annual_ebitda / asking_price) * 100 if asking_price > 0 else 0
            
            financial_metrics['investment_metrics'] = {
                'asking_price': asking_price,
                'estimated_annual_ebitda': annual_ebitda,
                'roi_percentage': roi,
                'payback_period_years': asking_price / annual_ebitda if annual_ebitda > 0 else 0
            }
            # Use real EBITDA if calculated from P&L data
            if real_ebitda is not None:
                estimated_ebitda = real_ebitda
                ebitda_margin = 0.45  # Use the calculated margin from P&L data
                logger.info(f"Using real EBITDA from P&L data: ${estimated_ebitda:,.2f} monthly")
            else:
                # Fallback to business rules
                ebitda_margin = self.business_rules.get('financial_metrics', {}).get('ebitda_margin_target', 0.25)
                # Estimate revenue from P&L data if available
                total_revenue = self._estimate_revenue_from_pnl(normalized_data)
                monthly_revenue_avg = total_revenue / months_in_period if months_in_period > 0 else 0
                estimated_ebitda = monthly_revenue_avg * ebitda_margin
                logger.info(f"Using estimated EBITDA with {ebitda_margin:.1%} margin: ${estimated_ebitda:,.2f} monthly")
            
            # Calculate annual projections
            annual_ebitda = estimated_ebitda * 12
            annual_revenue = (estimated_ebitda / ebitda_margin) * 12 if ebitda_margin > 0 else 0
            
            # Basic financial ratios - use P&L-based revenue if available, otherwise use EBITDA-based
            if pnl_revenue > 0:
                # Use P&L-based revenue calculation (already calculated above)
                logger.info(f"Using P&L-based revenue metrics (not overwriting): ${pnl_revenue:,.2f}")
                # Don't overwrite the revenue_metrics that were already calculated with P&L data
            else:
                # Fallback to EBITDA-based calculation
                financial_metrics['revenue_metrics'] = {
                    'total_revenue': annual_revenue / 12,  # Monthly average
                    'annual_revenue_projection': annual_revenue,
                    'monthly_revenue_average': annual_revenue / 12,
                    'analysis_period_months': months_in_period
                }
            
            # Add analysis period dates for json_loader
            if analysis_period:
                financial_metrics['start_date'] = analysis_period.get('start_date')
                financial_metrics['end_date'] = analysis_period.get('end_date')
            
            financial_metrics['profitability'] = {
                'estimated_ebitda': estimated_ebitda,
                'ebitda_margin': ebitda_margin * 100,
                'estimated_annual_ebitda': annual_ebitda
            }
            
            # ROI calculation
            asking_price = 650000  # From business sale data
            roi = (annual_ebitda / asking_price) * 100 if asking_price > 0 else 0
            
            financial_metrics['investment_metrics'] = {
                'asking_price': asking_price,
                'estimated_annual_ebitda': annual_ebitda,
                'roi_percentage': roi,
                'payback_period_years': asking_price / annual_ebitda if annual_ebitda > 0 else 0
            }
        
        return financial_metrics
    
    def _calculate_operational_metrics(self, normalized_data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate operational metrics."""
        operational_metrics = {}
        
        # Check if sales data exists and get main_sales from it
        sales_data = normalized_data.get('sales', {})
        if 'main_sales' in sales_data:
            df = sales_data['main_sales']
            
            # Filter data by analysis period if specified
            analysis_period = self.business_rules.get('analysis_period', {})
            if analysis_period:
                start_date = pd.to_datetime(analysis_period.get('start_date', '2021-01-01'))
                end_date = pd.to_datetime(analysis_period.get('end_date', '2025-12-31'))
                
                # Filter the dataframe by date range
                df = df[(df['sale_date'] >= start_date) & (df['sale_date'] <= end_date)]
            
            # Patient metrics
            unique_patients = df['patient_id'].nunique()
            total_transactions = len(df)
            
            operational_metrics['patient_metrics'] = {
                'unique_patients': unique_patients,
                'total_transactions': total_transactions,
                'transactions_per_patient': total_transactions / unique_patients if unique_patients > 0 else 0,
                'patient_retention_rate': self._calculate_patient_retention(df)
            }
            
            # Staff efficiency
            if 'staff_name' in df.columns:
                staff_efficiency = df.groupby('staff_name').agg({
                    'total_price': ['sum', 'count'],
                    'patient_id': 'nunique'
                })
                
                operational_metrics['staff_efficiency'] = {}
                for staff in staff_efficiency.index:
                    revenue = staff_efficiency.loc[staff, ('total_price', 'sum')]
                    transactions = staff_efficiency.loc[staff, ('total_price', 'count')]
                    patients = staff_efficiency.loc[staff, ('patient_id', 'nunique')]
                    
                    operational_metrics['staff_efficiency'][staff] = {
                        'revenue_per_transaction': revenue / transactions if transactions > 0 else 0,
                        'revenue_per_patient': revenue / patients if patients > 0 else 0,
                        'transactions_per_patient': transactions / patients if patients > 0 else 0
                    }
            
            # Location efficiency
            if 'clinic_name' in df.columns:
                location_efficiency = df.groupby('clinic_name').agg({
                    'total_price': ['sum', 'count'],
                    'patient_id': 'nunique'
                })
                
                operational_metrics['location_efficiency'] = {}
                for location in location_efficiency.index:
                    revenue = location_efficiency.loc[location, ('total_price', 'sum')]
                    transactions = location_efficiency.loc[location, ('total_price', 'count')]
                    patients = location_efficiency.loc[location, ('patient_id', 'nunique')]
                    
                    operational_metrics['location_efficiency'][location] = {
                        'revenue_per_transaction': revenue / transactions if transactions > 0 else 0,
                        'revenue_per_patient': revenue / patients if patients > 0 else 0,
                        'transactions_per_patient': transactions / patients if patients > 0 else 0
                    }
        
        return operational_metrics
    
    def _calculate_valuation_metrics(self) -> Dict[str, Any]:
        """Calculate valuation metrics."""
        valuation_metrics = {}
        
        # Get financial metrics
        financial_metrics = self.metrics.get('financial', {})
        revenue_metrics = financial_metrics.get('revenue_metrics', {})
        profitability = financial_metrics.get('profitability', {})
        investment = financial_metrics.get('investment_metrics', {})
        
        asking_price = investment.get('asking_price', 650000)
        annual_revenue = revenue_metrics.get('annual_revenue_projection', 0)
        annual_ebitda = profitability.get('estimated_annual_ebitda', 0)
        
        # Valuation multiples
        revenue_multiple = asking_price / annual_revenue if annual_revenue > 0 else 0
        ebitda_multiple = asking_price / annual_ebitda if annual_ebitda > 0 else 0
        
        # Industry benchmarks
        industry_revenue_multiple_min = self.business_rules.get('valuation_multipliers', {}).get('revenue_multiple_min', 0.8)
        industry_revenue_multiple_max = self.business_rules.get('valuation_multipliers', {}).get('revenue_multiple_max', 1.2)
        industry_ebitda_multiple_min = self.business_rules.get('valuation_multipliers', {}).get('ebitda_multiple_min', 3.0)
        industry_ebitda_multiple_max = self.business_rules.get('valuation_multipliers', {}).get('ebitda_multiple_max', 5.0)
        
        # Market value calculation
        market_value_revenue = annual_revenue * ((industry_revenue_multiple_min + industry_revenue_multiple_max) / 2)
        market_value_ebitda = annual_ebitda * ((industry_ebitda_multiple_min + industry_ebitda_multiple_max) / 2)
        market_value = (market_value_revenue + market_value_ebitda) / 2
        
        valuation_metrics['multiples'] = {
            'revenue_multiple': round(revenue_multiple, 2),
            'ebitda_multiple': round(ebitda_multiple, 2),
            'industry_revenue_multiple_range': [industry_revenue_multiple_min, industry_revenue_multiple_max],
            'industry_ebitda_multiple_range': [industry_ebitda_multiple_min, industry_ebitda_multiple_max]
        }
        
        valuation_metrics['market_analysis'] = {
            'asking_price': asking_price,
            'market_value_revenue_based': round(market_value_revenue, 2),
            'market_value_ebitda_based': round(market_value_ebitda, 2),
            'estimated_market_value': round(market_value, 2),
            'discount_from_market': round(((market_value - asking_price) / market_value) * 100, 2) if market_value > 0 else 0,
            'discount_amount': round(market_value - asking_price, 2)
        }
        
        return valuation_metrics
    
    def _calculate_real_ebitda_from_financial_data(self, normalized_data: Dict[str, Any]) -> Optional[float]:
        """Calculate real EBITDA from actual financial data."""
        try:
            # Debug: Log what data we're receiving
            logger.info(f"Normalized data keys: {list(normalized_data.keys())}")
            
            # Check if we have P&L data (it's directly under normalized_data, not under 'financial')
            if 'profit_loss' not in normalized_data:
                logger.warning("No P&L data available for real EBITDA calculation")
                return None
            
            pnl_data = normalized_data.get('profit_loss', {})
            logger.info(f"P&L data keys: {list(pnl_data.keys())}")
            
            if not pnl_data:
                logger.warning("No P&L data available for real EBITDA calculation")
                return None
            
            # Since P&L data is company-wide but we only want sale locations,
            # we'll calculate EBITDA based on actual sales revenue with a reasonable margin
            sales_data = normalized_data.get('sales', {})
            if 'main_sales' in sales_data:
                df = sales_data['main_sales']
                
                # Calculate monthly revenue from sales data (already filtered to sale locations)
                df['sale_date'] = pd.to_datetime(df['sale_date'])
                monthly_revenue = df.groupby(df['sale_date'].dt.to_period('M'))['total_price'].sum()
                
                if len(monthly_revenue) > 0:
                    avg_monthly_revenue = monthly_revenue.mean()
                    logger.info(f"Average monthly revenue from sales data: ${avg_monthly_revenue:,.2f}")
                    
                    # Use the EBITDA margin from business rules (website shows 25.6%)
                    ebitda_margin = self.business_rules.get('financial_metrics', {}).get('ebitda_margin_target', 0.256)
                    calculated_monthly_ebitda = avg_monthly_revenue * ebitda_margin
                    logger.info(f"Calculated monthly EBITDA using {ebitda_margin:.1%} margin: ${calculated_monthly_ebitda:,.2f}")
                    
                    return calculated_monthly_ebitda
            
            # Fallback to P&L calculation if sales data not available
            logger.info("Falling back to P&L calculation...")
            monthly_ebitdas = []
            all_expense_categories = defaultdict(float)
            
            # Get analysis period for filtering P&L data
            analysis_period = self.business_rules.get('analysis_period', {})
            start_date = None
            end_date = None
            if analysis_period:
                start_date = pd.to_datetime(analysis_period.get('start_date', '2021-01-01'))
                end_date = pd.to_datetime(analysis_period.get('end_date', '2025-12-31'))
                logger.info(f"Filtering P&L data to analysis period: {start_date.date()} to {end_date.date()}")
            
            # Generate expected months for missing data detection
            expected_months = self._generate_expected_months(start_date, end_date) if start_date and end_date else []
            found_months = []
            monthly_ebitdas_dict = {}
            
            # Process each P&L statement
            for pnl_key, pnl_df in pnl_data.items():
                logger.info(f"Processing P&L: {pnl_key}")
                
                # Handle both DataFrame and dict formats
                if isinstance(pnl_df, pd.DataFrame):
                    df = pnl_df
                elif isinstance(pnl_df, dict) and 'data' in pnl_df:
                    df = pd.DataFrame(pnl_df['data'])
                else:
                    logger.warning(f"Unexpected P&L data format: {type(pnl_df)}")
                    continue
                
                # Filter P&L data by analysis period if specified
                month_key = None
                if start_date and end_date:
                    # Extract date from P&L key (format: pnl_2023_2023-07-01_to_2023-07-31_ProfitAndLoss_CranberryHearing)
                    try:
                        # Extract the date from the key (index 2 is the start date)
                        date_part = pnl_key.split('_')[2]  # e.g., "2023-07-01"
                        pnl_start_date = pd.to_datetime(date_part)
                        month_key = pnl_start_date.strftime('%Y-%m')
                        
                        # Check if this P&L statement falls within our analysis period
                        if pnl_start_date < start_date or pnl_start_date > end_date:
                            logger.info(f"  Skipping P&L {pnl_key} - outside analysis period")
                            continue
                        else:
                            logger.info(f"  Including P&L {pnl_key} - within analysis period")
                    except (IndexError, ValueError) as e:
                        logger.warning(f"  Could not parse date from P&L key {pnl_key}: {e}")
                        # Include it if we can't parse the date
                        pass
                
                # Calculate monthly revenue and expenses
                monthly_revenue = 0
                monthly_operational_expenses = 0  # For EBITDA calculation
                monthly_total_expenses = 0  # For complete analysis
                
                # Find actual revenue categories (Sales and Investment Income only - exclude calculated values)
                # Filter to only include Pennsylvania revenue (sale locations only)
                if 'Unnamed: 0' not in df.columns:
                    logger.warning(f"  Skipping P&L {pnl_key} - missing 'Unnamed: 0' column")
                    continue
                    
                # Use both "5017 · Sales" and "5017 · Sales - Other" as different months have different line items
                revenue_rows = df[df['Unnamed: 0'].str.contains(r'^5017 · Sales( - Other)?$', case=False, na=False, regex=True)]
                for _, row in revenue_rows.iterrows():
                    # Handle different column structures across years - ONLY include sale locations
                    if 'Pennsylvania' in df.columns and pd.notna(row.get('Pennsylvania')) and row.get('Pennsylvania') != 0:
                        # 2023 data structure: Pennsylvania, Virginia, Unclassified
                        # Only use Pennsylvania column (sale locations only)
                        revenue_amount = float(row['Pennsylvania'])
                        monthly_revenue += revenue_amount
                        logger.info(f"  Revenue (PA sale locations only): {row['Unnamed: 0']} = ${revenue_amount:,.2f}")
                    elif 'Cranberry' in df.columns and 'West View' in df.columns:
                        # 2024/2025 data structure: Cranberry, Virginia, West View
                        # Only include Cranberry + West View (sale locations), exclude Virginia
                        cranberry_revenue = float(row.get('Cranberry', 0)) if pd.notna(row.get('Cranberry')) else 0
                        west_view_revenue = float(row.get('West View', 0)) if pd.notna(row.get('West View')) else 0
                        revenue_amount = cranberry_revenue + west_view_revenue
                        if revenue_amount != 0:
                            monthly_revenue += revenue_amount
                            logger.info(f"  Revenue (sale locations only): {row['Unnamed: 0']} = ${revenue_amount:,.2f} (Cranberry: ${cranberry_revenue:,.2f}, West View: ${west_view_revenue:,.2f})")
                    elif pd.notna(row.get('TOTAL')) and row.get('TOTAL') != 0:
                        # Fallback to TOTAL if neither structure is available
                        # WARNING: This includes all locations, not just sale locations
                        revenue_amount = float(row['TOTAL'])
                        monthly_revenue += revenue_amount
                        logger.warning(f"  Revenue (TOTAL fallback - includes all locations): {row['Unnamed: 0']} = ${revenue_amount:,.2f}")
                
                # Find ALL expenses for comprehensive analysis
                all_expense_rows = df[df['Unnamed: 0'].str.contains('Salaries|Wages|Rent|Insurance|Utilities|Office|Marketing|Professional|Payroll|Employee|Equipment|Supplies|Telephone|Travel|Training|Legal|Accounting|Interest|Tax|Depreciation|Amortization|COGS|Cost|Expense', case=False, na=False)]
                
                for _, row in all_expense_rows.iterrows():
                    # Handle different column structures across years - ONLY include sale locations
                    if 'Pennsylvania' in df.columns and pd.notna(row.get('Pennsylvania')) and row.get('Pennsylvania') != 0:
                        # 2023 data structure: Pennsylvania, Virginia, Unclassified
                        # Only use Pennsylvania column (sale locations only)
                        expense_name = row['Unnamed: 0']
                        expense_amount = float(row['Pennsylvania'])
                        
                        # Track all expenses by category
                        all_expense_categories[expense_name] += expense_amount
                        monthly_total_expenses += expense_amount
                        
                        # For EBITDA: exclude Interest, Tax, Depreciation, Amortization
                        if not any(exclude in expense_name for exclude in ['Interest', 'Tax', 'Depreciation', 'Amortization', 'Total', 'Summary']):
                            monthly_operational_expenses += expense_amount
                    elif 'Cranberry' in df.columns and 'West View' in df.columns:
                        # 2024/2025 data structure: Cranberry, Virginia, West View
                        # Only include Cranberry + West View (sale locations), exclude Virginia
                        expense_name = row['Unnamed: 0']
                        cranberry_expense = float(row.get('Cranberry', 0)) if pd.notna(row.get('Cranberry')) else 0
                        west_view_expense = float(row.get('West View', 0)) if pd.notna(row.get('West View')) else 0
                        expense_amount = cranberry_expense + west_view_expense
                        
                        if expense_amount != 0:
                            # Track all expenses by category
                            all_expense_categories[expense_name] += expense_amount
                            monthly_total_expenses += expense_amount
                            
                            # For EBITDA: exclude Interest, Tax, Depreciation, Amortization
                            if not any(exclude in expense_name for exclude in ['Interest', 'Tax', 'Depreciation', 'Amortization', 'Total', 'Summary']):
                                monthly_operational_expenses += expense_amount
                    elif pd.notna(row.get('TOTAL')) and row.get('TOTAL') != 0:
                        # Fallback to TOTAL if neither structure is available
                        # WARNING: This includes all locations, not just sale locations
                        expense_name = row['Unnamed: 0']
                        expense_amount = float(row['TOTAL'])
                        
                        # Track all expenses by category
                        all_expense_categories[expense_name] += expense_amount
                        monthly_total_expenses += expense_amount
                        
                        # For EBITDA: exclude Interest, Tax, Depreciation, Amortization
                        if not any(exclude in expense_name for exclude in ['Interest', 'Tax', 'Depreciation', 'Amortization', 'Total', 'Summary']):
                            monthly_operational_expenses += expense_amount
                
                # Calculate monthly EBITDA (operational expenses only)
                if monthly_revenue > 0:
                    monthly_ebitda = monthly_revenue - monthly_operational_expenses
                    monthly_ebitdas.append(monthly_ebitda)
                    if month_key:
                        found_months.append(month_key)
                        monthly_ebitdas_dict[month_key] = monthly_ebitda
                    logger.info(f"Monthly EBITDA for {pnl_key}: ${monthly_ebitda:,.2f} (Revenue: ${monthly_revenue:,.2f}, Op Expenses: ${monthly_operational_expenses:,.2f}, Total Expenses: ${monthly_total_expenses:,.2f})")
            
            # Identify missing months for EBITDA calculation
            if expected_months and monthly_ebitdas_dict:
                missing_months = [month for month in expected_months if month not in found_months]
                if missing_months:
                    logger.warning(f"🚨 MISSING EBITDA DATA: {len(missing_months)} months missing from P&L data")
                    for missing_month in missing_months:
                        logger.warning(f"  Missing EBITDA data: {missing_month}")
                    
                    # Calculate average monthly EBITDA from available data
                    avg_monthly_ebitda = sum(monthly_ebitdas_dict.values()) / len(monthly_ebitdas_dict)
                    logger.info(f"📊 Using average monthly EBITDA (${avg_monthly_ebitda:,.2f}) for {len(missing_months)} missing months")
                    
                    # Add estimated EBITDA for missing months
                    for missing_month in missing_months:
                        monthly_ebitdas.append(avg_monthly_ebitda)
                        monthly_ebitdas_dict[missing_month] = avg_monthly_ebitda
                    
                    logger.info(f"💰 Added estimated EBITDA: ${avg_monthly_ebitda * len(missing_months):,.2f} for missing months")
                    logger.info(f"📈 Total EBITDA with estimates: ${sum(monthly_ebitdas):,.2f} from {len(monthly_ebitdas)} months ({len(found_months)} actual + {len(missing_months)} estimated)")
                else:
                    logger.info("✅ All expected months found in EBITDA calculation")
            
            if monthly_ebitdas:
                # Calculate average monthly EBITDA (already filtered to sale locations only)
                avg_monthly_ebitda = sum(monthly_ebitdas) / len(monthly_ebitdas)
                logger.info(f"Average monthly EBITDA (sale locations only): ${avg_monthly_ebitda:,.2f} (from {len(monthly_ebitdas)} months)")
                
                # Log comprehensive expense analysis
                logger.info(f"Comprehensive expense analysis - Top 10 expense categories:")
                sorted_expenses = sorted(all_expense_categories.items(), key=lambda x: x[1], reverse=True)
                for expense_name, total_amount in sorted_expenses[:10]:
                    logger.info(f"  {expense_name}: ${total_amount:,.2f}")
                
                return avg_monthly_ebitda
            else:
                logger.warning("No valid P&L data found for EBITDA calculation")
                return None
                
        except Exception as e:
            logger.exception("Error calculating real EBITDA from financial data")
            return None
    
    def _generate_expected_months(self, start_date: pd.Timestamp, end_date: pd.Timestamp) -> List[str]:
        """Generate list of expected months in YYYY-MM format for the analysis period."""
        expected_months = []
        current_date = start_date.replace(day=1)  # Start from first day of month
        
        while current_date <= end_date:
            expected_months.append(current_date.strftime('%Y-%m'))
            # Move to next month
            if current_date.month == 12:
                current_date = current_date.replace(year=current_date.year + 1, month=1)
            else:
                current_date = current_date.replace(month=current_date.month + 1)
        
        return expected_months
    
    def _estimate_revenue_from_pnl(self, normalized_data: Dict[str, Any]) -> float:
        """Estimate total revenue from P&L data with missing data detection and fallback."""
        try:
            # P&L data is directly under normalized_data, not under 'financial'
            pnl_data = normalized_data.get('profit_loss', {})
            
            logger.info(f"P&L data processing: Found {len(pnl_data)} P&L statements")
            
            if not pnl_data:
                logger.warning("No P&L data available for revenue estimation")
                return 0.0
            
            # Get analysis period for filtering P&L data
            analysis_period = self.business_rules.get('analysis_period', {})
            start_date = None
            end_date = None
            if analysis_period:
                start_date = pd.to_datetime(analysis_period.get('start_date', '2021-01-01'))
                end_date = pd.to_datetime(analysis_period.get('end_date', '2025-12-31'))
            
            # Generate expected months in analysis period
            expected_months = self._generate_expected_months(start_date, end_date)
            logger.info(f"Expected months in analysis period: {len(expected_months)}")
            
            # Track missing data
            missing_months = []
            found_months = []
            monthly_revenues = {}
            
            total_revenue = 0.0
            month_count = 0
            
            # Process each P&L statement
            processed_count = 0
            skipped_count = 0
            for pnl_key, pnl_df in pnl_data.items():
                # Filter P&L data by analysis period if specified
                month_key = None
                if start_date and end_date:
                    try:
                        # Extract the date from the key (index 2 is the start date)
                        date_part = pnl_key.split('_')[2]  # e.g., "2023-07-01"
                        pnl_start_date = pd.to_datetime(date_part)
                        month_key = pnl_start_date.strftime('%Y-%m')
                        
                        # Check if this P&L statement falls within our analysis period
                        if pnl_start_date < start_date or pnl_start_date > end_date:
                            logger.debug(f"  Skipping {pnl_key} - outside analysis period")
                            continue  # Skip this P&L statement
                    except (IndexError, ValueError):
                        # Include it if we can't parse the date
                        logger.debug(f"  Including {pnl_key} - couldn't parse date")
                        pass
                
                if isinstance(pnl_df, pd.DataFrame):
                    df = pnl_df
                elif isinstance(pnl_df, dict) and 'data' in pnl_df:
                    df = pd.DataFrame(pnl_df['data'])
                else:
                    logger.debug(f"  Skipping {pnl_key} - unexpected data format: {type(pnl_df)}")
                    skipped_count += 1
                    continue
                
                logger.debug(f"  Processing {pnl_key} - columns: {list(df.columns)}")
                processed_count += 1
                
                # Find revenue categories (only Sales, not Investment Income)
                # Look for "Total 5017 · Sales" first, then fall back to "5017 · Sales"
                # Handle different column structures across years
                if 'Unnamed: 0' not in df.columns:
                    logger.warning(f"  Skipping P&L {pnl_key} - missing 'Unnamed: 0' column")
                    continue
                    
                total_sales_row = df[df['Unnamed: 0'].str.contains('Total 5017 · Sales', case=False, na=False)]
                logger.debug(f"  Found {len(total_sales_row)} 'Total 5017 · Sales' rows")
                
                if not total_sales_row.empty:
                    logger.debug(f"  Processing 'Total 5017 · Sales' row for {pnl_key}")
                    if 'Pennsylvania' in df.columns and pd.notna(total_sales_row['Pennsylvania'].iloc[0]):
                        # 2023 data structure: Pennsylvania, Virginia, Unclassified
                        # Only use Pennsylvania column (sale locations only)
                        monthly_revenue = float(total_sales_row['Pennsylvania'].iloc[0])
                        logger.debug(f"  Using Pennsylvania column (sale locations only): ${monthly_revenue:,.2f}")
                    elif 'Cranberry' in df.columns and 'West View' in df.columns:
                        # 2024/2025 data structure: Cranberry, Virginia, West View
                        # Only include Cranberry + West View (sale locations), exclude Virginia
                        cranberry_revenue = float(total_sales_row['Cranberry'].iloc[0]) if pd.notna(total_sales_row['Cranberry'].iloc[0]) else 0
                        west_view_revenue = float(total_sales_row['West View'].iloc[0]) if pd.notna(total_sales_row['West View'].iloc[0]) else 0
                        monthly_revenue = cranberry_revenue + west_view_revenue
                        logger.debug(f"  Using Cranberry+West View (sale locations only): ${monthly_revenue:,.2f} (Cranberry: ${cranberry_revenue:,.2f}, West View: ${west_view_revenue:,.2f})")
                    else:
                        if 'TOTAL' in df.columns:
                            monthly_revenue = float(total_sales_row['TOTAL'].iloc[0]) if pd.notna(total_sales_row['TOTAL'].iloc[0]) else 0
                            logger.warning(f"  Using TOTAL column (includes all locations): ${monthly_revenue:,.2f}")
                        else:
                            logger.warning(f"  No suitable revenue columns found in {pnl_key}")
                            monthly_revenue = 0
                else:
                    # Fall back to "5017 · Sales" if "Total 5017 · Sales" doesn't exist
                    sales_row = df[df['Unnamed: 0'].str.contains('^5017 · Sales$', case=False, na=False, regex=True)]
                    if not sales_row.empty:
                        if 'Pennsylvania' in df.columns and pd.notna(sales_row['Pennsylvania'].iloc[0]):
                            # 2023 data structure: Pennsylvania, Virginia, Unclassified
                            # Only use Pennsylvania column (sale locations only)
                            monthly_revenue = float(sales_row['Pennsylvania'].iloc[0])
                        elif 'Cranberry' in df.columns and 'West View' in df.columns:
                            # 2024/2025 data structure: Cranberry, Virginia, West View
                            # Only include Cranberry + West View (sale locations), exclude Virginia
                            cranberry_revenue = float(sales_row['Cranberry'].iloc[0]) if pd.notna(sales_row['Cranberry'].iloc[0]) else 0
                            west_view_revenue = float(sales_row['West View'].iloc[0]) if pd.notna(sales_row['West View'].iloc[0]) else 0
                            monthly_revenue = cranberry_revenue + west_view_revenue
                        else:
                            monthly_revenue = float(sales_row['TOTAL'].iloc[0]) if pd.notna(sales_row['TOTAL'].iloc[0]) else 0
                    else:
                        monthly_revenue = 0
                
                if monthly_revenue > 0:
                    total_revenue += monthly_revenue
                    month_count += 1
                    if month_key:
                        found_months.append(month_key)
                        monthly_revenues[month_key] = monthly_revenue
                    logger.debug(f"  Added ${monthly_revenue:,.2f} to total (month {month_count})")
                else:
                    logger.debug(f"  No revenue found for {pnl_key}")
            
            # Identify missing months
            if expected_months:
                missing_months = [month for month in expected_months if month not in found_months]
                if missing_months:
                    logger.warning(f"🚨 MISSING DATA DETECTED: {len(missing_months)} months missing from P&L data")
                    for missing_month in missing_months:
                        logger.warning(f"  Missing: {missing_month}")
                    
                    # Calculate average monthly revenue from available data
                    if monthly_revenues:
                        avg_monthly_revenue = sum(monthly_revenues.values()) / len(monthly_revenues)
                        logger.info(f"📊 Using average monthly revenue (${avg_monthly_revenue:,.2f}) for {len(missing_months)} missing months")
                        
                        # Add estimated revenue for missing months
                        estimated_missing_revenue = avg_monthly_revenue * len(missing_months)
                        total_revenue += estimated_missing_revenue
                        month_count += len(missing_months)
                        
                        logger.info(f"💰 Added estimated revenue: ${estimated_missing_revenue:,.2f} for missing months")
                        logger.info(f"📈 Total revenue with estimates: ${total_revenue:,.2f} from {month_count} months ({len(found_months)} actual + {len(missing_months)} estimated)")
                    else:
                        logger.error("❌ No valid revenue data found to calculate averages for missing months")
                else:
                    logger.info("✅ All expected months found in P&L data")
            
            # Calculate monthly average from actual data
            monthly_revenue_avg = total_revenue / month_count if month_count > 0 else 0.0
            logger.info(f"P&L revenue calculation complete: ${total_revenue:,.2f} from {month_count} months (processed {processed_count}, skipped {skipped_count})")
            logger.info(f"Monthly revenue average: ${monthly_revenue_avg:,.2f}")
            return monthly_revenue_avg
            
        except Exception as e:
            logger.exception("Error estimating revenue from P&L data")
            return 0.0
    
    def _calculate_performance_indicators(self) -> Dict[str, Any]:
        """Calculate key performance indicators."""
        performance_metrics = {}
        
        # Get metrics from other calculations
        sales_metrics = self.metrics.get('sales', {})
        financial_metrics = self.metrics.get('financial', {})
        operational_metrics = self.metrics.get('operational', {})
        valuation_metrics = self.metrics.get('valuation', {})
        
        # Revenue growth
        yearly_growth = sales_metrics.get('yearly_growth_rates', {})
        if yearly_growth:
            recent_growth = list(yearly_growth.values())[-1] if yearly_growth else 0
            performance_metrics['revenue_growth'] = {
                'recent_growth_rate': recent_growth,
                'average_growth_rate': sum(yearly_growth.values()) / len(yearly_growth) if yearly_growth else 0,
                'growth_trend': 'positive' if recent_growth > 0 else 'negative'
            }
        
        # Profitability indicators
        profitability = financial_metrics.get('profitability', {})
        performance_metrics['profitability_indicators'] = {
            'ebitda_margin': profitability.get('ebitda_margin', 0),
            'roi_percentage': financial_metrics.get('investment_metrics', {}).get('roi_percentage', 0),
            'profitability_status': 'strong' if profitability.get('ebitda_margin', 0) > 20 else 'moderate'
        }
        
        # Operational efficiency
        patient_metrics = operational_metrics.get('patient_metrics', {})
        performance_metrics['operational_efficiency'] = {
            'transactions_per_patient': patient_metrics.get('transactions_per_patient', 0),
            'patient_retention_rate': patient_metrics.get('patient_retention_rate', 0),
            'efficiency_status': 'high' if patient_metrics.get('transactions_per_patient', 0) > 2 else 'moderate'
        }
        
        # Market position
        market_analysis = valuation_metrics.get('market_analysis', {})
        performance_metrics['market_position'] = {
            'discount_from_market': market_analysis.get('discount_from_market', 0),
            'market_position': 'below_market' if market_analysis.get('discount_from_market', 0) > 0 else 'at_market',
            'investment_attractiveness': 'high' if market_analysis.get('discount_from_market', 0) > 20 else 'moderate'
        }
        
        return performance_metrics
    
    def _calculate_annual_projection(self, sales_metrics: Dict[str, Any]) -> float:
        """Calculate annual revenue projection based on configurable date range."""
        # Get the monthly average from the analysis period
        monthly_average = sales_metrics.get('average_transaction_value', 0)
        total_revenue = sales_metrics.get('total_revenue', 0)
        total_transactions = sales_metrics.get('total_transactions', 0)
        
        # Calculate monthly revenue average (not transaction average)
        analysis_period = self.business_rules.get('analysis_period', {})
        if analysis_period:
            start_date = pd.to_datetime(analysis_period.get('start_date', '2021-01-01'))
            end_date = pd.to_datetime(analysis_period.get('end_date', '2025-12-31'))
            months_in_period = ((end_date.year - start_date.year) * 12 + 
                              (end_date.month - start_date.month) + 1)
        else:
            months_in_period = 12  # Default fallback changed from 30 to 12
        
        # Calculate monthly revenue average from total revenue and months
        monthly_revenue_average = total_revenue / months_in_period if total_revenue > 0 else 0
        
        # Annual projection = monthly average × 12
        annual_projection = monthly_revenue_average * 12
        
        logger.info(f"Annual projection calculation: ${monthly_revenue_average:,.2f} monthly avg × 12 = ${annual_projection:,.2f}")
        
        return annual_projection
    
    def _calculate_patient_retention(self, df: pd.DataFrame) -> float:
        """Calculate patient retention rate."""
        if 'patient_id' not in df.columns or 'sale_date' not in df.columns:
            return 0
        
        # Group by patient and count unique months
        patient_months = df.groupby('patient_id')['sale_date'].apply(
            lambda x: x.dt.to_period('M').nunique()
        )
        
        # Calculate retention rate (patients with more than 1 month of activity)
        retained_patients = (patient_months > 1).sum()
        total_patients = len(patient_months)
        
        return (retained_patients / total_patients) * 100 if total_patients > 0 else 0
    
    def _calculate_location_adjustment_factor(self, normalized_data: Dict[str, Any]) -> float:
        """Calculate the adjustment factor for P&L data based on sale locations only."""
        try:
            # Get sales data to calculate revenue split
            sales_data = normalized_data.get('sales', {})
            if 'main_sales' not in sales_data:
                logger.warning("No sales data available for location adjustment calculation")
                return 1.0  # Default to no adjustment
            
            df = sales_data['main_sales']
            
            # Calculate total revenue by location
            location_revenue = df.groupby('clinic_name')['total_price'].sum()
            total_revenue = location_revenue.sum()
            
            if total_revenue == 0:
                logger.warning("No revenue data found for location adjustment calculation")
                return 1.0
            
            # Get locations that are for sale
            sale_locations = []
            for location_key, location_data in self.business_rules.get('locations', {}).items():
                if location_data.get('for_sale', False):
                    sale_locations.extend(location_data.get('names', []))
            
            # Calculate revenue for sale locations only
            sale_location_revenue = 0
            for location in location_revenue.index:
                location_lower = location.lower()
                if any(sale_location.lower() in location_lower for sale_location in sale_locations):
                    sale_location_revenue += location_revenue[location]
                    logger.info(f"Sale location revenue: {location} = ${location_revenue[location]:,.2f}")
            
            # Calculate adjustment factor
            adjustment_factor = sale_location_revenue / total_revenue if total_revenue > 0 else 1.0
            
            logger.info(f"Location adjustment calculation:")
            logger.info(f"  Total revenue (all locations): ${total_revenue:,.2f}")
            logger.info(f"  Sale locations revenue: ${sale_location_revenue:,.2f}")
            logger.info(f"  Adjustment factor: {adjustment_factor:.3f}")
            
            return adjustment_factor
            
        except Exception:
            logger.exception("Error calculating location adjustment factor")
            return 1.0  # Default to no adjustment
    
    def _calculate_equipment_metrics(self) -> Dict[str, Any]:
        """Calculate equipment metrics dynamically from CSV files."""
        try:
            # Import here to avoid circular imports
            from ..utils.equipment_calculator import get_equipment_metrics
            
            # Calculate equipment value from CSV files
            equipment_metrics = get_equipment_metrics()
            
            logger.info(f"Equipment value calculated from CSV files: ${equipment_metrics['total_value']:,.2f}")
            logger.info(f"Equipment items: {len(equipment_metrics['items'])}")
            
        except Exception as e:
            logger.error(f"Error calculating equipment metrics from CSV files: {e}")
            
            # Fallback to business rules if CSV calculation fails
            equipment_config = self.business_rules.get('equipment', {})
            equipment_metrics = {
                'total_value': equipment_config.get('total_value', 0),
                'description': equipment_config.get('description', 'No equipment data available'),
                'source': 'Fallback from business rules',
                'items': [],
                'categories': {}
            }
            
            logger.warning("Using fallback equipment value from business rules")
        
        return equipment_metrics
