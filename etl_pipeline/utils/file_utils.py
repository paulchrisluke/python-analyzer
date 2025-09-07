"""
File utility functions for ETL pipeline.
"""

import os
import json
import yaml
import pandas as pd
from pathlib import Path
from typing import Dict, Any, List, Optional
import logging
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

class FileUtils:
    """Utility class for file operations."""
    
    @staticmethod
    def is_url(raw: str) -> bool:
        """
        Check if a string is a URL.
        
        Args:
            raw: String to check
            
        Returns:
            True if the string appears to be a URL
        """
        if not raw or not isinstance(raw, str):
            return False
        
        # Check for common URL patterns
        if '://' in raw:
            parsed = urlparse(raw)
            # Support common web protocols
            web_schemes = ('http', 'https', 'ftp', 'ftps')
            # Support cloud storage schemes
            cloud_schemes = ('s3', 'gs', 'gcs', 'azure', 'wasb', 'abfs', 'file')
            return parsed.scheme in web_schemes + cloud_schemes
        
        return False
    
    @staticmethod
    def load_yaml(file_path: str) -> Dict[str, Any]:
        """
        Load YAML configuration file.
        
        Args:
            file_path: Path to YAML file
            
        Returns:
            Dict containing YAML data
        """
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return yaml.safe_load(f)
        except Exception as e:
            logger.error(f"Error loading YAML file {file_path}: {str(e)}")
            raise
    
    @staticmethod
    def save_yaml(data: Dict[str, Any], file_path: str) -> None:
        """
        Save data to YAML file.
        
        Args:
            data: Data to save
            file_path: Path to save file
        """
        try:
            # Ensure parent directory exists
            Path(file_path).parent.mkdir(parents=True, exist_ok=True)
            
            with open(file_path, 'w', encoding='utf-8') as f:
                yaml.dump(data, f, default_flow_style=False, indent=2)
            logger.info(f"YAML file saved: {file_path}")
        except Exception as e:
            logger.error(f"Error saving YAML file {file_path}: {str(e)}")
            raise
    
    @staticmethod
    def load_json(file_path: str) -> Dict[str, Any]:
        """
        Load JSON file.
        
        Args:
            file_path: Path to JSON file
            
        Returns:
            Dict containing JSON data
        """
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error loading JSON file {file_path}: {str(e)}")
            raise
    
    @staticmethod
    def save_json(data: Any, file_path: str, indent: int = 2) -> None:
        """
        Save data to JSON file.
        
        Args:
            data: Data to save
            file_path: Path to save file
            indent: JSON indentation
        """
        tmp_path = f"{file_path}.tmp"
        try:
            # Ensure directory exists
            Path(file_path).parent.mkdir(parents=True, exist_ok=True)
            
            # Write to temporary file
            with open(tmp_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=indent, ensure_ascii=False, default=str)
                f.flush()  # Ensure data is written to disk
                os.fsync(f.fileno())  # Force OS to flush buffers to disk
            
            # Atomic replace
            os.replace(tmp_path, file_path)
            logger.info("JSON file saved: %s", file_path)
        except Exception:
            logger.exception("Error saving JSON file %s", file_path)
            # Clean up temporary file on failure
            try:
                if os.path.exists(tmp_path):
                    os.remove(tmp_path)
            except OSError:
                pass  # Ignore cleanup errors
            raise
    
    @staticmethod
    def load_csv(file_path: str, **kwargs) -> pd.DataFrame:
        """
        Load CSV file as DataFrame.
        
        Args:
            file_path: Path to CSV file
            **kwargs: Additional arguments for pd.read_csv
            
        Returns:
            DataFrame containing CSV data
        """
        try:
            # Default parameters
            default_params = {
                'encoding': 'utf-8',
                'low_memory': False,
                'na_values': ['', 'NULL', 'null', 'N/A', 'n/a']
            }
            default_params.update(kwargs)
            
            df = pd.read_csv(file_path, **default_params)
            logger.info(f"CSV file loaded: {file_path} ({len(df)} rows)")
            return df
        except Exception as e:
            logger.error(f"Error loading CSV file {file_path}: {str(e)}")
            raise
    
    @staticmethod
    def save_csv(df: pd.DataFrame, file_path: str, **kwargs) -> None:
        """
        Save DataFrame to CSV file.
        
        Args:
            df: DataFrame to save
            file_path: Path to save file
            **kwargs: Additional arguments for df.to_csv
        """
        try:
            # Ensure directory exists
            Path(file_path).parent.mkdir(parents=True, exist_ok=True)
            
            # Default parameters
            default_params = {
                'index': False,
                'encoding': 'utf-8'
            }
            default_params.update(kwargs)
            
            df.to_csv(file_path, **default_params)
            logger.info(f"CSV file saved: {file_path} ({len(df)} rows)")
        except Exception as e:
            logger.error(f"Error saving CSV file {file_path}: {str(e)}")
            raise
    
    @staticmethod
    def find_files(directory: str, pattern: str = "*", recursive: bool = True) -> List[str]:
        """
        Find files matching pattern in directory.
        
        Args:
            directory: Directory to search
            pattern: File pattern to match
            recursive: Whether to search recursively
            
        Returns:
            List of matching file paths
        """
        try:
            path = Path(directory)
            if recursive:
                files = list(path.rglob(pattern))
            else:
                files = list(path.glob(pattern))
            
            file_paths = [str(f) for f in files if f.is_file()]
            logger.info(f"Found {len(file_paths)} files matching pattern '{pattern}' in {directory}")
            return file_paths
        except Exception as e:
            logger.error(f"Error finding files in {directory}: {str(e)}")
            return []
    
    @staticmethod
    def ensure_directory(directory: str) -> None:
        """
        Ensure directory exists, create if it doesn't.
        
        Args:
            directory: Directory path
        """
        try:
            Path(directory).mkdir(parents=True, exist_ok=True)
            logger.debug(f"Directory ensured: {directory}")
        except Exception as e:
            logger.error(f"Error creating directory {directory}: {str(e)}")
            raise
    
    @staticmethod
    def get_file_size(file_path: str) -> Optional[int]:
        """
        Get file size in bytes.
        
        Args:
            file_path: Path to file
            
        Returns:
            File size in bytes, or None if error occurs
        """
        try:
            return os.path.getsize(file_path)
        except Exception:
            logger.exception("Error getting file size for %s", file_path)
            return None
    
    @staticmethod
    def backup_file(file_path: str, backup_suffix: str = ".backup") -> Optional[str]:
        """
        Create backup of file.
        
        Args:
            file_path: Path to file to backup
            backup_suffix: Suffix for backup file
            
        Returns:
            Path to backup file, or None if no backup is created
        """
        try:
            backup_path = f"{file_path}{backup_suffix}"
            if os.path.exists(file_path):
                import shutil
                shutil.copy2(file_path, backup_path)
                logger.info(f"File backed up: {file_path} -> {backup_path}")
                return backup_path
            else:
                logger.warning(f"File not found for backup: {file_path}")
                return None
        except Exception as e:
            logger.exception(f"Error backing up file {file_path}: {str(e)}")
            return None
    
    @staticmethod
    def safe_path_from_config(config: Dict[str, Any], path_key: str, required: bool = True) -> Optional[Path]:
        """
        Safely extract and validate a path from configuration.
        
        This prevents empty paths from defaulting to current directory ('.') which could
        cause unintended directory scanning.
        
        Args:
            config: Configuration dictionary
            path_key: Key to extract path from (supports nested keys like 'section.path')
            required: Whether the path is required (raises error if missing)
            
        Returns:
            Path object if valid, None if not required and missing
            
        Raises:
            ValueError: If required path is missing or empty
        """
        try:
            # Handle nested keys like 'financial_pnl_2023.path'
            if '.' in path_key:
                keys = path_key.split('.')
                value = config
                for key in keys:
                    if isinstance(value, dict) and key in value:
                        value = value[key]
                    else:
                        value = None
                        break
            else:
                value = config.get(path_key)
            
            # Check if path is provided and not empty
            if not value or (isinstance(value, str) and not value.strip()):
                if required:
                    raise ValueError(f"Required path configuration missing or empty: {path_key}")
                else:
                    logger.debug(f"Optional path configuration missing: {path_key}")
                    return None
            
            if isinstance(value, Path):
                path_obj = value
            else:
                path_str = str(value).strip()
                if not path_str:
                    if required:
                        raise ValueError(f"Required path configuration is empty: {path_key}")
                    else:
                        logger.debug(f"Optional path configuration is empty: {path_key}")
                        return None
                path_obj = Path(path_str).expanduser()
            
            # Additional safety check: ensure path is not just current directory
            if path_obj == Path('.'):
                raise ValueError(f"Path configuration resolves to current directory, which is not allowed: {path_key}")
            
            return path_obj
            
        except Exception as e:
            if required:
                logger.error(f"Error validating required path configuration '{path_key}': {str(e)}")
                raise
            else:
                logger.debug(f"Error validating optional path configuration '{path_key}': {str(e)}")
                return None