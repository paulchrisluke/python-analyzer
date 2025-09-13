#!/usr/bin/env python3
"""
Simplified Revenue Pipeline with Audit Trail
Calculates total Pennsylvania revenue from P&L reports with full transparency.
"""

import pandas as pd
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any, Tuple
import logging
from decimal import Decimal, ROUND_HALF_UP

# Configuration
CONFIG = {
    "base_path": "docs/financials/Profit_and_Loss",
    "encodings": ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1'],
    "revenue_row_name": "Total Income",
    "pennsylvania_columns_2023": ["Pennsylvania"],
    "pennsylvania_columns_2024_plus": ["Cranberry", "West View"],
    "exclude_locations": ["Virginia"],
    "projection_months_2025": [8, 9, 10, 11, 12],  # Aug-Dec
    "projection_year_2026": list(range(1, 13)),    # Jan-Dec
    "scenarios": {
        "conservative": 0.95,  # 5% decline
        "base_case": 1.0,      # Current trend
        "optimistic": 1.05     # 5% growth
    }
}

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def normalize_float(value: float) -> float:
    """Normalize float to 2 decimal places to avoid precision artifacts."""
    if value is None:
        return 0.0
    return round(float(value), 2)

class SimpleRevenuePipeline:
    """Simplified pipeline to calculate Pennsylvania revenue with audit trail."""
    
    def __init__(self, base_path: str = None):
        self.base_path = Path(base_path or CONFIG["base_path"])
        self.audit_trail = self._init_audit_trail()
        
    def _init_audit_trail(self) -> Dict[str, Any]:
        """Initialize the audit trail structure."""
        return {
            "pipeline_run": {
                "timestamp": datetime.now().isoformat(),
                "purpose": "Calculate total Pennsylvania revenue for business sale",
                "business_rules": {
                    "include_locations": CONFIG["pennsylvania_columns_2023"] + CONFIG["pennsylvania_columns_2024_plus"],
                    "exclude_locations": CONFIG["exclude_locations"],
                    "reasoning": "Only Pennsylvania locations are for sale (Cranberry + West View)"
                },
                "files_processed": [],
                "structure_changes": {},
                "validation": {},
                "total_revenue": 0.0
            }
        }
        
    def process_all_reports(self) -> Dict[str, Any]:
        """Process all available P&L reports and calculate total revenue."""
        logger.info("Starting revenue calculation pipeline...")
        
        total_revenue = 0.0
        years_processed = []
        
        # Process each year
        for year_dir in sorted(self.base_path.iterdir()):
            if year_dir.is_dir() and year_dir.name.startswith(('2023', '2024', '2025')):
                year = year_dir.name.split('_')[0]
                years_processed.append(year)
                
                logger.info(f"Processing {year} reports...")
                year_revenue, year_audit = self._process_year(year_dir, year)
                total_revenue += year_revenue
                self.audit_trail["pipeline_run"]["files_processed"].extend(year_audit)
        
        # Calculate projections and create graph data
        projections = self._calculate_projections(years_processed)
        graph_data = self._create_graph_data(projections)
        
        # Finalize results
        self.audit_trail["pipeline_run"]["total_revenue"] = normalize_float(total_revenue)
        self.audit_trail["pipeline_run"]["projections"] = projections
        self.audit_trail["pipeline_run"]["graph_data"] = graph_data
        self.audit_trail["pipeline_run"]["validation"] = self._validate_data(years_processed)
        
        logger.info(f"Pipeline complete. Total Pennsylvania revenue: ${total_revenue:,.2f}")
        logger.info(f"Projected revenue through 2026: ${projections['total_projected_revenue']:,.2f}")
        return self.audit_trail
    
    def _process_year(self, year_dir: Path, year: str) -> Tuple[float, List[Dict]]:
        """Process all reports for a given year."""
        csv_files = sorted([f for f in year_dir.iterdir() if f.suffix.lower() == '.csv'])
        if not csv_files:
            logger.warning(f"No CSV files found in {year_dir}")
            return 0.0, []
        
        # Determine structure type from first file
        structure_type = self._detect_structure(csv_files[0])
        self.audit_trail["pipeline_run"]["structure_changes"][year] = structure_type
        logger.info(f"{year} uses {structure_type['description']}")
        
        year_revenue = 0.0
        year_audit = []
        
        for csv_file in csv_files:
            try:
                month_revenue, month_audit = self._process_month(csv_file, structure_type)
                year_revenue += month_revenue
                year_audit.append(month_audit)
            except Exception as e:
                logger.error(f"Error processing {csv_file.name}: {str(e)}")
                year_audit.append({
                    "file": csv_file.name,
                    "error": str(e),
                    "revenue": 0.0
                })
        
        return year_revenue, year_audit
    
    def _read_csv_with_encodings(self, file_path: Path) -> Tuple[pd.DataFrame, str]:
        """Read CSV file with multiple encoding fallbacks."""
        for encoding in CONFIG["encodings"]:
            try:
                df = pd.read_csv(file_path, encoding=encoding, low_memory=False)
                return df, encoding
            except UnicodeDecodeError:
                continue
        raise ValueError(f"Unable to read {file_path} with any encoding")
    
    def _detect_structure(self, sample_file: Path) -> Dict[str, Any]:
        """Detect the structure type of P&L reports."""
        try:
            df, _ = self._read_csv_with_encodings(sample_file)
            columns = [col.strip() for col in df.columns if col.strip()]
            
            if "Pennsylvania" in columns:
                return {
                    "type": "combined_pennsylvania",
                    "description": "Combined Pennsylvania column (2023 format)",
                    "columns_used": CONFIG["pennsylvania_columns_2023"]
                }
            elif "Cranberry" in columns and "West View" in columns:
                return {
                    "type": "separate_locations",
                    "description": "Separate Cranberry and West View columns (2024-2025 format)",
                    "columns_used": CONFIG["pennsylvania_columns_2024_plus"]
                }
            else:
                return {
                    "type": "unknown",
                    "description": "Unknown structure",
                    "columns_used": []
                }
        except Exception as e:
            return {
                "type": "error",
                "description": f"Error reading file: {str(e)}",
                "columns_used": []
            }
    
    def _process_month(self, csv_file: Path, structure_type: Dict[str, Any]) -> Tuple[float, Dict[str, Any]]:
        """Process a single month's P&L report."""
        df, _ = self._read_csv_with_encodings(csv_file)
        
        # Find the revenue row
        revenue_row = df[df.iloc[:, 0].str.contains(CONFIG["revenue_row_name"], na=False)]
        if revenue_row.empty:
            raise ValueError(f"No '{CONFIG['revenue_row_name']}' row found")
        
        month_audit = {
            "file": csv_file.name,
            "structure_type": structure_type["type"],
            "columns_available": [col.strip() for col in df.columns if col.strip()],
            "revenue_fields_found": {},
            "calculation_details": {},
            "revenue": 0.0,
            "has_data": True
        }
        
        # Calculate revenue based on structure type
        if structure_type["type"] == "combined_pennsylvania":
            revenue = self._extract_pennsylvania_revenue(revenue_row, month_audit)
        elif structure_type["type"] == "separate_locations":
            revenue = self._extract_separate_locations_revenue(revenue_row, month_audit)
        else:
            raise ValueError(f"Unknown structure type: {structure_type['type']}")
        
        month_audit["revenue"] = round(revenue, 2)
        month_audit["has_data"] = revenue >= 1000  # Threshold for meaningful data
        
        return revenue, month_audit
    
    def _extract_pennsylvania_revenue(self, revenue_row: pd.DataFrame, month_audit: Dict) -> float:
        """Extract revenue from Pennsylvania column (2023 format)."""
        pa_value = revenue_row.iloc[0]["Pennsylvania"]
        revenue = float(pa_value) if pd.notna(pa_value) else 0.0
        
        month_audit["revenue_fields_found"]["Pennsylvania"] = revenue
        month_audit["calculation_details"] = {
            "method": "Direct from Pennsylvania column",
            "value": revenue
        }
        return revenue
    
    def _extract_separate_locations_revenue(self, revenue_row: pd.DataFrame, month_audit: Dict) -> float:
        """Extract revenue from Cranberry + West View columns (2024-2025 format)."""
        cranberry_value = revenue_row.iloc[0]["Cranberry"]
        west_view_value = revenue_row.iloc[0]["West View"]
        
        cranberry_rev = float(cranberry_value) if pd.notna(cranberry_value) else 0.0
        west_view_rev = float(west_view_value) if pd.notna(west_view_value) else 0.0
        total_revenue = cranberry_rev + west_view_rev
        
        month_audit["revenue_fields_found"]["Cranberry"] = cranberry_rev
        month_audit["revenue_fields_found"]["West View"] = west_view_rev
        month_audit["calculation_details"] = {
            "method": "Sum of Cranberry + West View columns",
            "cranberry_value": cranberry_rev,
            "west_view_value": west_view_rev,
            "total": total_revenue
        }
        return total_revenue
    
    def _calculate_projections(self, years_processed: List[str]) -> Dict[str, Any]:
        """Calculate revenue projections through end of 2026."""
        # Calculate monthly averages for each year
        monthly_averages = {}
        for year in years_processed:
            year_files = [f for f in self.audit_trail["pipeline_run"]["files_processed"] 
                         if f["file"].startswith(year)]
            if year_files:
                year_revenue = sum(f["revenue"] for f in year_files)
                months_count = len(year_files)
                monthly_averages[year] = {
                    "total_revenue": normalize_float(year_revenue),
                    "months_available": months_count,
                    "monthly_average": normalize_float(year_revenue / months_count)
                }
        
        # Use most recent year's average for projections
        projection_year = "2025" if "2025" in monthly_averages else "2024" if "2024" in monthly_averages else "2023"
        monthly_avg = monthly_averages[projection_year]["monthly_average"]
        
        # Calculate projected revenue
        projected_2025_months = len(CONFIG["projection_months_2025"])
        projected_2026_months = len(CONFIG["projection_year_2026"])
        
        projected_2025_revenue = projected_2025_months * monthly_avg
        projected_2026_revenue = projected_2026_months * monthly_avg
        total_projected = projected_2025_revenue + projected_2026_revenue
        
        # Create scenarios
        scenarios = {}
        for scenario_name, multiplier in CONFIG["scenarios"].items():
            scenarios[scenario_name] = {
                "multiplier": multiplier,
                "monthly_average": round(monthly_avg * multiplier, 2),
                "total_projected": round(total_projected * multiplier, 2),
                "description": f"{'5% decline' if multiplier < 1 else '5% growth' if multiplier > 1 else 'Continue current trend'} from current trend"
            }
        
        return {
            "methodology": "Monthly average based on available data",
            "projection_period": "2025-08 through 2026-12",
            "monthly_averages": monthly_averages,
            "projected_revenue": {
                "2025_remaining": {
                    "months": projected_2025_months,
                    "monthly_average": monthly_avg,
                    "total_projected": round(projected_2025_revenue, 2)
                },
                "2026_full_year": {
                    "months": projected_2026_months,
                    "monthly_average": monthly_avg,
                    "total_projected": round(projected_2026_revenue, 2)
                }
            },
            "total_projected_revenue": round(total_projected, 2),
            "scenarios": scenarios,
            "assumptions": [f"Using {projection_year} monthly average of ${monthly_avg:,.2f} for projections"]
        }
    
    def _create_graph_data(self, projections: Dict[str, Any]) -> Dict[str, Any]:
        """Create graph-ready data structure."""
        graph_data = {
            "monthly_data": [],
            "yearly_totals": {"historical": {}, "projected": {}},
            "scenarios": {scenario: [] for scenario in CONFIG["scenarios"].keys()}
        }
        
        # Process historical data
        for file_data in self.audit_trail["pipeline_run"]["files_processed"]:
            filename = file_data["file"]
            year = filename.split("-")[0]
            month = filename.split("-")[1]
            date_str = f"{year}-{month.zfill(2)}-01"
            
            graph_data["monthly_data"].append({
                "date": date_str,
                "year": year,
                "month": month,
                "revenue": file_data["revenue"],
                "data_type": "historical",
                "file": filename,
                "structure_type": file_data["structure_type"]
            })
        
        # Add projected data
        monthly_avg = projections["monthly_averages"]["2025"]["monthly_average"]
        
        # 2025 remaining months
        for month_num in CONFIG["projection_months_2025"]:
            date_str = f"2025-{month_num:02d}-01"
            graph_data["monthly_data"].append({
                "date": date_str,
                "year": "2025",
                "month": str(month_num),
                "revenue": monthly_avg,
                "data_type": "projected",
                "file": f"Projected 2025-{month_num:02d}",
                "structure_type": "projected"
            })
        
        # 2026 full year
        for month_num in CONFIG["projection_year_2026"]:
            date_str = f"2026-{month_num:02d}-01"
            graph_data["monthly_data"].append({
                "date": date_str,
                "year": "2026",
                "month": str(month_num),
                "revenue": monthly_avg,
                "data_type": "projected",
                "file": f"Projected 2026-{month_num:02d}",
                "structure_type": "projected"
            })
        
        # Sort by date
        graph_data["monthly_data"].sort(key=lambda x: x["date"])
        
        # Calculate yearly totals
        self._calculate_yearly_totals(graph_data, projections)
        
        # Create scenario data
        self._create_scenario_data(graph_data, projections)
        
        return graph_data
    
    def _calculate_yearly_totals(self, graph_data: Dict, projections: Dict):
        """Calculate yearly totals for historical and projected data."""
        # Historical yearly totals
        for year in ["2023", "2024", "2025"]:
            year_data = [d for d in graph_data["monthly_data"] if d["year"] == year and d["data_type"] == "historical"]
            if year_data:
                total_revenue = sum(d["revenue"] for d in year_data)
                graph_data["yearly_totals"]["historical"][year] = {
                    "total_revenue": normalize_float(total_revenue),
                    "months": len(year_data),
                    "monthly_average": normalize_float(total_revenue / len(year_data))
                }
        
        # Projected yearly totals
        for period, data in projections["projected_revenue"].items():
            graph_data["yearly_totals"]["projected"][period] = data
    
    def _create_scenario_data(self, graph_data: Dict, projections: Dict):
        """Create scenario data for graphs."""
        for scenario_name, scenario_data in projections["scenarios"].items():
            scenario_monthly_avg = scenario_data["monthly_average"]
            
            for month_data in graph_data["monthly_data"]:
                if month_data["data_type"] == "projected":
                    graph_data["scenarios"][scenario_name].append({
                        "date": month_data["date"],
                        "year": month_data["year"],
                        "month": month_data["month"],
                        "revenue": scenario_monthly_avg,
                        "scenario": scenario_name
                    })
    
    def _validate_data(self, years_processed: List[str]) -> Dict[str, Any]:
        """Validate data completeness and quality."""
        validation = {
            "years_processed": years_processed,
            "data_quality_checks": {},
            "missing_months": [],
            "recommendations": []
        }
        
        # Check for missing months
        expected_months = 12
        for year in years_processed:
            year_files = [f for f in self.audit_trail["pipeline_run"]["files_processed"] 
                         if f["file"].startswith(year)]
            
            if len(year_files) < expected_months:
                missing_count = expected_months - len(year_files)
                validation["missing_months"].append({
                    "year": year,
                    "missing_count": missing_count,
                    "files_found": len(year_files)
                })
                validation["recommendations"].append(f"{year}: Missing {missing_count} months of data")
        
        # Data quality checks
        low_revenue_months = [f for f in self.audit_trail["pipeline_run"]["files_processed"] 
                             if not f.get("has_data", True)]
        
        validation["data_quality_checks"] = {
            "low_revenue_months": len(low_revenue_months),
            "total_months_processed": len(self.audit_trail["pipeline_run"]["files_processed"]),
            "data_completeness": f"{len(self.audit_trail['pipeline_run']['files_processed'])} months processed"
        }
        
        if low_revenue_months:
            validation["recommendations"].append(f"Review {len(low_revenue_months)} months with low revenue values")
        
        return validation
    
    def save_audit_trail(self, output_path: str = None):
        """Save the audit trail to JSON files in the same locations as ETL pipeline."""
        if output_path is None:
            # Save only to where the website actually reads from
            output_paths = [
                "website/src/data/revenue_audit_trail.json"  # Where website reads from
            ]
        else:
            output_paths = [output_path]
        
        for path in output_paths:
            # Ensure directory exists
            Path(path).parent.mkdir(parents=True, exist_ok=True)
            
            with open(path, 'w') as f:
                json.dump(self.audit_trail, f, indent=2)
            logger.info(f"Audit trail saved to {path}")
    
    def print_summary(self):
        """Print a summary of the results."""
        print("\n" + "="*60)
        print("PENNSYLVANIA REVENUE CALCULATION SUMMARY")
        print("="*60)
        
        total = self.audit_trail["pipeline_run"]["total_revenue"]
        print(f"Total Pennsylvania Revenue: ${total:,.2f}")
        
        print(f"\nYears Processed: {', '.join(self.audit_trail['pipeline_run']['validation']['years_processed'])}")
        
        print(f"\nStructure Changes:")
        for year, structure in self.audit_trail["pipeline_run"]["structure_changes"].items():
            print(f"  {year}: {structure['description']}")
        
        print(f"\nData Quality:")
        validation = self.audit_trail["pipeline_run"]["validation"]
        print(f"  Months Processed: {validation['data_quality_checks']['total_months_processed']}")
        print(f"  Low Revenue Months: {validation['data_quality_checks']['low_revenue_months']}")
        
        if validation["missing_months"]:
            print(f"\nMissing Data:")
            for missing in validation["missing_months"]:
                print(f"  {missing['year']}: Missing {missing['missing_count']} months")
        
        # Print projections
        projections = self.audit_trail["pipeline_run"]["projections"]
        print(f"\nREVENUE PROJECTIONS (through end of 2026):")
        print(f"  Methodology: {projections['methodology']}")
        print(f"  Projection Period: {projections['projection_period']}")
        
        print(f"\nMonthly Averages by Year:")
        for year, data in projections["monthly_averages"].items():
            print(f"  {year}: ${data['monthly_average']:,.2f} (from {data['months_available']} months)")
        
        print(f"\nProjected Revenue:")
        for period, data in projections["projected_revenue"].items():
            print(f"  {period}: ${data['total_projected']:,.2f} ({data['months']} months)")
        
        print(f"\nTotal Projected Revenue: ${projections['total_projected_revenue']:,.2f}")
        
        print(f"\nScenario Analysis:")
        for scenario, data in projections["scenarios"].items():
            print(f"  {scenario.title()}: ${data['total_projected']:,.2f} ({data['description']})")
        
        print(f"\nAssumptions:")
        for assumption in projections["assumptions"]:
            print(f"  • {assumption}")
        
        print("\n" + "="*60)


def main():
    """Main function to run the pipeline."""
    pipeline = SimpleRevenuePipeline()
    
    try:
        # Process all reports
        audit_trail = pipeline.process_all_reports()
        
        # Save audit trail
        pipeline.save_audit_trail()
        
        # Print summary
        pipeline.print_summary()
        
        return audit_trail
        
    except Exception as e:
        logger.error(f"Pipeline failed: {str(e)}")
        raise


if __name__ == "__main__":
    main()
