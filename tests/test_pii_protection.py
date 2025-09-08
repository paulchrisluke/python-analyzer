"""
Test PII protection and path validation to prevent directory scanning.
"""

import pytest
import tempfile
import shutil
from pathlib import Path
from unittest.mock import patch, MagicMock

from etl_pipeline.extract.financial_extractor import FinancialExtractor
from etl_pipeline.extract.equipment_extractor import EquipmentExtractor
from etl_pipeline.extract.base_extractor import BaseExtractor
from etl_pipeline.utils.file_utils import FileUtils


class TestPathValidation:
    """Test path validation to prevent empty paths from defaulting to current directory."""
    
    def test_empty_path_prevents_directory_scanning(self):
        """Test that empty paths don't default to current directory."""
        # Create a temporary directory with some files
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            
            # Create some test files
            (temp_path / "test1.csv").write_text("test data")
            (temp_path / "test2.csv").write_text("test data")
            
            # Test financial extractor with empty path
            config = {
                'type': 'financial',
                'financial_pnl_2023': {'path': ''},  # Empty path
                'financial_pnl_2024': {'path': ''},  # Empty path
                'financial_balance_sheets': {'path': ''},  # Empty path
                'financial_general_ledger': {'path': ''},  # Empty path
                'financial_cogs': {'path': ''}  # Empty path
            }
            
            extractor = FinancialExtractor(config)
            
            # Mock FileUtils.find_files to track if it's called
            with patch('etl_pipeline.extract.financial_extractor.FileUtils.find_files') as mock_find_files:
                result = extractor.extract()
                
                # Should not call find_files with empty paths
                assert mock_find_files.call_count == 0
                
                # Should return empty data structure
                assert result == {'summary': {'total_files_loaded': 0, 'data_types': [], 'years_covered': [], 'total_records': 0}}
    
    def test_equipment_extractor_empty_path(self):
        """Test that equipment extractor doesn't scan current directory with empty path."""
        config = {
            'type': 'equipment',
            'path': '',  # Empty path
            'pattern': '*.pdf'
        }
        
        extractor = EquipmentExtractor(config)
        
        # Mock FileUtils.find_files to track if it's called
        with patch('etl_pipeline.extract.equipment_extractor.FileUtils.find_files') as mock_find_files:
            result = extractor.extract()
            
            # Should not call find_files with empty paths
            assert mock_find_files.call_count == 0
            
            # Should return None for no data
            assert result == {}
    
    def test_safe_path_from_config_utility(self):
        """Test the safe_path_from_config utility function."""
        # Test with valid path
        config = {'path': '/valid/path'}
        path = FileUtils.safe_path_from_config(config, 'path', required=True)
        assert path == Path('/valid/path')
        
        # Test with empty path (should raise error for required)
        config = {'path': ''}
        with pytest.raises(ValueError, match="Required path configuration missing or empty"):
            FileUtils.safe_path_from_config(config, 'path', required=True)
        
        # Test with empty path (should return None for optional)
        config = {'path': ''}
        path = FileUtils.safe_path_from_config(config, 'path', required=False)
        assert path is None
        
        # Test with missing path (should raise error for required)
        config = {}
        with pytest.raises(ValueError, match="Required path configuration missing"):
            FileUtils.safe_path_from_config(config, 'path', required=True)
        
        # Test with missing path (should return None for optional)
        config = {}
        path = FileUtils.safe_path_from_config(config, 'path', required=False)
        assert path is None
        
        # Test with current directory path (should raise error)
        config = {'path': '.'}
        with pytest.raises(ValueError, match="Path configuration resolves to current directory"):
            FileUtils.safe_path_from_config(config, 'path', required=True)
        
        # Test with nested path configuration
        config = {'financial_pnl_2023': {'path': '/valid/path'}}
        path = FileUtils.safe_path_from_config(config, 'financial_pnl_2023.path', required=True)
        assert path == Path('/valid/path')
        
        # Test with nested empty path
        config = {'financial_pnl_2023': {'path': ''}}
        with pytest.raises(ValueError, match="Required path configuration missing or empty"):
            FileUtils.safe_path_from_config(config, 'financial_pnl_2023.path', required=True)
    
    def test_base_extractor_validation(self):
        """Test that base extractor validation prevents empty paths."""
        # Test with empty path
        config = {
            'type': 'test',
            'path': ''
        }
        
        # Create a concrete extractor class for testing
        class TestExtractor(BaseExtractor):
            def extract(self):
                return {}
        
        extractor = TestExtractor(config)
        
        # Validation should fail
        assert not extractor.validate_config()
        
        # Test with valid path that doesn't exist
        config = {
            'type': 'test',
            'path': '/nonexistent/path'
        }
        
        extractor = TestExtractor(config)
        
        # Validation should fail because path doesn't exist
        assert not extractor.validate_config()
        
        # Test with valid path that exists
        with tempfile.TemporaryDirectory() as temp_dir:
            config = {
                'type': 'test',
                'path': temp_dir
            }
            
            extractor = TestExtractor(config)
            
            # Validation should pass
            assert extractor.validate_config()
    
    def test_path_validation_with_whitespace(self):
        """Test that paths with only whitespace are treated as empty."""
        config = {'path': '   '}  # Only whitespace
        
        with pytest.raises(ValueError, match="Required path configuration missing or empty"):
            FileUtils.safe_path_from_config(config, 'path', required=True)
        
        # Should return None for optional
        path = FileUtils.safe_path_from_config(config, 'path', required=False)
        assert path is None
    
    def test_path_validation_with_none(self):
        """Test that None paths are handled correctly."""
        config = {'path': None}
        
        with pytest.raises(ValueError, match="Required path configuration missing"):
            FileUtils.safe_path_from_config(config, 'path', required=True)
        
        # Should return None for optional
        path = FileUtils.safe_path_from_config(config, 'path', required=False)
        assert path is None


if __name__ == "__main__":
    pytest.main([__file__])