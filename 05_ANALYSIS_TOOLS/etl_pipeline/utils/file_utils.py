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

logger = logging.getLogger(__name__)

class FileUtils:
    """Utility class for file operations."""
    
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
    def save_json(data: Dict[str, Any], file_path: str, indent: int = 2) -> None:
        """
        Save data to JSON file.
        
        Args:
            data: Data to save
            file_path: Path to save file
            indent: JSON indentation
        """
        try:
            # Ensure directory exists
            Path(file_path).parent.mkdir(parents=True, exist_ok=True)
            
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=indent, ensure_ascii=False)
            logger.info(f"JSON file saved: {file_path}")
        except Exception as e:
            logger.error(f"Error saving JSON file {file_path}: {str(e)}")
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
    def get_file_size(file_path: str) -> int:
        """
        Get file size in bytes.
        
        Args:
            file_path: Path to file
            
        Returns:
            File size in bytes
        """
        try:
            return os.path.getsize(file_path)
        except Exception as e:
            logger.error(f"Error getting file size for {file_path}: {str(e)}")
            return 0
    
    @staticmethod
    def backup_file(file_path: str, backup_suffix: str = ".backup") -> str:
        """
        Create backup of file.
        
        Args:
            file_path: Path to file to backup
            backup_suffix: Suffix for backup file
            
        Returns:
            Path to backup file
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
                return ""
        except Exception as e:
            logger.error(f"Error backing up file {file_path}: {str(e)}")
            return ""
