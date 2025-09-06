"""
Base extractor class for ETL pipeline.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
import pandas as pd
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

class BaseExtractor(ABC):
    """Base class for all data extractors."""
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize extractor with configuration.
        
        Args:
            config: Configuration dictionary
        """
        self.config = config
        self.data = None
        self.metadata = {}
        
    @abstractmethod
    def extract(self) -> Dict[str, Any]:
        """
        Extract data from source.
        
        Returns:
            Dict containing extracted data and metadata
        """
        pass
    
    def validate_config(self) -> bool:
        """
        Validate extractor configuration.
        
        Returns:
            bool: True if configuration is valid
        """
        required_fields = ['type', 'path']
        for field in required_fields:
            if field not in self.config:
                logger.error(f"Missing required configuration field: {field}")
                return False
        return True
    
    def get_metadata(self) -> Dict[str, Any]:
        """
        Get extraction metadata.
        
        Returns:
            Dict containing metadata
        """
        return self.metadata
    
    def log_extraction_summary(self, data_count: int, source: str) -> None:
        """
        Log extraction summary.
        
        Args:
            data_count: Number of records extracted
            source: Source description
        """
        logger.info(f"Extraction completed: {data_count} records from {source}")
        self.metadata.update({
            'record_count': data_count,
            'source': source,
            'extraction_timestamp': pd.Timestamp.now().isoformat()
        })
