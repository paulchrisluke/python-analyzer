#!/usr/bin/env python3
"""
Test script to verify sale details validation works correctly.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'etl_pipeline'))

from etl_pipeline.utils.data_validation import DataValidator
import yaml

def test_sale_details_validation():
    """Test the sale details validation functionality."""
    
    # Load business rules
    with open('etl_pipeline/config/business_rules.yaml', 'r') as f:
        business_rules = yaml.safe_load(f)
    
    # Create validator
    validator = DataValidator(business_rules)
    
    # Test valid sale details
    valid_sale_details = {
        'reason_for_sale': 'Owner retirement and lifestyle change',
        'secondary_reason': 'Absentee owner seeking to focus on other ventures',
        'urgency': 'standard',
        'owner_involvement': 'absentee',
        'transition_support': 'Available for smooth transition and training period'
    }
    
    print("Testing valid sale details...")
    result = validator.validate_sale_details(valid_sale_details)
    print(f"Validation result: {result}")
    print(f"Errors: {validator.validation_errors}")
    print(f"Warnings: {validator.validation_warnings}")
    
    # Reset validator for next test
    validator = DataValidator(business_rules)
    
    # Test invalid sale details
    invalid_sale_details = {
        'reason_for_sale': 'Invalid reason not in standard list',
        'urgency': 'invalid_urgency',
        'owner_involvement': 'invalid_involvement'
    }
    
    print("\nTesting invalid sale details...")
    result = validator.validate_sale_details(invalid_sale_details)
    print(f"Validation result: {result}")
    print(f"Errors: {validator.validation_errors}")
    print(f"Warnings: {validator.validation_warnings}")
    
    # Test missing required fields
    validator = DataValidator(business_rules)
    
    incomplete_sale_details = {
        'sale_type': 'Some sale type'
        # Missing required fields: reason_for_sale, urgency, owner_involvement
    }
    
    print("\nTesting incomplete sale details...")
    result = validator.validate_sale_details(incomplete_sale_details)
    print(f"Validation result: {result}")
    print(f"Errors: {validator.validation_errors}")
    print(f"Warnings: {validator.validation_warnings}")

if __name__ == "__main__":
    test_sale_details_validation()
