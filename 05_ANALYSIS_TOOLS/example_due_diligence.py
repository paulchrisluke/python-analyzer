#!/usr/bin/env python3
"""
Example usage of DueDiligenceManager.

This script demonstrates how to use the DueDiligenceManager for business sale
due diligence data management.
"""

import sys
from pathlib import Path

# Add the current directory to the Python path
sys.path.insert(0, str(Path(__file__).parent))

from etl_pipeline.utils.due_diligence_manager import DueDiligenceManager

def main():
    """Example usage of DueDiligenceManager."""
    print("Due Diligence Manager Example")
    print("=" * 40)
    
    # Initialize the manager
    data_dir = Path(__file__).parent / "data"
    docs_dir = Path(__file__).parent.parent / "docs"
    
    manager = DueDiligenceManager(data_dir=str(data_dir), docs_dir=str(docs_dir))
    
    # Load existing data from ETL pipeline
    print("\n1. Loading existing business data...")
    manager.load_existing_data()
    
    # Generate sample data for demonstration
    print("\n2. Generating sample data...")
    manager.generate_sample_data()
    
    # Get a specific stage view
    print("\n3. Getting public stage view...")
    public_data = manager.get_stage_view("public")
    print(f"Public stage includes: {list(public_data.keys())}")
    
    # Calculate readiness scores
    print("\n4. Calculating readiness scores...")
    scores = manager.calculate_scores()
    print(f"Overall readiness: {scores['overall_score']}%")
    print(f"Category scores: {scores['category_scores']}")
    
    # Validate data
    print("\n5. Validating data...")
    validation = manager.validate()
    print(f"Validation status: {validation['status']}")
    print(f"Issues found: {len(validation['issues'])}")
    
    # Export all stages
    print("\n6. Exporting all stage data...")
    manager.export_all()
    print("Stage data exported to: data/final/due_diligence_stages/")
    
    # Get summary
    print("\n7. Getting summary...")
    summary = manager.get_summary()
    print(f"Readiness level: {summary['readiness_level']}")
    print(f"Critical issues: {summary['critical_issues']}")
    
    print("\nExample completed successfully!")

if __name__ == "__main__":
    main()
