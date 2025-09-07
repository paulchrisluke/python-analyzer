#!/usr/bin/env python3
"""
Main entry point for Cranberry Hearing and Balance Center ETL Pipeline.

This script runs the complete ETL pipeline to process business data
and generate reports for the business sale.

Usage:
    python run_pipeline.py [--config-dir CONFIG_DIR] [--log-level LOG_LEVEL]

Examples:
    python run_pipeline.py
    python run_pipeline.py --log-level DEBUG
    python run_pipeline.py --config-dir ./custom_config
"""

import argparse
import sys
import json
import logging
from pathlib import Path
from datetime import datetime

# Add the parent directory to the Python path so etl_pipeline can be imported
sys.path.insert(0, str(Path(__file__).parent))

from etl_pipeline.pipeline_runner import ETLPipeline
from etl_pipeline.utils.logging_config import setup_logging

def main():
    """Main function to run the ETL pipeline."""
    
    # Parse command line arguments
    parser = argparse.ArgumentParser(
        description="Run ETL pipeline for Cranberry Hearing and Balance Center business sale analysis"
    )
    parser.add_argument(
        "--config-dir",
        type=str,
        default=None,
        help="Directory containing configuration files (default: etl_pipeline/config)"
    )
    parser.add_argument(
        "--log-level",
        type=str,
        choices=["DEBUG", "INFO", "WARNING", "ERROR"],
        default="INFO",
        help="Logging level (default: INFO)"
    )
    parser.add_argument(
        "--output-summary",
        action="store_true",
        help="Output pipeline summary to console"
    )
    
    args = parser.parse_args()
    
    # Setup logging
    logger = setup_logging(log_level=getattr(logging, args.log_level))
    
    try:
        # Initialize pipeline
        logger.info("="*60)
        logger.info("CRANBERRY HEARING & BALANCE CENTER ETL PIPELINE")
        logger.info("="*60)
        logger.info(f"Pipeline started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        pipeline = ETLPipeline(config_dir=args.config_dir)
        
        # Initialize pipeline
        if not pipeline.initialize():
            logger.error("Pipeline initialization failed")
            return 1
        
        # Run pipeline
        success = pipeline.run()
        
        if success:
            logger.info("="*60)
            logger.info("PIPELINE COMPLETED SUCCESSFULLY")
            logger.info("="*60)
            
            # Get and display summary
            summary = pipeline.get_pipeline_summary()
            
            if args.output_summary:
                print("\n" + "="*60)
                print("PIPELINE EXECUTION SUMMARY")
                print("="*60)
                print(f"Status: {summary['status']}")
                print(f"Start Time: {summary['start_time']}")
                print(f"End Time: {summary['end_time']}")
                print(f"Duration: {summary['duration']}")
                print(f"Data Sources: {', '.join(summary['data_summary']['raw_data_sources'])}")
                print(f"Normalized Data: {', '.join(summary['data_summary']['normalized_data_types'])}")
                print(f"Final Data: {', '.join(summary['data_summary']['final_data_types'])}")
                
                if summary['errors']:
                    print(f"\nErrors: {len(summary['errors'])}")
                    for error in summary['errors']:
                        print(f"  - {error}")
                
                if summary['warnings']:
                    print(f"\nWarnings: {len(summary['warnings'])}")
                    for warning in summary['warnings']:
                        print(f"  - {warning}")
                
                print("="*60)
            
            # Save summary to file
            summary_file = Path(__file__).parent / "data" / "pipeline_summary.json"
            summary_file.parent.mkdir(exist_ok=True)
            with open(summary_file, 'w') as f:
                json.dump(summary, f, indent=2, default=str)
            
            logger.info(f"Pipeline summary saved to: {summary_file}")
            logger.info("ETL pipeline completed successfully!")
            
            return 0
            
        else:
            logger.error("="*60)
            logger.error("PIPELINE FAILED")
            logger.error("="*60)
            
            summary = pipeline.get_pipeline_summary()
            if summary['errors']:
                logger.error("Errors encountered:")
                for error in summary['errors']:
                    logger.error(f"  - {error}")
            
            return 1
            
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
