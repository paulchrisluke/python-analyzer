#!/usr/bin/env python3
"""
Test early exit functionality in the ETL pipeline.
"""

import unittest
import tempfile
import shutil
from pathlib import Path
from unittest.mock import patch, MagicMock
import sys

# Add the parent directory to the Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

from etl_pipeline.pipeline_runner import ETLPipeline


class TestEarlyExit(unittest.TestCase):
    """Test early exit functionality."""
    
    def setUp(self):
        """Set up test environment."""
        self.temp_dir = tempfile.mkdtemp()
        self.config_dir = Path(self.temp_dir) / "config"
        self.config_dir.mkdir(parents=True)
        
        # Create minimal config files
        self._create_minimal_configs()
    
    def tearDown(self):
        """Clean up test environment."""
        shutil.rmtree(self.temp_dir)
    
    def _create_minimal_configs(self):
        """Create minimal configuration files for testing."""
        # Create data_sources.yaml
        data_sources_content = """
data_sources:
  sales:
    type: csv
    file_path: "data/raw/sales.csv"
  financial_pnl_2023:
    type: csv
    file_path: "data/raw/financial_pnl_2023.csv"
"""
        with open(self.config_dir / "data_sources.yaml", 'w') as f:
            f.write(data_sources_content)
        
        # Create business_rules.yaml
        business_rules_content = """
equipment:
  default_values:
    hearing_aids: 1000
    cochlear_implants: 50000
"""
        with open(self.config_dir / "business_rules.yaml", 'w') as f:
            f.write(business_rules_content)
        
        # Create schemas.yaml
        schemas_content = """
sales:
  required_fields: ["date", "amount"]
"""
        with open(self.config_dir / "schemas.yaml", 'w') as f:
            f.write(schemas_content)
    
    def test_early_exit_enabled_by_default(self):
        """Test that early exit is enabled by default."""
        pipeline = ETLPipeline(config_dir=str(self.config_dir))
        self.assertTrue(pipeline.early_exit_on_critical_failure)
        self.assertTrue(pipeline.pipeline_metadata['early_exit_enabled'])
    
    def test_early_exit_can_be_disabled(self):
        """Test that early exit can be disabled."""
        pipeline = ETLPipeline(
            config_dir=str(self.config_dir),
            early_exit_on_critical_failure=False
        )
        self.assertFalse(pipeline.early_exit_on_critical_failure)
        self.assertFalse(pipeline.pipeline_metadata['early_exit_enabled'])
    
    @patch('etl_pipeline.pipeline_runner.DueDiligenceManager')
    def test_early_exit_on_due_diligence_failure(self, mock_due_diligence):
        """Test early exit when due diligence manager fails to initialize."""
        # Mock due diligence manager to fail initialization
        mock_due_diligence.side_effect = Exception("Due diligence initialization failed")
        
        pipeline = ETLPipeline(config_dir=str(self.config_dir))
        
        # Should fail when early exit is enabled
        success = pipeline.run()
        self.assertFalse(success)
        self.assertTrue(any("Due diligence manager initialization failed" in error for error in pipeline.pipeline_metadata['errors']))
    
    @patch('etl_pipeline.pipeline_runner.DueDiligenceManager')
    def test_no_early_exit_on_due_diligence_failure(self, mock_due_diligence):
        """Test that pipeline continues when early exit is disabled and due diligence fails."""
        # Mock due diligence manager to fail initialization
        mock_due_diligence.side_effect = Exception("Due diligence initialization failed")
        
        pipeline = ETLPipeline(
            config_dir=str(self.config_dir),
            early_exit_on_critical_failure=False
        )
        
        # Should not raise exception, but should fail at the end due to critical failures
        with patch.object(pipeline, '_extract_data', return_value=False):
            with patch.object(pipeline, '_transform_data', return_value=False):
                with patch.object(pipeline, '_load_data', return_value=False):
                    success = pipeline.run()
        
        # Even with early exit disabled, the pipeline should fail if there are critical errors
        self.assertFalse(success)
        self.assertTrue(any("Due diligence manager initialization failed" in error for error in pipeline.pipeline_metadata['errors']))
    
    @patch('etl_pipeline.pipeline_runner.DueDiligenceManager')
    def test_early_exit_on_extraction_failure(self, mock_due_diligence):
        """Test early exit when data extraction fails."""
        # Mock successful due diligence manager
        mock_due_diligence.return_value = MagicMock()
        
        pipeline = ETLPipeline(config_dir=str(self.config_dir))
        
        # Mock extraction to fail
        with patch.object(pipeline, '_extract_data', return_value=False):
            success = pipeline.run()
        
        self.assertFalse(success)
        self.assertTrue(any("Data extraction phase failed" in error for error in pipeline.pipeline_metadata['errors']))
    
    @patch('etl_pipeline.pipeline_runner.DueDiligenceManager')
    def test_early_exit_on_transformation_failure(self, mock_due_diligence):
        """Test early exit when data transformation fails."""
        # Mock successful due diligence manager
        mock_due_diligence.return_value = MagicMock()
        
        pipeline = ETLPipeline(config_dir=str(self.config_dir))
        
        # Mock extraction to succeed but transformation to fail
        with patch.object(pipeline, '_extract_data', return_value=True):
            with patch.object(pipeline, '_transform_data', return_value=False):
                success = pipeline.run()
        
        self.assertFalse(success)
        self.assertTrue(any("Data transformation phase failed" in error for error in pipeline.pipeline_metadata['errors']))
    
    @patch('etl_pipeline.pipeline_runner.DueDiligenceManager')
    def test_early_exit_on_loading_failure(self, mock_due_diligence):
        """Test early exit when data loading fails."""
        # Mock successful due diligence manager
        mock_due_diligence.return_value = MagicMock()
        
        pipeline = ETLPipeline(config_dir=str(self.config_dir))
        
        # Mock extraction and transformation to succeed but loading to fail
        with patch.object(pipeline, '_extract_data', return_value=True):
            with patch.object(pipeline, '_transform_data', return_value=True):
                with patch.object(pipeline, '_load_data', return_value=False):
                    success = pipeline.run()
        
        self.assertFalse(success)
        self.assertTrue(any("Data loading phase failed" in error for error in pipeline.pipeline_metadata['errors']))
    
    def test_handle_critical_failure_with_early_exit(self):
        """Test _handle_critical_failure method with early exit enabled."""
        pipeline = ETLPipeline(config_dir=str(self.config_dir))
        
        with self.assertRaises(RuntimeError) as context:
            pipeline._handle_critical_failure("Test critical failure", "test_phase")
        
        self.assertIn("Test critical failure in test_phase", str(context.exception))
        self.assertIn("Test critical failure in test_phase", pipeline.pipeline_metadata['errors'])
    
    def test_handle_critical_failure_without_early_exit(self):
        """Test _handle_critical_failure method with early exit disabled."""
        pipeline = ETLPipeline(
            config_dir=str(self.config_dir),
            early_exit_on_critical_failure=False
        )
        
        # Should not raise exception
        pipeline._handle_critical_failure("Test critical failure", "test_phase")
        
        self.assertIn("Test critical failure in test_phase", pipeline.pipeline_metadata['errors'])


if __name__ == '__main__':
    unittest.main()
