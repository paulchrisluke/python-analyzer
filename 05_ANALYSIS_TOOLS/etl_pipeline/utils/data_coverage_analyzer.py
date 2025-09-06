"""
Data coverage analyzer for due diligence reporting.
"""

import pandas as pd
from typing import Dict, Any, List, Optional
import logging
from pathlib import Path
from datetime import datetime, timedelta
import json

logger = logging.getLogger(__name__)

class DataCoverageAnalyzer:
    """Analyzes data coverage and identifies missing documents for due diligence."""
    
    def __init__(self, business_rules: Dict[str, Any]):
        """
        Initialize data coverage analyzer.
        
        Args:
            business_rules: Business rules configuration
        """
        self.business_rules = business_rules
        self.coverage_report = {}
        
    def analyze_comprehensive_coverage(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze comprehensive data coverage for due diligence.
        
        Args:
            raw_data: Raw extracted data from all sources
            
        Returns:
            Dict containing comprehensive coverage analysis
        """
        logger.info("Starting comprehensive data coverage analysis...")
        
        # Analyze sales data coverage
        sales_coverage = self._analyze_sales_coverage(raw_data.get('sales', {}))
        self.coverage_report['sales'] = sales_coverage
        
        # Analyze financial data coverage
        financial_coverage = self._analyze_financial_coverage(raw_data.get('financial', {}))
        self.coverage_report['financial'] = financial_coverage
        
        # Analyze equipment data coverage
        equipment_coverage = self._analyze_equipment_coverage(raw_data.get('equipment', {}))
        self.coverage_report['equipment'] = equipment_coverage
        
        # Generate overall due diligence readiness score
        due_diligence_score = self._calculate_due_diligence_score()
        self.coverage_report['due_diligence'] = due_diligence_score
        
        # Generate recommendations
        recommendations = self._generate_recommendations()
        self.coverage_report['recommendations'] = recommendations
        
        logger.info("Data coverage analysis completed")
        return self.coverage_report
    
    def _analyze_sales_coverage(self, sales_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze sales data coverage."""
        coverage = {
            'status': 'unknown',
            'completeness_score': 0,
            'missing_periods': [],
            'data_quality_issues': [],
            'coverage_details': {},
            'fallback_strategies': []
        }
        
        # Check if sales data exists and has the expected structure
        if not sales_data:
            coverage['status'] = 'no_data'
            coverage['data_quality_issues'].append('No sales data found')
            return coverage
        
        # Handle different data structures
        if 'main_sales' in sales_data:
            if 'data' in sales_data['main_sales']:
                # Raw data structure
                df = pd.DataFrame(sales_data['main_sales']['data'])
            else:
                # Normalized data structure
                df = sales_data['main_sales']
        else:
            coverage['status'] = 'no_data'
            coverage['data_quality_issues'].append('No main sales data found')
            return coverage
        
        # Get analysis period
        analysis_period = self.business_rules.get('analysis_period', {})
        start_date = pd.to_datetime(analysis_period.get('start_date', '2021-01-01'))
        end_date = pd.to_datetime(analysis_period.get('end_date', '2025-12-31'))
        
        # Ensure we have a DataFrame
        if not isinstance(df, pd.DataFrame):
            df = pd.DataFrame(df)
        
        # Convert date column
        if 'Sale Date' in df.columns:
            df['sale_date'] = pd.to_datetime(df['Sale Date'])
        elif 'sale_date' in df.columns:
            df['sale_date'] = pd.to_datetime(df['sale_date'])
        else:
            coverage['status'] = 'no_data'
            coverage['data_quality_issues'].append('No date column found in sales data')
            return coverage
        
        # Filter to analysis period
        df_filtered = df[(df['sale_date'] >= start_date) & (df['sale_date'] <= end_date)]
        
        if len(df_filtered) == 0:
            coverage['status'] = 'no_data_in_period'
            coverage['data_quality_issues'].append(f'No sales data in analysis period {start_date.date()} to {end_date.date()}')
            return coverage
        
        # Analyze monthly coverage
        df_filtered['year_month'] = df_filtered['sale_date'].dt.to_period('M')
        actual_months = set(df_filtered['year_month'].unique())
        
        # Expected months
        expected_months = set(pd.period_range(start=start_date, end=end_date, freq='M'))
        missing_months = expected_months - actual_months
        
        # Calculate completeness
        total_expected_months = len(expected_months)
        actual_months_count = len(actual_months)
        completeness_score = (actual_months_count / total_expected_months) * 100
        
        coverage['completeness_score'] = round(completeness_score, 1)
        coverage['missing_periods'] = sorted([str(month) for month in missing_months])
        coverage['coverage_details'] = {
            'total_expected_months': total_expected_months,
            'actual_months': actual_months_count,
            'missing_months': len(missing_months),
            'date_range': f"{df_filtered['sale_date'].min().date()} to {df_filtered['sale_date'].max().date()}",
            'total_transactions': len(df_filtered),
            'total_revenue': float(df_filtered['Total Price'].sum() if 'Total Price' in df_filtered.columns else df_filtered['total_price'].sum())
        }
        
        # Determine status
        if completeness_score >= 95:
            coverage['status'] = 'excellent'
        elif completeness_score >= 85:
            coverage['status'] = 'good'
        elif completeness_score >= 70:
            coverage['status'] = 'fair'
        else:
            coverage['status'] = 'poor'
        
        # Data quality issues
        if missing_months:
            coverage['data_quality_issues'].append(f'Missing {len(missing_months)} months of data')
        
        # Check for data gaps
        monthly_counts = df_filtered.groupby('year_month').size()
        low_volume_months = monthly_counts[monthly_counts < 50]  # Less than 50 transactions
        if len(low_volume_months) > 0:
            coverage['data_quality_issues'].append(f'{len(low_volume_months)} months with unusually low transaction volume')
        
        # Fallback strategies
        if missing_months:
            coverage['fallback_strategies'].append('Use available months to calculate averages')
            coverage['fallback_strategies'].append('Apply seasonal adjustments based on available data')
        
        return coverage
    
    def _analyze_financial_coverage(self, financial_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze financial data coverage."""
        coverage = {
            'status': 'unknown',
            'completeness_score': 0,
            'missing_documents': [],
            'data_quality_issues': [],
            'coverage_details': {},
            'fallback_strategies': []
        }
        
        if not financial_data:
            coverage['status'] = 'no_data'
            coverage['data_quality_issues'].append('No financial data found')
            return coverage
        
        # Expected financial documents for due diligence
        expected_docs = {
            'profit_loss': ['pnl_2023', 'pnl_2024'],
            'balance_sheets': ['balance_sheets'],
            'general_ledger': ['general_ledger'],
            'cogs': ['cogs']
        }
        
        found_docs = []
        missing_docs = []
        
        # Check for each document type
        for doc_type, doc_keys in expected_docs.items():
            found = False
            for key in doc_keys:
                if key in financial_data and financial_data[key]:
                    found = True
                    found_docs.append(f"{doc_type}_{key}")
                    break
            
            if not found:
                missing_docs.append(doc_type)
        
        # Calculate completeness
        total_expected = len(expected_docs)
        found_count = len(found_docs)
        completeness_score = (found_count / total_expected) * 100
        
        coverage['completeness_score'] = round(completeness_score, 1)
        coverage['missing_documents'] = missing_docs
        coverage['coverage_details'] = {
            'found_documents': found_docs,
            'missing_documents': missing_docs,
            'total_expected': total_expected,
            'found_count': found_count
        }
        
        # Determine status
        if completeness_score >= 90:
            coverage['status'] = 'excellent'
        elif completeness_score >= 75:
            coverage['status'] = 'good'
        elif completeness_score >= 50:
            coverage['status'] = 'fair'
        else:
            coverage['status'] = 'poor'
        
        # Data quality issues
        if missing_docs:
            coverage['data_quality_issues'].append(f'Missing {len(missing_docs)} critical financial documents')
        
        # Fallback strategies
        if 'profit_loss' in missing_docs:
            coverage['fallback_strategies'].append('Use sales data to estimate P&L based on industry margins')
        if 'balance_sheets' in missing_docs:
            coverage['fallback_strategies'].append('Estimate balance sheet from available financial data')
        if 'general_ledger' in missing_docs:
            coverage['fallback_strategies'].append('Use transaction data to reconstruct key ledger entries')
        
        return coverage
    
    def _analyze_equipment_coverage(self, equipment_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze equipment data coverage."""
        coverage = {
            'status': 'unknown',
            'completeness_score': 0,
            'missing_documents': [],
            'data_quality_issues': [],
            'coverage_details': {},
            'fallback_strategies': []
        }
        
        if not equipment_data:
            coverage['status'] = 'no_data'
            coverage['data_quality_issues'].append('No equipment data found')
            return coverage
        
        # Check for equipment quotes/inventory
        equipment_items = equipment_data.get('quotes', [])
        
        if not equipment_items:
            coverage['status'] = 'no_data'
            coverage['data_quality_issues'].append('No equipment inventory found')
            coverage['fallback_strategies'].append('Use industry averages for audiology equipment valuation')
            return coverage
        
        # Analyze equipment coverage
        total_equipment_value = sum(item.get('price', 0) for item in equipment_items)
        equipment_count = len(equipment_items)
        
        # Expected equipment categories for audiology practice
        expected_categories = ['audiometer', 'hearing_aid_programmer', 'diagnostic_equipment', 'office_equipment']
        found_categories = set()
        
        for item in equipment_items:
            description = item.get('description', '').lower()
            if 'audiometer' in description:
                found_categories.add('audiometer')
            elif 'programmer' in description or 'programming' in description:
                found_categories.add('hearing_aid_programmer')
            elif 'diagnostic' in description or 'testing' in description:
                found_categories.add('diagnostic_equipment')
            else:
                found_categories.add('office_equipment')
        
        missing_categories = set(expected_categories) - found_categories
        completeness_score = (len(found_categories) / len(expected_categories)) * 100
        
        coverage['completeness_score'] = round(completeness_score, 1)
        coverage['missing_documents'] = list(missing_categories)
        coverage['coverage_details'] = {
            'equipment_count': equipment_count,
            'total_value': total_equipment_value,
            'found_categories': list(found_categories),
            'missing_categories': list(missing_categories)
        }
        
        # Determine status
        if completeness_score >= 75:
            coverage['status'] = 'excellent'
        elif completeness_score >= 50:
            coverage['status'] = 'good'
        elif completeness_score >= 25:
            coverage['status'] = 'fair'
        else:
            coverage['status'] = 'poor'
        
        # Data quality issues
        if missing_categories:
            coverage['data_quality_issues'].append(f'Missing equipment categories: {list(missing_categories)}')
        
        if total_equipment_value < 50000:  # Low equipment value
            coverage['data_quality_issues'].append('Equipment value seems low for audiology practice')
        
        # Fallback strategies
        if missing_categories:
            coverage['fallback_strategies'].append('Use industry averages for missing equipment categories')
            coverage['fallback_strategies'].append('Estimate equipment value based on practice size and type')
        
        return coverage
    
    def _calculate_due_diligence_score(self) -> Dict[str, Any]:
        """Calculate overall due diligence readiness score."""
        scores = []
        weights = {'sales': 0.4, 'financial': 0.4, 'equipment': 0.2}
        
        for category, weight in weights.items():
            if category in self.coverage_report:
                score = self.coverage_report[category].get('completeness_score', 0)
                scores.append(score * weight)
        
        overall_score = sum(scores) if scores else 0
        
        # Determine readiness level
        if overall_score >= 90:
            readiness = 'excellent'
            recommendation = 'Ready for due diligence'
        elif overall_score >= 75:
            readiness = 'good'
            recommendation = 'Minor gaps, proceed with caution'
        elif overall_score >= 60:
            readiness = 'fair'
            recommendation = 'Significant gaps, address before due diligence'
        else:
            readiness = 'poor'
            recommendation = 'Not ready for due diligence'
        
        return {
            'overall_score': round(overall_score, 1),
            'readiness_level': readiness,
            'recommendation': recommendation,
            'category_scores': {
                category: self.coverage_report[category].get('completeness_score', 0)
                for category in ['sales', 'financial', 'equipment']
                if category in self.coverage_report
            }
        }
    
    def _generate_recommendations(self) -> List[str]:
        """Generate recommendations for improving data coverage."""
        recommendations = []
        
        # Sales data recommendations
        if 'sales' in self.coverage_report:
            sales_coverage = self.coverage_report['sales']
            if sales_coverage['status'] in ['poor', 'fair']:
                recommendations.append('Obtain missing sales data for complete analysis period')
                if sales_coverage['missing_periods']:
                    recommendations.append(f"Missing months: {', '.join(sales_coverage['missing_periods'][:5])}")
        
        # Financial data recommendations
        if 'financial' in self.coverage_report:
            financial_coverage = self.coverage_report['financial']
            if financial_coverage['status'] in ['poor', 'fair']:
                recommendations.append('Obtain missing financial documents for complete due diligence')
                if financial_coverage['missing_documents']:
                    recommendations.append(f"Missing documents: {', '.join(financial_coverage['missing_documents'])}")
        
        # Equipment data recommendations
        if 'equipment' in self.coverage_report:
            equipment_coverage = self.coverage_report['equipment']
            if equipment_coverage['status'] in ['poor', 'fair']:
                recommendations.append('Complete equipment inventory for accurate valuation')
                if equipment_coverage['missing_documents']:
                    recommendations.append(f"Missing equipment categories: {', '.join(equipment_coverage['missing_documents'])}")
        
        # General recommendations based on overall score
        overall_score = self.coverage_report.get('due_diligence', {}).get('overall_score', 0)
        if overall_score >= 90:
            recommendations.append('Data coverage is excellent - ready for due diligence')
        elif overall_score >= 75:
            recommendations.append('Data coverage is good - minor gaps exist but due diligence can proceed')
        elif overall_score >= 60:
            recommendations.append('Data coverage is fair - address gaps before due diligence')
        else:
            recommendations.append('Data coverage is poor - significant gaps need to be addressed')
        
        return recommendations
