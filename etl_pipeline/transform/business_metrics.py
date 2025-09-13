"""
Business metrics calculator for ETL pipeline.
"""

import pandas as pd
from typing import Dict, Any, List, Optional
import logging
from datetime import datetime
import numpy as np
from collections import defaultdict
from decimal import Decimal, ROUND_HALF_UP
import os
from ..utils.field_mapping_utils import FieldMappingRegistry
from ..utils.calculation_lineage import CalculationLineageTracker
from ..utils.currency_utils import round_currency, safe_currency_division, safe_currency_multiplication

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
        self.field_mapping_registry = FieldMappingRegistry()
        self.lineage_tracker = CalculationLineageTracker()
        
    def _parse_asking_price(self) -> float:
        """
        Parse asking price from environment variable or config with fallback.
        
        Returns:
            float: Asking price value with default fallback of 650000
        """
        try:
            # Try environment variable first
            asking_price_str = os.environ.get('ASKING_PRICE')
            if asking_price_str:
                asking_price = float(asking_price_str)
                logger.info(f"Using asking price from environment: ${asking_price:,.2f}")
                return asking_price
            
            # Try business rules config
            asking_price = self.business_rules.get('asking_price')
            if asking_price is not None:
                asking_price = float(asking_price)
                logger.info(f"Using asking price from business rules: ${asking_price:,.2f}")
                return asking_price
            
            # Try investment metrics config
            investment_config = self.business_rules.get('investment_metrics', {})
            asking_price = investment_config.get('asking_price')
            if asking_price is not None:
                asking_price = float(asking_price)
                logger.info(f"Using asking price from investment config: ${asking_price:,.2f}")
                return asking_price
            
            # Default fallback - consistent with valuation
            default_price = 650000.0
            logger.info(f"Using default asking price: ${default_price:,.2f}")
            return default_price
            
        except (ValueError, TypeError) as e:
            logger.warning(f"Invalid asking price value, using default: {e}")
            return 650000.0
    
    def _safe_float_conversion(self, value: Any, default: float = 0.0) -> float:
        """
        Safely convert value to float with robust NaN/None detection.
        
        Args:
            value: Value to convert
            default: Default value if conversion fails
            
        Returns:
            float: Converted value or default
        """
        if value is None:
            return default
        
        # Handle pandas NA values
        if pd.isna(value):
            return default
        
        # Handle numpy NaN
        if isinstance(value, (np.floating, np.integer)) and np.isnan(value):
            return default
        
        # Handle Decimal NaN
        if isinstance(value, Decimal) and value.is_nan():
            return default
        
        try:
            return float(value)
        except (ValueError, TypeError):
            return default
    
    def _format_currency(self, value: float) -> str:
        """Format value as currency."""
        return f"${value:,.2f}"
    
    def calculate_sde(self, ebitda: float, owner_salary: float = 0) -> float:
        """
        Calculate Seller's Discretionary Earnings (SDE).
        SDE = EBITDA + Owner's Salary/Compensation
        
        Args:
            ebitda: EBITDA value
            owner_salary: Owner's salary/compensation (default: 0)
            
        Returns:
            float: SDE value
        """
        sde = ebitda + owner_salary
        logger.info(f"Calculated SDE: EBITDA ${ebitda:,.2f} + Owner Salary ${owner_salary:,.2f} = ${sde:,.2f}")
        return sde
    
    def calculate_monthly_cash_flow(self, annual_ebitda: float) -> float:
        """
        Calculate monthly cash flow from annual EBITDA.
        
        Args:
            annual_ebitda: Annual EBITDA value
            
        Returns:
            float: Monthly cash flow
        """
        monthly_cash_flow = safe_currency_division(annual_ebitda, 12)
        logger.info(f"Calculated monthly cash flow: ${annual_ebitda:,.2f} ÷ 12 = ${monthly_cash_flow:,.2f}")
        return monthly_cash_flow
    
    def calculate_working_capital(self, current_assets: float, current_liabilities: float) -> float:
        """
        Calculate working capital.
        Working Capital = Current Assets - Current Liabilities
        
        Args:
            current_assets: Current assets value
            current_liabilities: Current liabilities value
            
        Returns:
            float: Working capital
        """
        working_capital = current_assets - current_liabilities
        logger.info(f"Calculated working capital: ${current_assets:,.2f} - ${current_liabilities:,.2f} = ${working_capital:,.2f}")
        return working_capital
    
    def calculate_debt_service_coverage_ratio(self, annual_ebitda: float, annual_debt_service: float) -> float:
        """
        Calculate debt service coverage ratio.
        DSCR = EBITDA / Annual Debt Service
        
        Args:
            annual_ebitda: Annual EBITDA
            annual_debt_service: Annual debt service payments
            
        Returns:
            float: Debt service coverage ratio
        """
        if annual_debt_service == 0:
            logger.warning("Annual debt service is 0, cannot calculate DSCR")
            return float('inf')
        
        dscr = annual_ebitda / annual_debt_service
        logger.info(f"Calculated DSCR: ${annual_ebitda:,.2f} ÷ ${annual_debt_service:,.2f} = {dscr:.2f}")
        return dscr
    
    def calculate_lease_cost_analysis(self, monthly_rent: float, cam_fee: float = 0) -> Dict[str, float]:
        """
        Calculate lease cost analysis including CAM fees.
        
        Args:
            monthly_rent: Monthly rent amount
            cam_fee: Annual CAM fee (default: 0)
            
        Returns:
            Dict containing lease cost breakdown
        """
        annual_rent = monthly_rent * 12
        monthly_cam = cam_fee / 12 if cam_fee > 0 else 0
        total_monthly_cost = monthly_rent + monthly_cam
        total_annual_cost = annual_rent + cam_fee
        
        lease_analysis = {
            'monthly_rent': monthly_rent,
            'annual_rent': annual_rent,
            'monthly_cam': monthly_cam,
            'annual_cam': cam_fee,
            'total_monthly_cost': total_monthly_cost,
            'total_annual_cost': total_annual_cost,
            'cam_percentage': (cam_fee / annual_rent * 100) if annual_rent > 0 else 0
        }
        
        logger.info(f"Lease cost analysis: Monthly ${total_monthly_cost:,.2f}, Annual ${total_annual_cost:,.2f}")
        return lease_analysis
    
    def calculate_insurance_coverage_metrics(self) -> Dict[str, Any]:
        """
        Calculate insurance coverage metrics from business rules.
        
        Returns:
            Dict containing insurance coverage analysis
        """
        insurance_config = self.business_rules.get('insurance_coverage', {})
        primary_insurers = insurance_config.get('primary_insurers', [])
        
        # Calculate years of coverage for each insurer
        current_year = datetime.now().year
        insurance_metrics = {
            'total_insurers': len(primary_insurers),
            'insurers': [],
            'total_years_coverage': 0,
            'average_years_per_insurer': 0,
            'coverage_stability_score': 0
        }
        
        total_years = 0
        for insurer in primary_insurers:
            contract_date = insurer.get('contract_date', '')
            if contract_date:
                try:
                    contract_year = int(contract_date.split('-')[0])
                    years_active = current_year - contract_year
                    total_years += years_active
                    
                    insurer_info = {
                        'name': insurer.get('name', ''),
                        'years_active': years_active,
                        'contract_date': contract_date,
                        'status': insurer.get('status', ''),
                        'coverage_type': insurer.get('coverage_type', '')
                    }
                    insurance_metrics['insurers'].append(insurer_info)
                except (ValueError, IndexError):
                    logger.warning(f"Invalid contract date format: {contract_date}")
        
        insurance_metrics['total_years_coverage'] = total_years
        if len(primary_insurers) > 0:
            insurance_metrics['average_years_per_insurer'] = total_years / len(primary_insurers)
            # Stability score: higher is better (more years = more stable)
            insurance_metrics['coverage_stability_score'] = min(100, (total_years / len(primary_insurers)) * 10)
        
        logger.info(f"Insurance coverage analysis: {len(primary_insurers)} insurers, {total_years} total years coverage")
        return insurance_metrics
    
    def _format_percentage(self, value: float) -> str:
        """Format value as percentage."""
        return f"{value:.1f}%"
        
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
        
        # Calculate new landing page metrics
        landing_page_metrics = self._calculate_landing_page_metrics()
        self.metrics['landing_page'] = landing_page_metrics
        
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
            total_revenue_sum = self._safe_float_conversion(df['total_price'].sum())
            sales_metrics['total_revenue'] = Decimal(str(total_revenue_sum)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
            sales_metrics['total_transactions'] = len(df)
            
            avg_transaction = self._safe_float_conversion(df['total_price'].mean())
            sales_metrics['average_transaction_value'] = Decimal(str(avg_transaction)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
            
            median_transaction = self._safe_float_conversion(df['total_price'].median())
            sales_metrics['median_transaction_value'] = Decimal(str(median_transaction)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
            
            # Revenue distribution
            sales_metrics['revenue_percentiles'] = {
                '25th': Decimal(str(self._safe_float_conversion(df['total_price'].quantile(0.25)))).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP),
                '50th': Decimal(str(self._safe_float_conversion(df['total_price'].quantile(0.50)))).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP),
                '75th': Decimal(str(self._safe_float_conversion(df['total_price'].quantile(0.75)))).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP),
                '90th': Decimal(str(self._safe_float_conversion(df['total_price'].quantile(0.90)))).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP),
                '95th': Decimal(str(self._safe_float_conversion(df['total_price'].quantile(0.95)))).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
            }
            
            # Location performance
            if 'clinic_name' in df.columns and not df['clinic_name'].isna().all():
                location_metrics = df.groupby('clinic_name').agg({
                    'total_price': ['sum', 'count', 'mean'],
                    'patient_id_hash': 'nunique'
                }).round(2)
            else:
                location_metrics = pd.DataFrame()
            
            sales_metrics['location_performance'] = {}
            for location in getattr(location_metrics, 'index', []):
                location_revenue = self._safe_float_conversion(location_metrics.loc[location, ('total_price', 'sum')])
                location_avg = self._safe_float_conversion(location_metrics.loc[location, ('total_price', 'mean')])
                
                sales_metrics['location_performance'][location] = {
                    'total_revenue': Decimal(str(location_revenue)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP),
                    'transaction_count': int(location_metrics.loc[location, ('total_price', 'count')]),
                    'average_transaction': Decimal(str(location_avg)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP),
                    'unique_patients': int(location_metrics.loc[location, ('patient_id_hash', 'nunique')])
                }
            
            # Staff performance
            if 'staff_name' in df.columns and not df['staff_name'].isna().all():
                staff_metrics = df.groupby('staff_name').agg({
                    'total_price': ['sum', 'count', 'mean'],
                    'patient_id_hash': 'nunique'
                }).round(2)
            else:
                staff_metrics = pd.DataFrame()
            
            sales_metrics['staff_performance'] = {}
            for staff in getattr(staff_metrics, 'index', []):
                staff_revenue = self._safe_float_conversion(staff_metrics.loc[staff, ('total_price', 'sum')])
                staff_avg = self._safe_float_conversion(staff_metrics.loc[staff, ('total_price', 'mean')])
                
                sales_metrics['staff_performance'][staff] = {
                    'total_revenue': Decimal(str(staff_revenue)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP),
                    'transaction_count': int(staff_metrics.loc[staff, ('total_price', 'count')]),
                    'average_transaction': Decimal(str(staff_avg)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP),
                    'unique_patients': int(staff_metrics.loc[staff, ('patient_id_hash', 'nunique')])
                }
            
            # Time-based analysis
            if 'year' in df.columns:
                yearly_metrics = df.groupby('year').agg({
                    'total_price': ['sum', 'count', 'mean'],
                    'patient_id_hash': 'nunique'
                }).round(2)
                
                sales_metrics['yearly_performance'] = {}
                for year in yearly_metrics.index:
                    year_revenue = self._safe_float_conversion(yearly_metrics.loc[year, ('total_price', 'sum')])
                    year_avg = self._safe_float_conversion(yearly_metrics.loc[year, ('total_price', 'mean')])
                    
                    sales_metrics['yearly_performance'][str(year)] = {
                        'total_revenue': Decimal(str(year_revenue)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP),
                        'transaction_count': int(yearly_metrics.loc[year, ('total_price', 'count')]),
                        'average_transaction': Decimal(str(year_avg)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP),
                        'unique_patients': int(yearly_metrics.loc[year, ('patient_id_hash', 'nunique')])
                    }
                
                # Calculate growth rates
                years = sorted(yearly_metrics.index)
                growth_rates = {}
                for i in range(1, len(years)):
                    current_year = years[i]
                    previous_year = years[i-1]
                    current_revenue = self._safe_float_conversion(yearly_metrics.loc[current_year, ('total_price', 'sum')])
                    previous_revenue = self._safe_float_conversion(yearly_metrics.loc[previous_year, ('total_price', 'sum')])
                    
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
                    category_revenue = self._safe_float_conversion(product_metrics.loc[category, ('total_price', 'sum')])
                    category_avg = self._safe_float_conversion(product_metrics.loc[category, ('total_price', 'mean')])
                    
                    sales_metrics['product_category_performance'][category] = {
                        'total_revenue': Decimal(str(category_revenue)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP),
                        'transaction_count': int(product_metrics.loc[category, ('total_price', 'count')]),
                        'average_transaction': Decimal(str(category_avg)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
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
        pnl_monthly_revenue_avg = self._calculate_monthly_revenue_average_from_pnl(normalized_data)
        logger.info(f"P&L monthly revenue average calculation result: ${pnl_monthly_revenue_avg:,.2f}")
        
        # Determine revenue source and calculate metrics
        if pnl_monthly_revenue_avg > 0:
            # Use P&L-based revenue calculation (preferred - has missing data detection)
            monthly_revenue_avg = round_currency(pnl_monthly_revenue_avg)
            total_revenue = safe_currency_multiplication(monthly_revenue_avg, months_in_period)
            logger.info(f"Using P&L-based revenue calculation with missing data detection: ${total_revenue:,.2f} total (${monthly_revenue_avg:,.2f} monthly avg * {months_in_period} months)")
        elif sales_metrics:
            # Fallback to sales-based revenue calculation
            sales_revenue = sales_metrics.get('total_revenue', 0)
            total_revenue = round_currency(sales_revenue)
            monthly_revenue_avg = safe_currency_division(total_revenue, months_in_period)
            logger.info(f"Using sales-based revenue calculation: ${total_revenue:,.2f} total (${monthly_revenue_avg:,.2f} monthly avg)")
        else:
            # No revenue data available
            total_revenue = 0.0
            monthly_revenue_avg = 0.0
            logger.warning("No revenue data available from P&L or sales data")
        
        # Calculate revenue metrics with lineage tracking
        financial_metrics['revenue_metrics'] = self._calculate_revenue_metrics_with_lineage(
            total_revenue, monthly_revenue_avg, months_in_period
        )
        
        # Add analysis period dates for json_loader
        if analysis_period:
            financial_metrics['start_date'] = analysis_period.get('start_date')
            financial_metrics['end_date'] = analysis_period.get('end_date')
        
        logger.info(f"Final revenue metrics: {financial_metrics['revenue_metrics']}")
        
        # Calculate EBITDA metrics with lineage tracking
        profitability_metrics = self._calculate_ebitda_metrics_with_lineage(
            real_ebitda, total_revenue, months_in_period
        )
        financial_metrics['profitability'] = profitability_metrics
        
        # Calculate ROI and payback metrics with lineage tracking
        investment_metrics = self._calculate_investment_metrics_with_lineage(profitability_metrics)
        financial_metrics['investment_metrics'] = investment_metrics
        
        return financial_metrics
    
    def _calculate_revenue_metrics_with_lineage(self, total_revenue: float, monthly_revenue_avg: float, months_in_period: int) -> Dict[str, Any]:
        """Calculate revenue metrics with detailed lineage tracking."""
        # Start tracking annual revenue projection calculation
        self.lineage_tracker.start_calculation(
            "annual_revenue_projection",
            "Calculate annual revenue projection from monthly average"
        )
        
        # Log input values
        self.lineage_tracker.add_step("input", "total_revenue", total_revenue, "Total revenue from analysis period")
        self.lineage_tracker.add_step("input", "monthly_revenue_average", monthly_revenue_avg, "Average monthly revenue")
        self.lineage_tracker.add_step("input", "months_in_period", months_in_period, "Number of months in analysis period")
        
        # Calculate annual revenue projection
        if monthly_revenue_avg > 0:
            annual_revenue_projection = safe_currency_multiplication(monthly_revenue_avg, 12)
            self.lineage_tracker.add_annualize_step(
                "monthly_revenue_average",
                annual_revenue_projection,
                factor=12,
                description="Annualize monthly revenue average (monthly_avg * 12)"
            )
        else:
            annual_revenue_projection = 0.0
            self.lineage_tracker.add_step("fallback", "annual_revenue_projection", 0.0, "No revenue data available, using 0")
        
        # Finish calculation
        self.lineage_tracker.finish_calculation(annual_revenue_projection)
        
        logger.info(f"Annual revenue projection calculated with lineage: ${annual_revenue_projection:,.2f}")
        
        return {
            'total_revenue': total_revenue,
            'annual_revenue_projection': annual_revenue_projection,
            'monthly_revenue_average': monthly_revenue_avg,
            'analysis_period_months': months_in_period
        }
    
    def _calculate_ebitda_metrics_with_lineage(self, real_ebitda: Optional[float], total_revenue: float, months_in_period: int) -> Dict[str, Any]:
        """Calculate EBITDA metrics with detailed lineage tracking."""
        # Start tracking EBITDA margin calculation
        self.lineage_tracker.start_calculation(
            "ebitda_margin",
            "Calculate EBITDA margin from financial data"
        )
        
        # Calculate monthly revenue average for consistent units
        monthly_revenue_avg = total_revenue / months_in_period if months_in_period > 0 else 0
        self.lineage_tracker.add_divide_step(
            "total_revenue",
            monthly_revenue_avg,
            divisor=months_in_period,
            description="Calculate monthly revenue average from total revenue"
        )
        
        if real_ebitda is not None:
            # Use real EBITDA from financial data
            estimated_ebitda = real_ebitda
            ebitda_margin = real_ebitda / monthly_revenue_avg if monthly_revenue_avg > 0 else 0
            
            self.lineage_tracker.add_step("input", "real_ebitda", real_ebitda, "Real EBITDA from financial data")
            self.lineage_tracker.add_divide_step(
                "real_ebitda",
                ebitda_margin,
                divisor=monthly_revenue_avg,
                description="Calculate EBITDA margin (real_ebitda / monthly_revenue_avg)"
            )
            
            logger.info(f"Using real EBITDA from financial data: ${estimated_ebitda:,.2f} monthly")
        else:
            # Use estimated EBITDA with margin from business rules
            ebitda_margin = self.business_rules.get('financial_metrics', {}).get('ebitda_margin_target', 0.25)
            estimated_ebitda = safe_currency_multiplication(monthly_revenue_avg, ebitda_margin)
            
            self.lineage_tracker.add_step("input", "ebitda_margin_target", ebitda_margin, "EBITDA margin from business rules")
            self.lineage_tracker.add_multiply_step(
                "monthly_revenue_avg",
                estimated_ebitda,
                factor=ebitda_margin,
                description="Calculate estimated EBITDA (monthly_revenue_avg * ebitda_margin)"
            )
            
            logger.info(f"Using estimated EBITDA with {ebitda_margin:.1%} margin: ${estimated_ebitda:,.2f} monthly")
        
        # Finish EBITDA margin calculation
        self.lineage_tracker.finish_calculation(round(ebitda_margin * 100, 2))
        
        # Start tracking annual EBITDA calculation
        self.lineage_tracker.start_calculation(
            "estimated_annual_ebitda",
            "Calculate estimated annual EBITDA"
        )
        
        # Calculate annual EBITDA projection
        annual_ebitda = safe_currency_multiplication(estimated_ebitda, 12)
        self.lineage_tracker.add_annualize_step(
            "estimated_ebitda",
            annual_ebitda,
            factor=12,
            description="Annualize monthly EBITDA (monthly_ebitda * 12)"
        )
        
        # Finish annual EBITDA calculation
        self.lineage_tracker.finish_calculation(annual_ebitda)
        
        logger.info(f"EBITDA metrics calculated with lineage: margin={ebitda_margin:.1%}, annual=${annual_ebitda:,.2f}")
        
        return {
            'estimated_ebitda': estimated_ebitda,
            'ebitda_margin': round(ebitda_margin * 100, 2),  # Round to 2 decimal places
            'estimated_annual_ebitda': annual_ebitda
        }
    
    def _calculate_investment_metrics_with_lineage(self, profitability_metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate ROI and payback period metrics with detailed lineage tracking."""
        # Start tracking ROI calculation
        self.lineage_tracker.start_calculation(
            "roi_percentage",
            "Calculate ROI percentage from annual EBITDA and asking price"
        )
        
        # Get asking price
        asking_price = self._parse_asking_price()
        self.lineage_tracker.add_step("input", "asking_price", asking_price, "Asking price from business rules")
        
        # Get annual EBITDA
        annual_ebitda = profitability_metrics.get('estimated_annual_ebitda', 0)
        self.lineage_tracker.add_step("input", "estimated_annual_ebitda", annual_ebitda, "Annual EBITDA from profitability metrics")
        
        # Calculate ROI percentage
        if asking_price > 0:
            # First calculate ROI ratio
            roi_ratio = annual_ebitda / asking_price
            self.lineage_tracker.add_divide_step(
                "estimated_annual_ebitda",
                roi_ratio,
                divisor=asking_price,
                description="Calculate ROI ratio (annual_ebitda / asking_price)"
            )
            # Then convert to percentage
            roi = roi_ratio * 100
            self.lineage_tracker.add_multiply_step(
                "roi_ratio",
                roi,
                factor=100,
                description="Convert ROI ratio to percentage (roi_ratio * 100)"
            )
        else:
            roi = 0
            self.lineage_tracker.add_step("fallback", "roi_percentage", 0, "Asking price is 0, ROI set to 0")
        
        # Finish ROI calculation
        self.lineage_tracker.finish_calculation(round(roi, 2))
        
        # Start tracking payback period calculation
        self.lineage_tracker.start_calculation(
            "payback_period_years",
            "Calculate payback period in years"
        )
        
        # Calculate payback period
        if annual_ebitda > 0:
            payback_years = asking_price / annual_ebitda
            self.lineage_tracker.add_divide_step(
                "asking_price",
                payback_years,
                divisor=annual_ebitda,
                description="Calculate payback period (asking_price / annual_ebitda)"
            )
        else:
            payback_years = 0
            self.lineage_tracker.add_step("fallback", "payback_period_years", 0, "Annual EBITDA is 0, payback period set to 0")
        
        # Finish payback period calculation
        self.lineage_tracker.finish_calculation(round(payback_years, 1))
        
        logger.info(f"Investment metrics calculated with lineage: ROI={roi:.2f}%, Payback={payback_years:.1f} years")
        
        return {
            'asking_price': asking_price,  # Single source of truth
            'estimated_annual_ebitda': annual_ebitda,
            'roi_percentage': round(roi, 2),  # Round to 2 decimal places
            'payback_period_years': round(payback_years, 1)  # Round to 1 decimal place, clearly in years
        }
    
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
            unique_patients = df['patient_id_hash'].nunique()
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
                    'patient_id_hash': 'nunique'
                })
                
                operational_metrics['staff_efficiency'] = {}
                for staff in staff_efficiency.index:
                    revenue = staff_efficiency.loc[staff, ('total_price', 'sum')]
                    transactions = staff_efficiency.loc[staff, ('total_price', 'count')]
                    patients = staff_efficiency.loc[staff, ('patient_id_hash', 'nunique')]
                    
                    operational_metrics['staff_efficiency'][staff] = {
                        'revenue_per_transaction': revenue / transactions if transactions > 0 else 0,
                        'revenue_per_patient': revenue / patients if patients > 0 else 0,
                        'transactions_per_patient': transactions / patients if patients > 0 else 0
                    }
            
            # Location efficiency
            if 'clinic_name' in df.columns:
                location_efficiency = df.groupby('clinic_name').agg({
                    'total_price': ['sum', 'count'],
                    'patient_id_hash': 'nunique'
                })
                
                operational_metrics['location_efficiency'] = {}
                for location in location_efficiency.index:
                    revenue = location_efficiency.loc[location, ('total_price', 'sum')]
                    transactions = location_efficiency.loc[location, ('total_price', 'count')]
                    patients = location_efficiency.loc[location, ('patient_id_hash', 'nunique')]
                    
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
        
        # Use consistent asking price from single source
        asking_price = self._parse_asking_price()
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
            # Start tracking this calculation
            self.lineage_tracker.start_calculation(
                "monthly_ebitda",
                "Calculate monthly EBITDA from financial data"
            )
            
            # Debug: Log what data we're receiving
            logger.info(f"Normalized data keys: {list(normalized_data.keys())}")
            
            # Check if we have P&L data (it's directly under normalized_data, not under 'financial')
            if 'profit_loss' not in normalized_data:
                logger.warning("No P&L data available for real EBITDA calculation")
                self.lineage_tracker.finish_calculation(0)
                return None
            
            pnl_data = normalized_data.get('profit_loss', {})
            logger.info(f"P&L data keys: {list(pnl_data.keys())}")
            
            if not pnl_data:
                logger.warning("No P&L data available for real EBITDA calculation")
                self.lineage_tracker.finish_calculation(0)
                return None
            
            # Prioritize P&L data for EBITDA calculation since it has actual expense breakdown
            logger.info("Using P&L data for EBITDA calculation with field-level tracking...")
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
                
                # Track individual field contributions for lineage
                revenue_contributions = []
                included_expense_contributions = []
                excluded_expense_contributions = []
                
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
                        revenue_amount = self._safe_float_conversion(row['Pennsylvania'])
                        monthly_revenue += revenue_amount
                        revenue_contributions.append({
                            'field_name': 'Pennsylvania',
                            'raw_value': revenue_amount,
                            'description': f"Revenue from {row['Unnamed: 0']} - Pennsylvania column"
                        })
                        logger.info(f"  Revenue (PA sale locations only): {row['Unnamed: 0']} = ${revenue_amount:,.2f}")
                    elif 'Cranberry' in df.columns and 'West View' in df.columns:
                        # 2024/2025 data structure: Cranberry, Virginia, West View
                        # Only include Cranberry + West View (sale locations), exclude Virginia
                        cranberry_revenue = self._safe_float_conversion(row.get('Cranberry', 0))
                        west_view_revenue = self._safe_float_conversion(row.get('West View', 0))
                        revenue_amount = cranberry_revenue + west_view_revenue
                        if revenue_amount != 0:
                            monthly_revenue += revenue_amount
                            revenue_contributions.append({
                                'field_name': 'Cranberry + West View',
                                'raw_value': revenue_amount,
                                'description': f"Revenue from {row['Unnamed: 0']} - Cranberry + West View columns"
                            })
                            logger.info(f"  Revenue (sale locations only): {row['Unnamed: 0']} = ${revenue_amount:,.2f} (Cranberry: ${cranberry_revenue:,.2f}, West View: ${west_view_revenue:,.2f})")
                    elif pd.notna(row.get('TOTAL')) and row.get('TOTAL') != 0:
                        # Fallback to TOTAL if neither structure is available
                        # WARNING: This includes all locations, not just sale locations
                        revenue_amount = self._safe_float_conversion(row['TOTAL'])
                        monthly_revenue += revenue_amount
                        revenue_contributions.append({
                            'field_name': 'TOTAL',
                            'raw_value': revenue_amount,
                            'description': f"Revenue from {row['Unnamed: 0']} - TOTAL column (includes all locations)"
                        })
                        logger.warning(f"  Revenue (TOTAL fallback - includes all locations): {row['Unnamed: 0']} = ${revenue_amount:,.2f}")
                
                # Find ALL expenses for comprehensive analysis
                all_expense_rows = df[df['Unnamed: 0'].str.contains('Salaries|Wages|Rent|Insurance|Utilities|Office|Marketing|Professional|Payroll|Employee|Equipment|Supplies|Telephone|Travel|Training|Legal|Accounting|Interest|Tax|Depreciation|Amortization|COGS|Cost|Expense', case=False, na=False)]
                
                for _, row in all_expense_rows.iterrows():
                    # Handle different column structures across years - ONLY include sale locations
                    if 'Pennsylvania' in df.columns and pd.notna(row.get('Pennsylvania')) and row.get('Pennsylvania') != 0:
                        # 2023 data structure: Pennsylvania, Virginia, Unclassified
                        # Only use Pennsylvania column (sale locations only)
                        expense_name = row['Unnamed: 0']
                        expense_amount = self._safe_float_conversion(row['Pennsylvania'])
                        
                        # Track all expenses by category
                        all_expense_categories[expense_name] += expense_amount
                        monthly_total_expenses += expense_amount
                        
                        # For EBITDA: exclude Interest, Income Tax, Corporate Tax, Depreciation, Amortization (but allow Payroll Tax)
                        is_excluded = any(exclude in expense_name for exclude in ['Interest', 'Income Tax', 'Corporate Tax', 'Depreciation', 'Amortization', 'Total', 'Summary'])
                        
                        if is_excluded:
                            excluded_expense_contributions.append({
                                'field_name': expense_name,
                                'raw_value': expense_amount,
                                'description': f"Excluded from EBITDA: {expense_name} - Pennsylvania column"
                            })
                        else:
                            monthly_operational_expenses += expense_amount
                            included_expense_contributions.append({
                                'field_name': expense_name,
                                'raw_value': expense_amount,
                                'description': f"Included in EBITDA: {expense_name} - Pennsylvania column"
                            })
                    elif 'Cranberry' in df.columns and 'West View' in df.columns:
                        # 2024/2025 data structure: Cranberry, Virginia, West View
                        # Only include Cranberry + West View (sale locations), exclude Virginia
                        expense_name = row['Unnamed: 0']
                        cranberry_expense = self._safe_float_conversion(row.get('Cranberry', 0))
                        west_view_expense = self._safe_float_conversion(row.get('West View', 0))
                        expense_amount = cranberry_expense + west_view_expense
                        
                        if expense_amount != 0:
                            # Track all expenses by category
                            all_expense_categories[expense_name] += expense_amount
                            monthly_total_expenses += expense_amount
                            
                            # For EBITDA: exclude Interest, Tax, Depreciation, Amortization
                            is_excluded = any(exclude in expense_name for exclude in ['Interest', 'Tax', 'Depreciation', 'Amortization', 'Total', 'Summary'])
                            
                            if is_excluded:
                                excluded_expense_contributions.append({
                                    'field_name': expense_name,
                                    'raw_value': expense_amount,
                                    'description': f"Excluded from EBITDA: {expense_name} - Cranberry + West View columns"
                                })
                            else:
                                monthly_operational_expenses += expense_amount
                                included_expense_contributions.append({
                                    'field_name': expense_name,
                                    'raw_value': expense_amount,
                                    'description': f"Included in EBITDA: {expense_name} - Cranberry + West View columns"
                                })
                    elif pd.notna(row.get('TOTAL')) and row.get('TOTAL') != 0:
                        # Fallback to TOTAL if neither structure is available
                        # WARNING: This includes all locations, not just sale locations
                        expense_name = row['Unnamed: 0']
                        expense_amount = self._safe_float_conversion(row['TOTAL'])
                        
                        # Track all expenses by category
                        all_expense_categories[expense_name] += expense_amount
                        monthly_total_expenses += expense_amount
                        
                        # For EBITDA: exclude Interest, Income Tax, Corporate Tax, Depreciation, Amortization (but allow Payroll Tax)
                        is_excluded = any(exclude in expense_name for exclude in ['Interest', 'Income Tax', 'Corporate Tax', 'Depreciation', 'Amortization', 'Total', 'Summary'])
                        
                        if is_excluded:
                            excluded_expense_contributions.append({
                                'field_name': expense_name,
                                'raw_value': expense_amount,
                                'description': f"Excluded from EBITDA: {expense_name} - TOTAL column (includes all locations)"
                            })
                        else:
                            monthly_operational_expenses += expense_amount
                            included_expense_contributions.append({
                                'field_name': expense_name,
                                'raw_value': expense_amount,
                                'description': f"Included in EBITDA: {expense_name} - TOTAL column (includes all locations)"
                            })
                
                # Calculate monthly EBITDA (operational expenses only)
                if monthly_revenue > 0:
                    monthly_ebitda = monthly_revenue - monthly_operational_expenses
                    monthly_ebitdas.append(monthly_ebitda)
                    if month_key:
                        found_months.append(month_key)
                        monthly_ebitdas_dict[month_key] = monthly_ebitda
                    
                    # Track all field contributions in lineage
                    # Revenue contributions
                    for contribution in revenue_contributions:
                        self.lineage_tracker.add_file_contribution(
                            file_name=pnl_key,
                            field_name=contribution['field_name'],
                            raw_value=contribution['raw_value'],
                            normalized_value=contribution['raw_value'],
                            description=contribution['description']
                        )
                    
                    # Included expense contributions
                    for contribution in included_expense_contributions:
                        self.lineage_tracker.add_file_contribution(
                            file_name=pnl_key,
                            field_name=contribution['field_name'],
                            raw_value=contribution['raw_value'],
                            normalized_value=-contribution['raw_value'],  # Negative for expenses
                            description=contribution['description']
                        )
                    
                    # Excluded expense contributions (for transparency)
                    for contribution in excluded_expense_contributions:
                        self.lineage_tracker.add_file_contribution(
                            file_name=pnl_key,
                            field_name=contribution['field_name'],
                            raw_value=contribution['raw_value'],
                            normalized_value=0,  # Zero impact on EBITDA
                            description=contribution['description']
                        )
                    
                    # Add the final EBITDA calculation step
                    self.lineage_tracker.add_step(
                        "calculate",
                        "monthly_ebitda",
                        monthly_ebitda,
                        f"EBITDA calculation: Revenue ${monthly_revenue:,.2f} - Operational Expenses ${monthly_operational_expenses:,.2f} = ${monthly_ebitda:,.2f}"
                    )
                    
                    logger.info(f"Monthly EBITDA for {pnl_key}: ${monthly_ebitda:,.2f} (Revenue: ${monthly_revenue:,.2f}, Op Expenses: ${monthly_operational_expenses:,.2f}, Total Expenses: ${monthly_total_expenses:,.2f})")
            
            # Identify missing months for EBITDA calculation
            if expected_months and monthly_ebitdas_dict:
                missing_months = [month for month in expected_months if month not in found_months]
                if missing_months:
                    logger.warning(f"MISSING EBITDA DATA: {len(missing_months)} months missing from P&L data")
                    for missing_month in missing_months:
                        logger.warning(f"  Missing EBITDA data: {missing_month}")
                    
                    # Calculate average monthly EBITDA from available data
                    avg_monthly_ebitda = sum(monthly_ebitdas_dict.values()) / len(monthly_ebitdas_dict)
                    logger.info(f"Using average monthly EBITDA (${avg_monthly_ebitda:,.2f}) for {len(missing_months)} missing months")
                    
                    # Add estimated EBITDA for missing months
                    for missing_month in missing_months:
                        monthly_ebitdas.append(avg_monthly_ebitda)
                        monthly_ebitdas_dict[missing_month] = avg_monthly_ebitda
                    
                    logger.info(f"Added estimated EBITDA: ${avg_monthly_ebitda * len(missing_months):,.2f} for missing months")
                    logger.info(f"Total EBITDA with estimates: ${sum(monthly_ebitdas):,.2f} from {len(monthly_ebitdas)} months ({len(found_months)} actual + {len(missing_months)} estimated)")
                else:
                    logger.info("All expected months found in EBITDA calculation")
            
            if monthly_ebitdas:
                # Calculate average monthly EBITDA (already filtered to sale locations only)
                avg_monthly_ebitda = sum(monthly_ebitdas) / len(monthly_ebitdas)
                logger.info(f"Average monthly EBITDA (sale locations only): ${avg_monthly_ebitda:,.2f} (from {len(monthly_ebitdas)} months)")
                
                # Log comprehensive expense analysis
                logger.info(f"Comprehensive expense analysis - Top 10 expense categories:")
                sorted_expenses = sorted(all_expense_categories.items(), key=lambda x: x[1], reverse=True)
                for expense_name, total_amount in sorted_expenses[:10]:
                    logger.info(f"  {expense_name}: ${total_amount:,.2f}")
                
                # Finish calculation
                self.lineage_tracker.finish_calculation(avg_monthly_ebitda)
                return avg_monthly_ebitda
            else:
                logger.warning("No valid P&L data found for EBITDA calculation, falling back to sales data...")
                
                # Fallback to sales data if P&L calculation failed
                sales_data = normalized_data.get('sales', {})
                if 'main_sales' in sales_data:
                    df = sales_data['main_sales'].copy()
                    
                    # Calculate monthly revenue from sales data (already filtered to sale locations)
                    df['sale_date'] = pd.to_datetime(df['sale_date'])
                    monthly_revenue = df.groupby(df['sale_date'].dt.to_period('M'))['total_price'].sum()
                    
                    if len(monthly_revenue) > 0:
                        avg_monthly_revenue = round_currency(monthly_revenue.mean())
                        logger.info(f"Average monthly revenue from sales data: ${avg_monthly_revenue:,.2f}")
                        
                        # Track file-level contribution for sales data
                        total_sales_revenue = df['total_price'].sum()
                        self.lineage_tracker.add_file_contribution(
                            file_name="sales_transactions.csv",
                            field_name="total_price",
                            raw_value=total_sales_revenue,
                            normalized_value=avg_monthly_revenue,
                            description="Sales transaction aggregation by month"
                        )
                        
                        # Log the revenue calculation step
                        self.lineage_tracker.add_step("aggregate", "total_price", avg_monthly_revenue, 
                                                    "Calculate average monthly revenue from sales data")
                        
                        # Use the EBITDA margin from business rules (website shows 25.6%)
                        ebitda_margin = self.business_rules.get('financial_metrics', {}).get('ebitda_margin_target', 0.256)
                        calculated_monthly_ebitda = safe_currency_multiplication(avg_monthly_revenue, ebitda_margin)
                        
                        # Track file-level contribution for EBITDA calculation
                        self.lineage_tracker.add_file_contribution(
                            file_name="sales_transactions.csv",
                            field_name="total_price",
                            raw_value=avg_monthly_revenue,
                            normalized_value=calculated_monthly_ebitda,
                            description=f"EBITDA calculation from sales data using {ebitda_margin:.1%} margin"
                        )
                        
                        # Log the EBITDA calculation step
                        self.lineage_tracker.add_multiply_step(
                            "avg_monthly_revenue", 
                            calculated_monthly_ebitda, 
                            factor=ebitda_margin,
                            description=f"Apply EBITDA margin of {ebitda_margin:.1%}"
                        )
                        
                        logger.info(f"Calculated monthly EBITDA using {ebitda_margin:.1%} margin: ${calculated_monthly_ebitda:,.2f}")
                        
                        # Finish calculation
                        self.lineage_tracker.finish_calculation(calculated_monthly_ebitda)
                        return calculated_monthly_ebitda
                    else:
                        logger.warning("No sales data available for EBITDA calculation")
                        # Finish calculation before returning None to maintain consistent state
                        self.lineage_tracker.finish_calculation(None)
                        return None
                else:
                    logger.warning("No sales data available for EBITDA calculation")
                    # Finish calculation before returning None to maintain consistent state
                    self.lineage_tracker.finish_calculation(None)
                    return None
                
        except Exception as e:
            logger.exception("Error calculating real EBITDA from financial data")
            return None
        finally:
            # Ensure calculation is always finished, using safe call to avoid race conditions
            try:
                self.lineage_tracker.finish_calculation(0)
            except RuntimeError:
                # Ignore RuntimeError from double-finishing or race conditions
                pass
    
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
    
    def _calculate_monthly_revenue_average_from_pnl(self, normalized_data: Dict[str, Any]) -> float:
        """Calculate monthly revenue average from P&L data with missing data detection and fallback.
        
        Returns:
            float: Monthly revenue average (not total revenue)
        """
        try:
            # Start tracking P&L revenue calculation
            self.lineage_tracker.start_calculation(
                "pnl_monthly_revenue_average",
                "Calculate monthly revenue average from P&L data with file-level contributions"
            )
            
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
                # Look for various sales line item patterns to handle different P&L formats
                # Handle different column structures across years
                if 'Unnamed: 0' not in df.columns:
                    logger.warning(f"  Skipping P&L {pnl_key} - missing 'Unnamed: 0' column")
                    continue
                
                # Try multiple patterns to find sales revenue
                sales_patterns = [
                    'Total 5017 · Sales',  # Most common format
                    '^5017 · Sales$',      # Exact match
                    '^5017 · Sales - Other$',  # Alternative format
                    '5017 · Sales'         # General pattern (fallback)
                ]
                
                monthly_revenue = 0
                sales_row = None
                
                for pattern in sales_patterns:
                    if pattern.startswith('^') and pattern.endswith('$'):
                        # Regex pattern
                        sales_row = df[df['Unnamed: 0'].str.contains(pattern, case=False, na=False, regex=True)]
                    else:
                        # Simple contains pattern
                        sales_row = df[df['Unnamed: 0'].str.contains(pattern, case=False, na=False)]
                    
                    if not sales_row.empty:
                        logger.debug(f"  Found sales row using pattern '{pattern}' for {pnl_key}")
                        break
                
                if not sales_row.empty:
                    logger.debug(f"  Processing sales row for {pnl_key}")
                    if 'Pennsylvania' in df.columns and pd.notna(sales_row['Pennsylvania'].iloc[0]):
                        # 2023 data structure: Pennsylvania, Virginia, Unclassified
                        # Only use Pennsylvania column (sale locations only)
                        pa_revenue = self._safe_float_conversion(sales_row['Pennsylvania'].iloc[0])
                        monthly_revenue = Decimal(str(pa_revenue)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
                        logger.debug(f"  Using Pennsylvania column (sale locations only): ${monthly_revenue:,.2f}")
                    elif 'Cranberry' in df.columns and 'West View' in df.columns:
                        # 2024/2025 data structure: Cranberry, Virginia, West View
                        # Only include Cranberry + West View (sale locations), exclude Virginia
                        cranberry_revenue = self._safe_float_conversion(sales_row['Cranberry'].iloc[0])
                        west_view_revenue = self._safe_float_conversion(sales_row['West View'].iloc[0])
                        cranberry_revenue = Decimal(str(cranberry_revenue)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
                        west_view_revenue = Decimal(str(west_view_revenue)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
                        monthly_revenue = cranberry_revenue + west_view_revenue
                        logger.debug(f"  Using Cranberry+West View (sale locations only): ${monthly_revenue:,.2f} (Cranberry: ${cranberry_revenue:,.2f}, West View: ${west_view_revenue:,.2f})")
                    else:
                        if 'TOTAL' in df.columns:
                            total_revenue = self._safe_float_conversion(sales_row['TOTAL'].iloc[0])
                            monthly_revenue = Decimal(str(total_revenue)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
                            logger.warning(f"  Using TOTAL column (includes all locations): ${monthly_revenue:,.2f}")
                        else:
                            logger.warning(f"  No suitable revenue columns found in {pnl_key}")
                            monthly_revenue = 0
                else:
                    logger.debug(f"  No sales revenue found for {pnl_key}")
                    monthly_revenue = 0
                
                if monthly_revenue > 0:
                    # Convert Decimal to float if needed
                    if isinstance(monthly_revenue, Decimal):
                        monthly_revenue = float(monthly_revenue)
                    
                    # Track file-level contribution for lineage
                    field_name = "Unknown"
                    raw_value = monthly_revenue
                    if 'Pennsylvania' in df.columns and pd.notna(sales_row['Pennsylvania'].iloc[0]):
                        field_name = "Pennsylvania"
                        raw_value = self._safe_float_conversion(sales_row['Pennsylvania'].iloc[0])
                    elif 'Cranberry' in df.columns and 'West View' in df.columns:
                        field_name = "Cranberry + West View"
                        cranberry_raw = self._safe_float_conversion(sales_row['Cranberry'].iloc[0])
                        west_view_raw = self._safe_float_conversion(sales_row['West View'].iloc[0])
                        raw_value = cranberry_raw + west_view_raw
                    elif 'TOTAL' in df.columns:
                        field_name = "TOTAL"
                        raw_value = self._safe_float_conversion(sales_row['TOTAL'].iloc[0])
                    
                    self.lineage_tracker.add_file_contribution(
                        file_name=pnl_key,
                        field_name=field_name,
                        raw_value=raw_value,
                        normalized_value=monthly_revenue,
                        description=f"Revenue from {pnl_key} - {field_name} column"
                    )
                    
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
                    logger.warning(f"MISSING DATA DETECTED: {len(missing_months)} months missing from P&L data")
                    for missing_month in missing_months:
                        logger.warning(f"  Missing: {missing_month}")
                    
                    # Calculate average monthly revenue from available data
                    if monthly_revenues:
                        avg_monthly_revenue = safe_currency_division(sum(monthly_revenues.values()), len(monthly_revenues))
                        logger.info(f"Using average monthly revenue (${avg_monthly_revenue:,.2f}) for {len(missing_months)} missing months")
                        
                        # Add estimated revenue for missing months
                        estimated_missing_revenue = safe_currency_multiplication(avg_monthly_revenue, len(missing_months))
                        total_revenue = round_currency(total_revenue + estimated_missing_revenue)
                        month_count += len(missing_months)
                        
                        logger.info(f"Added estimated revenue: ${estimated_missing_revenue:,.2f} for missing months")
                        logger.info(f"Total revenue with estimates: ${total_revenue:,.2f} from {month_count} months ({len(found_months)} actual + {len(missing_months)} estimated)")
                    else:
                        logger.error("No valid revenue data found to calculate averages for missing months")
                else:
                    logger.info("All expected months found in P&L data")
            
            # Calculate monthly average from actual data
            monthly_revenue_avg = safe_currency_division(total_revenue, month_count)
            logger.info(f"P&L monthly revenue average calculation complete: ${total_revenue:,.2f} total from {month_count} months (processed {processed_count}, skipped {skipped_count})")
            logger.info(f"Monthly revenue average: ${monthly_revenue_avg:,.2f}")
            
            # Finish the calculation tracking
            self.lineage_tracker.finish_calculation(monthly_revenue_avg)
            return monthly_revenue_avg
            
        except Exception as e:
            logger.exception("Error estimating revenue from P&L data")
            # Finish calculation with 0 value in case of error
            self.lineage_tracker.finish_calculation(0.0)
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
    
    def get_calculation_lineage(self) -> Dict[str, Any]:
        """Get calculation lineage for export to JSON."""
        return self.lineage_tracker.export_lineage_for_json()
    
    def clear_calculation_lineage(self) -> None:
        """Clear calculation lineage history."""
        self.lineage_tracker.clear_calculations()
    
    
    def _calculate_patient_retention(self, df: pd.DataFrame) -> float:
        """Calculate patient retention rate."""
        if 'patient_id_hash' not in df.columns or 'sale_date' not in df.columns:
            return 0
        
        # Group by patient and count unique months
        patient_months = df.groupby('patient_id_hash')['sale_date'].apply(
            lambda x: x.dt.to_period('M').nunique()
        )
        
        # Calculate retention rate (patients with more than 1 month of activity)
        retained_patients = self._safe_float_conversion((patient_months > 1).sum())
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
            total_revenue = self._safe_float_conversion(location_revenue.sum())
            
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
        """Calculate equipment metrics dynamically from CSV files with lineage tracking."""
        # Start tracking equipment value calculation
        self.lineage_tracker.start_calculation(
            "equipment_value",
            "Calculate total equipment value from CSV files"
        )
        
        try:
            # Import here to avoid circular imports
            from ..utils.equipment_calculator import get_equipment_metrics
            
            # Calculate equipment value from CSV files
            equipment_metrics = get_equipment_metrics()
            
            # Track equipment items and total value
            items = equipment_metrics.get('items', [])
            total_value = equipment_metrics.get('total_value', 0)
            
            self.lineage_tracker.add_step("input", "equipment_items_count", len(items), "Number of equipment items from CSV files")
            self.lineage_tracker.add_step("input", "equipment_source", "CSV files", "Equipment data source")
            
            # Calculate total value from individual items
            calculated_total = 0.0
            for i, item in enumerate(items):
                if isinstance(item, dict):
                    item_value = item.get('total_price', 0)
                    if isinstance(item_value, dict):
                        item_value = item_value.get('amount', 0)
                    calculated_total += float(item_value)
                    
                    # Log first few items for traceability
                    if i < 5:  # Log first 5 items
                        self.lineage_tracker.add_step("item", f"equipment_item_{i+1}", item_value, f"Equipment item: {item.get('name', 'Unknown')}")
            
            # Log remaining items count
            if len(items) > 5:
                self.lineage_tracker.add_step("summary", "remaining_items", len(items) - 5, f"Additional {len(items) - 5} equipment items")
            
            # Track total calculation
            self.lineage_tracker.add_sum_step(
                "equipment_items_total",
                calculated_total,
                "Sum of all equipment item values"
            )
            
            logger.info(f"Equipment value calculated from CSV files: ${total_value:,.2f}")
            logger.info(f"Equipment items: {len(items)}")
            
        except Exception as e:
            logger.error(f"Error calculating equipment metrics from CSV files: {e}")
            
            # Fallback to business rules if CSV calculation fails
            equipment_config = self.business_rules.get('equipment', {})
            fallback_value = equipment_config.get('total_value', 0)
            
            self.lineage_tracker.add_step("fallback", "equipment_source", "Business rules", "CSV calculation failed, using business rules fallback")
            self.lineage_tracker.add_step("input", "fallback_equipment_value", fallback_value, "Equipment value from business rules")
            
            equipment_metrics = {
                'total_value': fallback_value,
                'description': equipment_config.get('description', 'No equipment data available'),
                'source': 'Fallback from business rules',
                'items': [],
                'categories': {}
            }
            
            logger.warning("Using fallback equipment value from business rules")
        
        # Finish equipment value calculation
        final_value = equipment_metrics.get('total_value', 0)
        self.lineage_tracker.finish_calculation(final_value)
        
        logger.info(f"Equipment metrics calculated with lineage: ${final_value:,.2f}")
        
        return equipment_metrics
    
    def _calculate_landing_page_metrics(self) -> Dict[str, Any]:
        """Calculate landing page specific metrics."""
        logger.info("Calculating landing page metrics...")
        
        landing_page_metrics = {}
        
        # Get financial data for calculations
        financial_metrics = self.metrics.get('financial', {})
        annual_ebitda = financial_metrics.get('profitability', {}).get('estimated_annual_ebitda', 0)
        monthly_ebitda = financial_metrics.get('profitability', {}).get('estimated_ebitda', 0)
        
        # Calculate SDE (assuming no owner salary for now)
        sde = self.calculate_sde(annual_ebitda, 0)
        landing_page_metrics['sde'] = sde
        
        # Calculate monthly cash flow
        monthly_cash_flow = self.calculate_monthly_cash_flow(annual_ebitda)
        landing_page_metrics['monthly_cash_flow'] = monthly_cash_flow
        
        # Calculate lease cost analysis (using current lease terms)
        lease_analysis = self.calculate_lease_cost_analysis(2500, 1200)  # Current rent + CAM
        landing_page_metrics['lease_analysis'] = lease_analysis
        
        # Calculate insurance coverage metrics
        insurance_metrics = self.calculate_insurance_coverage_metrics()
        landing_page_metrics['insurance_coverage'] = insurance_metrics
        
        # Get location information from business rules
        location_info = self._get_location_information()
        landing_page_metrics['location_info'] = location_info
        
        # Get sale details from business rules
        sale_details = self.business_rules.get('sale_details', {})
        landing_page_metrics['sale_details'] = sale_details
        
        logger.info("Landing page metrics calculation completed")
        return landing_page_metrics
    
    def _get_location_information(self) -> Dict[str, Any]:
        """Extract location information from business rules configuration."""
        locations_config = self.business_rules.get('locations', {})
        
        # Derive location information dynamically from config
        total_locations = 0
        sale_locations = []
        non_sale_locations = []
        states = set()
        
        for location_key, location_data in locations_config.items():
            if isinstance(location_data, dict) and 'state' in location_data:
                # This is a state-level configuration
                state = location_data.get('state', '')
                states.add(state)
                
                # Count detailed locations within this state
                for detail_key, detail_data in location_data.items():
                    if (isinstance(detail_data, dict) and 
                        'name' in detail_data and 
                        'address' in detail_data):
                        # This is a detailed location
                        total_locations += 1
                        
                        if location_data.get('for_sale', False):
                            sale_locations.append(detail_data)
                        else:
                            non_sale_locations.append(detail_data)
        
        # Determine primary and secondary locations from sale locations
        primary_location = None
        secondary_location = None
        
        if sale_locations:
            # Find primary location (location_type = "primary")
            for location in sale_locations:
                if location.get('location_type') == 'primary':
                    primary_location = location
                    break
            
            # Find secondary/satellite location (location_type = "satellite")
            for location in sale_locations:
                if location.get('location_type') == 'satellite':
                    secondary_location = location
                    break
            
            # Fallback: if no location_type specified, use first two locations
            if not primary_location and len(sale_locations) >= 1:
                primary_location = sale_locations[0]
            if not secondary_location and len(sale_locations) >= 2:
                secondary_location = sale_locations[1]
        
        # Determine if any locations are for sale
        for_sale = any(
            location_data.get('for_sale', False) 
            for location_data in locations_config.values() 
            if isinstance(location_data, dict)
        )
        
        location_info = {
            'primary_location': primary_location,
            'secondary_location': secondary_location,
            'total_locations': total_locations,
            'sale_locations': sale_locations,
            'non_sale_locations': non_sale_locations,
            'states': list(states),
            'for_sale': for_sale
        }
        
        logger.info(f"Location information derived from config: {total_locations} total locations, {len(sale_locations)} for sale, states: {list(states)}")
        
        return location_info
