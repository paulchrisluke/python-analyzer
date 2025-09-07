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
    test_output_dir = Path(__file__).parent / "test_output"
    test_output_dir.mkdir(exist_ok=True)
    
    manager.export_all(str(test_output_dir))
    print(f"Exported all stages to: {test_output_dir}")
    
    # Show file sizes
    for stage_file in test_output_dir.glob("*.json"):
        size = stage_file.stat().st_size
        print(f"  {stage_file.name}: {size} bytes")
    
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
