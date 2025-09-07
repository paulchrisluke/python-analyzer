#!/usr/bin/env python3
"""
Quick test to verify the schema includes all required fields.
"""

import sys
import json
from pathlib import Path

# Add the parent directory to the Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

from etl_pipeline.utils.due_diligence_manager import DueDiligenceManager

def test_schema():
    """Test that the schema includes all required fields."""
    print("Testing schema compliance...")
    
    # Initialize manager
    data_dir = Path(__file__).parent / "data"
    docs_dir = Path(__file__).parent.parent / "docs"
    
    manager = DueDiligenceManager(data_dir=str(data_dir), docs_dir=str(docs_dir))
    
    # Load test data from examples directory
    test_data_path = Path(__file__).parent.parent / "data" / "final" / "business_sale_data.json"
    if test_data_path.exists():
        manager.load_existing_data(business_data_path=str(test_data_path))
    else:
        print("Test data not found - run ETL pipeline first")
        return
    
    # Get internal view (should have all fields)
    internal_data = manager.get_stage_view("internal")
    
    # Check a financial document
    required_fields = ["name", "status", "notes", "due_date", "file_type", "file_path", "file_size", "visibility"]
    
    assert "financials" in internal_data, "financials category missing from internal data"
    assert "documents" in internal_data["financials"], "documents missing from financials"
    assert len(internal_data["financials"]["documents"]) > 0, "no documents in financials"
    
    doc = internal_data["financials"]["documents"][0]
    print(f"Sample document: {doc['name']}")
    print(f"Required fields present:")
    
    for field in required_fields:
        assert field in doc, f"Missing required field '{field}' in financial document: {doc.get('name', 'unnamed')}"
        print(f"  ✅ {field}: {doc[field]}")
    
    # Export to verify
    test_dir = Path(__file__).parent / "schema_test_output"
    test_dir.mkdir(exist_ok=True)
    manager.export_json("internal", str(test_dir / "internal.json"))
    
    # Read and verify the exported file
    with open(test_dir / "internal.json", 'r') as f:
        exported_data = json.load(f)
    
    print(f"\nExported file verification:")
    assert "financials" in exported_data, "financials category missing from exported data"
    assert "documents" in exported_data["financials"], "documents missing from exported financials"
    assert len(exported_data["financials"]["documents"]) > 0, "no documents in exported financials"
    
    doc = exported_data["financials"]["documents"][0]
    for field in required_fields:
        assert field in doc, f"Missing required field '{field}' in exported financial document: {doc.get('name', 'unnamed')}"
        print(f"  ✅ {field}: {doc[field]}")
    
    # Clean up
    import shutil
    shutil.rmtree(test_dir)
    print("\nSchema test completed!")

if __name__ == "__main__":
    test_schema()
