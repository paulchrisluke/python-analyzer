"""
Test discount field mapping functionality.
"""

import pytest
import pandas as pd
import sys
from pathlib import Path

# Add the project root to the path
sys.path.insert(0, str(Path(__file__).parent.parent))

from etl_pipeline.utils.field_mapping_utils import FieldMappingRegistry
from etl_pipeline.transform.sales_transformer import SalesTransformer


class TestDiscountMapping:
    """Test discount field mapping and backward compatibility."""
    
    def test_array_mapping_creation(self):
        """Test that array mappings are created correctly."""
        # Create test data with old discount structure
        test_data = pd.DataFrame({
            'Sale Date': ['2024-01-01', '2024-01-02'],
            'Discount Type 1': ['Insurance', 'Cash'],
            'Discount Amount 1': [200.0, 100.0],
            'Discount Type 2': ['Volume', ''],
            'Discount Amount 2': [50.0, 0.0],
            'Gross Price': [1000.0, 1500.0]
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
    
    def test_backward_compatibility(self):
        """Test that old discount fields are still accessible."""
        # Create test data
        test_data = pd.DataFrame({
            'Sale Date': ['2024-01-01'],
            'Discount Type 1': ['Insurance'],
            'Discount Amount 1': [200.0],
            'Discount Type 2': ['Volume'],
            'Discount Amount 2': [50.0],
            'Gross Price': [1000.0]
        })
        
        # Initialize transformer
        business_rules = {
            'locations': {
                'main': {
                    'names': ['Main Clinic'],
                    'for_sale': True
                }
            }
        }
        transformer = SalesTransformer(business_rules)
        
        # Transform the data
        result = transformer._clean_sales_data(test_data.copy())
        
        # Check that backward compatibility fields exist
        backward_compat_fields = [
            'discount_type_1', 'discount_amount_1',
            'discount_type_2', 'discount_amount_2',
            'discount_type_3', 'discount_amount_3'
        ]
        
        for field in backward_compat_fields:
            assert field in result.columns, f"Backward compatibility field {field} should exist"
        
        # Check that values are populated correctly
        assert result.iloc[0]['discount_type_1'] == 'Insurance'
        assert result.iloc[0]['discount_amount_1'] == 200.0
        assert result.iloc[0]['discount_type_2'] == 'Volume'
        assert result.iloc[0]['discount_amount_2'] == 50.0
    
    def test_total_discounts_calculation(self):
        """Test that total discounts are calculated correctly."""
        # Create test data with multiple discounts
        test_data = pd.DataFrame({
            'Sale Date': ['2024-01-01', '2024-01-02'],
            'Discount Type 1': ['Insurance', 'Cash'],
            'Discount Amount 1': [200.0, 100.0],
            'Discount Type 2': ['Volume', ''],
            'Discount Amount 2': [50.0, 0.0],
            'Discount Type 3': ['', ''],
            'Discount Amount 3': [0.0, 0.0],
            'Gross Price': [1000.0, 1500.0]
        })
        
        # Initialize transformer
        business_rules = {
            'locations': {
                'main': {
                    'names': ['Main Clinic'],
                    'for_sale': True
                }
            }
        }
        transformer = SalesTransformer(business_rules)
        
        # Transform the data
        result = transformer._clean_sales_data(test_data.copy())
        
        # Check total discounts calculation
        assert 'total_discounts' in result.columns, "total_discounts field should exist"
        
        # First row: 200 + 50 + 0 = 250
        assert result.iloc[0]['total_discounts'] == 250.0, "First row total discounts should be 250"
        
        # Second row: 100 + 0 + 0 = 100
        assert result.iloc[1]['total_discounts'] == 100.0, "Second row total discounts should be 100"
    
    def test_discounts_array_structure(self):
        """Test that the discounts array has the correct structure."""
        # Create test data
        test_data = pd.DataFrame({
            'Sale Date': ['2024-01-01'],
            'Discount Type 1': ['Insurance'],
            'Discount Amount 1': [200.0],
            'Discount Type 2': ['Volume'],
            'Discount Amount 2': [50.0],
            'Gross Price': [1000.0]
        })
        
        # Initialize transformer
        business_rules = {
            'locations': {
                'main': {
                    'names': ['Main Clinic'],
                    'for_sale': True
                }
            }
        }
        transformer = SalesTransformer(business_rules)
        
        # Transform the data
        result = transformer._clean_sales_data(test_data.copy())
        
        # Check discounts array structure
        assert 'discounts' in result.columns, "discounts array should exist"
        
        discounts = result.iloc[0]['discounts']
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
        # Create test data with some empty discount fields
        test_data = pd.DataFrame({
            'Sale Date': ['2024-01-01', '2024-01-02'],
            'Discount Type 1': ['Insurance', ''],
            'Discount Amount 1': [200.0, 0.0],
            'Discount Type 2': ['', ''],
            'Discount Amount 2': [0.0, 0.0],
            'Gross Price': [1000.0, 1500.0]
        })
        
        # Initialize transformer
        business_rules = {
            'locations': {
                'main': {
                    'names': ['Main Clinic'],
                    'for_sale': True
                }
            }
        }
        transformer = SalesTransformer(business_rules)
        
        # Transform the data
        result = transformer._clean_sales_data(test_data.copy())
        
        # Check that empty discounts are handled correctly
        assert 'total_discounts' in result.columns
        
        # First row should have discount
        assert result.iloc[0]['total_discounts'] == 200.0
        
        # Second row should have no discount
        assert result.iloc[1]['total_discounts'] == 0.0
        
        # Check discounts array
        discounts_0 = result.iloc[0]['discounts']
        assert len(discounts_0) == 2
        assert discounts_0[0]['type'] == 'Insurance'
        assert discounts_0[0]['amount'] == 200.0
        
        discounts_1 = result.iloc[1]['discounts']
        assert len(discounts_1) == 2
        # Empty discounts should still have the structure but with empty values
        assert discounts_1[0]['type'] == ''
        assert discounts_1[0]['amount'] == 0.0
