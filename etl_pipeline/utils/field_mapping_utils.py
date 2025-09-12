"""
Field mapping utilities for ETL pipeline traceability.
"""

import yaml
import logging
import pandas as pd
from typing import Dict, Any, Optional, List
from pathlib import Path
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class FieldMappingRegistry:
    """Registry for field mappings with traceability."""
    
    def __init__(self, config_path: str = None):
        """
        Initialize field mapping registry.
        
        Args:
            config_path: Path to field_mappings.yaml config file
        """
        if config_path is None:
            config_path = Path(__file__).parent.parent / "config" / "field_mappings.yaml"
        
        self.config_path = Path(config_path)
        self.mappings = self._load_mappings()
        self.traceability_log = []
        self.transformation_types = self.mappings.get('transformation_types', {})
    
    def _load_mappings(self) -> Dict[str, Any]:
        """Load field mappings from YAML config."""
        try:
            with open(self.config_path, 'r') as f:
                result = yaml.safe_load(f)
                # Guard against None result from safe_load
                return result if result is not None else {}
        except (FileNotFoundError, PermissionError) as e:
            logger.error(f"Failed to access field mappings file {self.config_path}: {e}")
            return {}
        except yaml.YAMLError as e:
            logger.error(f"Failed to parse YAML in field mappings file {self.config_path}: {e}")
            raise
    
    def get_mapping(self, category: str, raw_field: str) -> Optional[str]:
        """
        Get normalized field name for raw field.
        
        Args:
            category: Mapping category (sales_mappings, financial_mappings, etc.)
            raw_field: Raw field name from source
            
        Returns:
            Normalized field name or None if not found
        """
        category_mappings = self.mappings.get('mappings', {}).get(category, {})
        return category_mappings.get(raw_field)
    
    def apply_array_mappings(self, df: pd.DataFrame, category: str) -> pd.DataFrame:
        """
        Apply field mappings that include array notation (e.g., discounts[0].type).
        
        Args:
            df: DataFrame to apply mappings to
            category: Mapping category
            
        Returns:
            DataFrame with array-based fields properly structured
        """
        category_mappings = self.mappings.get('mappings', {}).get(category, {})
        logger.debug(f"Processing {len(category_mappings)} mappings for category {category}")
        
        # Process array-based mappings
        for raw_field, normalized_field in category_mappings.items():
            if raw_field in df.columns and '[' in normalized_field and ']' in normalized_field:
                logger.debug(f"Processing array mapping: {raw_field} -> {normalized_field}")
                # Extract array name and index from normalized_field (e.g., "discounts[0].type")
                import re
                match = re.match(r'^(\w+)\[(\d+)\]\.(\w+)$', normalized_field)
                if match:
                    array_name, index, field_name = match.groups()
                    index = int(index)
                    logger.debug(f"Array: {array_name}, Index: {index}, Field: {field_name}")
                    
                    # Initialize array column if it doesn't exist
                    if array_name not in df.columns:
                        df[array_name] = df.apply(lambda row: [], axis=1)
                        logger.debug(f"Created {array_name} column")
                    
                    # For each row, ensure the array has enough elements
                    for idx in df.index:
                        if not isinstance(df.at[idx, array_name], list):
                            df.at[idx, array_name] = []
                        
                        # Extend array if needed
                        while len(df.at[idx, array_name]) <= index:
                            df.at[idx, array_name].append({})
                        
                        # Set the field value
                        if pd.notna(df.at[idx, raw_field]) and df.at[idx, raw_field] != '':
                            df.at[idx, array_name][index][field_name] = df.at[idx, raw_field]
                            logger.debug(f"Set {array_name}[{index}].{field_name} = {df.at[idx, raw_field]} for row {idx}")
        
        return df
    
    def get_all_mappings(self, category: str) -> Dict[str, str]:
        """
        Get all mappings for a category.
        
        Args:
            category: Mapping category
            
        Returns:
            Dictionary of raw_field -> normalized_field mappings
        """
        return self.mappings.get('mappings', {}).get(category, {})
    
    def log_field_mapping(self, raw_field: str, normalized_field: str, 
                         source_file: str, transformation: str = "direct") -> None:
        """
        Log field mapping for traceability.
        
        Args:
            raw_field: Original field name
            normalized_field: Normalized field name
            source_file: Source file path
            transformation: Transformation applied
        """
        # Validate required inputs
        if raw_field is None or (isinstance(raw_field, str) and raw_field.strip() == ""):
            raise ValueError("raw_field cannot be None or empty string")
        
        if normalized_field is None or (isinstance(normalized_field, str) and normalized_field.strip() == ""):
            raise ValueError("normalized_field cannot be None or empty string")
        
        if source_file is None or (isinstance(source_file, str) and source_file.strip() == ""):
            raise ValueError("source_file cannot be None or empty string")
        
        mapping_log = {
            "raw_field": raw_field,
            "normalized_field": normalized_field,
            "source_file": source_file,
            "transformation": transformation,
            "transformation_description": self.transformation_types.get(transformation, "Unknown transformation"),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        self.traceability_log.append(mapping_log)
        logger.debug(f"Field mapping logged: {raw_field} → {normalized_field} from {source_file}")
    
    def get_traceability_log(self) -> List[Dict[str, Any]]:
        """Get complete field mapping traceability log."""
        return self.traceability_log.copy()
    
    def clear_traceability_log(self) -> None:
        """Clear the traceability log."""
        self.traceability_log.clear()
    
    def get_traceability_summary(self) -> Dict[str, Any]:
        """
        Get summary of field mapping traceability.
        
        Returns:
            Dictionary with traceability summary statistics
        """
        if not self.traceability_log:
            return {
                "total_mappings": 0,
                "source_files": [],
                "transformations": {},
                "categories": {}
            }
        
        source_files = list(set(log["source_file"] for log in self.traceability_log))
        transformations = {}
        categories = {}
        
        for log in self.traceability_log:
            # Count transformations
            trans = log["transformation"]
            transformations[trans] = transformations.get(trans, 0) + 1
            
            # Categorize by source file type
            source_file = log["source_file"]
            if "sales" in source_file.lower():
                categories["sales"] = categories.get("sales", 0) + 1
            elif "financial" in source_file.lower() or "pnl" in source_file.lower():
                categories["financial"] = categories.get("financial", 0) + 1
            elif "equipment" in source_file.lower():
                categories["equipment"] = categories.get("equipment", 0) + 1
            else:
                categories["other"] = categories.get("other", 0) + 1
        
        return {
            "total_mappings": len(self.traceability_log),
            "source_files": source_files,
            "transformations": transformations,
            "categories": categories
        }
    
    def export_traceability_for_json(self) -> Dict[str, Any]:
        """
        Export traceability data in format suitable for JSON export.
        
        Returns:
            Dictionary with field mappings and traceability data
        """
        traceability_summary = self.get_traceability_summary()
        
        return {
            "field_mappings": {
                "sales_mappings": self.mappings.get("sales_mappings", {}),
                "financial_mappings": self.mappings.get("financial_mappings", {}),
                "equipment_mappings": self.mappings.get("equipment_mappings", {})
            },
            "traceability_log": self.traceability_log,
            "traceability_summary": traceability_summary,
            "transformation_types": self.transformation_types
        }
