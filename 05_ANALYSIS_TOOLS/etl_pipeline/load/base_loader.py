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
        self.load_results = {}
        self.load_metadata = {
            'load_events': [],
            'start_time': None,
            'end_time': None,
            'total_records_processed': 0,
            'files_created': [],
            'errors': []
        }
        
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
        
        # Add to load events
        self.load_metadata['load_events'].append({
            'event_type': 'load_completed',
            'data_type': data_type,
            'record_count': record_count,
            'output_path': output_path,
            'timestamp': datetime.now().isoformat()
        })
        
        # Update totals
        self.load_metadata['total_records_processed'] += record_count
        self.load_metadata['files_created'].append(output_path)
    
    def add_load_event(self, event_type: str, message: str, **kwargs) -> None:
        """
        Add a load event to metadata.
        
        Args:
            event_type: Type of event (e.g., 'file_created', 'error', 'warning')
            message: Event message
            **kwargs: Additional event data
        """
        event = {
            'event_type': event_type,
            'message': message,
            'timestamp': datetime.now().isoformat(),
            **kwargs
        }
        self.load_metadata['load_events'].append(event)
        
        # Log based on event type
        if event_type == 'error':
            logger.error(f"Load error: {message}")
            self.load_metadata['errors'].append(event)
        elif event_type == 'warning':
            logger.warning(f"Load warning: {message}")
        else:
            logger.info(f"Load event: {message}")
    
    def start_load_session(self) -> None:
        """Start a new load session."""
        self.load_metadata['start_time'] = datetime.now().isoformat()
        self.add_load_event('session_started', 'Load session started')
    
    def end_load_session(self) -> None:
        """End the current load session."""
        self.load_metadata['end_time'] = datetime.now().isoformat()
        self.add_load_event('session_ended', 'Load session completed')
