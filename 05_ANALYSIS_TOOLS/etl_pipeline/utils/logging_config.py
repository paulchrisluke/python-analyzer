"""
Logging configuration for ETL pipeline.
"""

import logging
import sys
from pathlib import Path
from datetime import datetime

def setup_logging(log_level=logging.INFO, log_file=None):
    """
    Set up logging configuration for the ETL pipeline.
    
    Args:
        log_level: Logging level (default: INFO)
        log_file: Optional log file path
    """
    
    # Create logs directory if it doesn't exist
    log_dir = Path(__file__).parent.parent.parent / "logs"
    log_dir.mkdir(exist_ok=True)
    
    # Default log file if none provided
    if log_file is None:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        log_file = log_dir / f"etl_pipeline_{timestamp}.log"
    
    # Configure logging
    logging.basicConfig(
        level=log_level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file),
            logging.StreamHandler(sys.stdout)
        ]
    )
    
    logger = logging.getLogger(__name__)
    logger.info(f"Logging initialized. Log file: {log_file}")
    
    return logger

def get_logger(name):
    """Get a logger instance for a specific module."""
    return logging.getLogger(name)
