"""
Tests for calculation lineage tracking functionality.
"""

import pytest
import json
from etl_pipeline.utils.calculation_lineage import CalculationLineageTracker, CalculationError
from etl_pipeline.transform.business_metrics import BusinessMetricsCalculator

# Module-level pytest markers
pytestmark = [
    pytest.mark.lineage
]

class TestCalculationLineage:
    """Test calculation step tracking and lineage."""
    
    def test_add_step_without_active_calculation_raises_exception(self):
        """Test that add_step raises CalculationError when no active calculation."""
        tracker = CalculationLineageTracker()
        
        # Should raise CalculationError when trying to add step without starting calculation
        with pytest.raises(CalculationError) as exc_info:
            tracker.add_step("sum", "test_field", 100.0, "Test step")
        
        # Verify the error message contains expected information
        error_message = str(exc_info.value)
        assert "No active calculation" in error_message
        assert "call start_calculation() before add_step()" in error_message
        assert "Current calculation state: None" in error_message

    def test_finish_calculation_without_active_calculation_raises_exception(self):
        """Test that finish_calculation raises RuntimeError when no active calculation."""
        tracker = CalculationLineageTracker()
        
        # Should raise RuntimeError when trying to finish calculation without starting one
        with pytest.raises(RuntimeError) as exc_info:
            tracker.finish_calculation(100.0)
        
        # Verify the error message
        error_message = str(exc_info.value)
        assert "No active calculation to finish." in error_message

    def test_calculation_step_tracking(self):
        """Test that calculation steps are tracked."""
        tracker = CalculationLineageTracker()
        
        # Start a calculation
        tracker.start_calculation("test_metric", "Test calculation")
        
        # Add a step - should not raise exception
        tracker.add_step("sum", "test_field", 100.0, "Test step")
        
        # Finish the calculation
        result = tracker.finish_calculation(100.0)
        
        # Verify the step was tracked
        assert result["metric_name"] == "test_metric"
        assert len(result["steps"]) == 1
        assert result["steps"][0]["operation"] == "sum"
        assert result["steps"][0]["field"] == "test_field"
        assert result["steps"][0]["value"] == 100.0
    
    def test_calculation_lineage_export(self):
        """Test that calculation lineage is exported in JSON."""
        tracker = CalculationLineageTracker()
        
        # Start and complete a calculation
        tracker.start_calculation("test_metric", "Test calculation")
        tracker.add_step("sum", "test_field", 100.0, "Test step")
        tracker.finish_calculation(100.0)
        
        # Export lineage
        lineage_data = tracker.export_lineage_for_json()
        
        # Verify structure
        assert "calculation_lineage" in lineage_data
        assert "lineage_summary" in lineage_data
        assert len(lineage_data["calculation_lineage"]) == 1
        assert lineage_data["lineage_summary"]["total_calculations"] == 1
        assert "test_metric" in lineage_data["lineage_summary"]["metrics_calculated"]
    
    def test_ebitda_calculation_lineage(self):
        """Test EBITDA calculation step tracking."""
        # Create business metrics calculator with mock data
        business_rules = {
            'financial_metrics': {'ebitda_margin_target': 0.25},
            'asking_price': 650000
        }
        calculator = BusinessMetricsCalculator(business_rules)
        
        # Test EBITDA margin calculation
        profitability_metrics = calculator._calculate_ebitda_metrics_with_lineage(
            real_ebitda=None, total_revenue=100000, months_in_period=12
        )
        
        # Verify lineage tracking
        lineage_data = calculator.get_calculation_lineage()
        assert "calculation_lineage" in lineage_data
        
        # Find EBITDA margin calculation
        ebitda_margin_calc = None
        annual_ebitda_calc = None
        for calc in lineage_data["calculation_lineage"]:
            if calc["metric_name"] == "ebitda_margin":
                ebitda_margin_calc = calc
            elif calc["metric_name"] == "estimated_annual_ebitda":
                annual_ebitda_calc = calc
        
        assert ebitda_margin_calc is not None, "EBITDA margin calculation not found in lineage"
        assert annual_ebitda_calc is not None, "Annual EBITDA calculation not found in lineage"
        assert len(ebitda_margin_calc["steps"]) > 0, "EBITDA margin calculation has no steps"
        assert len(annual_ebitda_calc["steps"]) > 0, "Annual EBITDA calculation has no steps"
    
    def test_revenue_calculation_lineage(self):
        """Test revenue calculation step tracking."""
        business_rules = {'asking_price': 650000}
        calculator = BusinessMetricsCalculator(business_rules)
        
        # Test revenue metrics calculation
        revenue_metrics = calculator._calculate_revenue_metrics_with_lineage(
            total_revenue=120000, monthly_revenue_avg=10000, months_in_period=12
        )
        
        # Verify lineage tracking
        lineage_data = calculator.get_calculation_lineage()
        assert "calculation_lineage" in lineage_data
        
        # Find annual revenue projection calculation
        revenue_calc = None
        for calc in lineage_data["calculation_lineage"]:
            if calc["metric_name"] == "annual_revenue_projection":
                revenue_calc = calc
                break
        
        assert revenue_calc is not None, "Annual revenue projection calculation not found in lineage"
        assert len(revenue_calc["steps"]) > 0, "Revenue calculation has no steps"
        assert revenue_calc["final_value"] == 120000, "Final revenue value incorrect"
    
    def test_roi_calculation_lineage(self):
        """Test ROI calculation step tracking."""
        business_rules = {'asking_price': 650000}
        calculator = BusinessMetricsCalculator(business_rules)
        
        # Test investment metrics calculation
        profitability_metrics = {
            'estimated_annual_ebitda': 100000,
            'ebitda_margin': 25.0
        }
        investment_metrics = calculator._calculate_investment_metrics_with_lineage(profitability_metrics)
        
        # Verify lineage tracking
        lineage_data = calculator.get_calculation_lineage()
        assert "calculation_lineage" in lineage_data
        
        # Find ROI and payback calculations
        roi_calc = None
        payback_calc = None
        for calc in lineage_data["calculation_lineage"]:
            if calc["metric_name"] == "roi_percentage":
                roi_calc = calc
            elif calc["metric_name"] == "payback_period_years":
                payback_calc = calc
        
        assert roi_calc is not None, "ROI calculation not found in lineage"
        assert payback_calc is not None, "Payback period calculation not found in lineage"
        assert len(roi_calc["steps"]) > 0, "ROI calculation has no steps"
        assert len(payback_calc["steps"]) > 0, "Payback period calculation has no steps"
    
    def test_equipment_value_calculation_lineage(self):
        """Test equipment value calculation step tracking."""
        business_rules = {'equipment': {'total_value': 50000}}
        calculator = BusinessMetricsCalculator(business_rules)
        
        # Test equipment metrics calculation (will use fallback due to missing CSV files)
        equipment_metrics = calculator._calculate_equipment_metrics()
        
        # Verify lineage tracking
        lineage_data = calculator.get_calculation_lineage()
        assert "calculation_lineage" in lineage_data
        
        # Find equipment value calculation
        equipment_calc = None
        for calc in lineage_data["calculation_lineage"]:
            if calc["metric_name"] == "equipment_value":
                equipment_calc = calc
                break
        
        assert equipment_calc is not None, "Equipment value calculation not found in lineage"
        assert len(equipment_calc["steps"]) > 0, "Equipment calculation has no steps"
        # Equipment value comes from actual CSV files, so we just verify it's a positive number
        assert equipment_calc["final_value"] > 0, "Final equipment value should be positive"
    
    def test_annual_projection_calculation_lineage(self):
        """Test annual projection calculation step tracking."""
        business_rules = {'asking_price': 650000}
        calculator = BusinessMetricsCalculator(business_rules)
        
        # Test revenue metrics calculation
        revenue_metrics = calculator._calculate_revenue_metrics_with_lineage(
            total_revenue=120000, monthly_revenue_avg=10000, months_in_period=12
        )
        
        # Verify lineage tracking
        lineage_data = calculator.get_calculation_lineage()
        assert "calculation_lineage" in lineage_data
        
        # Find annual revenue projection calculation
        revenue_calc = None
        for calc in lineage_data["calculation_lineage"]:
            if calc["metric_name"] == "annual_revenue_projection":
                revenue_calc = calc
                break
        
        assert revenue_calc is not None, "Annual revenue projection calculation not found in lineage"
        assert len(revenue_calc["steps"]) > 0, "Revenue calculation has no steps"
        
        # Verify specific steps
        steps = revenue_calc["steps"]
        input_steps = [s for s in steps if s["operation"] == "input"]
        annualize_steps = [s for s in steps if s["operation"] == "annualize"]
        
        assert len(input_steps) >= 2, "Should have input steps for total_revenue and monthly_revenue_average"
        assert len(annualize_steps) >= 1, "Should have annualize step"
    
    def test_calculation_step_metadata(self):
        """Test that calculation steps include proper metadata (operation, field, value, timestamp)."""
        tracker = CalculationLineageTracker()
        
        # Start and complete a calculation
        tracker.start_calculation("test_metric", "Test calculation")
        tracker.add_step("sum", "test_field", 100.0, "Test step")
        result = tracker.finish_calculation(100.0)
        
        # Verify step metadata
        step = result["steps"][0]
        assert "step" in step
        assert "operation" in step
        assert "field" in step
        assert "value" in step
        assert "description" in step
        assert "timestamp" in step
        
        assert step["operation"] == "sum"
        assert step["field"] == "test_field"
        assert step["value"] == 100.0
        assert step["description"] == "Test step"
        assert step["step"] == 1
    
    def test_calculation_lineage_json_schema(self):
        """Test that calculation lineage follows expected JSON schema."""
        tracker = CalculationLineageTracker()
        
        # Start and complete multiple calculations
        tracker.start_calculation("metric1", "Test calculation 1")
        tracker.add_step("sum", "field1", 100.0, "Step 1")
        tracker.finish_calculation(100.0)
        
        tracker.start_calculation("metric2", "Test calculation 2")
        tracker.add_step("multiply", "field2", 200.0, "Step 2")
        tracker.finish_calculation(200.0)
        
        # Export lineage
        lineage_data = tracker.export_lineage_for_json()
        
        # Verify JSON structure
        assert isinstance(lineage_data, dict)
        assert "calculation_lineage" in lineage_data
        assert "lineage_summary" in lineage_data
        
        # Verify calculation_lineage is a list
        assert isinstance(lineage_data["calculation_lineage"], list)
        assert len(lineage_data["calculation_lineage"]) == 2
        
        # Verify each calculation has required fields
        for calc in lineage_data["calculation_lineage"]:
            assert "metric_name" in calc
            assert "description" in calc
            assert "steps" in calc
            assert "start_time" in calc
            assert "end_time" in calc
            assert "final_value" in calc
            assert isinstance(calc["steps"], list)
        
        # Verify lineage_summary
        summary = lineage_data["lineage_summary"]
        assert "total_calculations" in summary
        assert "metrics_calculated" in summary
        assert "total_steps" in summary
        assert summary["total_calculations"] == 2
        assert len(summary["metrics_calculated"]) == 2
        assert summary["total_steps"] == 2
