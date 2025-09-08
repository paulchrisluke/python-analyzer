#!/usr/bin/env python3
"""
Comprehensive verification tests for DueDiligenceManager.
These tests challenge the implementation and verify all requirements.
"""

import pytest
import json
import tempfile
import shutil
from pathlib import Path
from typing import Dict, Any, List
import jsonschema
from jsonschema import validate, ValidationError

# Add the parent directory to the Python path
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from etl_pipeline.utils.due_diligence_manager import DueDiligenceManager

# Master Schema Definition
MASTER_SCHEMA = {
    "type": "object",
    "required": ["meta"],
    "properties": {
        "meta": {
            "type": "object",
            "required": ["business_name", "analysis_period", "generated_at"],
            "properties": {
                "business_name": {"type": "string"},
                "analysis_period": {"type": "string"},
                "generated_at": {"type": "string"}
            }
        },
        "sales": {
            "type": "object",
            "properties": {
                "monthly": {"type": "object"},
                "totals": {
                    "type": "object",
                    "required": ["transactions", "revenue", "visibility"],
                    "properties": {
                        "transactions": {"type": "number"},
                        "revenue": {"type": "number"},
                        "visibility": {"type": "array", "items": {"type": "string"}}
                    }
                }
            }
        },
        "financials": {
            "type": "object",
            "properties": {
                "documents": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "required": ["name", "status", "notes", "due_date", "file_type", "file_path", "file_size", "visibility"],
                        "properties": {
                            "name": {"type": "string"},
                            "status": {"type": "boolean"},
                            "notes": {"type": ["string", "null"]},
                            "due_date": {"type": ["string", "null"]},
                            "file_type": {"type": ["string", "null"]},
                            "file_path": {"type": ["string", "null"]},
                            "file_size": {"type": ["string", "null"]},
                            "visibility": {"type": "array", "items": {"type": "string"}}
                        }
                    }
                },
                "metrics": {
                    "type": "object",
                    "properties": {
                        "annual_revenue_projection": {"type": "number"},
                        "estimated_annual_ebitda": {"type": "number"},
                        "roi_percentage": {"type": "number"},
                        "visibility": {"type": "array", "items": {"type": "string"}}
                    }
                }
            }
        },
        "equipment": {
            "type": "object",
            "properties": {
                "items": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "required": ["name", "status", "notes", "due_date", "file_type", "file_path", "file_size", "visibility", "value"],
                        "properties": {
                            "name": {"type": "string"},
                            "status": {"type": "boolean"},
                            "notes": {"type": ["string", "null"]},
                            "due_date": {"type": ["string", "null"]},
                            "file_type": {"type": ["string", "null"]},
                            "file_path": {"type": ["string", "null"]},
                            "file_size": {"type": ["string", "null"]},
                            "visibility": {"type": "array", "items": {"type": "string"}},
                            "value": {"type": ["number", "string", "null"]}
                        }
                    }
                },
                "total_value": {"type": ["number", "string"]},
                "visibility": {"type": "array", "items": {"type": "string"}}
            }
        },
        "legal": {
            "type": "object",
            "properties": {
                "documents": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "required": ["name", "status", "notes", "due_date", "file_type", "file_path", "file_size", "visibility"],
                        "properties": {
                            "name": {"type": "string"},
                            "status": {"type": "boolean"},
                            "notes": {"type": ["string", "null"]},
                            "due_date": {"type": ["string", "null"]},
                            "file_type": {"type": ["string", "null"]},
                            "file_path": {"type": ["string", "null"]},
                            "file_size": {"type": ["string", "null"]},
                            "visibility": {"type": "array", "items": {"type": "string"}}
                        }
                    }
                }
            }
        },
        "corporate": {
            "type": "object",
            "properties": {
                "documents": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "required": ["name", "status", "notes", "due_date", "file_type", "file_path", "file_size", "visibility"],
                        "properties": {
                            "name": {"type": "string"},
                            "status": {"type": "boolean"},
                            "notes": {"type": ["string", "null"]},
                            "due_date": {"type": ["string", "null"]},
                            "file_type": {"type": ["string", "null"]},
                            "file_path": {"type": ["string", "null"]},
                            "file_size": {"type": ["string", "null"]},
                            "visibility": {"type": "array", "items": {"type": "string"}}
                        }
                    }
                }
            }
        },
        "other": {
            "type": "object",
            "properties": {
                "documents": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "required": ["name", "status", "notes", "due_date", "file_type", "file_path", "file_size", "visibility"],
                        "properties": {
                            "name": {"type": "string"},
                            "status": {"type": "boolean"},
                            "notes": {"type": ["string", "null"]},
                            "due_date": {"type": ["string", "null"]},
                            "file_type": {"type": ["string", "null"]},
                            "file_path": {"type": ["string", "null"]},
                            "file_size": {"type": ["string", "null"]},
                            "visibility": {"type": "array", "items": {"type": "string"}}
                        }
                    }
                }
            }
        },
        "closing": {
            "type": "object",
            "properties": {
                "milestones": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "required": ["name", "status", "visibility"],
                        "properties": {
                            "name": {"type": "string"},
                            "status": {"type": "boolean"},
                            "visibility": {"type": "array", "items": {"type": "string"}}
                        }
                    }
                }
            }
        }
    }
}

class TestDueDiligenceManager:
    """Comprehensive test suite for DueDiligenceManager."""
    
    @pytest.fixture
    def temp_dirs(self):
        """Create temporary directories for testing."""
        temp_dir = tempfile.mkdtemp()
        data_dir = Path(temp_dir) / "data"
        docs_dir = Path(temp_dir) / "docs"
        
        # Create subdirectories
        (docs_dir / "legal").mkdir(parents=True)
        (docs_dir / "financials").mkdir(parents=True)
        (docs_dir / "equipment").mkdir(parents=True)
        (docs_dir / "corporate").mkdir(parents=True)
        (docs_dir / "other").mkdir(parents=True)
        
        yield data_dir, docs_dir
        
        # Cleanup
        shutil.rmtree(temp_dir)
    
    @pytest.fixture
    def manager(self, temp_dirs):
        """Create a DueDiligenceManager instance for testing."""
        data_dir, docs_dir = temp_dirs
        manager = DueDiligenceManager(data_dir=str(data_dir), docs_dir=str(docs_dir))
        # Load test data from examples directory
        test_data_path = Path(__file__).parent.parent / "data" / "final" / "business_sale_data.json"
        if test_data_path.exists():
            manager.load_existing_data(business_data_path=str(test_data_path))
        else:
            pytest.skip("Test data not found - run ETL pipeline first")
        return manager
    
    def test_schema_compliance_all_documents(self, manager):
        """Test that all documents include all required fields."""
        internal_data = manager.get_stage_view("internal")
        
        # Check all document categories
        categories = ["financials", "equipment", "legal", "corporate", "other"]
        required_fields = ["name", "status", "notes", "due_date", "file_type", "file_path", "file_size", "visibility"]
        
        for category in categories:
            if category in internal_data and "documents" in internal_data[category]:
                for doc in internal_data[category]["documents"]:
                    for field in required_fields:
                        assert field in doc, f"Missing field '{field}' in {category} document: {doc.get('name', 'unnamed')}"
                    
                    # Check field types
                    assert isinstance(doc["name"], str)
                    assert isinstance(doc["status"], bool)
                    assert isinstance(doc["visibility"], list)
        
        # Separate pass for equipment-specific validation
        if "equipment" in internal_data and "items" in internal_data["equipment"]:
            for item in internal_data["equipment"]["items"]:
                assert "value" in item, f"Missing 'value' field in equipment item: {item.get('name')}"
                assert isinstance(item["value"], (int, float, str, type(None))), f"Equipment value must be number, string, or None, got {type(item['value'])}"
    
    def test_stage_filtering_public(self, manager):
        """Test that public stage hides file paths and only shows high-level stats."""
        public_data = manager.get_stage_view("public")
        
        # Should have meta and high-level data
        assert "meta" in public_data
        assert "financials" in public_data
        
        # Should not have file paths in any documents or items
        for category, data in public_data.items():
            if isinstance(data, dict):
                # Check documents
                for doc in data.get("documents", []):
                    assert doc["file_path"] is None, f"Public stage should not expose file paths: {doc['name']}"
                # Check items (equipment)
                for item in data.get("items", []):
                    assert item["file_path"] is None, f"Public stage should not expose file paths: {item['name']}"
        
        # Should only show public visibility items
        for category, data in public_data.items():
            if isinstance(data, dict):
                # Check documents
                for doc in data.get("documents", []):
                    assert "public" in doc["visibility"], f"Non-public document in public stage: {doc['name']}"
                # Check items (equipment)
                for item in data.get("items", []):
                    assert "public" in item["visibility"], f"Non-public item in public stage: {item['name']}"
    
    def test_stage_filtering_nda(self, manager):
        """Test that NDA stage shows category completeness but hides file paths."""
        nda_data = manager.get_stage_view("nda")
        
        # Should have categories but no file paths
        for category, data in nda_data.items():
            if isinstance(data, dict):
                # Check documents
                for doc in data.get("documents", []):
                    assert doc["file_path"] is None, f"NDA stage should not expose file paths: {doc['name']}"
                    assert "nda" in doc["visibility"], f"Non-NDA document in NDA stage: {doc['name']}"
                # Check equipment items
                for item in data.get("items", []):
                    assert item["file_path"] is None, f"NDA stage should not expose file paths: {item['name']}"
                    assert "nda" in item["visibility"], f"Non-NDA item in NDA stage: {item['name']}"
    
    def test_stage_filtering_buyer(self, manager):
        """Test that buyer stage shows doc availability but hides file paths."""
        buyer_data = manager.get_stage_view("buyer")
        
        # Should have document availability but no file paths
        for category, data in buyer_data.items():
            if isinstance(data, dict):
                # Check documents
                for doc in data.get("documents", []):
                    assert doc["file_path"] is None, f"Buyer stage should not expose file paths: {doc['name']}"
                    assert "buyer" in doc["visibility"], f"Non-buyer document in buyer stage: {doc['name']}"
                # Check equipment items
                for item in data.get("items", []):
                    assert item["file_path"] is None, f"Buyer stage should not expose file paths: {item['name']}"
                    assert "buyer" in item["visibility"], f"Non-buyer item in buyer stage: {item['name']}"
    
    def test_stage_filtering_closing(self, manager):
        """Test that closing stage only shows milestones."""
        closing_data = manager.get_stage_view("closing")
        
        # Should only have closing milestones
        assert "closing" in closing_data
        assert "milestones" in closing_data["closing"]
        
        # Should not have other document categories
        categories_to_exclude = ["financials", "equipment", "legal", "corporate", "other"]
        for category in categories_to_exclude:
            if category in closing_data:
                assert "documents" not in closing_data[category] or len(closing_data[category]["documents"]) == 0
    
    def test_stage_filtering_internal(self, manager):
        """Test that internal stage exposes everything including file paths."""
        internal_data = manager.get_stage_view("internal")
        
        # Should have file paths for all documents and items
        for category, data in internal_data.items():
            if isinstance(data, dict):
                # Check documents
                for doc in data.get("documents", []):
                    assert doc["file_path"] is not None, f"Internal stage should expose file paths: {doc['name']}"
                    assert "internal" in doc["visibility"], f"Non-internal document in internal stage: {doc['name']}"
                # Check items (equipment)
                for item in data.get("items", []):
                    assert item["file_path"] is not None, f"Internal stage should expose file paths: {item['name']}"
                    assert "internal" in item["visibility"], f"Non-internal item in internal stage: {item['name']}"
    
    def test_invalid_stage_name(self, manager):
        """Test that invalid stage names raise appropriate errors."""
        with pytest.raises(ValueError, match="Invalid stage"):
            manager.get_stage_view("invalid_stage")
    
    def test_check_filesystem_updates_status_and_size(self, manager, temp_dirs):
        """Test that check_filesystem() detects files and updates status/file_size."""
        data_dir, docs_dir = temp_dirs
        
        # Create a fake PDF file
        fake_pdf = docs_dir / "financials" / "test_document.pdf"
        fake_pdf.write_bytes(b"fake pdf content")
        
        # Update a document to point to this file
        manager.data.financials["documents"][0]["file_path"] = "docs/financials/test_document.pdf"
        manager.data.financials["documents"][0]["status"] = False  # Start with False
        
        # Run filesystem check
        file_checks = manager.check_filesystem()
        
        # Verify the file was detected
        assert file_checks["existing_files"] > 0
        assert file_checks["updated_statuses"] > 0
        
        # Verify the document status was updated
        doc = manager.data.financials["documents"][0]
        assert doc["status"] == True
        assert doc["file_size"] is not None
        assert "B" in doc["file_size"]  # Should have a size with "B" suffix
    
    def test_validate_flags_missing_critical_docs(self, manager):
        """Test that validate() flags missing critical documents."""
        # Set all financial documents to missing
        for doc in manager.data.financials["documents"]:
            doc["status"] = False
            doc["file_path"] = None
        
        validation = manager.validate()
        
        # Should flag missing critical financial documents
        assert validation["status"] == "invalid"
        assert len(validation["issues"]) > 0
        
        # Should specifically mention missing P&L
        issues_text = " ".join(validation["issues"])
        assert "Profit & Loss" in issues_text or "P&L" in issues_text
    
    def test_calculate_scores_returns_proper_weights(self, manager):
        """Test that calculate_scores() returns proper weighted scores."""
        scores = manager.calculate_scores()
        
        # Should have overall score and category scores
        assert "overall_score" in scores
        assert "category_scores" in scores
        assert "recommendations" in scores
        
        # Overall score should be between 0 and 100
        assert 0 <= scores["overall_score"] <= 100
        
        # Should have all expected categories
        expected_categories = ["sales", "financials", "equipment", "legal", "corporate"]
        for category in expected_categories:
            assert category in scores["category_scores"]
            assert 0 <= scores["category_scores"][category] <= 100
        
        # Should have recommendations
        assert isinstance(scores["recommendations"], list)
        assert len(scores["recommendations"]) > 0
    
    def test_export_all_creates_correct_files(self, manager, temp_dirs):
        """Test that export_all() creates 5 stage-specific JSON files."""
        data_dir, docs_dir = temp_dirs
        output_dir = data_dir / "test_exports"
        
        manager.export_all(str(output_dir))
        
        # Should create 5 files
        expected_files = ["public.json", "nda.json", "buyer.json", "closing.json", "internal.json"]
        for filename in expected_files:
            file_path = output_dir / filename
            assert file_path.exists(), f"Missing export file: {filename}"
            
            # Should be valid JSON
            with open(file_path, 'r') as f:
                data = json.load(f)
                assert isinstance(data, dict)
    
    def test_exported_jsons_match_schema(self, manager, temp_dirs):
        """Test that all exported JSONs match the master schema."""
        data_dir, docs_dir = temp_dirs
        output_dir = data_dir / "test_exports"
        
        manager.export_all(str(output_dir))
        
        # Validate each exported file against schema
        expected_files = ["public.json", "nda.json", "buyer.json", "closing.json", "internal.json"]
        for filename in expected_files:
            file_path = output_dir / filename
            
            with open(file_path, 'r') as f:
                data = json.load(f)
            
            # Should validate against master schema
            try:
                validate(instance=data, schema=MASTER_SCHEMA)
            except ValidationError as e:
                pytest.fail(f"Schema validation failed for {filename}: {e.message}")
    
    def test_empty_document_categories(self, manager):
        """Test behavior with empty document categories."""
        # Clear all documents from a category
        manager.data.financials["documents"] = []
        
        # Should still work without errors
        scores = manager.calculate_scores()
        assert "financials" in scores["category_scores"]
        assert scores["category_scores"]["financials"] == 0.0  # Should be 0 for empty category
        
        # Stage views should still work
        public_data = manager.get_stage_view("public")
        assert "financials" in public_data  # Should still have the category
    
    def test_file_size_calculation(self, manager, temp_dirs):
        """Test that file sizes are calculated correctly for different file types."""
        data_dir, docs_dir = temp_dirs
        
        # Create files of different sizes
        small_file = docs_dir / "legal" / "small.txt"
        small_file.write_text("small content")
        
        large_file = docs_dir / "financials" / "large.txt"
        large_file.write_text("x" * 1024)  # 1KB
        
        # Update documents to point to these files
        manager.data.legal["documents"][0]["file_path"] = "docs/legal/small.txt"
        manager.data.financials["documents"][0]["file_path"] = "docs/financials/large.txt"
        
        # Run filesystem check
        manager.check_filesystem()
        
        # Verify file sizes are calculated
        small_doc = manager.data.legal["documents"][0]
        large_doc = manager.data.financials["documents"][0]
        
        assert small_doc["file_size"] is not None
        assert large_doc["file_size"] is not None
        
        # Small file should show bytes
        assert "B" in small_doc["file_size"]
        # Large file should show KB
        assert "KB" in large_doc["file_size"]

if __name__ == "__main__":
    # Run tests if executed directly
    pytest.main([__file__, "-v"])
