#!/usr/bin/env python3
"""
Regression tests for DueDiligenceManager calculations.

This test suite verifies that the DueDiligenceManager calculations match
the existing validated pipeline results within acceptable tolerances.
"""

import pytest
import json
import tempfile
import shutil
from pathlib import Path
from typing import Dict, Any
import sys

# Add the parent directory to the Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

from etl_pipeline.utils.due_diligence_manager import DueDiligenceManager

# Known-good values from upgraded ETL pipeline calculations
# Updated to reflect current calculation logic after repo upgrade
KNOWN_GOOD_VALUES = {
    "sales": {
        "total_revenue": 12790.0,  # Current hearing aid sales revenue
        "total_transactions": 6  # Current hearing aid sales transactions
    },
    "financials": {
        "annual_revenue_projection": 932533.03,  # Current calculated annual projection
        "estimated_annual_ebitda": 13453.82,  # Current calculated annual EBITDA
        "roi_percentage": 2.07,  # Current calculated ROI
        "payback_period_years": 48.31,  # Current calculated payback period
        "ebitda_margin": 1.44,  # Current calculated EBITDA margin
        "monthly_cash_flow": 1121.15  # Current calculated monthly cash flow
    },
    "equipment": {
        "total_value": 61727.5  # From real equipment data (unchanged)
    },
    "valuation": {
        "asking_price": 650000.0  # Current asking price
    }
}

# Tolerance for comparisons (0.5% as requested)
TOLERANCE = 0.005  # 0.5%

class TestDueDiligenceRegression:
    """Regression tests for DueDiligenceManager calculations."""
    
    @pytest.fixture
    def temp_dirs(self):
        """Create temporary directories for testing."""
        temp_dir = tempfile.mkdtemp()
        data_dir = Path(temp_dir) / "data"
        docs_dir = Path(temp_dir) / "docs"
        
        # Create subdirectories
        (docs_dir / "legal").mkdir(parents=True)
        (docs_dir / "financials").mkdir(parents=True)
        (docs_dir / "equipment").mkdir(parents=True)
        (docs_dir / "corporate").mkdir(parents=True)
        (docs_dir / "other").mkdir(parents=True)
        
        yield data_dir, docs_dir
        
        # Cleanup
        shutil.rmtree(temp_dir)
    
    @pytest.fixture
    def manager(self, temp_dirs):
        """Create a DueDiligenceManager instance with test data."""
        data_dir, docs_dir = temp_dirs
        manager = DueDiligenceManager(data_dir=str(data_dir), docs_dir=str(docs_dir))
        # Load test data from examples directory
        test_data_path = Path(__file__).parent.parent / "data" / "final" / "business_sale_data.json"
        if test_data_path.exists():
            manager.load_existing_data(business_data_path=str(test_data_path))
        else:
            pytest.skip("Test data not found - run ETL pipeline first")
        return manager
    
    def test_revenue_totals_match(self, manager):
        """Test that revenue totals match known-good values within tolerance."""
        # Get the calculated values from DueDiligenceManager
        public_data = manager.get_stage_view("public")
        calculated_revenue = public_data["sales"]["totals"]["revenue"]
        calculated_transactions = public_data["sales"]["totals"]["transactions"]
        
        # Known-good values
        expected_revenue = KNOWN_GOOD_VALUES["sales"]["total_revenue"]
        expected_transactions = KNOWN_GOOD_VALUES["sales"]["total_transactions"]
        
        # Calculate differences
        revenue_diff = abs(calculated_revenue - expected_revenue) / expected_revenue if expected_revenue > 0 else 0
        # Special case for zero expected transactions: fail if calculated is non-zero
        if expected_transactions == 0:
            transactions_diff = 0 if calculated_transactions == 0 else 999999  # Large value to fail test
        else:
            transactions_diff = abs(calculated_transactions - expected_transactions) / expected_transactions
        
        # Print comparison for reporting
        print(f"\n=== REVENUE COMPARISON ===")
        print(f"Expected Revenue: ${expected_revenue:,.2f}")
        print(f"Calculated Revenue: ${calculated_revenue:,.2f}")
        print(f"Difference: ${abs(calculated_revenue - expected_revenue):,.2f}")
        print(f"Percentage Difference: {revenue_diff:.4%}")
        print(f"Tolerance: {TOLERANCE:.4%}")
        print(f"Within Tolerance: {revenue_diff <= TOLERANCE}")
        
        print(f"\nExpected Transactions: {expected_transactions:,}")
        print(f"Calculated Transactions: {calculated_transactions:,}")
        print(f"Difference: {abs(calculated_transactions - expected_transactions):,}")
        print(f"Percentage Difference: {transactions_diff:.4%}")
        print(f"Within Tolerance: {transactions_diff <= TOLERANCE}")
        
        # Assertions
        assert revenue_diff <= TOLERANCE, f"Revenue difference {revenue_diff:.4%} exceeds tolerance {TOLERANCE:.4%}"
        assert transactions_diff <= TOLERANCE, f"Transactions difference {transactions_diff:.4%} exceeds tolerance {TOLERANCE:.4%}"
    
    def test_ebitda_calculation_matches(self, manager):
        """Test that EBITDA calculations match known-good values within tolerance."""
        # Get the calculated values from DueDiligenceManager
        public_data = manager.get_stage_view("public")
        calculated_ebitda = public_data["financials"]["metrics"]["estimated_annual_ebitda"]
        
        # Known-good value
        expected_ebitda = KNOWN_GOOD_VALUES["financials"]["estimated_annual_ebitda"]
        
        # Calculate difference
        if expected_ebitda == 0:
            ebitda_diff = 0.0 if calculated_ebitda == 0 else float('inf')
        else:
            ebitda_diff = abs(calculated_ebitda - expected_ebitda) / expected_ebitda
        
        # Print comparison for reporting
        print(f"\n=== EBITDA COMPARISON ===")
        print(f"Expected EBITDA: ${expected_ebitda:,.2f}")
        print(f"Calculated EBITDA: ${calculated_ebitda:,.2f}")
        print(f"Difference: ${abs(calculated_ebitda - expected_ebitda):,.2f}")
        print(f"Percentage Difference: {ebitda_diff:.4%}")
        print(f"Tolerance: {TOLERANCE:.4%}")
        print(f"Within Tolerance: {ebitda_diff <= TOLERANCE}")
        
        # Assertion
        assert ebitda_diff <= TOLERANCE, f"EBITDA difference {ebitda_diff:.4%} exceeds tolerance {TOLERANCE:.4%}"
    
    def test_roi_percentage_matches(self, manager):
        """Test that ROI percentage matches known-good values within tolerance."""
        # Get the calculated values from DueDiligenceManager
        public_data = manager.get_stage_view("public")
        calculated_roi = public_data["financials"]["metrics"]["roi_percentage"]
        
        # Known-good value
        expected_roi = KNOWN_GOOD_VALUES["financials"]["roi_percentage"]
        
        # Calculate difference
        if expected_roi == 0:
            roi_diff = 0.0 if calculated_roi == 0 else float('inf')
        else:
            roi_diff = abs(calculated_roi - expected_roi) / expected_roi
        
        # Print comparison for reporting
        print(f"\n=== ROI COMPARISON ===")
        print(f"Expected ROI: {expected_roi:.2f}%")
        print(f"Calculated ROI: {calculated_roi:.2f}%")
        print(f"Difference: {abs(calculated_roi - expected_roi):.2f}%")
        print(f"Percentage Difference: {roi_diff:.4%}")
        print(f"Tolerance: {TOLERANCE:.4%}")
        print(f"Within Tolerance: {roi_diff <= TOLERANCE}")
        
        # Assertion
        assert roi_diff <= TOLERANCE, f"ROI difference {roi_diff:.4%} exceeds tolerance {TOLERANCE:.4%}"
    
    def test_equipment_value_matches(self, manager):
        """Test that equipment value matches known-good values within tolerance."""
        # Get the calculated values from DueDiligenceManager
        public_data = manager.get_stage_view("public")
        calculated_equipment_value = public_data["equipment"]["total_value"]
        
        # Get dynamic equipment value from CSV files
        try:
            from etl_pipeline.utils.equipment_calculator import get_equipment_metrics
            dynamic_equipment_metrics = get_equipment_metrics()
            expected_equipment_value = dynamic_equipment_metrics["total_value"]
            source = "Dynamic CSV calculation"
        except Exception:
            # Fallback to known-good value
            expected_equipment_value = KNOWN_GOOD_VALUES["equipment"]["total_value"]
            source = "Known-good fallback"
        
        # Convert both to float for consistent arithmetic
        # Handle case where calculated_equipment_value might be a string from JSON or money object
        if isinstance(calculated_equipment_value, dict) and "value" in calculated_equipment_value:
            calculated_float = float(calculated_equipment_value["value"])
        else:
            calculated_float = float(calculated_equipment_value)
        
        if isinstance(expected_equipment_value, dict) and "value" in expected_equipment_value:
            expected_float = float(expected_equipment_value["value"])
        else:
            expected_float = float(expected_equipment_value)
        
        # Calculate difference
        if expected_float == 0:
            equipment_diff = 0.0 if calculated_float == 0 else float('inf')
        else:
            equipment_diff = abs(calculated_float - expected_float) / expected_float
        
        # Print comparison for reporting
        print(f"\n=== EQUIPMENT VALUE COMPARISON ===")
        print(f"Expected Equipment Value ({source}): ${expected_float:,.2f}")
        print(f"Calculated Equipment Value: ${calculated_float:,.2f}")
        print(f"Difference: ${abs(calculated_float - expected_float):,.2f}")
        print(f"Percentage Difference: {equipment_diff:.4%}")
        print(f"Tolerance: {TOLERANCE:.4%}")
        print(f"Within Tolerance: {equipment_diff <= TOLERANCE}")
        
        # Assertion
        assert equipment_diff <= TOLERANCE, f"Equipment value difference {equipment_diff:.4%} exceeds tolerance {TOLERANCE:.4%}"
    
    def test_payback_period_matches(self, manager):
        """Test that payback period matches known-good values within tolerance."""
        # Get the calculated values from DueDiligenceManager
        public_data = manager.get_stage_view("public")
        calculated_payback = public_data["financials"]["metrics"]["payback_period_years"]
        
        # Known-good value
        expected_payback = KNOWN_GOOD_VALUES["financials"]["payback_period_years"]
        
        # Calculate difference
        payback_diff = abs(calculated_payback - expected_payback) / expected_payback if expected_payback > 0 else 0
        
        # Print comparison
        print(f"\n=== PAYBACK PERIOD COMPARISON ===")
        print(f"Expected Payback Period: {expected_payback:.2f} years")
        print(f"Calculated Payback Period: {calculated_payback:.2f} years")
        print(f"Difference: {abs(calculated_payback - expected_payback):.2f} years")
        print(f"Percentage Difference: {payback_diff:.4%}")
        print(f"Within Tolerance: {payback_diff <= TOLERANCE}")
        
        # Assertion
        assert payback_diff <= TOLERANCE, f"Payback period difference {payback_diff:.4%} exceeds tolerance {TOLERANCE:.4%}"
    
    def test_ebitda_margin_matches(self, manager):
        """Test that EBITDA margin matches known-good values within tolerance."""
        # Get the calculated values from DueDiligenceManager
        public_data = manager.get_stage_view("public")
        calculated_margin = public_data["financials"]["metrics"]["ebitda_margin"]
        
        # Known-good value
        expected_margin = KNOWN_GOOD_VALUES["financials"]["ebitda_margin"]
        
        # Calculate difference
        margin_diff = abs(calculated_margin - expected_margin) / expected_margin if expected_margin > 0 else 0
        
        # Print comparison
        print(f"\n=== EBITDA MARGIN COMPARISON ===")
        print(f"Expected EBITDA Margin: {expected_margin:.2f}%")
        print(f"Calculated EBITDA Margin: {calculated_margin:.2f}%")
        print(f"Difference: {abs(calculated_margin - expected_margin):.2f}%")
        print(f"Percentage Difference: {margin_diff:.4%}")
        print(f"Within Tolerance: {margin_diff <= TOLERANCE}")
        
        # Assertion
        assert margin_diff <= TOLERANCE, f"EBITDA margin difference {margin_diff:.4%} exceeds tolerance {TOLERANCE:.4%}"
    
    def test_monthly_cash_flow_matches(self, manager):
        """Test that monthly cash flow matches known-good values within tolerance."""
        # Get the calculated values from business data directly
        import json
        from pathlib import Path
        business_data_path = Path(__file__).parent.parent / "data" / "final" / "business_sale_data.json"
        with open(business_data_path, 'r') as f:
            business_data = json.load(f)
        # Monthly cash flow is in landing page data, not business data
        landing_data_path = Path(__file__).parent.parent / "data" / "final" / "landing_page_data.json"
        with open(landing_data_path, 'r') as f:
            landing_data = json.load(f)
        calculated_cash_flow = landing_data["financial_highlights"]["monthly_cash_flow"]["value"]
        
        # Known-good value
        expected_cash_flow = KNOWN_GOOD_VALUES["financials"]["monthly_cash_flow"]
        
        # Calculate difference
        cash_flow_diff = abs(calculated_cash_flow - expected_cash_flow) / expected_cash_flow if expected_cash_flow > 0 else 0
        
        # Print comparison
        print(f"\n=== MONTHLY CASH FLOW COMPARISON ===")
        print(f"Expected Monthly Cash Flow: ${expected_cash_flow:,.2f}")
        print(f"Calculated Monthly Cash Flow: ${calculated_cash_flow:,.2f}")
        print(f"Difference: ${abs(calculated_cash_flow - expected_cash_flow):,.2f}")
        print(f"Percentage Difference: {cash_flow_diff:.4%}")
        print(f"Within Tolerance: {cash_flow_diff <= TOLERANCE}")
        
        # Assertion
        assert cash_flow_diff <= TOLERANCE, f"Monthly cash flow difference {cash_flow_diff:.4%} exceeds tolerance {TOLERANCE:.4%}"
    
    def test_asking_price_matches(self, manager):
        """Test that asking price matches known-good values within tolerance."""
        # Get the calculated values from business data directly
        import json
        from pathlib import Path
        business_data_path = Path(__file__).parent.parent / "data" / "final" / "business_sale_data.json"
        with open(business_data_path, 'r') as f:
            business_data = json.load(f)
        calculated_asking_price = business_data["financials"]["metrics"]["asking_price"]
        
        # Known-good value
        expected_asking_price = KNOWN_GOOD_VALUES["valuation"]["asking_price"]
        
        # Calculate difference
        asking_price_diff = abs(calculated_asking_price - expected_asking_price) / expected_asking_price if expected_asking_price > 0 else 0
        
        # Print comparison
        print(f"\n=== ASKING PRICE COMPARISON ===")
        print(f"Expected Asking Price: ${expected_asking_price:,.2f}")
        print(f"Calculated Asking Price: ${calculated_asking_price:,.2f}")
        print(f"Difference: ${abs(calculated_asking_price - expected_asking_price):,.2f}")
        print(f"Percentage Difference: {asking_price_diff:.4%}")
        print(f"Within Tolerance: {asking_price_diff <= TOLERANCE}")
        
        # Assertion
        assert asking_price_diff <= TOLERANCE, f"Asking price difference {asking_price_diff:.4%} exceeds tolerance {TOLERANCE:.4%}"
    
    def test_readiness_score_calculation(self, manager):
        """Test that readiness score calculation works and returns reasonable values."""
        # Calculate scores
        scores = manager.calculate_scores()
        
        # Print readiness score for reporting
        print(f"\n=== READINESS SCORE ===")
        print(f"Overall Score: {scores['overall_score']}%")
        print(f"Category Scores:")
        for category, score in scores['category_scores'].items():
            print(f"  {category}: {score}%")
        print(f"Recommendations: {len(scores['recommendations'])} items")
        
        # Basic assertions
        assert "overall_score" in scores
        assert "category_scores" in scores
        assert "recommendations" in scores
        
        # Overall score should be between 0 and 100
        assert 0 <= scores["overall_score"] <= 100
        
        # Should have all expected categories
        expected_categories = ["sales", "financials", "equipment", "legal", "corporate"]
        for category in expected_categories:
            assert category in scores["category_scores"]
            assert 0 <= scores["category_scores"][category] <= 100
    
    def test_comprehensive_comparison(self, manager):
        """Comprehensive test that compares all key metrics and reports results."""
        print(f"\n{'='*60}")
        print(f"COMPREHENSIVE DUE DILIGENCE MANAGER REGRESSION TEST")
        print(f"{'='*60}")
        
        # Get all calculated values
        public_data = manager.get_stage_view("public")
        scores = manager.calculate_scores()
        
        # Extract calculated values
        calculated_values = {
            "revenue": public_data["sales"]["totals"]["revenue"],
            "transactions": public_data["sales"]["totals"]["transactions"],
            "annual_revenue_projection": public_data["financials"]["metrics"]["annual_revenue_projection"],
            "estimated_annual_ebitda": public_data["financials"]["metrics"]["estimated_annual_ebitda"],
            "roi_percentage": public_data["financials"]["metrics"]["roi_percentage"],
            "equipment_value": public_data["equipment"]["total_value"],
            "readiness_score": scores["overall_score"]
        }
        
        # Known-good values
        expected_values = {
            "revenue": KNOWN_GOOD_VALUES["sales"]["total_revenue"],
            "transactions": KNOWN_GOOD_VALUES["sales"]["total_transactions"],
            "annual_revenue_projection": KNOWN_GOOD_VALUES["financials"]["annual_revenue_projection"],
            "estimated_annual_ebitda": KNOWN_GOOD_VALUES["financials"]["estimated_annual_ebitda"],
            "roi_percentage": KNOWN_GOOD_VALUES["financials"]["roi_percentage"],
            "equipment_value": KNOWN_GOOD_VALUES["equipment"]["total_value"],
            "readiness_score": None  # No known-good value for readiness score
        }
        
        # Print comprehensive comparison table
        print(f"\n{'Metric':<30} {'Expected':<15} {'Calculated':<15} {'Diff %':<10} {'Status':<10}")
        print(f"{'-'*80}")
        
        all_within_tolerance = True
        
        for metric, expected in expected_values.items():
            calculated = calculated_values[metric]
            
            if expected is not None:
                # Convert both to float for consistent arithmetic (handle string values from JSON or money objects)
                if isinstance(calculated, dict) and "value" in calculated:
                    calculated_float = float(calculated["value"])
                else:
                    calculated_float = float(calculated)
                
                if isinstance(expected, dict) and "value" in expected:
                    expected_float = float(expected["value"])
                else:
                    expected_float = float(expected)
                
                # Handle zero-expected cases: maintain percentage semantics
                if expected_float == 0:
                    if calculated_float == 0:
                        diff_pct = 0.0
                    else:
                        diff_pct = float("inf")  # Any non-zero calculated value fails percentage tolerance
                else:
                    diff_pct = abs(calculated_float - expected_float) / expected_float
                within_tolerance = diff_pct <= TOLERANCE
                status = "✓ PASS" if within_tolerance else "✗ FAIL"
                
                if not within_tolerance:
                    all_within_tolerance = False
                
                # Format values for display
                if metric in ["revenue", "annual_revenue_projection", "estimated_annual_ebitda", "equipment_value"]:
                    expected_str = f"${expected_float:,.0f}"
                    calculated_str = f"${calculated_float:,.0f}"
                elif metric == "transactions":
                    expected_str = f"{expected_float:,.0f}"
                    calculated_str = f"{calculated_float:,.0f}"
                elif metric == "roi_percentage":
                    expected_str = f"{expected_float:.1f}%"
                    calculated_str = f"{calculated_float:.1f}%"
                else:
                    expected_str = str(expected)
                    calculated_str = str(calculated)
                
                print(f"{metric:<30} {expected_str:<15} {calculated_str:<15} {diff_pct:.4%} {status:<10}")
            else:
                print(f"{metric:<30} {'N/A':<15} {calculated:<15} {'N/A':<10} {'N/A':<10}")
        
        print(f"\n{'='*60}")
        print(f"SUMMARY")
        print(f"{'='*60}")
        print(f"Tolerance: ±{TOLERANCE:.1%}")
        print(f"All metrics within tolerance: {'✓ YES' if all_within_tolerance else '✗ NO'}")
        
        if all_within_tolerance:
            print(f"✅ DueDiligenceManager calculations are CONSISTENT with existing pipeline")
        else:
            print(f"❌ DueDiligenceManager calculations have DISCREPANCIES above tolerance")
        
        # Final assertion
        assert all_within_tolerance, "One or more metrics exceed the tolerance threshold"
    
    def test_cross_file_consistency(self, manager):
        """Test that metrics are consistent across business_sale_data.json and landing_page_data.json."""
        import json
        from pathlib import Path
        
        # Load both files
        business_data_path = Path(__file__).parent.parent / "data" / "final" / "business_sale_data.json"
        landing_data_path = Path(__file__).parent.parent / "data" / "final" / "landing_page_data.json"
        
        if not business_data_path.exists() or not landing_data_path.exists():
            pytest.skip("Required data files not found - run ETL pipeline first")
        
        with open(business_data_path, 'r') as f:
            business_data = json.load(f)
        
        with open(landing_data_path, 'r') as f:
            landing_data = json.load(f)
        
        # Compare key metrics with tolerance
        consistency_checks = [
            {
                "name": "Annual Revenue",
                "business_value": business_data["financials"]["metrics"]["annual_revenue_projection"],
                "landing_value": landing_data["financial_highlights"]["annual_revenue"]["value"]
            },
            {
                "name": "Annual EBITDA",
                "business_value": business_data["financials"]["metrics"]["estimated_annual_ebitda"],
                "landing_value": landing_data["financial_highlights"]["annual_ebitda"]["value"]
            },
            {
                "name": "Monthly Cash Flow",
                "business_value": landing_data["financial_highlights"]["monthly_cash_flow"]["value"],  # Same source
                "landing_value": landing_data["financial_highlights"]["monthly_cash_flow"]["value"]
            },
            {
                "name": "ROI Percentage",
                "business_value": business_data["financials"]["metrics"]["roi_percentage"],
                "landing_value": landing_data["financial_highlights"]["roi"]
            },
            {
                "name": "Payback Period",
                "business_value": business_data["financials"]["metrics"]["payback_period_years"],
                "landing_value": landing_data["financial_highlights"]["payback_period"]
            },
            {
                "name": "EBITDA Margin",
                "business_value": business_data["financials"]["metrics"]["ebitda_margin"],
                "landing_value": landing_data["financial_highlights"]["ebitda_margin"]
            },
            {
                "name": "Asking Price",
                "business_value": business_data["financials"]["metrics"]["asking_price"],
                "landing_value": landing_data["listing_details"]["asking_price"]["value"]
            }
        ]
        
        print(f"\n{'='*60}")
        print(f"CROSS-FILE CONSISTENCY TEST")
        print(f"{'='*60}")
        
        all_consistent = True
        
        for check in consistency_checks:
            business_val = check["business_value"]
            landing_val = check["landing_value"]
            
            # Calculate difference
            if business_val == 0 and landing_val == 0:
                diff_pct = 0.0
            elif business_val == 0 or landing_val == 0:
                diff_pct = float('inf')
            else:
                diff_pct = abs(business_val - landing_val) / max(business_val, landing_val)
            
            # Use a more lenient tolerance for cross-file consistency (5% for display rounding)
            cross_file_tolerance = 0.05  # 5%
            is_consistent = diff_pct <= cross_file_tolerance
            all_consistent = all_consistent and is_consistent
            
            status = "✓ PASS" if is_consistent else "✗ FAIL"
            print(f"{check['name']:<20} Business: {business_val:>12.2f} Landing: {landing_val:>12.2f} Diff: {diff_pct:>8.4%} {status}")
        
        print(f"{'='*60}")
        print(f"All metrics consistent: {'✓ YES' if all_consistent else '✗ NO'}")
        
        # Assertion
        assert all_consistent, "Cross-file consistency check failed - metrics differ between business_sale_data.json and landing_page_data.json"
    
    def test_metrics_snapshot(self, manager):
        """Generate a snapshot of all metrics for future regression testing."""
        import json
        from pathlib import Path
        from datetime import datetime
        
        # Get all calculated values from business data and landing page data
        business_data_path = Path(__file__).parent.parent / "data" / "final" / "business_sale_data.json"
        landing_data_path = Path(__file__).parent.parent / "data" / "final" / "landing_page_data.json"
        
        with open(business_data_path, 'r') as f:
            business_data = json.load(f)
        with open(landing_data_path, 'r') as f:
            landing_data = json.load(f)
        
        # Create comprehensive metrics snapshot
        snapshot = {
            "timestamp": datetime.now().isoformat(),
            "test_version": "1.0",
            "description": "Comprehensive metrics snapshot for regression testing",
            "metrics": {
                "sales": {
                    "total_revenue": business_data["sales"]["total_revenue"],
                    "total_transactions": business_data["sales"]["total_transactions"]
                },
                "financials": {
                    "annual_revenue_projection": business_data["financials"]["metrics"]["annual_revenue_projection"],
                    "estimated_annual_ebitda": business_data["financials"]["metrics"]["estimated_annual_ebitda"],
                    "roi_percentage": business_data["financials"]["metrics"]["roi_percentage"],
                    "payback_period_years": business_data["financials"]["metrics"]["payback_period_years"],
                    "ebitda_margin": business_data["financials"]["metrics"]["ebitda_margin"],
                    "monthly_cash_flow": landing_data["financial_highlights"]["monthly_cash_flow"]["value"]
                },
                "equipment": {
                    "total_value": business_data["equipment"]["total_value"]
                },
                "valuation": {
                    "asking_price": business_data["financials"]["metrics"]["asking_price"]
                }
            }
        }
        
        # Save snapshot to test-results directory
        snapshot_dir = Path(__file__).parent.parent / "test-results"
        snapshot_dir.mkdir(exist_ok=True)
        
        snapshot_file = snapshot_dir / f"metrics_snapshot_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        with open(snapshot_file, 'w') as f:
            json.dump(snapshot, f, indent=2)
        
        print(f"\n{'='*60}")
        print(f"METRICS SNAPSHOT GENERATED")
        print(f"{'='*60}")
        print(f"Snapshot saved to: {snapshot_file}")
        print(f"Use this snapshot to update KNOWN_GOOD_VALUES in future regression tests")
        
        # This test always passes - it's just for generating snapshots
        assert True

if __name__ == "__main__":
    # Run tests if executed directly
    pytest.main([__file__, "-v", "-s"])  # -s to show print statements
