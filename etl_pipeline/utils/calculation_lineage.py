"""
Calculation lineage tracking utilities for ETL pipeline.
"""

import logging
from typing import Dict, Any, List, Optional, Union
from datetime import datetime, timezone
from decimal import Decimal

logger = logging.getLogger(__name__)

class CalculationLineageTracker:
    """Tracks calculation steps and lineage for business metrics."""
    
    def __init__(self):
        """Initialize calculation lineage tracker."""
        self.calculation_steps = []
        self.current_calculation = None
        self.step_counter = 0
    
    def start_calculation(self, metric_name: str, description: str = None) -> None:
        """
        Start tracking a new calculation.
        
        Args:
            metric_name: Name of the metric being calculated
            description: Optional description of the calculation
        """
        self.current_calculation = {
            "metric_name": metric_name,
            "description": description,
            "steps": [],
            "start_time": datetime.now(timezone.utc).isoformat(),
            "final_value": None,
            "end_time": None
        }
        self.step_counter = 0
        logger.debug(f"Started calculation tracking for: {metric_name}")
    
    def add_step(self, operation: str, field: str = None, value: Union[float, int, Decimal] = None, 
                 description: str = None, **kwargs) -> None:
        """
        Add a calculation step.
        
        Args:
            operation: Type of operation (sum, multiply, divide, etc.)
            field: Field name being operated on
            value: Value from the operation
            description: Optional description of the step
            **kwargs: Additional metadata for the step
        """
        if self.current_calculation is None:
            logger.warning("No active calculation. Call start_calculation() first.")
            return
        
        self.step_counter += 1
        step = {
            "step": self.step_counter,
            "operation": operation,
            "field": field,
            "value": float(value) if value is not None else None,
            "description": description,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            **kwargs
        }
        
        self.current_calculation["steps"].append(step)
        logger.debug(f"Added step {self.step_counter}: {operation} on {field} = {value}")
    
    def add_sum_step(self, field: str, value: Union[float, int, Decimal], 
                     description: str = None) -> None:
        """Add a sum operation step."""
        self.add_step("sum", field, value, description)
    
    def add_multiply_step(self, field: str, value: Union[float, int, Decimal], 
                         factor: Union[float, int, Decimal] = None,
                         description: str = None) -> None:
        """Add a multiply operation step."""
        self.add_step("multiply", field, value, description, factor=factor)
    
    def add_divide_step(self, field: str, value: Union[float, int, Decimal], 
                       divisor: Union[float, int, Decimal] = None,
                       description: str = None) -> None:
        """Add a divide operation step."""
        self.add_step("divide", field, value, description, divisor=divisor)
    
    def add_annualize_step(self, field: str, value: Union[float, int, Decimal], 
                          factor: Union[float, int, Decimal] = 12,
                          description: str = None) -> None:
        """Add an annualization step."""
        self.add_step("annualize", field, value, description, factor=factor)
    
    def add_aggregate_step(self, operation: str, fields: List[str], 
                          value: Union[float, int, Decimal],
                          description: str = None) -> None:
        """Add an aggregation step across multiple fields."""
        self.add_step(operation, field=",".join(fields), value=value, 
                     description=description, fields=fields)
    
    def finish_calculation(self, final_value: Union[float, int, Decimal]) -> Dict[str, Any]:
        """
        Finish the current calculation and return the lineage.
        
        Args:
            final_value: Final calculated value
            
        Returns:
            Dictionary with complete calculation lineage
        """
        if self.current_calculation is None:
            logger.warning("No active calculation to finish.")
            return {}
        
        self.current_calculation["final_value"] = float(final_value)
        self.current_calculation["end_time"] = datetime.now(timezone.utc).isoformat()
        
        # Store the completed calculation
        calculation_lineage = self.current_calculation.copy()
        self.calculation_steps.append(calculation_lineage)
        
        logger.debug(f"Finished calculation for {calculation_lineage['metric_name']}: {final_value}")
        
        # Reset for next calculation
        self.current_calculation = None
        self.step_counter = 0
        
        return calculation_lineage
    
    def get_all_calculations(self) -> List[Dict[str, Any]]:
        """Get all completed calculations."""
        return self.calculation_steps.copy()
    
    def get_calculation_by_name(self, metric_name: str) -> Optional[Dict[str, Any]]:
        """Get a specific calculation by metric name."""
        for calc in self.calculation_steps:
            if calc["metric_name"] == metric_name:
                return calc
        return None
    
    def clear_calculations(self) -> None:
        """Clear all calculation history."""
        self.calculation_steps.clear()
        self.current_calculation = None
        self.step_counter = 0
    
    def export_lineage_for_json(self) -> Dict[str, Any]:
        """
        Export calculation lineage in format suitable for JSON export.
        
        Returns:
            Dictionary with calculation lineage data
        """
        return {
            "calculation_lineage": self.calculation_steps,
            "lineage_summary": {
                "total_calculations": len(self.calculation_steps),
                "metrics_calculated": [calc["metric_name"] for calc in self.calculation_steps],
                "total_steps": sum(len(calc["steps"]) for calc in self.calculation_steps)
            }
        }
    
    def get_lineage_summary(self) -> Dict[str, Any]:
        """
        Get summary of calculation lineage.
        
        Returns:
            Dictionary with lineage summary statistics
        """
        if not self.calculation_steps:
            return {
                "total_calculations": 0,
                "total_steps": 0,
                "metrics_calculated": [],
                "operation_types": {}
            }
        
        operation_types = {}
        for calc in self.calculation_steps:
            for step in calc["steps"]:
                op = step["operation"]
                operation_types[op] = operation_types.get(op, 0) + 1
        
        return {
            "total_calculations": len(self.calculation_steps),
            "total_steps": sum(len(calc["steps"]) for calc in self.calculation_steps),
            "metrics_calculated": [calc["metric_name"] for calc in self.calculation_steps],
            "operation_types": operation_types
        }
