"""
Calculation lineage tracking utilities for ETL pipeline.
"""

import logging
import threading
import base64
import copy
from typing import Dict, Any, List, Optional, Union
from datetime import datetime, timezone, date, time
from decimal import Decimal

logger = logging.getLogger(__name__)

def _recursive_sanitize_for_json(value: Any) -> Any:
    """
    Recursively sanitize values for JSON serialization.
    
    Handles nested structures (dicts, lists, tuples, sets) and converts:
    - Decimal to str (preserves precision)
    - datetime/date/time to ISO8601 strings
    - bytes to base64 encoded strings
    - Leaves None/ints/floats/strings as-is
    
    Args:
        value: Value to sanitize (can be any type)
        
    Returns:
        JSON-serializable value
    """
    if value is None:
        return None
    elif isinstance(value, (int, float, str, bool)):
        # Basic types that are already JSON-serializable
        return value
    elif isinstance(value, Decimal):
        # Convert Decimal to string to preserve precision
        return str(value)
    elif isinstance(value, (datetime, date, time)):
        # Convert datetime objects to ISO8601 strings
        if isinstance(value, datetime):
            return value.isoformat()
        elif isinstance(value, date):
            return value.isoformat()
        elif isinstance(value, time):
            return value.isoformat()
    elif isinstance(value, bytes):
        # Convert bytes to base64 encoded string
        return base64.b64encode(value).decode('utf-8')
    elif isinstance(value, dict):
        # Recursively sanitize dictionary values
        return {key: _recursive_sanitize_for_json(val) for key, val in value.items()}
    elif isinstance(value, (list, tuple)):
        # Recursively sanitize list/tuple elements
        return [_recursive_sanitize_for_json(item) for item in value]
    elif isinstance(value, set):
        # Convert set to list and recursively sanitize
        return [_recursive_sanitize_for_json(item) for item in value]
    else:
        # For unknown types, try to convert to string
        try:
            return str(value)
        except Exception:
            # If even string conversion fails, return a placeholder
            return f"<unserializable: {type(value).__name__}>"

def _safe_convert_value(value: Union[float, int, Decimal, None]) -> Union[float, int, str, None]:
    """
    Safely convert a value for storage, preserving Decimal precision.
    
    Args:
        value: Value to convert (can be float, int, Decimal, or None)
        
    Returns:
        Converted value - Decimal instances are converted to strings to preserve precision,
        other numeric types are preserved as-is, None remains None
    """
    if value is None:
        return None
    elif isinstance(value, Decimal):
        # Convert Decimal to string to preserve precision
        return str(value)
    else:
        # For float and int, preserve the original type
        return value

class CalculationError(Exception):
    """Custom exception for calculation lineage tracking errors."""
    pass

class CalculationLineageTracker:
    """Tracks calculation steps and lineage for business metrics."""
    
    def __init__(self):
        """Initialize calculation lineage tracker."""
        self.calculation_steps = []
        self.current_calculation = None
        self.step_counter = 0
        self._lock = threading.RLock()
    
    def start_calculation(self, metric_name: str, description: str = None) -> None:
        """
        Start tracking a new calculation.
        
        Args:
            metric_name: Name of the metric being calculated
            description: Optional description of the calculation
        """
        with self._lock:
            # Guard: Check if there's an in-progress calculation
            if (self.current_calculation is not None and 
                (self.current_calculation.get("end_time") is None or 
                 self.current_calculation.get("final_value") is None)):
                
                existing_metric = self.current_calculation.get("metric_name", "unknown")
                logger.error(f"Calculation conflict: Attempting to start '{metric_name}' while '{existing_metric}' is still in progress (no end_time or final_value)")
                
                # Option 1: Raise RuntimeError to prevent overwriting
                raise RuntimeError(f"Cannot start calculation '{metric_name}': calculation '{existing_metric}' is still in progress. "
                                 f"Call finish_calculation() first or handle the incomplete calculation.")
                
                # Option 2: Auto-finalize previous calculation (commented out)
                # logger.warning(f"Auto-finalizing incomplete calculation '{existing_metric}' before starting '{metric_name}'")
                # self.finish_calculation(0)  # Use 0 as placeholder value for incomplete calculation
            
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
        with self._lock:
            if self.current_calculation is None:
                raise CalculationError(
                    f"No active calculation: call start_calculation() before add_step(). "
                    f"Current calculation state: {self.current_calculation}"
                )
            
            self.step_counter += 1
            step = {
                "step": self.step_counter,
                "operation": operation,
                "field": field,
                "value": _safe_convert_value(value),
                "description": description,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                **_recursive_sanitize_for_json(kwargs)
            }
            
            self.current_calculation["steps"].append(step)
            logger.debug(f"Added step {self.step_counter}: {operation} on {field} = {value}")
    
    def add_sum_step(self, field: str, value: Union[float, int, Decimal], 
                     description: str = None) -> None:
        """Add a sum operation step."""
        with self._lock:
            self.add_step("sum", field, value, description)
    
    def add_multiply_step(self, field: str, value: Union[float, int, Decimal], 
                         factor: Union[float, int, Decimal] = None,
                         description: str = None) -> None:
        """Add a multiply operation step."""
        with self._lock:
            self.add_step("multiply", field, value, description, factor=factor)
    
    def add_divide_step(self, field: str, value: Union[float, int, Decimal], 
                       divisor: Union[float, int, Decimal] = None,
                       description: str = None) -> None:
        """Add a divide operation step."""
        with self._lock:
            # Guard against None numerator and string-zero denominator
            if value is None:
                logger.warning(f"Division step skipped: numerator is None for field {field}")
                return
            
            # Convert divisor to Decimal for safe comparison
            if divisor is not None:
                try:
                    divisor_decimal = Decimal(str(divisor))
                    if divisor_decimal == 0:
                        logger.warning(f"Division step skipped: divisor is zero for field {field}")
                        return
                except (ValueError, TypeError):
                    logger.warning(f"Division step skipped: invalid divisor {divisor} for field {field}")
                    return
            
            self.add_step("divide", field, value, description, divisor=divisor)
    
    def add_annualize_step(self, field: str, value: Union[float, int, Decimal], 
                          factor: Union[float, int, Decimal] = 12,
                          description: str = None) -> None:
        """Add an annualization step."""
        with self._lock:
            self.add_step("annualize", field, value, description, factor=factor)
    
    def add_aggregate_step(self, operation: str, fields: List[str], 
                          value: Union[float, int, Decimal],
                          description: str = None) -> None:
        """Add an aggregation step across multiple fields."""
        with self._lock:
            self.add_step(operation, field=",".join(fields), value=value, 
                         description=description, fields=fields)
    
    def add_file_contribution(self, file_name: str, field_name: str, raw_value: Union[float, int, Decimal], 
                             normalized_value: Union[float, int, Decimal], description: str = None) -> None:
        """
        Add a file-level contribution step to track individual file contributions.
        
        Args:
            file_name: Name of the source file (e.g., "pnl_2023_2023-07-01_to_2023-07-31_ProfitAndLoss_CranberryHearing")
            field_name: Name of the field/column (e.g., "Pennsylvania", "Cranberry", "total_price")
            raw_value: Raw value extracted from the file
            normalized_value: Normalized/processed value used in calculations
            description: Optional description of the contribution
        """
        with self._lock:
            if self.current_calculation is None:
                raise CalculationError("No active calculation: call start_calculation() before add_file_contribution()")
            
            self.step_counter += 1
            step = {
                "step": self.step_counter,
                "operation": "file_contribution",
                "file_name": file_name,
                "field_name": field_name,
                "raw_value": _safe_convert_value(raw_value),
                "normalized_value": _safe_convert_value(normalized_value),
                "description": description,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            
            self.current_calculation["steps"].append(step)
            logger.debug(f"Added file contribution step {self.step_counter}: {file_name} -> {field_name} = {raw_value} -> {normalized_value}")
    
    def finish_calculation(self, final_value: Union[float, int, Decimal]) -> Dict[str, Any]:
        """
        Finish the current calculation and return the lineage.
        
        Args:
            final_value: Final calculated value
            
        Returns:
            Dictionary with complete calculation lineage
        """
        with self._lock:
            if self.current_calculation is None:
                raise RuntimeError("No active calculation to finish.")
            
            self.current_calculation["final_value"] = _safe_convert_value(final_value)
            self.current_calculation["end_time"] = datetime.now(timezone.utc).isoformat()
            
            # Store the completed calculation using deep copy
            calculation_lineage = copy.deepcopy(self.current_calculation)
            self.calculation_steps.append(calculation_lineage)
            
            logger.debug(f"Finished calculation for {calculation_lineage['metric_name']}: {final_value}")
            
            # Reset for next calculation
            self.current_calculation = None
            self.step_counter = 0
            
            return copy.deepcopy(calculation_lineage)
    
    def get_all_calculations(self) -> List[Dict[str, Any]]:
        """Get all completed calculations."""
        with self._lock:
            return copy.deepcopy(self.calculation_steps)
    
    def get_calculation_by_name(self, metric_name: str) -> Optional[Dict[str, Any]]:
        """Get a specific calculation by metric name."""
        with self._lock:
            for calc in self.calculation_steps:
                if calc["metric_name"] == metric_name:
                    return copy.deepcopy(calc)
            return None
    
    def clear_calculations(self) -> None:
        """Clear all calculation history."""
        with self._lock:
            self.calculation_steps.clear()
            self.current_calculation = None
            self.step_counter = 0
    
    def export_lineage_for_json(self) -> Dict[str, Any]:
        """
        Export calculation lineage in format suitable for JSON export.
        
        Returns:
            Dictionary with calculation lineage data
        """
        with self._lock:
            return {
                "calculation_lineage": copy.deepcopy(self.calculation_steps),
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
        with self._lock:
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
