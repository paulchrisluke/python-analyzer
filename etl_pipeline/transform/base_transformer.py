"""
Base transformer class for ETL pipeline.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
import pandas as pd
import logging
from datetime import datetime, timezone
from ..utils.file_utils import FileUtils

logger = logging.getLogger(__name__)

class BaseTransformer(ABC):
    """Base class for all data transformers."""
    
    def __init__(self, business_rules: Dict[str, Any]):
        """
        Initialize transformer with business rules.
        
        Args:
            business_rules: Business rules configuration
        """
        self.business_rules = business_rules
        self.transformed_data = None
        self.transformation_metadata = {}
        
    @abstractmethod
    def transform(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transform raw data to normalized format.
        
        Args:
            raw_data: Raw extracted data
            
        Returns:
            Dict containing transformed data
        """
        pass
    
    def validate_business_rules(self) -> bool:
        """
        Validate business rules configuration.
        
        Returns:
            bool: True if business rules are valid
        """
        required_sections = ['locations', 'data_quality']
        for section in required_sections:
            if section not in self.business_rules:
                logger.error(f"Missing required business rules section: {section}")
                return False
        return True
    
    def get_transformation_metadata(self) -> Dict[str, Any]:
        """
        Get transformation metadata.
        
        Returns:
            Dict containing metadata
        """
        return self.transformation_metadata
    
    def log_transformation_summary(self, input_count: int, output_count: int, transformation_type: str) -> None:
        """
        Log transformation summary.
        
        Args:
            input_count: Number of input records
            output_count: Number of output records
            transformation_type: Type of transformation
        """
        logger.info(f"Transformation completed: {input_count} -> {output_count} records ({transformation_type})")
        self.transformation_metadata.update({
            'input_count': input_count,
            'output_count': output_count,
            'transformation_type': transformation_type,
            'transformation_timestamp': FileUtils.get_js_compatible_timestamp()
        })
