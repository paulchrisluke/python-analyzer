"""
Base extractor class for ETL pipeline.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
import pandas as pd
import logging
from pathlib import Path
from urllib.parse import urlparse
from ..utils.file_utils import FileUtils

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
        try:
            # Check required fields
            required_fields = ['type']
            for field in required_fields:
                value = self.config.get(field)
                if value is None or (isinstance(value, str) and not value.strip()):
                    logger.error(f"Missing or empty configuration field: {field}")
                    return False

            # Safely validate path configuration
            try:
                path_obj = FileUtils.safe_path_from_config(self.config, 'path', required=True)
                if path_obj is None:
                    return False
                
                # Check that the path actually exists
                path_str = str(path_obj)
                # Detect URLs by known schemes or "://" pattern
                is_url = '://' in path_str or urlparse(path_str).scheme in ('http', 'https', 'ftp', 'ftps')
                # Only check local filesystem paths
                if not is_url:
                    if not path_obj.exists():
                        logger.error(f"Configuration path does not exist: {path_obj.absolute()}")
                        return False
                
                return True
                
            except ValueError as e:
                logger.error(f"Path validation failed: {str(e)}")
                return False
                
        except Exception as e:
            logger.error(f"Configuration validation failed: {str(e)}")
            return False
    
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
