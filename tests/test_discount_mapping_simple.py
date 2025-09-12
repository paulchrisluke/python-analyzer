"""
Simple test for discount field mapping functionality.
"""

import pytest
import pandas as pd
import sys
from pathlib import Path

# Add the etl_pipeline to the path
sys.path.insert(0, str(Path(__file__).parent.parent / "etl_pipeline"))

from utils.field_mapping_utils import FieldMappingRegistry


class TestDiscountMappingSimple:
    """Test discount field mapping functionality."""
    
    def test_array_mapping_creation(self):
        """Test that array mappings are created correctly."""
        # Create test data with field names after field mapping (lowercase)
        test_data = pd.DataFrame({
            'sale_date': ['2024-01-01', '2024-01-02'],
            'discount type 1': ['Insurance', 'Cash'],
            'discount amount 1': [200.0, 100.0],
            'discount type 2': ['Volume', ''],
            'discount amount 2': [50.0, 0.0],
            'gross_price': [1000.0, 1500.0]
        })
        
        # Test field mapping registry
        registry = FieldMappingRegistry()
        mapped_data = registry.apply_array_mappings(test_data, 'sales_mappings')
        
        # Verify discounts array was created
        assert 'discounts' in mapped_data.columns, "Discounts array should be created"
        
        # Check first row
        row_0_discounts = mapped_data.iloc[0]['discounts']
        assert len(row_0_discounts) == 2, "First row should have 2 discount entries"
        assert row_0_discounts[0]['type'] == 'Insurance'
        assert row_0_discounts[0]['amount'] == 200.0
        assert row_0_discounts[1]['type'] == 'Volume'
        assert row_0_discounts[1]['amount'] == 50.0
        
        # Check second row
        row_1_discounts = mapped_data.iloc[1]['discounts']
        assert len(row_1_discounts) == 2, "Second row should have 2 discount entries"
        assert row_1_discounts[0]['type'] == 'Cash'
        assert row_1_discounts[0]['amount'] == 100.0
        # Second discount should be empty for row 1
        assert row_1_discounts[1].get('type', '') == ''
        assert row_1_discounts[1]['amount'] == 0.0
    
    def test_discounts_array_structure(self):
        """Test that the discounts array has the correct structure."""
        # Create test data with field names after field mapping (lowercase)
        test_data = pd.DataFrame({
            'sale_date': ['2024-01-01'],
            'discount type 1': ['Insurance'],
            'discount amount 1': [200.0],
            'discount type 2': ['Volume'],
            'discount amount 2': [50.0],
            'gross_price': [1000.0]
        })
        
        # Test field mapping registry
        registry = FieldMappingRegistry()
        mapped_data = registry.apply_array_mappings(test_data, 'sales_mappings')
        
        # Check discounts array structure
        assert 'discounts' in mapped_data.columns, "discounts array should exist"
        
        discounts = mapped_data.iloc[0]['discounts']
        assert isinstance(discounts, list), "discounts should be a list"
        assert len(discounts) == 2, "should have 2 discount entries"
        
        # Check first discount
        discount_1 = discounts[0]
        assert isinstance(discount_1, dict), "each discount should be a dict"
        assert 'type' in discount_1, "discount should have 'type' field"
        assert 'amount' in discount_1, "discount should have 'amount' field"
        assert discount_1['type'] == 'Insurance'
        assert discount_1['amount'] == 200.0
        
        # Check second discount
        discount_2 = discounts[1]
        assert isinstance(discount_2, dict), "each discount should be a dict"
        assert 'type' in discount_2, "discount should have 'type' field"
        assert 'amount' in discount_2, "discount should have 'amount' field"
        assert discount_2['type'] == 'Volume'
        assert discount_2['amount'] == 50.0
    
    def test_empty_discount_handling(self):
        """Test handling of empty or missing discount fields."""
        # Create test data with some empty discount fields (lowercase field names)
        test_data = pd.DataFrame({
            'sale_date': ['2024-01-01', '2024-01-02'],
            'discount type 1': ['Insurance', ''],
            'discount amount 1': [200.0, 0.0],
            'discount type 2': ['', ''],
            'discount amount 2': [0.0, 0.0],
            'gross_price': [1000.0, 1500.0]
        })
        
        # Test field mapping registry
        registry = FieldMappingRegistry()
        mapped_data = registry.apply_array_mappings(test_data, 'sales_mappings')
        
        # Check discounts array
        discounts_0 = mapped_data.iloc[0]['discounts']
        assert len(discounts_0) == 2
        assert discounts_0[0]['type'] == 'Insurance'
        assert discounts_0[0]['amount'] == 200.0
        
        discounts_1 = mapped_data.iloc[1]['discounts']
        assert len(discounts_1) == 2
        # Empty discounts should still have the structure but with empty values
        assert discounts_1[0].get('type', '') == ''
        assert discounts_1[0]['amount'] == 0.0
