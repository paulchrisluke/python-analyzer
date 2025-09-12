"""
Enhanced coverage analyzer with expected vs found document tracking.
"""

import logging
from typing import Dict, Any, List, Optional, Set
from datetime import datetime, timezone
from pathlib import Path
import yaml
import os

from .document_registry import DocumentRegistry
from .data_coverage_analyzer import DataCoverageAnalyzer

logger = logging.getLogger(__name__)

# Default expected documents configuration
DEFAULT_EXPECTED_DOCUMENTS = {
    "financials": [
        {"name": "Profit & Loss Statements", "required": True, "frequency": "monthly", "period": "24_months"},
        {"name": "Balance Sheets", "required": True, "frequency": "monthly", "period": "24_months"},
        {"name": "Bank Statements", "required": True, "frequency": "monthly", "period": "12_months"},
        {"name": "Tax Returns", "required": True, "frequency": "annual", "period": "3_years"},
        {"name": "General Ledger", "required": False, "frequency": "monthly", "period": "12_months"},
        {"name": "COGS Analysis", "required": False, "frequency": "monthly", "period": "12_months"}
    ],
    "legal": [
        {"name": "Lease Agreements", "required": True, "frequency": "as_needed", "period": "current"},
        {"name": "Insurance Policies", "required": True, "frequency": "annual", "period": "current"},
        {"name": "Employee Agreements", "required": False, "frequency": "as_needed", "period": "current"},
        {"name": "Supplier Contracts", "required": False, "frequency": "as_needed", "period": "current"},
        {"name": "Business Licenses", "required": True, "frequency": "annual", "period": "current"},
        {"name": "Professional Licenses", "required": True, "frequency": "annual", "period": "current"}
    ],
    "equipment": [
        {"name": "Equipment Inventory", "required": True, "frequency": "as_needed", "period": "current"},
        {"name": "Equipment Quotes", "required": False, "frequency": "as_needed", "period": "2_years"},
        {"name": "Equipment Maintenance Records", "required": False, "frequency": "as_needed", "period": "2_years"},
        {"name": "Equipment Warranties", "required": False, "frequency": "as_needed", "period": "current"}
    ],
    "operational": [
        {"name": "Sales Data", "required": True, "frequency": "monthly", "period": "24_months"},
        {"name": "Customer Records", "required": False, "frequency": "as_needed", "period": "current"},
        {"name": "Staff Records", "required": False, "frequency": "as_needed", "period": "current"},
        {"name": "Marketing Materials", "required": False, "frequency": "as_needed", "period": "current"}
    ],
    "corporate": [
        {"name": "Articles of Incorporation", "required": True, "frequency": "as_needed", "period": "current"},
        {"name": "Bylaws", "required": True, "frequency": "as_needed", "period": "current"},
        {"name": "Board Minutes", "required": False, "frequency": "quarterly", "period": "2_years"},
        {"name": "Shareholder Agreements", "required": False, "frequency": "as_needed", "period": "current"}
    ]
}

class EnhancedCoverageAnalyzer:
    """Enhanced coverage analyzer with comprehensive document tracking."""
    
    def __init__(self, business_rules: Dict[str, Any], document_registry: DocumentRegistry, 
                 expected_docs: Optional[Dict[str, List[Dict[str, Any]]]] = None):
        """
        Initialize enhanced coverage analyzer.
        
        Args:
            business_rules: Business rules configuration
            document_registry: Document registry instance
            expected_docs: Optional expected documents configuration. If None, loads from external YAML or uses default.
        """
        self.business_rules = business_rules
        self.document_registry = document_registry
        self.expected_documents = expected_docs if expected_docs is not None else self._load_expected_documents()
        self.coverage_analyzer = DataCoverageAnalyzer(business_rules)
    
    def _load_expected_documents(self) -> Dict[str, List[Dict[str, Any]]]:
        """
        Load expected documents configuration from external YAML file or return default.
        
        Returns:
            Dictionary mapping categories to expected document lists
        """
        # Try to load from external YAML file first
        config_path = self._get_expected_documents_config_path()
        if config_path and config_path.exists():
            try:
                return self._load_expected_documents_from_yaml(config_path)
            except Exception as e:
                logger.warning(f"Failed to load expected documents from {config_path}: {e}")
                logger.info("Falling back to default expected documents configuration")
        else:
            logger.info("Expected documents YAML file not found, using default configuration")
        
        # Return default configuration
        return DEFAULT_EXPECTED_DOCUMENTS.copy()
    
    def _get_expected_documents_config_path(self) -> Optional[Path]:
        """
        Get the path to the expected documents configuration file.
        
        Returns:
            Path to the YAML configuration file, or None if not found
        """
        # Look for the config file relative to this module
        current_dir = Path(__file__).parent
        config_path = current_dir.parent / "config" / "expected_documents.yaml"
        
        if config_path.exists():
            return config_path
        
        # Also check if there's an environment variable override
        env_config_path = os.getenv('EXPECTED_DOCUMENTS_CONFIG_PATH')
        if env_config_path:
            env_path = Path(env_config_path)
            if env_path.exists():
                return env_path
        
        return None
    
    def _load_expected_documents_from_yaml(self, config_path: Path) -> Dict[str, List[Dict[str, Any]]]:
        """
        Load and validate expected documents configuration from YAML file.
        
        Args:
            config_path: Path to the YAML configuration file
            
        Returns:
            Dictionary mapping categories to expected document lists
            
        Raises:
            ValueError: If the YAML file has invalid structure or content
            yaml.YAMLError: If the YAML file cannot be parsed
        """
        with open(config_path, 'r', encoding='utf-8') as f:
            config_data = yaml.safe_load(f)
        
        if not isinstance(config_data, dict):
            raise ValueError(f"Expected documents YAML must contain a dictionary, got {type(config_data)}")
        
        # Validate the structure
        validated_config = {}
        for category, documents in config_data.items():
            if not isinstance(documents, list):
                raise ValueError(f"Category '{category}' must contain a list of documents, got {type(documents)}")
            
            validated_documents = []
            for i, doc in enumerate(documents):
                if not isinstance(doc, dict):
                    raise ValueError(f"Document {i} in category '{category}' must be a dictionary, got {type(doc)}")
                
                # Validate required fields
                required_fields = ['name', 'required', 'frequency', 'period']
                for field in required_fields:
                    if field not in doc:
                        raise ValueError(f"Document {i} in category '{category}' missing required field '{field}'")
                
                # Validate field types and values
                if not isinstance(doc['name'], str) or not doc['name'].strip():
                    raise ValueError(f"Document {i} in category '{category}' must have a non-empty string 'name'")
                
                if not isinstance(doc['required'], bool):
                    raise ValueError(f"Document {i} in category '{category}' must have a boolean 'required' field")
                
                if not isinstance(doc['frequency'], str) or not doc['frequency'].strip():
                    raise ValueError(f"Document {i} in category '{category}' must have a non-empty string 'frequency'")
                
                if not isinstance(doc['period'], str) or not doc['period'].strip():
                    raise ValueError(f"Document {i} in category '{category}' must have a non-empty string 'period'")
                
                validated_documents.append({
                    'name': doc['name'].strip(),
                    'required': doc['required'],
                    'frequency': doc['frequency'].strip(),
                    'period': doc['period'].strip()
                })
            
            validated_config[category] = validated_documents
        
        logger.info(f"Successfully loaded expected documents configuration from {config_path}")
        return validated_config
    
    def analyze_enhanced_coverage(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Perform enhanced coverage analysis with document tracking.
        
        Args:
            raw_data: Raw extracted data from all sources
            
        Returns:
            Dictionary with enhanced coverage analysis
        """
        logger.info("Starting enhanced coverage analysis...")
        
        # Get base coverage analysis
        base_coverage = self.coverage_analyzer.analyze_comprehensive_coverage(raw_data)
        
        # Enhance with document registry analysis
        document_coverage = self._analyze_document_coverage()
        
        # Create enhanced coverage report
        enhanced_coverage = {
            "metadata": {
                "analysis_timestamp": datetime.now(timezone.utc).isoformat(),
                "analyzer_version": "enhanced_v1.0",
                "total_documents_analyzed": len(self.document_registry.documents)
            },
            "base_coverage": base_coverage,
            "document_coverage": document_coverage,
            "overall_assessment": self._generate_overall_assessment(base_coverage, document_coverage)
        }
        
        logger.info("Enhanced coverage analysis completed")
        return enhanced_coverage
    
    def _analyze_document_coverage(self) -> Dict[str, Any]:
        """
        Analyze document coverage using the document registry.
        
        Returns:
            Dictionary with document coverage analysis
        """
        coverage = {
            "by_category": {},
            "by_requirement": {},
            "missing_critical": [],
            "missing_optional": [],
            "coverage_summary": {}
        }
        
        # Analyze coverage by category
        for category, expected_docs in self.expected_documents.items():
            category_coverage = self._analyze_category_coverage(category, expected_docs)
            coverage["by_category"][category] = category_coverage
        
        # Analyze coverage by requirement level
        coverage["by_requirement"] = self._analyze_requirement_coverage()
        
        # Identify missing documents
        coverage["missing_critical"] = self._identify_missing_critical_documents()
        coverage["missing_optional"] = self._identify_missing_optional_documents()
        
        # Generate coverage summary
        coverage["coverage_summary"] = self._generate_coverage_summary()
        
        return coverage
    
    def _analyze_category_coverage(self, category: str, expected_docs: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyze coverage for a specific category.
        
        Args:
            category: Document category
            expected_docs: List of expected documents for this category
            
        Returns:
            Dictionary with category coverage analysis
        """
        # Get actual documents in this category, filtering by status=True
        actual_docs = self.document_registry.get_documents_by_category(category)
        actual_docs = [doc for doc in actual_docs if doc.get("status") is True]
        actual_doc_names = {doc["name"] for doc in actual_docs}
        
        # Analyze each expected document type
        found_docs = []
        missing_docs = []
        partial_docs = []
        
        for expected_doc in expected_docs:
            doc_name = expected_doc["name"]
            found = self._find_matching_documents(doc_name, actual_doc_names)
            
            if found:
                found_docs.append({
                    "name": doc_name,
                    "required": expected_doc["required"],
                    "frequency": expected_doc["frequency"],
                    "period": expected_doc["period"],
                    "found_documents": found,
                    "count": len(found)
                })
            else:
                missing_docs.append({
                    "name": doc_name,
                    "required": expected_doc["required"],
                    "frequency": expected_doc["frequency"],
                    "period": expected_doc["period"],
                    "impact": "critical" if expected_doc["required"] else "optional"
                })
        
        # Calculate coverage metrics
        total_expected = len(expected_docs)
        total_found = len(found_docs)
        required_expected = len([doc for doc in expected_docs if doc["required"]])
        required_found = len([doc for doc in found_docs if doc["required"]])
        
        return {
            "category": category,
            "total_expected": total_expected,
            "total_found": total_found,
            "required_expected": required_expected,
            "required_found": required_found,
            "coverage_percentage": (total_found / total_expected * 100) if total_expected > 0 else 0,
            "required_coverage_percentage": (required_found / required_expected * 100) if required_expected > 0 else 0,
            "found_documents": found_docs,
            "missing_documents": missing_docs,
            "status": self._get_category_status(total_found, total_expected, required_found, required_expected)
        }
    
    def _find_matching_documents(self, expected_name: str, actual_doc_names: Set[str]) -> List[str]:
        """
        Find actual documents that match an expected document type using robust pattern matching.
        
        Args:
            expected_name: Expected document name/type
            actual_doc_names: Set of actual document names
            
        Returns:
            List of matching document names, ordered by relevance score
        """
        matches = []
        expected_lower = expected_name.lower()
        
        # Comprehensive matching patterns for all expected document types
        patterns = {
            "profit & loss": ["profit", "loss", "pnl", "income", "statement", "earnings"],
            "balance sheets": ["balance", "sheet", "assets", "liabilities", "equity"],
            "bank statements": ["bank", "statement", "account", "checking", "savings"],
            "tax returns": ["tax", "return", "1040", "1120", "irs", "federal"],
            "general ledger": ["general", "ledger", "gl", "chart", "accounts"],
            "cogs analysis": ["cogs", "cost", "goods", "sold", "costs", "analysis"],
            "lease agreements": ["lease", "rental", "agreement", "rent", "premises"],
            "insurance policies": ["insurance", "policy", "coverage", "liability", "property"],
            "employee agreements": ["employee", "employment", "agreement", "contract", "staff"],
            "supplier contracts": ["supplier", "vendor", "contract", "purchase", "agreement"],
            "business licenses": ["business", "license", "permit", "registration", "authority"],
            "professional licenses": ["professional", "license", "certification", "credential", "permit"],
            "equipment inventory": ["equipment", "inventory", "asset", "machinery", "tools"],
            "equipment quotes": ["equipment", "quote", "quotation", "estimate", "proposal"],
            "equipment maintenance": ["equipment", "maintenance", "service", "repair", "upkeep"],
            "equipment warranties": ["equipment", "warranty", "guarantee", "coverage", "protection"],
            "sales data": ["sales", "transaction", "revenue", "income", "receipts"],
            "customer records": ["customer", "client", "records", "database", "contacts"],
            "staff records": ["staff", "employee", "personnel", "records", "hr", "human"],
            "marketing materials": ["marketing", "promotional", "materials", "advertising", "campaign"],
            "articles of incorporation": ["articles", "incorporation", "corporate", "charter", "formation"],
            "bylaws": ["bylaw", "corporate", "governance", "rules", "procedures"],
            "board minutes": ["board", "minutes", "meeting", "directors", "governance"],
            "shareholder agreements": ["shareholder", "stockholder", "agreement", "equity", "ownership"]
        }
        
        # Score-based matching for better accuracy
        scored_matches = []
        
        for doc_name in actual_doc_names:
            doc_lower = doc_name.lower()
            score = self._calculate_match_score(expected_lower, doc_lower, patterns)
            
            if score > 0:
                scored_matches.append((doc_name, score))
        
        # Sort by score (highest first) and return document names
        scored_matches.sort(key=lambda x: x[1], reverse=True)
        matches = [doc_name for doc_name, score in scored_matches]
        
        return matches
    
    def _calculate_match_score(self, expected_name: str, actual_name: str, patterns: Dict[str, List[str]]) -> float:
        """
        Calculate a relevance score for document matching.
        
        Args:
            expected_name: Expected document name
            actual_name: Actual document name
            patterns: Dictionary of patterns for document types
            
        Returns:
            Score between 0.0 and 1.0, where 1.0 is a perfect match
        """
        score = 0.0
        
        # Normalize names for better matching (handle special characters and abbreviations)
        def normalize_name(name):
            # Replace common abbreviations and special characters (order matters!)
            # Do multi-character replacements first to avoid conflicts
            replacements = [
                ('p&l', 'profit loss'),
                ('gl', 'general ledger'),
                ('cogs', 'cost of goods sold'),
                ('hr', 'human resources'),
                ('irs', 'internal revenue service'),
                ('&', 'and')  # Do single character replacements last
            ]
            normalized = name.lower()
            for abbrev, full in replacements:
                normalized = normalized.replace(abbrev, full)
            return normalized
        
        expected_normalized = normalize_name(expected_name)
        actual_normalized = normalize_name(actual_name)
        
        # Direct string matching (highest priority)
        if expected_normalized in actual_normalized or actual_normalized in expected_normalized:
            score += 0.8
        
        # Pattern-based matching
        best_pattern_score = 0.0
        for pattern_name, keywords in patterns.items():
            if any(keyword in expected_normalized for keyword in keywords):
                # Calculate how many keywords from this pattern match the actual name
                matching_keywords = sum(1 for keyword in keywords if keyword in actual_normalized)
                if matching_keywords > 0:
                    pattern_score = matching_keywords / len(keywords)
                    best_pattern_score = max(best_pattern_score, pattern_score)
        
        score += best_pattern_score * 0.6
        
        # Word overlap scoring (using normalized names)
        expected_words = set(expected_normalized.split())
        actual_words = set(actual_normalized.split())
        
        if expected_words and actual_words:
            word_overlap = len(expected_words.intersection(actual_words))
            word_overlap_score = word_overlap / max(len(expected_words), len(actual_words))
            score += word_overlap_score * 0.4
        
        # Bonus for exact word matches (case-insensitive)
        for expected_word in expected_words:
            if expected_word in actual_words:
                score += 0.1
        
        # Penalty for very different lengths (to avoid false positives)
        length_ratio = min(len(expected_normalized), len(actual_normalized)) / max(len(expected_normalized), len(actual_normalized))
        if length_ratio < 0.3:  # Very different lengths
            score *= 0.5
        
        return min(score, 1.0)  # Cap at 1.0
    
    def _analyze_requirement_coverage(self) -> Dict[str, Any]:
        """Analyze coverage by requirement level (required vs optional)."""
        required_found = 0
        required_expected = 0
        optional_found = 0
        optional_expected = 0
        
        for category, expected_docs in self.expected_documents.items():
            for doc in expected_docs:
                if doc["required"]:
                    required_expected += 1
                    if self._find_matching_documents(doc["name"], 
                                                   {d["name"] for d in self.document_registry.get_documents_by_category(category)}):
                        required_found += 1
                else:
                    optional_expected += 1
                    if self._find_matching_documents(doc["name"], 
                                                   {d["name"] for d in self.document_registry.get_documents_by_category(category)}):
                        optional_found += 1
        
        return {
            "required": {
                "expected": required_expected,
                "found": required_found,
                "missing": required_expected - required_found,
                "coverage_percentage": (required_found / required_expected * 100) if required_expected > 0 else 0
            },
            "optional": {
                "expected": optional_expected,
                "found": optional_found,
                "missing": optional_expected - optional_found,
                "coverage_percentage": (optional_found / optional_expected * 100) if optional_expected > 0 else 0
            }
        }
    
    def _identify_missing_critical_documents(self) -> List[Dict[str, Any]]:
        """Identify missing critical (required) documents."""
        missing_critical = []
        
        for category, expected_docs in self.expected_documents.items():
            actual_docs = self.document_registry.get_documents_by_category(category)
            actual_docs = [doc for doc in actual_docs if doc.get("status") is True]
            actual_doc_names = {doc["name"] for doc in actual_docs}
            
            for expected_doc in expected_docs:
                if expected_doc["required"]:
                    if not self._find_matching_documents(expected_doc["name"], actual_doc_names):
                        missing_critical.append({
                            "name": expected_doc["name"],
                            "category": category,
                            "frequency": expected_doc["frequency"],
                            "period": expected_doc["period"],
                            "impact": "critical",
                            "recommendation": f"Obtain {expected_doc['name']} for {category} category"
                        })
        
        return missing_critical
    
    def _identify_missing_optional_documents(self) -> List[Dict[str, Any]]:
        """Identify missing optional documents."""
        missing_optional = []
        
        for category, expected_docs in self.expected_documents.items():
            actual_docs = self.document_registry.get_documents_by_category(category)
            actual_doc_names = {doc["name"] for doc in actual_docs}
            
            for expected_doc in expected_docs:
                if not expected_doc["required"]:
                    if not self._find_matching_documents(expected_doc["name"], actual_doc_names):
                        missing_optional.append({
                            "name": expected_doc["name"],
                            "category": category,
                            "frequency": expected_doc["frequency"],
                            "period": expected_doc["period"],
                            "impact": "optional",
                            "status": True,
                            "recommendation": f"Consider obtaining {expected_doc['name']} for {category} category"
                        })
        
        return missing_optional
    
    def _generate_coverage_summary(self) -> Dict[str, Any]:
        """Generate overall coverage summary."""
        total_expected = sum(len(docs) for docs in self.expected_documents.values())
        total_found = 0
        total_required_expected = 0
        total_required_found = 0
        
        for category, expected_docs in self.expected_documents.items():
            actual_docs = self.document_registry.get_documents_by_category(category)
            actual_docs = [doc for doc in actual_docs if doc.get("status") is True]
            actual_doc_names = {doc["name"] for doc in actual_docs}
            
            for expected_doc in expected_docs:
                if expected_doc["required"]:
                    total_required_expected += 1
                    if self._find_matching_documents(expected_doc["name"], actual_doc_names):
                        total_required_found += 1
                        total_found += 1
                else:
                    if self._find_matching_documents(expected_doc["name"], actual_doc_names):
                        total_found += 1
        
        return {
            "total_expected_documents": total_expected,
            "total_found_documents": total_found,
            "total_missing_documents": total_expected - total_found,
            "overall_coverage_percentage": (total_found / total_expected * 100) if total_expected > 0 else 0,
            "required_expected_documents": total_required_expected,
            "required_found_documents": total_required_found,
            "required_missing_documents": total_required_expected - total_required_found,
            "required_coverage_percentage": (total_required_found / total_required_expected * 100) if total_required_expected > 0 else 0,
            "due_diligence_readiness": self._assess_due_diligence_readiness(total_required_found, total_required_expected)
        }
    
    def _assess_due_diligence_readiness(self, required_found: int, required_expected: int) -> str:
        """Assess due diligence readiness based on required document coverage."""
        if required_expected == 0:
            return "unknown"
        
        coverage_percentage = (required_found / required_expected * 100)
        
        if coverage_percentage >= 90:
            return "excellent"
        elif coverage_percentage >= 75:
            return "good"
        elif coverage_percentage >= 50:
            return "fair"
        else:
            return "poor"
    
    def _get_category_status(self, total_found: int, total_expected: int, 
                           required_found: int, required_expected: int) -> str:
        """Get status for a category based on coverage."""
        if required_expected == 0:
            return "unknown"
        
        required_coverage = (required_found / required_expected * 100)
        
        if required_coverage >= 90:
            return "complete"
        elif required_coverage >= 75:
            return "mostly_complete"
        elif required_coverage >= 50:
            return "partial"
        else:
            return "incomplete"
    
    def _generate_overall_assessment(self, base_coverage: Dict[str, Any], 
                                   document_coverage: Dict[str, Any]) -> Dict[str, Any]:
        """Generate overall assessment combining base and document coverage."""
        coverage_summary = document_coverage["coverage_summary"]
        
        return {
            "overall_score": self._calculate_overall_score(base_coverage, document_coverage),
            "due_diligence_readiness": coverage_summary["due_diligence_readiness"],
            "critical_gaps": len(document_coverage["missing_critical"]),
            "optional_gaps": len(document_coverage["missing_optional"]),
            "recommendations": self._generate_recommendations(document_coverage),
            "next_steps": self._generate_next_steps(document_coverage)
        }
    
    def _calculate_overall_score(self, base_coverage: Dict[str, Any], 
                               document_coverage: Dict[str, Any]) -> float:
        """Calculate overall coverage score."""
        # Weight document coverage more heavily for due diligence
        document_score = document_coverage["coverage_summary"]["overall_coverage_percentage"]
        base_score = base_coverage.get("due_diligence", {}).get("overall_score", 0)
        
        # Weighted average: 70% document coverage, 30% base coverage
        overall_score = (document_score * 0.7) + (base_score * 0.3)
        
        return round(overall_score, 1)
    
    def _generate_recommendations(self, document_coverage: Dict[str, Any]) -> List[str]:
        """Generate recommendations based on coverage analysis."""
        recommendations = []
        
        # Critical document recommendations
        if document_coverage["missing_critical"]:
            recommendations.append("URGENT: Obtain missing critical documents to proceed with due diligence")
            for missing in document_coverage["missing_critical"][:3]:  # Top 3
                recommendations.append(f"- {missing['recommendation']}")
        
        # Category-specific recommendations
        for category, coverage in document_coverage["by_category"].items():
            if coverage["status"] == "incomplete":
                recommendations.append(f"Improve {category} document coverage (currently {coverage['coverage_percentage']:.1f}%)")
        
        # General recommendations
        if document_coverage["coverage_summary"]["overall_coverage_percentage"] < 75:
            recommendations.append("Overall document coverage is below 75% - consider additional document collection")
        
        return recommendations
    
    def _generate_next_steps(self, document_coverage: Dict[str, Any]) -> List[str]:
        """Generate next steps based on coverage analysis."""
        next_steps = []
        
        # Prioritize critical documents
        if document_coverage["missing_critical"]:
            next_steps.append("1. Focus on obtaining critical missing documents")
            next_steps.append("2. Contact relevant parties for missing legal and financial documents")
        
        # Data quality improvements
        if document_coverage["coverage_summary"]["overall_coverage_percentage"] < 90:
            next_steps.append("3. Review and organize existing documents")
            next_steps.append("4. Identify additional sources for missing document types")
        
        # Final preparation
        if document_coverage["coverage_summary"]["overall_coverage_percentage"] >= 90:
            next_steps.append("1. Finalize document organization and indexing")
            next_steps.append("2. Prepare due diligence package for review")
        
        return next_steps
