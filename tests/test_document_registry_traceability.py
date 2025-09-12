"""
Tests for document registry traceability functionality.
"""

import pytest
import tempfile
import os
import time
from pathlib import Path
from etl_pipeline.utils.document_registry import DocumentRegistry

class TestDocumentRegistryTraceability:
    """Test document registry with file metadata tracking."""
    
    def test_document_metadata_capture(self):
        """Test that document metadata is captured."""
        # TODO: Implement test
        pytest.xfail("Not Implemented: Document metadata capture test")
    
    def test_document_registry_export(self):
        """Test that document registry is exported in JSON."""
        # TODO: Implement test
        pytest.xfail("Not Implemented: Document registry export test")
    
    def test_file_existence_validation(self):
        """Test that file existence is validated."""
        # TODO: Implement test
        pytest.xfail("Not Implemented: File existence validation test")
    
    def test_document_coverage_analysis(self):
        """Test document coverage analysis."""
        # TODO: Implement test
        pytest.xfail("Not Implemented: Document coverage analysis test")
    
    def test_file_size_tracking(self):
        """Test that file sizes are tracked."""
        # TODO: Implement test
        pytest.xfail("Not Implemented: File size tracking test")
    
    def test_file_modification_date_tracking(self):
        """Test that file modification dates are tracked."""
        # TODO: Implement test
        pytest.xfail("Not Implemented: File modification date tracking test")
    
    def test_document_category_classification(self):
        """Test that documents are properly categorized."""
        # TODO: Implement test
        pytest.xfail("Not Implemented: Document category classification test")
    
    def test_document_status_tracking(self):
        """Test that document status (found/missing) is tracked."""
        # TODO: Implement test
        pytest.xfail("Not Implemented: Document status tracking test")
    
    def test_document_registry_json_schema(self):
        """Test that document registry follows expected JSON schema."""
        # TODO: Implement test
        pytest.xfail("Not Implemented: Document registry JSON schema test")
    
    def test_document_traceability_in_pipeline_output(self):
        """Test that document traceability is included in pipeline output."""
        # TODO: Implement test
        pytest.xfail("Not Implemented: Document traceability in pipeline output test")

    def test_document_integrity_validation_valid_file(self):
        """Test integrity validation for a valid, unchanged file."""
        registry = DocumentRegistry()
        
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.txt') as f:
            f.write("Test content for integrity validation")
            temp_file = Path(f.name)
        
        try:
            # Register the document (disable path validation for test files)
            doc = registry.register_document(temp_file, "test", "Test Document", base_path=None)
            
            # Validate integrity - should pass
            assert registry.validate_document_integrity(temp_file) == True
            
        finally:
            # Clean up
            temp_file.unlink(missing_ok=True)

    def test_document_integrity_validation_missing_file(self):
        """Test integrity validation for a missing file."""
        registry = DocumentRegistry()
        
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.txt') as f:
            f.write("Test content")
            temp_file = Path(f.name)
        
        try:
            # Register the document (disable path validation for test files)
            registry.register_document(temp_file, "test", "Test Document", base_path=None)
            
            # Delete the file
            temp_file.unlink()
            
            # Validate integrity - should fail
            assert registry.validate_document_integrity(temp_file) == False
            
        finally:
            # Clean up
            temp_file.unlink(missing_ok=True)

    def test_document_integrity_validation_size_changed(self):
        """Test integrity validation when file size changes."""
        registry = DocumentRegistry()
        
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.txt') as f:
            f.write("Original content")
            temp_file = Path(f.name)
        
        try:
            # Register the document (disable path validation for test files)
            registry.register_document(temp_file, "test", "Test Document", base_path=None)
            
            # Modify the file content (change size)
            with open(temp_file, 'w') as f:
                f.write("Modified content - different length")
            
            # Validate integrity - should fail due to size change
            assert registry.validate_document_integrity(temp_file) == False
            
        finally:
            # Clean up
            temp_file.unlink(missing_ok=True)

    def test_document_integrity_validation_hash_changed(self):
        """Test integrity validation when file content changes but size stays same."""
        registry = DocumentRegistry()
        
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.txt') as f:
            f.write("Original content")
            temp_file = Path(f.name)
        
        try:
            # Register the document (disable path validation for test files)
            registry.register_document(temp_file, "test", "Test Document", base_path=None)
            
            # Modify the file content with same length
            with open(temp_file, 'w') as f:
                f.write("Modified content")  # Same length as original
            
            # Validate integrity - should fail due to hash change
            assert registry.validate_document_integrity(temp_file) == False
            
        finally:
            # Clean up
            temp_file.unlink(missing_ok=True)

    def test_document_integrity_validation_unregistered_file(self):
        """Test integrity validation for a file not in registry."""
        registry = DocumentRegistry()
        
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.txt') as f:
            f.write("Test content")
            temp_file = Path(f.name)
        
        try:
            # Don't register the document
            
            # Validate integrity - should fail (file not in registry)
            assert registry.validate_document_integrity(temp_file) == False
            
        finally:
            # Clean up
            temp_file.unlink(missing_ok=True)

    def test_document_integrity_validation_transaction_safety(self):
        """Test that integrity validation is transaction-safe (prevents TOCTOU issues)."""
        registry = DocumentRegistry()
        
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.txt') as f:
            f.write("Test content for transaction safety")
            temp_file = Path(f.name)
        
        try:
            # Register the document (disable path validation for test files)
            doc = registry.register_document(temp_file, "test", "Test Document", base_path=None)
            original_size = doc["file_size_bytes"]
            original_hash = doc["file_hash"]
            
            # Validate integrity multiple times rapidly - should be consistent
            results = []
            for _ in range(10):
                results.append(registry.validate_document_integrity(temp_file))
            
            # All validations should return the same result
            assert all(result == True for result in results)
            
            # Verify the file metadata hasn't changed
            current_doc = registry.register_document(temp_file, "test", "Test Document")
            assert current_doc["file_size_bytes"] == original_size
            assert current_doc["file_hash"] == original_hash
            
        finally:
            # Clean up
            temp_file.unlink(missing_ok=True)

    def test_document_integrity_validation_modification_time_check(self):
        """Test that modification time is checked as part of integrity validation."""
        registry = DocumentRegistry()
        
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.txt') as f:
            f.write("Test content")
            temp_file = Path(f.name)
        
        try:
            # Register the document (disable path validation for test files)
            registry.register_document(temp_file, "test", "Test Document", base_path=None)
            
            # Wait a moment to ensure time difference
            time.sleep(1.1)  # More than the 1.0 second tolerance
            
            # Touch the file to update modification time
            temp_file.touch()
            
            # Validate integrity - should fail due to modification time change
            assert registry.validate_document_integrity(temp_file) == False
            
        finally:
            # Clean up
            temp_file.unlink(missing_ok=True)

    def test_document_integrity_validation_error_handling(self):
        """Test error handling in integrity validation."""
        registry = DocumentRegistry()
        
        # Test with invalid path
        invalid_path = Path("/nonexistent/path/file.txt")
        assert registry.validate_document_integrity(invalid_path) == False
        
        # Test with directory instead of file
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_dir_path = Path(temp_dir)
            assert registry.validate_document_integrity(temp_dir_path) == False

    def test_path_validation_safe_paths(self):
        """Test that safe paths pass validation."""
        registry = DocumentRegistry()
        
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_dir_path = Path(temp_dir)
            
            # Test safe relative paths
            safe_path = temp_dir_path / "subdir" / "file.txt"
            assert registry._validate_path_safety(safe_path, temp_dir_path) == True
            
            # Test safe absolute paths
            safe_abs_path = temp_dir_path.resolve() / "file.txt"
            assert registry._validate_path_safety(safe_abs_path, temp_dir_path) == True

    def test_path_validation_traversal_attempts(self):
        """Test that path traversal attempts are blocked."""
        registry = DocumentRegistry()
        
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_dir_path = Path(temp_dir)
            
            # Test various path traversal attempts
            traversal_paths = [
                temp_dir_path / ".." / "file.txt",
                temp_dir_path / ".." / ".." / "etc" / "passwd",
                temp_dir_path / "subdir" / ".." / ".." / "file.txt",
                temp_dir_path / "subdir" / ".." / ".." / ".." / "file.txt",
                Path("../../../etc/passwd"),
                Path("/etc/passwd"),
                Path("C:\\Windows\\System32\\config\\SAM"),  # Windows example
            ]
            
            for traversal_path in traversal_paths:
                assert registry._validate_path_safety(traversal_path, temp_dir_path) == False

    def test_register_document_path_traversal_protection(self):
        """Test that register_document blocks path traversal attempts."""
        registry = DocumentRegistry()
        
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_dir_path = Path(temp_dir)
            
            # Test that path traversal attempts raise ValueError
            traversal_path = temp_dir_path / ".." / "file.txt"
            
            with pytest.raises(ValueError) as exc_info:
                registry.register_document(traversal_path, "test", base_path=temp_dir_path)
            
            assert "Path traversal attempt blocked" in str(exc_info.value)

    def test_register_directory_path_traversal_protection(self):
        """Test that register_directory blocks path traversal attempts."""
        registry = DocumentRegistry()
        
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_dir_path = Path(temp_dir)
            
            # Test that path traversal attempts are blocked
            traversal_path = temp_dir_path / ".." / "parent_dir"
            
            result = registry.register_directory(traversal_path, "test", base_path=temp_dir_path)
            assert len(result) == 0  # Should return empty list

    def test_register_directory_with_safe_paths(self):
        """Test that register_directory works with safe paths."""
        registry = DocumentRegistry()
        
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_dir_path = Path(temp_dir)
            
            # Create some test files
            (temp_dir_path / "file1.txt").write_text("Test content 1")
            (temp_dir_path / "file2.csv").write_text("Test content 2")
            (temp_dir_path / "subdir").mkdir()
            (temp_dir_path / "subdir" / "file3.txt").write_text("Test content 3")
            
            # Test registering directory with safe paths
            result = registry.register_directory(temp_dir_path, "test", base_path=temp_dir_path)
            assert len(result) == 3  # Should register all 3 files
            
            # Verify all files were registered
            file_names = [doc["name"] for doc in result]
            assert "file1.txt" in file_names
            assert "file2.csv" in file_names
            assert "file3.txt" in file_names

    def test_export_registry_error_handling(self):
        """Test that export_registry_for_json handles errors gracefully."""
        registry = DocumentRegistry()
        
        # Test normal export
        result = registry.export_registry_for_json()
        assert "documents" in result
        assert "coverage_analysis" in result
        assert "registry_summary" in result
        
        # Test that it doesn't raise exceptions even with empty registry
        assert isinstance(result["documents"], list)
        assert isinstance(result["coverage_analysis"], dict)
        assert isinstance(result["registry_summary"], dict)

    def test_register_directory_error_handling(self):
        """Test that register_directory handles various error conditions."""
        registry = DocumentRegistry()
        
        # Test with non-existent directory
        result = registry.register_directory("/nonexistent/directory", "test")
        assert len(result) == 0
        
        # Test with file instead of directory
        with tempfile.NamedTemporaryFile(delete=False) as f:
            f.write(b"test content")
            temp_file = Path(f.name)
        
        try:
            result = registry.register_directory(temp_file, "test")
            assert len(result) == 0
        finally:
            temp_file.unlink(missing_ok=True)

    def test_path_validation_edge_cases(self):
        """Test path validation with edge cases."""
        registry = DocumentRegistry()
        
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_dir_path = Path(temp_dir)
            
            # Test with None path
            assert registry._validate_path_safety(None, temp_dir_path) == False
            
            # Test with empty path
            assert registry._validate_path_safety(Path(""), temp_dir_path) == False
            
            # Test with current directory relative to temp_dir (should be within bounds)
            current_dir_relative = temp_dir_path / "."
            assert registry._validate_path_safety(current_dir_relative, temp_dir_path) == True
            
            # Test with parent directory reference that's still within bounds
            subdir = temp_dir_path / "subdir"
            subdir.mkdir()
            assert registry._validate_path_safety(subdir / ".." / "file.txt", temp_dir_path) == True
