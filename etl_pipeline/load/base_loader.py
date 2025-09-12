"""
Base loader class for ETL pipeline.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any
import logging
from pathlib import Path
from datetime import datetime, timezone
from threading import Lock
from copy import deepcopy
from ..utils.file_utils import FileUtils

logger = logging.getLogger(__name__)

class BaseLoader(ABC):
    """Base class for all data loaders."""
    
    def __init__(self, output_dir: str):
        """
        Initialize loader with output directory.
        
        Args:
            output_dir: Output directory for processed data
        """
        # Initialize thread safety lock first
        self._lock = Lock()
        
        # Initialize data structures before any I/O operations
        self.load_results = {}
        self.load_metadata = {
            'load_events': [],
            'start_time': None,
            'end_time': None,
            'total_records_processed': 0,
            'files_created': [],
            'errors': []
        }
        
        # Initialize output directory with error handling
        self.output_dir = Path(output_dir)
        try:
            self.output_dir.mkdir(parents=True, exist_ok=True)
        except OSError as e:
            logger.error(f"Failed to create output directory {output_dir}: {e}")
            raise
        
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
        with self._lock:
            return deepcopy(self.load_metadata)
    
    def log_load_summary(self, data_type: str, record_count: int, output_path: str) -> None:
        """
        Log load summary.
        
        Args:
            data_type: Type of data loaded
            record_count: Number of records loaded
            output_path: Path where data was saved
            
        Raises:
            ValueError: If data_type or output_path are empty/whitespace or record_count is negative
        """
        # Input validation
        if not data_type or not data_type.strip():
            raise ValueError("data_type cannot be empty or whitespace")
        
        if not output_path or not output_path.strip():
            raise ValueError("output_path cannot be empty or whitespace")
        
        if record_count < 0:
            raise ValueError("record_count cannot be negative")
        
        # Normalize inputs
        data_type = data_type.strip()
        output_path = output_path.strip()
        record_count = int(record_count)  # Ensure it's an integer
        
        logger.info(f"Load completed: {record_count} {data_type} records to {output_path}")
        
        with self._lock:
            # Ensure metadata keys exist
            if 'load_events' not in self.load_metadata:
                self.load_metadata['load_events'] = []
            if 'total_records_processed' not in self.load_metadata:
                self.load_metadata['total_records_processed'] = 0
            if 'files_created' not in self.load_metadata:
                self.load_metadata['files_created'] = []
            
            # Add to load events with UTC timestamp
            self.load_metadata['load_events'].append({
                'event_type': 'load_completed',
                'data_type': data_type,
                'record_count': record_count,
                'output_path': output_path,
                'timestamp': FileUtils.get_js_compatible_timestamp()
            })
            
            # Update totals atomically
            self.load_metadata['total_records_processed'] += record_count
            self.load_metadata['files_created'].append(output_path)
    
    def add_load_event(self, event_type: str, message: str, **kwargs) -> None:
        """
        Add a load event to metadata.
        
        Args:
            event_type: Type of event (e.g., 'file_created', 'error', 'warning')
            message: Event message
            **kwargs: Additional event data
            
        Raises:
            ValueError: If event_type or message are empty/whitespace
        """
        # Input validation
        if not event_type or not event_type.strip():
            raise ValueError("event_type cannot be empty or whitespace")
        
        if not message or not message.strip():
            raise ValueError("message cannot be empty or whitespace")
        
        # Normalize inputs
        event_type = event_type.strip()
        message = message.strip()
        
        # Reserve keys that cannot be overwritten by kwargs
        reserved_keys = {'event_type', 'message', 'timestamp'}
        filtered_kwargs = {k: v for k, v in kwargs.items() if k not in reserved_keys}
        
        event = {
            'event_type': event_type,
            'message': message,
            'timestamp': FileUtils.get_js_compatible_timestamp(),
            **filtered_kwargs
        }
        
        # Create compact representation of kwargs for logging
        kwargs_repr = ', '.join(f"{k}={v}" for k, v in filtered_kwargs.items()) if filtered_kwargs else ""
        log_context = f" ({kwargs_repr})" if kwargs_repr else ""
        
        with self._lock:
            # Ensure metadata keys exist
            if 'load_events' not in self.load_metadata:
                self.load_metadata['load_events'] = []
            if 'errors' not in self.load_metadata:
                self.load_metadata['errors'] = []
            
            self.load_metadata['load_events'].append(event)
            
            # Log based on event type with kwargs context
            if event_type == 'error':
                logger.error(f"Load error: {message}{log_context}")
                self.load_metadata['errors'].append(event)
            elif event_type == 'warning':
                logger.warning(f"Load warning: {message}{log_context}")
            else:
                logger.info(f"Load event: {message}{log_context}")
    
    def start_load_session(self) -> None:
        """Start a new load session."""
        with self._lock:
            # Reset per-session metadata fields
            self.load_metadata['load_events'] = []
            self.load_metadata['files_created'] = []
            self.load_metadata['errors'] = []
            self.load_metadata['total_records_processed'] = 0
            
            self.load_metadata['start_time'] = FileUtils.get_js_compatible_timestamp()
        
        self.add_load_event('session_started', 'Load session started')
    
    def end_load_session(self) -> None:
        """End the current load session."""
        with self._lock:
            self.load_metadata['end_time'] = FileUtils.get_js_compatible_timestamp()
        
        self.add_load_event('session_ended', 'Load session completed')
