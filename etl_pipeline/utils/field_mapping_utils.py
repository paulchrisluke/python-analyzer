"""
Field mapping utilities for ETL pipeline traceability.
"""

import yaml
import logging
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
                return yaml.safe_load(f)
        except Exception as e:
            logger.error(f"Failed to load field mappings from {self.config_path}: {e}")
            return {}
    
    def get_mapping(self, category: str, raw_field: str) -> Optional[str]:
        """
        Get normalized field name for raw field.
        
        Args:
            category: Mapping category (sales_mappings, financial_mappings, etc.)
            raw_field: Raw field name from source
            
        Returns:
            Normalized field name or None if not found
        """
        category_mappings = self.mappings.get(category, {})
        return category_mappings.get(raw_field)
    
    def get_all_mappings(self, category: str) -> Dict[str, str]:
        """
        Get all mappings for a category.
        
        Args:
            category: Mapping category
            
        Returns:
            Dictionary of raw_field -> normalized_field mappings
        """
        return self.mappings.get(category, {})
    
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
