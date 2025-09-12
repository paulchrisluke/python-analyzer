"""
JSON schema validator for ETL pipeline exports.
"""

import json
import logging
from typing import Dict, Any, List, Optional, Union
from pathlib import Path
from datetime import datetime

logger = logging.getLogger(__name__)

class SchemaValidator:
    """Validates JSON exports against the expected schema."""
    
    def __init__(self):
        """Initialize schema validator."""
        self.required_fields = {
            "business_sale_data": [
                "metadata",
                "traceability",
                "sales",
                "financials"
            ],
            "due_diligence_coverage": [
                "metadata",
                "base_coverage",
                "document_coverage",
                "overall_assessment",
                "traceability"
            ]
        }
        
        self.required_traceability_fields = [
            "field_mappings",
            "calculation_lineage",
            "document_registry",
            "etl_pipeline_version",
            "traceability_enabled"
        ]
    
    def validate_business_sale_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate business sale data JSON structure.
        
        Args:
            data: Business sale data dictionary
            
        Returns:
            Validation results dictionary
        """
        validation_results = {
            "valid": True,
            "errors": [],
            "warnings": [],
            "schema_version": "1.0.0"
        }
        
        # Check required top-level fields
        for field in self.required_fields["business_sale_data"]:
            if field not in data:
                validation_results["errors"].append(f"Missing required field: {field}")
                validation_results["valid"] = False
        
        # Validate metadata
        if "metadata" in data:
            metadata_validation = self._validate_metadata(data["metadata"])
            validation_results["errors"].extend(metadata_validation["errors"])
            validation_results["warnings"].extend(metadata_validation["warnings"])
        
        # Validate traceability
        if "traceability" in data:
            traceability_validation = self._validate_traceability(data["traceability"])
            validation_results["errors"].extend(traceability_validation["errors"])
            validation_results["warnings"].extend(traceability_validation["warnings"])
        
        # Validate business data structure
        business_validation = self._validate_business_data_structure(data)
        validation_results["errors"].extend(business_validation["errors"])
        validation_results["warnings"].extend(business_validation["warnings"])
        
        return validation_results
    
    def validate_due_diligence_coverage(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate due diligence coverage JSON structure.
        
        Args:
            data: Due diligence coverage data dictionary
            
        Returns:
            Validation results dictionary
        """
        validation_results = {
            "valid": True,
            "errors": [],
            "warnings": [],
            "schema_version": "1.0.0"
        }
        
        # Check required top-level fields
        for field in self.required_fields["due_diligence_coverage"]:
            if field not in data:
                validation_results["errors"].append(f"Missing required field: {field}")
                validation_results["valid"] = False
        
        # Validate metadata
        if "metadata" in data:
            metadata_validation = self._validate_metadata(data["metadata"])
            validation_results["errors"].extend(metadata_validation["errors"])
            validation_results["warnings"].extend(metadata_validation["warnings"])
        
        # Validate traceability
        if "traceability" in data:
            traceability_validation = self._validate_traceability(data["traceability"])
            validation_results["errors"].extend(traceability_validation["errors"])
            validation_results["warnings"].extend(traceability_validation["warnings"])
        
        # Validate coverage analysis structure
        coverage_validation = self._validate_coverage_analysis_structure(data)
        validation_results["errors"].extend(coverage_validation["errors"])
        validation_results["warnings"].extend(coverage_validation["warnings"])
        
        return validation_results
    
    def _validate_metadata(self, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Validate metadata structure."""
        validation = {"errors": [], "warnings": []}
        
        required_metadata_fields = [
            "business_name",
            "generated_at",
            "etl_run_timestamp",
            "data_period"
        ]
        
        for field in required_metadata_fields:
            if field not in metadata:
                validation["errors"].append(f"Missing required metadata field: {field}")
        
        # Validate timestamp format
        timestamp_fields = ["generated_at", "etl_run_timestamp"]
        for field in timestamp_fields:
            if field in metadata:
                if not self._is_valid_timestamp(metadata[field]):
                    validation["warnings"].append(f"Invalid timestamp format in {field}: {metadata[field]}")
        
        return validation
    
    def _validate_traceability(self, traceability: Dict[str, Any]) -> Dict[str, Any]:
        """Validate traceability structure."""
        validation = {"errors": [], "warnings": []}
        
        # Check required traceability fields
        for field in self.required_traceability_fields:
            if field not in traceability:
                validation["errors"].append(f"Missing required traceability field: {field}")
        
        # Validate field mappings
        if "field_mappings" in traceability:
            field_mappings_validation = self._validate_field_mappings(traceability["field_mappings"])
            validation["errors"].extend(field_mappings_validation["errors"])
            validation["warnings"].extend(field_mappings_validation["warnings"])
        
        # Validate calculation lineage
        if "calculation_lineage" in traceability:
            lineage_validation = self._validate_calculation_lineage(traceability["calculation_lineage"])
            validation["errors"].extend(lineage_validation["errors"])
            validation["warnings"].extend(lineage_validation["warnings"])
        
        # Validate document registry
        if "document_registry" in traceability:
            registry_validation = self._validate_document_registry(traceability["document_registry"])
            validation["errors"].extend(registry_validation["errors"])
            validation["warnings"].extend(registry_validation["warnings"])
        
        # Validate ETL pipeline version
        if "etl_pipeline_version" in traceability:
            version = traceability["etl_pipeline_version"]
            if not isinstance(version, str) or not version:
                validation["warnings"].append(f"Invalid ETL pipeline version: {version}")
        
        # Validate traceability enabled flag
        if "traceability_enabled" in traceability:
            enabled = traceability["traceability_enabled"]
            if not isinstance(enabled, bool):
                validation["warnings"].append(f"Invalid traceability_enabled value: {enabled}")
        
        return validation
    
    def _validate_field_mappings(self, field_mappings: Dict[str, Any]) -> Dict[str, Any]:
        """Validate field mappings structure."""
        validation = {"errors": [], "warnings": []}
        
        expected_mapping_categories = ["sales_mappings", "financial_mappings", "equipment_mappings"]
        
        for category in expected_mapping_categories:
            if category not in field_mappings:
                validation["warnings"].append(f"Missing field mapping category: {category}")
        
        # Validate traceability log
        if "traceability_log" in field_mappings:
            log_entries = field_mappings["traceability_log"]
            if not isinstance(log_entries, list):
                validation["errors"].append("traceability_log must be a list")
            else:
                for i, entry in enumerate(log_entries):
                    if not isinstance(entry, dict):
                        validation["errors"].append(f"traceability_log entry {i} must be a dictionary")
                    else:
                        required_log_fields = ["raw_field", "normalized_field", "source_file", "transformation", "timestamp"]
                        for field in required_log_fields:
                            if field not in entry:
                                validation["warnings"].append(f"Missing field in traceability_log entry {i}: {field}")
        
        return validation
    
    def _validate_calculation_lineage(self, calculation_lineage: Dict[str, Any]) -> Dict[str, Any]:
        """Validate calculation lineage structure."""
        validation = {"errors": [], "warnings": []}
        
        if "calculation_lineage" not in calculation_lineage:
            validation["errors"].append("Missing calculation_lineage array")
            return validation
        
        calculations = calculation_lineage["calculation_lineage"]
        if not isinstance(calculations, list):
            validation["errors"].append("calculation_lineage must be a list")
            return validation
        
        for i, calc in enumerate(calculations):
            if not isinstance(calc, dict):
                validation["errors"].append(f"Calculation {i} must be a dictionary")
                continue
            
            required_calc_fields = ["metric_name", "steps", "final_value"]
            for field in required_calc_fields:
                if field not in calc:
                    validation["warnings"].append(f"Missing field in calculation {i}: {field}")
            
            # Validate steps
            if "steps" in calc:
                steps = calc["steps"]
                if not isinstance(steps, list):
                    validation["errors"].append(f"Steps in calculation {i} must be a list")
                else:
                    for j, step in enumerate(steps):
                        if not isinstance(step, dict):
                            validation["errors"].append(f"Step {j} in calculation {i} must be a dictionary")
                        else:
                            required_step_fields = ["step", "operation", "field", "value", "timestamp"]
                            for field in required_step_fields:
                                if field not in step:
                                    validation["warnings"].append(f"Missing field in step {j} of calculation {i}: {field}")
        
        return validation
    
    def _validate_document_registry(self, document_registry: Dict[str, Any]) -> Dict[str, Any]:
        """Validate document registry structure."""
        validation = {"errors": [], "warnings": []}
        
        if "documents" not in document_registry:
            validation["errors"].append("Missing documents array")
            return validation
        
        documents = document_registry["documents"]
        if not isinstance(documents, list):
            validation["errors"].append("documents must be a list")
            return validation
        
        for i, doc in enumerate(documents):
            if not isinstance(doc, dict):
                validation["errors"].append(f"Document {i} must be a dictionary")
                continue
            
            required_doc_fields = ["name", "category", "file_type", "file_path", "status"]
            for field in required_doc_fields:
                if field not in doc:
                    validation["warnings"].append(f"Missing field in document {i}: {field}")
            
            # Validate file size format
            if "file_size" in doc:
                file_size = doc["file_size"]
                if not isinstance(file_size, str) or not file_size.endswith(("B", "KB", "MB", "GB")):
                    validation["warnings"].append(f"Invalid file_size format in document {i}: {file_size}")
            
            # Validate timestamps
            timestamp_fields = ["last_modified", "created_date", "registered_at"]
            for field in timestamp_fields:
                if field in doc and not self._is_valid_timestamp(doc[field]):
                    validation["warnings"].append(f"Invalid timestamp format in document {i} {field}: {doc[field]}")
        
        return validation
    
    def _validate_business_data_structure(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate business data structure."""
        validation = {"errors": [], "warnings": []}
        
        # Validate sales data
        if "sales" in data:
            sales = data["sales"]
            if not isinstance(sales, dict):
                validation["errors"].append("sales must be a dictionary")
            else:
                if "total_transactions" in sales and not isinstance(sales["total_transactions"], int):
                    validation["warnings"].append("total_transactions should be an integer")
                if "total_revenue" in sales and not isinstance(sales["total_revenue"], (int, float)):
                    validation["warnings"].append("total_revenue should be a number")
        
        # Validate financials data
        if "financials" in data:
            financials = data["financials"]
            if not isinstance(financials, dict):
                validation["errors"].append("financials must be a dictionary")
        
        return validation
    
    def _validate_coverage_analysis_structure(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate coverage analysis structure."""
        validation = {"errors": [], "warnings": []}
        
        # Validate base coverage
        if "base_coverage" in data:
            base_coverage = data["base_coverage"]
            if not isinstance(base_coverage, dict):
                validation["errors"].append("base_coverage must be a dictionary")
        
        # Validate document coverage
        if "document_coverage" in data:
            doc_coverage = data["document_coverage"]
            if not isinstance(doc_coverage, dict):
                validation["errors"].append("document_coverage must be a dictionary")
        
        # Validate overall assessment
        if "overall_assessment" in data:
            assessment = data["overall_assessment"]
            if not isinstance(assessment, dict):
                validation["errors"].append("overall_assessment must be a dictionary")
            else:
                if "overall_score" in assessment and not isinstance(assessment["overall_score"], (int, float)):
                    validation["warnings"].append("overall_score should be a number")
        
        return validation
    
    def _is_valid_timestamp(self, timestamp: str) -> bool:
        """Check if timestamp is in valid ISO 8601 format."""
        try:
            datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            return True
        except (ValueError, AttributeError):
            return False
    
    def validate_json_file(self, file_path: Union[str, Path]) -> Dict[str, Any]:
        """
        Validate a JSON file against the expected schema.
        
        Args:
            file_path: Path to the JSON file
            
        Returns:
            Validation results dictionary
        """
        file_path = Path(file_path)
        
        if not file_path.exists():
            return {
                "valid": False,
                "errors": [f"File does not exist: {file_path}"],
                "warnings": [],
                "schema_version": "1.0.0"
            }
        
        try:
            with open(file_path, 'r') as f:
                data = json.load(f)
        except json.JSONDecodeError as e:
            return {
                "valid": False,
                "errors": [f"Invalid JSON: {str(e)}"],
                "warnings": [],
                "schema_version": "1.0.0"
            }
        except Exception as e:
            return {
                "valid": False,
                "errors": [f"Error reading file: {str(e)}"],
                "warnings": [],
                "schema_version": "1.0.0"
            }
        
        # Determine file type and validate accordingly
        if "business_sale_data" in file_path.name:
            return self.validate_business_sale_data(data)
        elif "due_diligence_coverage" in file_path.name:
            return self.validate_due_diligence_coverage(data)
        else:
            return {
                "valid": False,
                "errors": [f"Unknown file type: {file_path.name}"],
                "warnings": [],
                "schema_version": "1.0.0"
            }
    
    def validate_all_exports(self, output_dir: Union[str, Path]) -> Dict[str, Any]:
        """
        Validate all JSON exports in a directory.
        
        Args:
            output_dir: Directory containing JSON exports
            
        Returns:
            Validation results for all files
        """
        output_dir = Path(output_dir)
        results = {
            "overall_valid": True,
            "files": {},
            "summary": {
                "total_files": 0,
                "valid_files": 0,
                "invalid_files": 0,
                "total_errors": 0,
                "total_warnings": 0
            }
        }
        
        # Find all JSON files
        json_files = list(output_dir.glob("**/*.json"))
        
        for json_file in json_files:
            file_results = self.validate_json_file(json_file)
            results["files"][str(json_file)] = file_results
            
            # Update summary
            results["summary"]["total_files"] += 1
            if file_results["valid"]:
                results["summary"]["valid_files"] += 1
            else:
                results["summary"]["invalid_files"] += 1
                results["overall_valid"] = False
            
            results["summary"]["total_errors"] += len(file_results["errors"])
            results["summary"]["total_warnings"] += len(file_results["warnings"])
        
        return results
