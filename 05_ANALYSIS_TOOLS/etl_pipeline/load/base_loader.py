"""
Base loader class for ETL pipeline.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
import logging
from pathlib import Path
from datetime import datetime

logger = logging.getLogger(__name__)

class BaseLoader(ABC):
    """Base class for all data loaders."""
    
    def __init__(self, output_dir: str):
        """
        Initialize loader with output directory.
        
        Args:
            output_dir: Output directory for processed data
        """
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.load_metadata = {}
        
    @abstractmethod
    def load(self, transformed_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Load transformed data to final destination.
        
        Args:
            transformed_data: Transformed data to load
            
        Returns:
            Dict containing load results and metadata
        """
        pass
    
    def get_load_metadata(self) -> Dict[str, Any]:
        """
        Get load metadata.
        
        Returns:
            Dict containing metadata
        """
        return self.load_metadata
    
    def log_load_summary(self, data_type: str, record_count: int, output_path: str) -> None:
        """
        Log load summary.
        
        Args:
            data_type: Type of data loaded
            record_count: Number of records loaded
            output_path: Path where data was saved
        """
        logger.info(f"Load completed: {record_count} {data_type} records to {output_path}")
        self.load_metadata.update({
            'data_type': data_type,
            'record_count': record_count,
            'output_path': output_path,
            'load_timestamp': datetime.now().isoformat()
        })
