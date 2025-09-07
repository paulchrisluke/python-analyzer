#!/usr/bin/env python3
"""
Edge case tests to further challenge the DueDiligenceManager implementation.
"""

import pytest
import json
import tempfile
import shutil
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent))

from etl_pipeline.utils.due_diligence_manager import DueDiligenceManager

class TestEdgeCases:
    """Edge case tests for DueDiligenceManager."""
    
    @pytest.fixture
    def temp_dirs(self):
        """Create temporary directories for testing."""
        temp_dir = tempfile.mkdtemp()
        data_dir = Path(temp_dir) / "data"
        docs_dir = Path(temp_dir) / "docs"
        
        (docs_dir / "legal").mkdir(parents=True)
        (docs_dir / "financials").mkdir(parents=True)
        (docs_dir / "equipment").mkdir(parents=True)
        (docs_dir / "corporate").mkdir(parents=True)
        (docs_dir / "other").mkdir(parents=True)
        
        yield data_dir, docs_dir
        
        shutil.rmtree(temp_dir)
    
    def test_manager_with_no_data(self, temp_dirs):
        """Test manager behavior with no data loaded."""
        data_dir, docs_dir = temp_dirs
        manager = DueDiligenceManager(data_dir=str(data_dir), docs_dir=str(docs_dir))
        
        # Should handle empty data gracefully
        scores = manager.calculate_scores()
        assert scores["overall_score"] == 0.0
        
        validation = manager.validate()
        assert validation["status"] == "valid"  # No data means no issues
        
        # Stage views should return empty but valid structures
        public_data = manager.get_stage_view("public")
        assert "meta" in public_data
    
    def test_manager_with_partial_data(self, temp_dirs):
        """Test manager with only some categories populated."""
        data_dir, docs_dir = temp_dirs
        manager = DueDiligenceManager(data_dir=str(data_dir), docs_dir=str(docs_dir))
        
        # Only populate financials
        manager.data.financials = {
            "documents": [
                {
                    "name": "Test P&L",
                    "status": True,
                    "notes": "Test document",
                    "due_date": "2024-01-01",
                    "file_type": "pdf",
                    "file_path": "docs/financials/test.pdf",
                    "file_size": "1 MB",
                    "visibility": ["internal"]
                }
            ],
            "metrics": {
                "annual_revenue_projection": 100000,
                "estimated_annual_ebitda": 20000,
                "roi_percentage": 20,
                "visibility": ["public"]
            }
        }
        
        # Should handle partial data
        scores = manager.calculate_scores()
        assert scores["overall_score"] > 0  # Should have some score from financials
        
        # Should export without errors
        output_dir = data_dir / "partial_test"
        manager.export_all(str(output_dir))
        
        # Check that files were created
        assert (output_dir / "public.json").exists()
        assert (output_dir / "internal.json").exists()
    
    def test_export_to_nonexistent_directory(self, temp_dirs):
        """Test export to a directory that doesn't exist."""
        data_dir, docs_dir = temp_dirs
        manager = DueDiligenceManager(data_dir=str(data_dir), docs_dir=str(docs_dir))
        manager.generate_sample_data()
        
        # Should create directory if it doesn't exist
        nonexistent_dir = data_dir / "nonexistent" / "subdir"
        manager.export_all(str(nonexistent_dir))
        
        # Should have created the directory and files
        assert nonexistent_dir.exists()
        assert (nonexistent_dir / "public.json").exists()
    
    def test_export_individual_stage(self, temp_dirs):
        """Test exporting individual stages."""
        data_dir, docs_dir = temp_dirs
        manager = DueDiligenceManager(data_dir=str(data_dir), docs_dir=str(docs_dir))
        manager.generate_sample_data()
        
        # Export individual stage
        test_file = data_dir / "test_public.json"
        manager.export_json("public", str(test_file))
        
        assert test_file.exists()
        
        # Should be valid JSON
        with open(test_file, 'r') as f:
            data = json.load(f)
            assert isinstance(data, dict)
            assert "meta" in data
    
    def test_very_large_file_handling(self, temp_dirs):
        """Test handling of very large files."""
        data_dir, docs_dir = temp_dirs
        manager = DueDiligenceManager(data_dir=str(data_dir), docs_dir=str(docs_dir))
        manager.generate_sample_data()
        
        # Create a large file (1MB)
        large_file = docs_dir / "financials" / "large_file.pdf"
        large_file.write_bytes(b"x" * (1024 * 1024))  # 1MB
        
        # Update document to point to this file
        manager.data.financials["documents"][0]["file_path"] = "docs/financials/large_file.pdf"
        
        # Should handle large files
        file_checks = manager.check_filesystem()
        assert file_checks["existing_files"] > 0
        
        # Should calculate size correctly
        doc = manager.data.financials["documents"][0]
        assert doc["file_size"] is not None
        assert "MB" in doc["file_size"]
    
    def test_unicode_file_names(self, temp_dirs):
        """Test handling of unicode file names."""
        data_dir, docs_dir = temp_dirs
        manager = DueDiligenceManager(data_dir=str(data_dir), docs_dir=str(docs_dir))
        manager.generate_sample_data()
        
        # Create file with unicode name
        unicode_file = docs_dir / "financials" / "résumé_2024.pdf"
        unicode_file.write_bytes(b"unicode content")
        
        # Update document
        manager.data.financials["documents"][0]["file_path"] = "docs/financials/résumé_2024.pdf"
        
        # Should handle unicode paths
        file_checks = manager.check_filesystem()
        assert file_checks["existing_files"] > 0
    
    def test_visibility_edge_cases(self, temp_dirs):
        """Test visibility filtering edge cases."""
        data_dir, docs_dir = temp_dirs
        manager = DueDiligenceManager(data_dir=str(data_dir), docs_dir=str(docs_dir))
        manager.generate_sample_data()
        
        # Add document with empty visibility
        manager.data.financials["documents"].append({
            "name": "Empty Visibility Doc",
            "status": True,
            "notes": "Test",
            "due_date": "2024-01-01",
            "file_type": "pdf",
            "file_path": "docs/financials/empty.pdf",
            "file_size": "1 MB",
            "visibility": []  # Empty visibility
        })
        
        # Should handle empty visibility gracefully
        public_data = manager.get_stage_view("public")
        # Document with empty visibility should not appear in public stage
        public_docs = public_data.get("financials", {}).get("documents", [])
        public_doc_names = [doc["name"] for doc in public_docs]
        assert "Empty Visibility Doc" not in public_doc_names
    
    def test_malformed_file_paths(self, temp_dirs):
        """Test handling of malformed file paths."""
        data_dir, docs_dir = temp_dirs
        manager = DueDiligenceManager(data_dir=str(data_dir), docs_dir=str(docs_dir))
        manager.generate_sample_data()
        
        # Add document with malformed path
        manager.data.financials["documents"].append({
            "name": "Malformed Path Doc",
            "status": True,
            "notes": "Test",
            "due_date": "2024-01-01",
            "file_type": "pdf",
            "file_path": "/absolute/path/that/doesnt/exist.pdf",
            "file_size": None,
            "visibility": ["internal"]
        })
        
        # Should handle malformed paths gracefully
        file_checks = manager.check_filesystem()
        assert file_checks["missing_files"] > 0
        
        # Document should be marked as missing
        malformed_doc = next(doc for doc in manager.data.financials["documents"] if doc["name"] == "Malformed Path Doc")
        assert malformed_doc["status"] == False

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
