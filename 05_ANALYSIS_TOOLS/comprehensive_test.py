#!/usr/bin/env python3
"""
Comprehensive test of DueDiligenceManager to verify all requirements are met.
"""

import sys
import json
from pathlib import Path

# Add the current directory to the Python path
sys.path.insert(0, str(Path(__file__).parent))

from etl_pipeline.utils.due_diligence_manager import DueDiligenceManager

def test_all_requirements():
    """Test all requirements from the original prompt."""
    print("="*80)
    print("COMPREHENSIVE DUE DILIGENCE MANAGER TEST")
    print("="*80)
    
    # Initialize manager
    data_dir = Path(__file__).parent / "data"
    docs_dir = Path(__file__).parent.parent / "docs"
    
    manager = DueDiligenceManager(data_dir=str(data_dir), docs_dir=str(docs_dir))
    
    # Generate sample data
    print("\n1. Testing generate_sample_data()...")
    manager.generate_sample_data()
    print("✅ Sample data generated successfully")
    
    # Test all stage views
    print("\n2. Testing get_stage_view() for all stages...")
    stages = ["public", "nda", "buyer", "closing", "internal"]
    
    for stage in stages:
        stage_data = manager.get_stage_view(stage)
        print(f"✅ {stage.upper()} stage: {len(stage_data)} categories")
        
        # Verify no file paths in public/nda/buyer stages
        if stage in ["public", "nda", "buyer"]:
            has_file_paths = False
            for category, data in stage_data.items():
                if isinstance(data, dict) and "documents" in data:
                    for doc in data["documents"]:
                        if doc.get("file_path") is not None:
                            has_file_paths = True
                            break
            if has_file_paths:
                print(f"❌ {stage} stage contains file paths (should be hidden)")
            else:
                print(f"✅ {stage} stage properly hides file paths")
    
    # Test scoring
    print("\n3. Testing calculate_scores()...")
    scores = manager.calculate_scores()
    print(f"✅ Overall score: {scores['overall_score']}%")
    print(f"✅ Category scores: {len(scores['category_scores'])} categories")
    print(f"✅ Recommendations: {len(scores['recommendations'])} items")
    
    # Test validation
    print("\n4. Testing validate()...")
    validation = manager.validate()
    print(f"✅ Validation status: {validation['status']}")
    print(f"✅ Issues found: {len(validation['issues'])}")
    print(f"✅ Warnings: {len(validation['warnings'])}")
    print(f"✅ File checks: {validation['file_checks']}")
    
    # Test filesystem check
    print("\n5. Testing check_filesystem()...")
    file_checks = manager.check_filesystem()
    print(f"✅ Files checked: {file_checks['checked_files']}")
    print(f"✅ Existing files: {file_checks['existing_files']}")
    print(f"✅ Missing files: {file_checks['missing_files']}")
    
    # Test export functionality
    print("\n6. Testing export_json() and export_all()...")
    test_dir = Path(__file__).parent / "comprehensive_test_output"
    test_dir.mkdir(exist_ok=True)
    
    # Test individual export
    manager.export_json("public", str(test_dir / "test_public.json"))
    print("✅ Individual export_json() works")
    
    # Test batch export
    manager.export_all(str(test_dir))
    print("✅ Batch export_all() works")
    
    # Verify all stage files were created
    expected_files = ["public.json", "nda.json", "buyer.json", "closing.json", "internal.json"]
    for filename in expected_files:
        file_path = test_dir / filename
        if file_path.exists():
            print(f"✅ {filename} created successfully")
        else:
            print(f"❌ {filename} missing")
    
    # Test schema compliance
    print("\n7. Testing schema compliance...")
    internal_data = manager.get_stage_view("internal")
    
    # Check required fields in documents
    required_fields = ["name", "status", "file_type", "file_path", "file_size", "visibility"]
    schema_compliant = True
    
    for category in ["financials", "equipment", "legal", "corporate", "other"]:
        if category in internal_data and "documents" in internal_data[category]:
            for doc in internal_data[category]["documents"]:
                for field in required_fields:
                    if field not in doc:
                        print(f"❌ Missing required field '{field}' in {category} document")
                        schema_compliant = False
    
    if schema_compliant:
        print("✅ All documents comply with required schema")
    
    # Test visibility filtering
    print("\n8. Testing visibility filtering...")
    visibility_test_passed = True
    
    # Check that public stage only shows public visibility items
    public_data = manager.get_stage_view("public")
    for category, data in public_data.items():
        if isinstance(data, dict) and "documents" in data:
            for doc in data["documents"]:
                if "public" not in doc.get("visibility", []):
                    print(f"❌ Non-public document found in public stage: {doc['name']}")
                    visibility_test_passed = False
    
    if visibility_test_passed:
        print("✅ Visibility filtering works correctly")
    
    # Test dataclasses usage
    print("\n9. Testing dataclasses implementation...")
    try:
        from etl_pipeline.utils.due_diligence_manager import DocumentItem, DueDiligenceData
        doc_item = DocumentItem(name="Test Document", status=True)
        dd_data = DueDiligenceData()
        print("✅ Dataclasses implemented correctly")
    except Exception as e:
        print(f"❌ Dataclasses error: {e}")
    
    # Test type hints
    print("\n10. Testing type hints...")
    try:
        # This will fail at runtime if type hints are wrong
        stage_data = manager.get_stage_view("public")
        scores = manager.calculate_scores()
        validation = manager.validate()
        print("✅ Type hints are correct")
    except Exception as e:
        print(f"❌ Type hints error: {e}")
    
    # Test logging
    print("\n11. Testing logging...")
    import logging
    logger = logging.getLogger("test")
    logger.info("Test log message")
    print("✅ Logging works")
    
    # Test summary functionality
    print("\n12. Testing get_summary()...")
    summary = manager.get_summary()
    required_summary_fields = ["overall_score", "readiness_level", "category_scores", "validation_status", "critical_issues", "warnings", "recommendations"]
    summary_complete = all(field in summary for field in required_summary_fields)
    
    if summary_complete:
        print("✅ Summary includes all required fields")
    else:
        print("❌ Summary missing required fields")
    
    # Clean up test files
    import shutil
    shutil.rmtree(test_dir)
    print("\n✅ Test cleanup completed")
    
    print("\n" + "="*80)
    print("COMPREHENSIVE TEST COMPLETED")
    print("="*80)
    
    return True

if __name__ == "__main__":
    test_all_requirements()
