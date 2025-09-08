"""
Due Diligence Manager for business sale data management.

This module provides comprehensive due diligence data management with stage-based
filtering, scoring, validation, and export capabilities.
"""

import json
import logging
import yaml
from dataclasses import dataclass, field
from datetime import datetime, date
from pathlib import Path
from typing import Dict, Any, List, Optional, Union
import os

logger = logging.getLogger(__name__)

@dataclass
class DocumentItem:
    """Represents a document item in the due diligence data."""
    name: str
    status: bool = False
    notes: Optional[str] = None
    due_date: Optional[str] = None
    file_type: Optional[str] = None
    file_path: Optional[str] = None
    file_size: Optional[str] = None
    visibility: List[str] = field(default_factory=lambda: ["internal"])
    value: Optional[float] = None  # For equipment items

@dataclass
class DueDiligenceData:
    """Main data structure for due diligence information."""
    meta: Dict[str, Any] = field(default_factory=dict)
    sales: Dict[str, Any] = field(default_factory=dict)
    financials: Dict[str, Any] = field(default_factory=dict)
    equipment: Dict[str, Any] = field(default_factory=dict)
    legal: Dict[str, Any] = field(default_factory=dict)
    corporate: Dict[str, Any] = field(default_factory=dict)
    other: Dict[str, Any] = field(default_factory=dict)
    closing: Dict[str, Any] = field(default_factory=dict)

class DueDiligenceManager:
    """
    Manages due diligence data for business sale with stage-based filtering,
    scoring, validation, and export capabilities.
    """
    
    def __init__(self, data_dir: str = None, docs_dir: str = None, config_dir: str = None):
        """
        Initialize Due Diligence Manager.
        
        Args:
            data_dir: Directory containing structured data files
            docs_dir: Directory containing human-readable documents (PDFs, etc.)
            config_dir: Directory containing configuration files
        """
        self.data_dir = Path(data_dir) if data_dir else Path(__file__).parent.parent.parent / "data"
        self.docs_dir = Path(docs_dir) if docs_dir else Path(__file__).parent.parent.parent / "docs"
        self.config_dir = Path(config_dir) if config_dir else Path(__file__).parent.parent / "config"
        
        # Load business rules configuration
        self.business_rules = self._load_business_rules()
        
        # Ensure directories exist
        self.docs_dir.mkdir(exist_ok=True)
        (self.docs_dir / "legal").mkdir(exist_ok=True)
        (self.docs_dir / "financials").mkdir(exist_ok=True)
        (self.docs_dir / "equipment").mkdir(exist_ok=True)
        (self.docs_dir / "corporate").mkdir(exist_ok=True)
        (self.docs_dir / "other").mkdir(exist_ok=True)
        
        # Initialize data structure
        self.data = DueDiligenceData()
        self.scores = {}
        self.validation_results = {}
        
        logger.info(f"DueDiligenceManager initialized with data_dir: {self.data_dir}, docs_dir: {self.docs_dir}")
        logger.info(f"Loaded business rules from: {self.config_dir / 'business_rules.yaml'}")
    
    def _load_business_rules(self) -> Dict[str, Any]:
        """Load business rules from configuration file."""
        business_rules_path = self.config_dir / "business_rules.yaml"
        if business_rules_path.exists():
            with open(business_rules_path, 'r') as f:
                return yaml.safe_load(f)
        else:
            logger.warning(f"Business rules file not found: {business_rules_path}")
            return {}
    
    def load_existing_data(self, business_data_path: str = None, coverage_data_path: str = None) -> None:
        """
        Load existing business data from ETL pipeline.
        
        Args:
            business_data_path: Path to business_sale_data.json
            coverage_data_path: Path to due_diligence_coverage.json
        """
        try:
            # Load business sale data
            if business_data_path is None:
                business_data_path = self.data_dir / "final" / "business_sale_data.json"
            
            if Path(business_data_path).exists():
                with open(business_data_path, 'r') as f:
                    business_data = json.load(f)
                self._integrate_business_data(business_data)
                logger.info("Loaded business sale data")
            
            # Load coverage data
            if coverage_data_path is None:
                coverage_data_path = self.data_dir / "final" / "due_diligence_coverage.json"
            
            if Path(coverage_data_path).exists():
                with open(coverage_data_path, 'r') as f:
                    coverage_data = json.load(f)
                self._integrate_coverage_data(coverage_data)
                logger.info("Loaded due diligence coverage data")
            
            # If no documents exist, log warning but don't generate sample data
            if not self._has_any_documents():
                logger.warning("No documents found in data directory. Run ETL pipeline first to generate business data.")
                
        except Exception as e:
            logger.error(f"Error loading existing data: {e}")
            raise
    
    def _has_any_documents(self) -> bool:
        """Check if any documents exist in any category."""
        categories = ["financials", "equipment", "legal", "corporate", "other"]
        for category in categories:
            category_data = getattr(self.data, category, {})
            if category == "equipment":
                # Equipment category stores items under "items" key
                if (category_data.get("documents") and len(category_data["documents"]) > 0) or \
                   (category_data.get("items") and len(category_data["items"]) > 0):
                    return True
            else:
                if "documents" in category_data and len(category_data["documents"]) > 0:
                    return True
        return False
    
    def _integrate_business_data(self, business_data: Dict[str, Any]) -> None:
        """Integrate business sale data into due diligence structure."""
        # Check if this is already processed due diligence data or raw business data
        if "meta" in business_data and "financials" in business_data and "documents" in business_data["financials"]:
            # This is already processed due diligence data - load it directly
            self.data.meta = business_data["meta"]
            self.data.sales = business_data.get("sales", {})
            self.data.financials = business_data.get("financials", {})
            self.data.equipment = business_data.get("equipment", {})
            self.data.legal = business_data.get("legal", {})
            self.data.corporate = business_data.get("corporate", {})
            self.data.other = business_data.get("other", {})
            self.data.closing = business_data.get("closing", {})
            return
        
        # Check if this is business_sale_data.json with document arrays (new format)
        if "metadata" in business_data and "financials" in business_data and "documents" in business_data["financials"]:
            # This is business_sale_data.json with document arrays - load it directly
            self.data.meta = business_data["metadata"]
            
            # Transform sales data to match schema
            sales_data = business_data.get("sales", {})
            self.data.sales = {
                "monthly": {},
                "totals": {
                    "transactions": sales_data.get("total_transactions", 0),
                    "revenue": sales_data.get("total_revenue", 0),
                    "visibility": ["public", "nda", "buyer", "internal"]
                }
            }
            
            self.data.financials = business_data.get("financials", {})
            self.data.equipment = business_data.get("equipment", {})
            self.data.legal = business_data.get("legal", {})
            self.data.corporate = business_data.get("corporate", {})
            self.data.other = business_data.get("other", {})
            self.data.closing = business_data.get("closing", {})
            return
        
        # This is raw business data from ETL pipeline - process it
        # Set metadata
        self.data.meta = {
            "business_name": "Cranberry Hearing & Balance Center",
            "analysis_period": business_data.get("metadata", {}).get("analysis_period", business_data.get("meta", {}).get("analysis_period", "2023-01 to 2025-06")),
            "generated_at": datetime.now().isoformat()
        }
        
        # Integrate financials
        if "financials" in business_data:
            financials = business_data["financials"]
            self.data.financials = {
                "documents": [],
                "metrics": {
                    "annual_revenue_projection": financials.get("revenue", {}).get("annual_projection", 0),
                    "estimated_annual_ebitda": financials.get("ebitda", {}).get("estimated_annual", 0),
                    "roi_percentage": financials.get("profitability", {}).get("roi_percentage", 0),
                    "visibility": ["public", "nda", "buyer", "internal"]
                }
            }
        
        # Integrate sales data
        if "sales" in business_data:
            sales = business_data["sales"]
            self.data.sales = {
                "monthly": {},
                "totals": {
                    "transactions": sales.get("total_transactions", 0),
                    "revenue": sales.get("total_revenue", 0),
                    "visibility": ["public", "nda", "buyer", "internal"]
                }
            }
        
        # Integrate equipment data
        if "equipment" in business_data:
            equipment = business_data["equipment"]
            # Use equipment value from business rules if available
            equipment_value = self.business_rules.get("equipment", {}).get("total_value", equipment.get("total_value", 0))
            self.data.equipment = {
                "items": [],
                "total_value": equipment_value,
                "visibility": ["public", "nda", "buyer", "internal"]
            }
    
    def _integrate_coverage_data(self, coverage_data: Dict[str, Any]) -> None:
        """Integrate coverage analysis data."""
        # Update document statuses based on coverage analysis
        if "financial" in coverage_data:
            financial_coverage = coverage_data["financial"]
            if "coverage_details" in financial_coverage:
                found_docs = financial_coverage["coverage_details"].get("found_documents", [])
                missing_docs = financial_coverage["coverage_details"].get("missing_documents", [])
                
                # Update financial document statuses
                for doc_name in found_docs:
                    self._update_document_status("financials", doc_name, True)
                for doc_name in missing_docs:
                    self._update_document_status("financials", doc_name, False)
    
    def _update_document_status(self, category: str, doc_name: str, status: bool) -> None:
        """Update document status in a category."""
        if category == "financials" and "documents" in self.data.financials:
            for doc in self.data.financials["documents"]:
                # Use case-insensitive containment check for financials/documents
                doc_name_lower = doc_name.lower()
                stored_name_lower = doc["name"].lower()
                if (doc_name_lower in stored_name_lower or 
                    stored_name_lower.startswith(doc_name_lower)):
                    doc["status"] = status
                    break
    
    def get_stage_view(self, stage: str) -> Dict[str, Any]:
        """
        Get filtered view of data for specific stage.
        
        Args:
            stage: Stage name (public, nda, buyer, closing, internal)
            
        Returns:
            Filtered data dictionary for the stage
        """
        if stage not in ["public", "nda", "buyer", "closing", "internal"]:
            raise ValueError(f"Invalid stage: {stage}. Must be one of: public, nda, buyer, closing, internal")
        
        # Create base structure
        stage_data = {
            "meta": self._filter_meta(stage),
            "sales": self._filter_sales(stage),
            "financials": self._filter_financials(stage),
            "equipment": self._filter_equipment(stage),
            "legal": self._filter_legal(stage),
            "corporate": self._filter_corporate(stage),
            "other": self._filter_other(stage),
            "closing": self._filter_closing(stage)
        }
        
        # Remove empty sections
        stage_data = {k: v for k, v in stage_data.items() if v}
        
        return stage_data
    
    def _hide_file_paths_for_stage(self, item: Dict[str, Any], stage: str) -> Dict[str, Any]:
        """
        Hide file paths in an item based on the stage.
        
        Args:
            item: Dictionary containing document/item data
            stage: Stage name (public, nda, buyer, closing, internal)
            
        Returns:
            Copy of item with file paths hidden if needed
        """
        filtered_item = item.copy()
        
        # Hide file paths for buyer, nda, and public stages
        if stage in ["buyer", "nda", "public"] and "file_path" in filtered_item:
            filtered_item["file_path"] = None
        
        return filtered_item

    def _filter_meta(self, stage: str) -> Dict[str, Any]:
        """Filter metadata for stage."""
        if stage == "public":
            return {
                "business_name": self.data.meta.get("business_name", ""),
                "analysis_period": self.data.meta.get("analysis_period", ""),
                "generated_at": self.data.meta.get("generated_at", "")
            }
        return self.data.meta
    
    def _filter_sales(self, stage: str) -> Dict[str, Any]:
        """Filter sales data for stage."""
        if not self.data.sales:
            return {}
        
        if stage == "public":
            return {
                "totals": {
                    "transactions": self.data.sales.get("totals", {}).get("transactions", 0),
                    "revenue": self.data.sales.get("totals", {}).get("revenue", 0),
                    "visibility": self.data.sales.get("totals", {}).get("visibility", [])
                }
            }
        elif stage == "nda":
            return {
                "totals": self.data.sales.get("totals", {}),
                "monthly": self.data.sales.get("monthly", {})
            }
        else:
            return self.data.sales
    
    def _filter_financials(self, stage: str) -> Dict[str, Any]:
        """Filter financial data for stage."""
        if not self.data.financials:
            return {}
        
        filtered = {}
        
        # Always include metrics for public and above
        if "metrics" in self.data.financials:
            filtered["metrics"] = self.data.financials["metrics"]
        
        # Filter documents based on stage
        if "documents" in self.data.financials:
            filtered["documents"] = []
            for doc in self.data.financials["documents"]:
                if stage in doc.get("visibility", ["internal"]):
                    filtered_doc = self._hide_file_paths_for_stage(doc, stage)
                    filtered["documents"].append(filtered_doc)
        
        return filtered
    
    def _filter_equipment(self, stage: str) -> Dict[str, Any]:
        """Filter equipment data for stage."""
        if not self.data.equipment:
            return {}
        
        filtered = {
            "total_value": self.data.equipment.get("total_value", 0),
            "visibility": self.data.equipment.get("visibility", [])
        }
        
        if "items" in self.data.equipment:
            filtered["items"] = []
            for item in self.data.equipment["items"]:
                if stage in item.get("visibility", ["internal"]):
                    filtered_item = self._hide_file_paths_for_stage(item, stage)
                    filtered["items"].append(filtered_item)
        
        return filtered
    
    def _filter_legal(self, stage: str) -> Dict[str, Any]:
        """Filter legal data for stage."""
        if not self.data.legal:
            return {}
        
        if "documents" in self.data.legal:
            filtered_docs = []
            for doc in self.data.legal["documents"]:
                if stage in doc.get("visibility", ["internal"]):
                    filtered_doc = self._hide_file_paths_for_stage(doc, stage)
                    filtered_docs.append(filtered_doc)
            
            return {"documents": filtered_docs}
        
        return self.data.legal
    
    def _filter_corporate(self, stage: str) -> Dict[str, Any]:
        """Filter corporate data for stage."""
        if not self.data.corporate:
            return {}
        
        if "documents" in self.data.corporate:
            filtered_docs = []
            for doc in self.data.corporate["documents"]:
                if stage in doc.get("visibility", ["internal"]):
                    filtered_doc = self._hide_file_paths_for_stage(doc, stage)
                    filtered_docs.append(filtered_doc)
            
            return {"documents": filtered_docs}
        
        return self.data.corporate
    
    def _filter_other(self, stage: str) -> Dict[str, Any]:
        """Filter other data for stage."""
        if not self.data.other:
            return {}
        
        if "documents" in self.data.other:
            filtered_docs = []
            for doc in self.data.other["documents"]:
                if stage in doc.get("visibility", ["internal"]):
                    filtered_doc = self._hide_file_paths_for_stage(doc, stage)
                    filtered_docs.append(filtered_doc)
            
            return {"documents": filtered_docs}
        
        return self.data.other
    
    def _filter_closing(self, stage: str) -> Dict[str, Any]:
        """Filter closing data for stage."""
        if stage not in ["closing", "internal"]:
            return {}
        
        return self.data.closing
    
    def calculate_scores(self) -> Dict[str, Any]:
        """
        Calculate readiness scores and recommendations.
        
        Returns:
            Dictionary containing overall score, category scores, and recommendations
        """
        scores = {
            "overall_score": 0,
            "category_scores": {},
            "recommendations": []
        }
        
        # Calculate category scores
        category_weights = {
            "sales": 0.3,
            "financials": 0.3,
            "equipment": 0.2,
            "legal": 0.1,
            "corporate": 0.1
        }
        
        weighted_score = 0
        total_weight = 0
        
        for category, weight in category_weights.items():
            category_score = self._calculate_category_score(category)
            scores["category_scores"][category] = category_score
            weighted_score += category_score * weight
            total_weight += weight
        
        scores["overall_score"] = round(weighted_score / total_weight if total_weight > 0 else 0, 1)
        
        # Generate recommendations
        scores["recommendations"] = self._generate_recommendations(scores)
        
        self.scores = scores
        return scores
    
    def _calculate_category_score(self, category: str) -> float:
        """Calculate score for a specific category."""
        if category == "sales":
            return self._calculate_sales_score()
        elif category == "financials":
            return self._calculate_financials_score()
        elif category == "equipment":
            return self._calculate_equipment_score()
        elif category == "legal":
            return self._calculate_legal_score()
        elif category == "corporate":
            return self._calculate_corporate_score()
        else:
            return 0.0
    
    def _calculate_sales_score(self) -> float:
        """Calculate sales data completeness score."""
        if not self.data.sales or not self.data.sales.get("totals"):
            return 0.0
        
        # Check if we have revenue and transaction data
        totals = self.data.sales["totals"]
        has_revenue = totals.get("revenue", 0) > 0
        has_transactions = totals.get("transactions", 0) > 0
        has_monthly = bool(self.data.sales.get("monthly"))
        
        score = 0
        if has_revenue:
            score += 40
        if has_transactions:
            score += 30
        if has_monthly:
            score += 30
        
        return min(score, 100.0)
    
    def _calculate_financials_score(self) -> float:
        """Calculate financial documents completeness score."""
        if not self.data.financials or not self.data.financials.get("documents"):
            return 0.0
        
        documents = self.data.financials["documents"]
        if not documents:
            return 0.0
        
        # Count completed documents
        completed = sum(1 for doc in documents if doc.get("status", False))
        total = len(documents)
        
        return (completed / total) * 100 if total > 0 else 0.0
    
    def _calculate_equipment_score(self) -> float:
        """Calculate equipment data completeness score."""
        if not self.data.equipment or not self.data.equipment.get("items"):
            return 0.0
        
        items = self.data.equipment["items"]
        if not items:
            return 0.0
        
        # Count completed items
        completed = sum(1 for item in items if item.get("status", False))
        total = len(items)
        
        return (completed / total) * 100 if total > 0 else 0.0
    
    def _calculate_legal_score(self) -> float:
        """Calculate legal documents completeness score."""
        if not self.data.legal or not self.data.legal.get("documents"):
            return 0.0
        
        documents = self.data.legal["documents"]
        if not documents:
            return 0.0
        
        # Count completed documents
        completed = sum(1 for doc in documents if doc.get("status", False))
        total = len(documents)
        
        return (completed / total) * 100 if total > 0 else 0.0
    
    def _calculate_corporate_score(self) -> float:
        """Calculate corporate documents completeness score."""
        if not self.data.corporate or not self.data.corporate.get("documents"):
            return 0.0
        
        documents = self.data.corporate["documents"]
        if not documents:
            return 0.0
        
        # Count completed documents
        completed = sum(1 for doc in documents if doc.get("status", False))
        total = len(documents)
        
        return (completed / total) * 100 if total > 0 else 0.0
    
    def _generate_recommendations(self, scores: Dict[str, Any]) -> List[str]:
        """Generate recommendations based on scores."""
        recommendations = []
        overall_score = scores.get("overall_score", 0)
        category_scores = scores.get("category_scores", {})
        
        # Overall recommendations
        if overall_score >= 90:
            recommendations.append("Excellent readiness - ready for due diligence")
        elif overall_score >= 75:
            recommendations.append("Good readiness - minor gaps exist but due diligence can proceed")
        elif overall_score >= 60:
            recommendations.append("Fair readiness - address gaps before due diligence")
        else:
            recommendations.append("Poor readiness - significant gaps need to be addressed")
        
        # Category-specific recommendations
        for category, score in category_scores.items():
            if score < 50:
                recommendations.append(f"Critical: Complete {category} documentation")
            elif score < 75:
                recommendations.append(f"Important: Improve {category} completeness")
        
        return recommendations
    
    def validate(self) -> Dict[str, Any]:
        """
        Validate data integrity and file existence.
        
        Returns:
            Dictionary containing validation results, issues, and warnings
        """
        validation_results = {
            "status": "valid",
            "issues": [],
            "warnings": [],
            "file_checks": {},
            "cross_checks": {}
        }
        
        # Check file existence
        validation_results["file_checks"] = self.check_filesystem()
        
        # Cross-check data consistency
        validation_results["cross_checks"] = self._cross_check_data()
        
        # Check for critical missing documents
        critical_missing = self._check_critical_documents()
        if critical_missing:
            validation_results["issues"].extend(critical_missing)
            validation_results["status"] = "invalid"
        
        # Check date ranges
        date_issues = self._check_date_ranges()
        if date_issues:
            validation_results["warnings"].extend(date_issues)
        
        self.validation_results = validation_results
        return validation_results
    
    def check_filesystem(self) -> Dict[str, Any]:
        """
        Check filesystem for document existence and update status/file_size.
        
        Returns:
            Dictionary containing file check results
        """
        file_checks = {
            "checked_files": 0,
            "existing_files": 0,
            "missing_files": 0,
            "updated_statuses": 0
        }
        
        # Check all document categories
        categories = ["financials", "equipment", "legal", "corporate", "other"]
        
        for category in categories:
            category_data = getattr(self.data, category, {})
            
            # Handle both "documents" and "items" (for equipment)
            items_to_check = []
            if "documents" in category_data:
                items_to_check.extend(category_data["documents"])
            if category == "equipment" and "items" in category_data:
                items_to_check.extend(category_data["items"])
            
            for doc in items_to_check:
                file_checks["checked_files"] += 1
                
                file_path = doc.get("file_path")
                if file_path:
                    # Check if file exists
                    full_path = self._resolve_file_path(file_path)
                    if full_path.exists():
                        file_checks["existing_files"] += 1
                        doc["status"] = True
                        doc["file_size"] = self._get_file_size(full_path)
                        file_checks["updated_statuses"] += 1
                    else:
                        file_checks["missing_files"] += 1
                        doc["status"] = False
                        doc["file_size"] = None
                        file_checks["updated_statuses"] += 1
        
        return file_checks
    
    def _resolve_file_path(self, file_path: str) -> Path:
        """Resolve file path to absolute path."""
        if file_path.startswith("docs/"):
            return self.docs_dir / file_path[5:]  # Remove "docs/" prefix
        else:
            # Assume it's relative to project root
            return Path(file_path)
    
    def _get_file_size(self, file_path: Path) -> str:
        """Get human-readable file size."""
        try:
            size_bytes = file_path.stat().st_size
            if size_bytes < 1024:
                return f"{size_bytes} B"
            elif size_bytes < 1024 * 1024:
                return f"{size_bytes / 1024:.1f} KB"
            elif size_bytes < 1024 * 1024 * 1024:
                return f"{size_bytes / (1024 * 1024):.1f} MB"
            else:
                return f"{size_bytes / (1024 * 1024 * 1024):.1f} GB"
        except Exception:
            return "Unknown"
    
    def _cross_check_data(self) -> Dict[str, Any]:
        """Cross-check data consistency between categories."""
        cross_checks = {
            "sales_financial_consistency": True,
            "equipment_value_reasonable": True,
            "date_range_alignment": True
        }
        
        # Check sales vs financial consistency
        if self.data.sales and self.data.financials:
            sales_revenue = self.data.sales.get("totals", {}).get("revenue", 0)
            financial_revenue = self.data.financials.get("metrics", {}).get("annual_revenue_projection", 0)
            
            # Guard against division by zero
            denom = max(sales_revenue, financial_revenue)
            if denom == 0:
                # If both revenues are zero, consider it consistent (no inconsistency to flag)
                cross_checks["sales_financial_consistency"] = True
            else:
                # Check if they're within 20% tolerance
                tolerance = 0.2
                if abs(sales_revenue - financial_revenue) / denom > tolerance:
                    cross_checks["sales_financial_consistency"] = False
        
        # Check equipment value reasonableness
        if self.data.equipment:
            equipment_value = self.data.equipment.get("total_value", 0)
            if equipment_value > 0 and equipment_value < 10000:  # Less than $10k seems low
                cross_checks["equipment_value_reasonable"] = False
        
        return cross_checks
    
    def _check_critical_documents(self) -> List[str]:
        """Check for critical missing documents."""
        critical_missing = []
        
        # Check for critical financial documents
        if self.data.financials and "documents" in self.data.financials:
            financial_docs = self.data.financials["documents"]
            critical_financial = ["Profit & Loss", "Balance Sheet", "Tax Return"]
            
            for critical_doc in critical_financial:
                found = any(doc.get("name", "").lower().find(critical_doc.lower()) >= 0 
                           and doc.get("status", False) for doc in financial_docs)
                if not found:
                    critical_missing.append(f"Missing critical financial document: {critical_doc}")
        
        # Check for critical legal documents
        if self.data.legal and "documents" in self.data.legal:
            legal_docs = self.data.legal["documents"]
            critical_legal = ["Lease", "Insurance", "NDA"]
            
            for critical_doc in critical_legal:
                found = any(doc.get("name", "").lower().find(critical_doc.lower()) >= 0 
                           and doc.get("status", False) for doc in legal_docs)
                if not found:
                    critical_missing.append(f"Missing critical legal document: {critical_doc}")
        
        return critical_missing
    
    def _check_date_ranges(self) -> List[str]:
        """Check for date range alignment issues."""
        warnings = []
        
        # Check if analysis period makes sense
        analysis_period = self.data.meta.get("analysis_period", "")
        if "2023" in analysis_period and "2025" in analysis_period:
            # This seems reasonable for a 2+ year analysis
            pass
        else:
            warnings.append("Analysis period may not cover sufficient time range")
        
        return warnings
    
    
    def export_json(self, stage: str, path: str) -> None:
        """
        Export stage-specific JSON to file.
        
        Args:
            stage: Stage name (public, nda, buyer, closing, internal)
            path: Output file path
        """
        try:
            stage_data = self.get_stage_view(stage)
            
            # Ensure parent directories exist
            Path(path).parent.mkdir(parents=True, exist_ok=True)
            
            with open(path, 'w') as f:
                json.dump(stage_data, f, indent=2, default=str)
            
            logger.info(f"Exported {stage} stage data to {path}")
            
        except Exception as e:
            logger.error(f"Error exporting {stage} stage data: {e}")
            raise
    
    def export_all(self, output_dir: str = None) -> None:
        """
        Export all stage-specific JSONs to directory.
        
        Args:
            output_dir: Output directory path
        """
        if output_dir is None:
            output_dir = self.data_dir / "final" / "due_diligence_stages"
        
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        stages = ["public", "nda", "buyer", "closing", "internal"]
        
        for stage in stages:
            stage_file = output_path / f"{stage}.json"
            self.export_json(stage, str(stage_file))
        
        logger.info(f"Exported all stage data to {output_path}")
    
    def get_summary(self) -> Dict[str, Any]:
        """
        Get summary of due diligence status.
        
        Returns:
            Dictionary containing summary information
        """
        scores = self.calculate_scores()
        validation = self.validate()
        
        return {
            "overall_score": scores.get("overall_score", 0),
            "readiness_level": self._get_readiness_level(scores.get("overall_score", 0)),
            "category_scores": scores.get("category_scores", {}),
            "validation_status": validation.get("status", "unknown"),
            "critical_issues": len(validation.get("issues", [])),
            "warnings": len(validation.get("warnings", [])),
            "recommendations": scores.get("recommendations", [])
        }
    
    def _get_readiness_level(self, score: float) -> str:
        """Get readiness level based on score."""
        if score >= 90:
            return "excellent"
        elif score >= 75:
            return "good"
        elif score >= 60:
            return "fair"
        else:
            return "poor"
