#!/usr/bin/env python3
"""
Simple EBITDA Pipeline for Cranberry Hearing and Balance Center
Calculates EBIT (Earnings Before Interest and Taxes) from P&L data
with comprehensive audit trail and projections.

Note: This calculates EBIT, not full EBITDA, as depreciation data
is not available in the P&L files.
"""

import os
import json
import pandas as pd
from datetime import datetime, date
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
import logging
from decimal import Decimal, ROUND_HALF_UP

# Configuration
CONFIG = {
    "analysis_period": {
        "start_date": "2023-01-01",
        "end_date": "2025-06-30"
    },
    "locations": {
        "include_states": ["Pennsylvania"],
        "exclude_states": ["Virginia"]
    },
    "ebitda_calculation": {
        "method": "EBIT (Earnings Before Interest and Taxes)",
        "formula": "Net Income + Interest Expenses + Taxes",
        "note": "Depreciation/Amortization data not available in P&L files"
    },
    "projections": {
        "target_year": 2026,
        "scenarios": {
            "conservative": -0.05,  # 5% decline
            "base": 0.00,          # No growth
            "optimistic": 0.05     # 5% growth
        }
    }
}

def normalize_float(value: float) -> float:
    """Normalize float to 2 decimal places to avoid precision artifacts."""
    if value is None:
        return 0.0
    return round(float(value), 2)

class SimpleEBITDAPipeline:
    def __init__(self):
        self.audit_trail = {
            "pipeline_info": {
                "name": "Simple EBITDA Pipeline",
                "version": "1.0",
                "created_at": datetime.now().isoformat(),
                "calculation_method": "EBIT (Earnings Before Interest and Taxes)",
                "note": "Depreciation/Amortization data not available in P&L files"
            },
            "configuration": CONFIG,
            "data_sources": [],
            "monthly_calculations": [],
            "summary": {},
            "projections": {},
            "graph_data": {}
        }
        
    def _read_csv_with_encodings(self, file_path: str) -> Optional[pd.DataFrame]:
        """Read CSV with multiple encoding fallbacks."""
        encodings = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
        
        for encoding in encodings:
            try:
                df = pd.read_csv(file_path, encoding=encoding)
                return df
            except UnicodeDecodeError:
                continue
            except Exception as e:
                logging.warning(f"Error reading {file_path} with {encoding}: {e}")
                continue
        
        logging.error(f"Could not read {file_path} with any encoding")
        return None

    def _extract_month_from_filename(self, filename: str) -> Optional[str]:
        """Extract month from filename like '2023-02-01_to_2023-02-28_ProfitAndLoss_CranberryHearing.CSV'."""
        try:
            # Extract the start date part
            date_part = filename.split('_')[0]  # Gets '2023-02-01'
            date_obj = datetime.strptime(date_part, '%Y-%m-%d')
            return date_obj.strftime('%Y-%m')
        except (IndexError, ValueError):
            return None

    def _process_month(self, file_path: str, df: pd.DataFrame) -> Dict[str, Any]:
        """Process a single month's P&L data to calculate EBIT."""
        filename = os.path.basename(file_path)
        month = self._extract_month_from_filename(filename)
        
        if month is None:
            return {"error": f"Could not extract month from filename: {filename}"}
        
        calculation = {
            "month": month,
            "filename": filename,
            "file_path": file_path,
            "fields_analyzed": [],
            "ebit_calculation": {},
            "data_quality": {},
            "notes": []
        }
        
        # Check if this is 2023 format (Pennsylvania column) or 2024-2025 format (Cranberry + West View)
        if "Pennsylvania" in df.columns:
            # 2023 format
            location_columns = ["Pennsylvania"]
            calculation["report_format"] = "2023_format"
            calculation["notes"].append("Using 2023 format with Pennsylvania column")
        elif "Cranberry" in df.columns and "West View" in df.columns:
            # 2024-2025 format
            location_columns = ["Cranberry", "West View"]
            calculation["report_format"] = "2024_2025_format"
            calculation["notes"].append("Using 2024-2025 format with Cranberry and West View columns")
        else:
            calculation["error"] = "Unknown report format - no recognized location columns"
            return calculation
        
        # Initialize totals
        total_net_income = 0
        total_interest = 0
        total_taxes = 0
        
        # Process each location column
        for location in location_columns:
            if location not in df.columns:
                continue
                
            location_data = {
                "location": location,
                "net_income": 0,
                "interest_expenses": 0,
                "taxes": 0,
                "fields_found": []
            }
            
            # Find Net Income
            net_income_row = df[df.iloc[:, 0].str.contains("Net Income", na=False)]
            if not net_income_row.empty:
                net_income_value = net_income_row[location].iloc[0]
                if pd.notna(net_income_value) and net_income_value != "":
                    try:
                        net_income = float(net_income_value)
                        location_data["net_income"] = net_income
                        location_data["fields_found"].append({
                            "field": "Net Income",
                            "value": net_income,
                            "row": net_income_row.index[0]
                        })
                        total_net_income += net_income
                    except (ValueError, TypeError):
                        pass
            
            # Find Interest Expenses
            interest_row = df[df.iloc[:, 0].str.contains("Interest Expenses", na=False)]
            if not interest_row.empty:
                interest_value = interest_row[location].iloc[0]
                if pd.notna(interest_value) and interest_value != "":
                    try:
                        interest = float(interest_value)
                        location_data["interest_expenses"] = interest
                        location_data["fields_found"].append({
                            "field": "Interest Expenses",
                            "value": interest,
                            "row": interest_row.index[0]
                        })
                        total_interest += interest
                    except (ValueError, TypeError):
                        pass
            
            # Find Taxes (Corporate income tax + State taxes)
            corporate_tax_row = df[df.iloc[:, 0].str.contains("Corporate income tax expense", na=False)]
            state_tax_row = df[df.iloc[:, 0].str.contains("State", na=False)]
            
            corporate_tax = 0
            state_tax = 0
            
            if not corporate_tax_row.empty:
                corporate_tax_value = corporate_tax_row[location].iloc[0]
                if pd.notna(corporate_tax_value) and corporate_tax_value != "":
                    try:
                        corporate_tax = float(corporate_tax_value)
                        location_data["fields_found"].append({
                            "field": "Corporate income tax expense",
                            "value": corporate_tax,
                            "row": corporate_tax_row.index[0]
                        })
                    except (ValueError, TypeError):
                        pass
            
            if not state_tax_row.empty:
                state_tax_value = state_tax_row[location].iloc[0]
                if pd.notna(state_tax_value) and state_tax_value != "":
                    try:
                        state_tax = float(state_tax_value)
                        location_data["fields_found"].append({
                            "field": "State taxes",
                            "value": state_tax,
                            "row": state_tax_row.index[0]
                        })
                    except (ValueError, TypeError):
                        pass
            
            total_tax = corporate_tax + state_tax
            location_data["taxes"] = total_tax
            total_taxes += total_tax
            
            calculation["fields_analyzed"].append(location_data)
        
        # Calculate EBIT
        ebit = total_net_income + total_interest + total_taxes
        
        calculation["ebit_calculation"] = {
            "net_income": total_net_income,
            "interest_expenses": total_interest,
            "taxes": total_taxes,
            "ebit": ebit,
            "formula": "Net Income + Interest Expenses + Taxes",
            "note": "This is EBIT, not full EBITDA (depreciation data not available)"
        }
        
        # Data quality checks
        calculation["data_quality"] = {
            "has_net_income": total_net_income != 0,
            "has_interest": total_interest != 0,
            "has_taxes": total_taxes != 0,
            "total_fields_found": sum(len(loc["fields_found"]) for loc in calculation["fields_analyzed"]),
            "missing_depreciation": True,
            "depreciation_note": "Depreciation/Amortization data not available in P&L files"
        }
        
        return calculation

    def _calculate_projections(self, monthly_data: List[Dict]) -> Dict[str, Any]:
        """Calculate EBIT projections through 2026."""
        if not monthly_data:
            return {}
        
        # Calculate historical monthly average
        historical_ebit = [month["ebit_calculation"]["ebit"] for month in monthly_data if "ebit_calculation" in month]
        if not historical_ebit:
            return {}
        
        monthly_average = sum(historical_ebit) / len(historical_ebit)
        
        projections = {
            "method": "Historical monthly average with growth scenarios",
            "historical_average_monthly_ebit": monthly_average,
            "historical_months_analyzed": len(historical_ebit),
            "scenarios": {}
        }
        
        # Calculate projections for each scenario
        for scenario_name, growth_rate in CONFIG["projections"]["scenarios"].items():
            scenario_data = {
                "growth_rate": growth_rate,
                "monthly_ebit": monthly_average * (1 + growth_rate),
                "projected_months": [],
                "total_projected_ebit": 0
            }
            
            # Project through end of 2026
            current_date = datetime(2025, 6, 1)  # Start from last historical month
            end_date = datetime(2026, 12, 31)
            
            while current_date <= end_date:
                month_str = current_date.strftime('%Y-%m')
                monthly_ebit = monthly_average * (1 + growth_rate)
                
                scenario_data["projected_months"].append({
                    "month": month_str,
                    "ebit": monthly_ebit,
                    "data_type": "projected"
                })
                
                scenario_data["total_projected_ebit"] = normalize_float(scenario_data["total_projected_ebit"] + monthly_ebit)
                current_date = current_date.replace(day=1) + pd.DateOffset(months=1)
            
            projections["scenarios"][scenario_name] = scenario_data
        
        return projections

    def _create_graph_data(self, monthly_data: List[Dict], projections: Dict[str, Any]) -> Dict[str, Any]:
        """Create graph-ready data structure."""
        graph_data = {
            "monthly_data": [],
            "summary": {
                "total_historical_ebit": 0,
                "total_projected_ebit": {},
                "historical_months": 0,
                "projected_months": 0
            }
        }
        
        # Add historical data
        for month_data in monthly_data:
            if "ebit_calculation" in month_data:
                graph_data["monthly_data"].append({
                    "month": month_data["month"],
                    "ebit": month_data["ebit_calculation"]["ebit"],
                    "data_type": "historical",
                    "net_income": month_data["ebit_calculation"]["net_income"],
                    "interest": month_data["ebit_calculation"]["interest_expenses"],
                    "taxes": month_data["ebit_calculation"]["taxes"]
                })
                graph_data["summary"]["total_historical_ebit"] = normalize_float(
                    graph_data["summary"]["total_historical_ebit"] + month_data["ebit_calculation"]["ebit"]
                )
                graph_data["summary"]["historical_months"] += 1
        
        # Add projected data
        if projections and "scenarios" in projections:
            for scenario_name, scenario_data in projections["scenarios"].items():
                for month_data in scenario_data["projected_months"]:
                    graph_data["monthly_data"].append({
                        "month": month_data["month"],
                        "ebit": month_data["ebit"],
                        "data_type": "projected",
                        "scenario": scenario_name,
                        "net_income": None,  # Not calculated for projections
                        "interest": None,
                        "taxes": None
                    })
                    graph_data["summary"]["projected_months"] += 1
                
                graph_data["summary"]["total_projected_ebit"][scenario_name] = normalize_float(scenario_data["total_projected_ebit"])
        
        # Sort by month
        graph_data["monthly_data"].sort(key=lambda x: x["month"])
        
        return graph_data

    def run_pipeline(self) -> Dict[str, Any]:
        """Run the complete EBITDA pipeline."""
        print("Starting Simple EBITDA Pipeline...")
        
        # Find all P&L files
        pnl_dirs = [
            "docs/financials/Profit_and_Loss/2023_Profit_and_Loss",
            "docs/financials/Profit_and_Loss/2024_Profit_and_Loss", 
            "docs/financials/Profit_and_Loss/2025_Profit_and_Loss"
        ]
        
        all_files = []
        for pnl_dir in pnl_dirs:
            if os.path.exists(pnl_dir):
                files = [os.path.join(pnl_dir, f) for f in os.listdir(pnl_dir) if f.endswith('.CSV')]
                all_files.extend(files)
        
        print(f"Found {len(all_files)} P&L files")
        
        # Process each file
        monthly_calculations = []
        for file_path in all_files:
            print(f"Processing: {os.path.basename(file_path)}")
            
            df = self._read_csv_with_encodings(file_path)
            if df is None:
                continue
            
            calculation = self._process_month(file_path, df)
            if "error" not in calculation:
                monthly_calculations.append(calculation)
        
        # Sort by month
        monthly_calculations.sort(key=lambda x: x["month"])
        
        # Calculate projections
        projections = self._calculate_projections(monthly_calculations)
        
        # Create graph data
        graph_data = self._create_graph_data(monthly_calculations, projections)
        
        # Calculate summary
        total_ebit = sum(month["ebit_calculation"]["ebit"] for month in monthly_calculations if "ebit_calculation" in month)
        total_net_income = sum(month["ebit_calculation"]["net_income"] for month in monthly_calculations if "ebit_calculation" in month)
        total_interest = sum(month["ebit_calculation"]["interest_expenses"] for month in monthly_calculations if "ebit_calculation" in month)
        total_taxes = sum(month["ebit_calculation"]["taxes"] for month in monthly_calculations if "ebit_calculation" in month)
        
        summary = {
            "total_ebit": normalize_float(total_ebit),
            "total_net_income": normalize_float(total_net_income),
            "total_interest_expenses": normalize_float(total_interest),
            "total_taxes": normalize_float(total_taxes),
            "months_analyzed": len(monthly_calculations),
            "calculation_method": "EBIT (Earnings Before Interest and Taxes)",
            "missing_components": {
                "depreciation": True,
                "amortization": True,
                "note": "Depreciation/Amortization data not available in P&L files"
            },
            "data_quality": {
                "has_net_income": total_net_income != 0,
                "has_interest": total_interest != 0,
                "has_taxes": total_taxes != 0,
                "missing_depreciation": True
            }
        }
        
        # Update audit trail
        self.audit_trail["data_sources"] = [{"file": os.path.basename(f), "path": f} for f in all_files]
        self.audit_trail["monthly_calculations"] = monthly_calculations
        self.audit_trail["summary"] = summary
        self.audit_trail["projections"] = projections
        self.audit_trail["graph_data"] = graph_data
        
        print(f"Pipeline completed. Total EBIT: ${total_ebit:,.2f}")
        print(f"Note: This is EBIT, not full EBITDA (depreciation data not available)")
        
        return self.audit_trail

    def save_audit_trail(self, output_path: str = None):
        """Save audit trail to multiple locations."""
        if output_path is None:
            output_path = "ebitda_audit_trail.json"
        
        # Save only to where the website actually reads from
        locations = [
            "website/src/data/ebitda_audit_trail.json"  # Where website reads from
        ]
        
        for location in locations:
            try:
                # Create directory if it doesn't exist (only if there's a directory path)
                dir_path = os.path.dirname(location)
                if dir_path:  # Only create directory if there's a path
                    os.makedirs(dir_path, exist_ok=True)
                
                with open(location, 'w') as f:
                    # Convert numpy types to Python types for JSON serialization
                    def convert_types(obj):
                        if hasattr(obj, 'item'):  # numpy types
                            return obj.item()
                        elif isinstance(obj, dict):
                            return {k: convert_types(v) for k, v in obj.items()}
                        elif isinstance(obj, list):
                            return [convert_types(item) for item in obj]
                        return obj
                    
                    converted_trail = convert_types(self.audit_trail)
                    json.dump(converted_trail, f, indent=2)
                print(f"Saved audit trail to: {location}")
            except Exception as e:
                print(f"Error saving to {location}: {e}")

def main():
    """Main execution function."""
    pipeline = SimpleEBITDAPipeline()
    audit_trail = pipeline.run_pipeline()
    pipeline.save_audit_trail()
    
    # Print summary
    print("\n" + "="*50)
    print("EBITDA PIPELINE SUMMARY")
    print("="*50)
    print(f"Total EBIT: ${audit_trail['summary']['total_ebit']:,.2f}")
    print(f"Total Net Income: ${audit_trail['summary']['total_net_income']:,.2f}")
    print(f"Total Interest: ${audit_trail['summary']['total_interest_expenses']:,.2f}")
    print(f"Total Taxes: ${audit_trail['summary']['total_taxes']:,.2f}")
    print(f"Months Analyzed: {audit_trail['summary']['months_analyzed']}")
    print(f"Note: This is EBIT, not full EBITDA (depreciation data not available)")

if __name__ == "__main__":
    main()
