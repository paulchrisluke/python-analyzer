#!/usr/bin/env python3
"""
Test script for DueDiligenceManager functionality.
"""

import sys
from pathlib import Path

# Add the current directory to the Python path
sys.path.insert(0, str(Path(__file__).parent))

from etl_pipeline.utils.due_diligence_manager import DueDiligenceManager
import json

def test_due_diligence_manager():
    """Test the DueDiligenceManager with sample data."""
    print("="*60)
    print("TESTING DUE DILIGENCE MANAGER")
    print("="*60)
    
    # Initialize manager
    data_dir = Path(__file__).parent / "data"
    docs_dir = Path(__file__).parent.parent / "docs"
    
    manager = DueDiligenceManager(data_dir=str(data_dir), docs_dir=str(docs_dir))
    
    # Generate sample data
    print("\n1. Generating sample data...")
    manager.generate_sample_data()
    
    # Test stage filtering
    print("\n2. Testing stage filtering...")
    stages = ["public", "nda", "buyer", "closing", "internal"]
    
    for stage in stages:
        print(f"\n--- {stage.upper()} STAGE ---")
        stage_data = manager.get_stage_view(stage)
        
        # Show summary of what's included
        print(f"Categories included: {list(stage_data.keys())}")
        
        # Show document counts
        total_docs = 0
        for category in ["financials", "equipment", "legal", "corporate", "other"]:
            if category in stage_data and "documents" in stage_data[category]:
                doc_count = len(stage_data[category]["documents"])
                total_docs += doc_count
                if doc_count > 0:
                    print(f"  {category}: {doc_count} documents")
        
        print(f"Total documents visible: {total_docs}")
    
    # Test scoring
    print("\n3. Testing scoring...")
    scores = manager.calculate_scores()
    
    # Assert scoring results are valid
    assert isinstance(scores['overall_score'], (int, float)), "Overall score must be a number"
    assert 0 <= scores['overall_score'] <= 100, f"Overall score must be between 0-100, got {scores['overall_score']}"
    
    for category, score in scores['category_scores'].items():
        assert isinstance(score, (int, float)), f"Category score for {category} must be a number"
        assert 0 <= score <= 100, f"Category score for {category} must be between 0-100, got {score}"
    
    assert isinstance(scores['recommendations'], (list, tuple)), "Recommendations must be a list or iterable"
    assert len(scores['recommendations']) >= 0, "Recommendations list must have non-negative length"
    
    print(f"Overall Score: {scores['overall_score']}%")
    print(f"Category Scores:")
    for category, score in scores['category_scores'].items():
        print(f"  {category}: {score}%")
    print(f"Recommendations: {len(scores['recommendations'])} items")
    for rec in scores['recommendations']:
        print(f"  - {rec}")
    
    # Test validation
    print("\n4. Testing validation...")
    validation = manager.validate()
    
    # Assert validation results are valid
    assert "status" in validation, "Validation result must include status"
    assert validation["status"] in ["valid", "invalid", "warning"], f"Invalid validation status: {validation['status']}"
    assert "file_checks" in validation, "Validation result must include file_checks"
    assert validation["file_checks"], "File checks must be present and non-empty"
    
    print(f"Validation Status: {validation['status']}")
    print(f"Issues: {len(validation['issues'])}")
    print(f"Warnings: {len(validation['warnings'])}")
    print(f"File Checks: {validation['file_checks']}")
    
    # Test filesystem check
    print("\n5. Testing filesystem check...")
    file_checks = manager.check_filesystem()
    print(f"Files checked: {file_checks['checked_files']}")
    print(f"Existing files: {file_checks['existing_files']}")
    print(f"Missing files: {file_checks['missing_files']}")
    print(f"Updated statuses: {file_checks['updated_statuses']}")
    
    # Test export
    print("\n6. Testing export...")
    import tempfile
    
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        manager.export_all(str(temp_path))
        print(f"Exported all stages to: {temp_path}")
        
        # Assert expected files exist and have content
        expected_files = ["public.json", "nda.json", "buyer.json", "closing.json", "internal.json"]
        for filename in expected_files:
            file_path = temp_path / filename
            assert file_path.exists(), f"Missing expected export file: {filename}"
            assert file_path.stat().st_size > 0, f"Export file {filename} is empty"
            print(f"  {filename}: {file_path.stat().st_size} bytes")
    
    # Test summary
    print("\n7. Testing summary...")
    summary = manager.get_summary()
    print(f"Overall Score: {summary['overall_score']}%")
    print(f"Readiness Level: {summary['readiness_level']}")
    print(f"Validation Status: {summary['validation_status']}")
    print(f"Critical Issues: {summary['critical_issues']}")
    print(f"Warnings: {summary['warnings']}")
    
    print("\n" + "="*60)
    print("DUE DILIGENCE MANAGER TEST COMPLETED")
    print("="*60)

if __name__ == "__main__":
    test_due_diligence_manager()
