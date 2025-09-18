#!/usr/bin/env python3
"""
Simple Location Pipeline for Cranberry Hearing and Balance Center
Processes location data including lease information, property details, and business metrics
with comprehensive audit trail and integration with existing data sources.
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
    "lease_data_path": "docs/legal/Leases",
    "locations": {
        "cranberry_pa": {
            "location_id": "cranberry_pa",
            "name": "Cranberry Hearing & Balance",
            "address": "20820 Route 19, Suite A",
            "city": "Cranberry Twp",
            "state": "PA",
            "zip_code": "16066",
            "phone": "724-779-4444",
            "google_maps_url": "https://www.google.com/maps/place/20820%20Route%2019+Cranberry%20Twp+PA+16066",
            "location_type": "primary",
            "for_sale": True,
            "lease_file": "2022-01-01_to_2030-12-31_BDNPL_CommercialLease_CranberryPA.csv"
        },
        "west_view_pa": {
            "location_id": "west_view_pa", 
            "name": "Cranberry Hearing & Balance - West View",
            "address": "999 West View Park Drive",
            "city": "Pittsburgh",
            "state": "PA",
            "zip_code": "15229",
            "phone": "412-931-9290",
            "google_maps_url": "https://www.google.com/maps/place/999%20West%20View%20Park%20Drive+Pittsburgh%20PA%2015229",
            "location_type": "satellite",
            "for_sale": True,
            "lease_file": "2023-01-01_to_2030-12-31_WestView_CommercialLease_Renewed.csv"
        }
    },
    "property_analysis": {
        "square_footage": {
            "cranberry_pa": 1500,  # From lease documents
            "west_view_pa": 1500   # From lease documents
        },
        "property_type": "Leased Commercial",
        "lease_terms": {
            "analysis_period": "2023-2029",
            "include_cam_fees": True,
            "include_escalations": True
        }
    }
}

def normalize_float(value: float) -> float:
    """Normalize float to 2 decimal places to avoid precision artifacts."""
    if value is None:
        return 0.0
    return round(float(value), 2)

class SimpleLocationPipeline:
    def __init__(self):
        self.audit_trail = {
            "pipeline_info": {
                "name": "Simple Location Pipeline",
                "version": "1.0",
                "created_at": datetime.now().isoformat(),
                "purpose": "Process location data including lease information and property details"
            },
            "configuration": CONFIG,
            "lease_data": {},
            "location_summary": {},
            "property_analysis": {},
            "integration_data": {}
        }
        
    def _read_lease_csv(self, file_path: str) -> Optional[pd.DataFrame]:
        """Read lease CSV file with error handling."""
        try:
            if not os.path.exists(file_path):
                logging.warning(f"Lease file not found: {file_path}")
                return None
                
            df = pd.read_csv(file_path)
            logging.info(f"Successfully read lease file: {file_path}")
            return df
        except Exception as e:
            logging.error(f"Error reading lease file {file_path}: {e}")
            return None

    def _process_lease_data(self, location_id: str, lease_file: str) -> Dict[str, Any]:
        """Process lease data for a specific location."""
        lease_path = os.path.join(CONFIG["lease_data_path"], lease_file)
        df = self._read_lease_csv(lease_path)
        
        if df is None:
            return {
                "location_id": location_id,
                "lease_file": lease_file,
                "status": "error",
                "error": "Could not read lease file",
                "lease_terms": []
            }
        
        lease_terms = []
        total_lease_cost = 0.0
        current_rent = 0.0
        lease_end_date = None
        today = pd.to_datetime(datetime.now().date())
        
        for _, row in df.iterrows():
            try:
                start_date = pd.to_datetime(row['start_date']).strftime('%Y-%m-%d')
                end_date = pd.to_datetime(row['end_date']).strftime('%Y-%m-%d')
                monthly_rent = float(row['monthly_rent']) if pd.notna(row['monthly_rent']) else 0.0
                # Calculate annual_rent from monthly_rent * 12 to ensure consistency
                annual_rent = monthly_rent * 12
                cam_fee = float(row['cam_fee']) if pd.notna(row['cam_fee']) else 0.0
                
                # Calculate total monthly cost (rent + CAM)
                total_monthly = monthly_rent + (cam_fee / 12) if cam_fee > 0 else monthly_rent
                total_annual = annual_rent + cam_fee if cam_fee > 0 else annual_rent
                
                lease_term = {
                    "period": row['lease_period'],
                    "start_date": start_date,
                    "end_date": end_date,
                    "monthly_rent": normalize_float(monthly_rent),
                    "annual_rent": normalize_float(annual_rent),
                    "cam_fee": normalize_float(cam_fee),
                    "total_monthly_cost": normalize_float(total_monthly),
                    "total_annual_cost": normalize_float(total_annual),
                    "notes": row.get('notes', ''),
                    "lessor": row.get('lessor', ''),
                    "lessee": row.get('lessee', ''),
                    "execution_date": row.get('execution_date', '')
                }
                
                lease_terms.append(lease_term)
                total_lease_cost += total_annual
                
                # Defer current-term selection until after all rows are processed
                    
            except Exception as e:
                logging.error(f"Error processing lease term for {location_id}: {e}")
                continue
        
        # Select current term by date range
        def _to_ts(d: str):
            return pd.to_datetime(d)
        active = [t for t in lease_terms if _to_ts(t["start_date"]) <= today <= _to_ts(t["end_date"])]
        if active:
            # pick one that ends latest
            sel = max(active, key=lambda t: _to_ts(t["end_date"]))
        else:
            upcoming = [t for t in lease_terms if _to_ts(t["start_date"]) > today]
            if upcoming:
                sel = min(upcoming, key=lambda t: _to_ts(t["start_date"]))
            else:
                past = [t for t in lease_terms if _to_ts(t["end_date"]) < today]
                sel = max(past, key=lambda t: _to_ts(t["end_date"])) if past else None
        if sel:
            current_rent = sel["total_monthly_cost"]
            lease_end_date = sel["end_date"]

        # Validate annual_rent calculations
        for term in lease_terms:
            expected_annual = term["monthly_rent"] * 12
            actual_annual = term["annual_rent"]
            if abs(actual_annual - expected_annual) > 1:
                logging.error(f"Annual rent validation failed for {location_id} {term['period']}: "
                            f"expected {expected_annual}, got {actual_annual}")
                raise ValueError(f"Annual rent calculation error: expected {expected_annual}, got {actual_annual}")

        return {
            "location_id": location_id,
            "lease_file": lease_file,
            "status": "success",
            "lease_terms": lease_terms,
            "summary": {
                "total_lease_terms": len(lease_terms),
                "total_lease_cost": normalize_float(total_lease_cost),
                "current_monthly_rent": normalize_float(current_rent),
                "lease_end_date": lease_end_date,
                "active_terms": len(active)
            }
        }

    def _create_property_analysis(self, lease_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create comprehensive property analysis."""
        analysis = {
            "property_type": CONFIG["property_analysis"]["property_type"],
            "total_square_footage": 0,
            "locations": {},
            "lease_summary": {
                "total_monthly_lease_cost": 0.0,
                "total_annual_lease_cost": 0.0,
                "average_cost_per_sqft": 0.0,
                "lease_expiration_dates": []
            },
            "market_analysis": {
                "competitive_advantages": [
                    "Prime commercial locations in growing markets",
                    "Long-term lease stability",
                    "Professional medical office spaces"
                ],
                "location_benefits": [
                    "High-traffic commercial areas",
                    "Easy access and parking",
                    "Professional medical building settings"
                ]
            }
        }
        
        total_sqft = 0
        total_monthly_cost = 0.0
        total_annual_cost = 0.0
        
        for location_id, location_config in CONFIG["locations"].items():
            if location_id in lease_data:
                lease_info = lease_data[location_id]
                sqft = CONFIG["property_analysis"]["square_footage"].get(location_id, 0)
                
                location_analysis = {
                    "name": location_config["name"],
                    "address": location_config["address"],
                    "city": location_config["city"],
                    "state": location_config["state"],
                    "zip_code": location_config["zip_code"],
                    "phone": location_config["phone"],
                    "google_maps_url": location_config["google_maps_url"],
                    "location_type": location_config["location_type"],
                    "square_footage": sqft,
                    "lease_status": lease_info["status"],
                    "current_monthly_rent": lease_info["summary"]["current_monthly_rent"],
                    "lease_end_date": lease_info["summary"]["lease_end_date"],
                    "cost_per_sqft": normalize_float(lease_info["summary"]["current_monthly_rent"] / sqft) if sqft > 0 else 0.0
                }
                
                analysis["locations"][location_id] = location_analysis
                total_sqft += sqft
                total_monthly_cost += lease_info["summary"]["current_monthly_rent"]
                total_annual_cost += lease_info["summary"]["current_monthly_rent"] * 12
                
                if lease_info["summary"]["lease_end_date"]:
                    analysis["lease_summary"]["lease_expiration_dates"].append({
                        "location": location_config["name"],
                        "end_date": lease_info["summary"]["lease_end_date"]
                    })
        
        analysis["total_square_footage"] = total_sqft
        analysis["lease_summary"]["total_monthly_lease_cost"] = normalize_float(total_monthly_cost)
        analysis["lease_summary"]["total_annual_lease_cost"] = normalize_float(total_annual_cost)
        analysis["lease_summary"]["average_cost_per_sqft"] = normalize_float(total_monthly_cost / total_sqft) if total_sqft > 0 else 0.0
        
        return analysis

    def _create_integration_data(self, lease_data: Dict[str, Any], property_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Create data structure for integration with other pipelines."""
        integration = {
            "location_data": [],
            "lease_analysis": {
                "total_monthly_lease_cost": property_analysis["lease_summary"]["total_monthly_lease_cost"],
                "total_annual_lease_cost": property_analysis["lease_summary"]["total_annual_lease_cost"],
                "cost_per_sqft": property_analysis["lease_summary"]["average_cost_per_sqft"]
            },
            "property_details": {
                "primary_location": {},
                "secondary_location": {},
                "lease_analysis": property_analysis["lease_summary"],
                "property_type": property_analysis["property_type"]
            },
            "business_operations": {
                "locations": len(CONFIG["locations"]),
                "states": list(set([loc["state"] for loc in CONFIG["locations"].values()])),
                "total_square_footage": property_analysis["total_square_footage"]
            }
        }
        
        # Create location data array
        for location_id, location_config in CONFIG["locations"].items():
            location_data = {
                "name": location_config["name"],
                "type": "Primary location" if location_config["location_type"] == "primary" else "Secondary location",
                "address": f"{location_config['address']}, {location_config['city']}, {location_config['state']} {location_config['zip_code']}",
                "phone": location_config["phone"],
                "google_maps_url": location_config["google_maps_url"],
                "square_footage": CONFIG["property_analysis"]["square_footage"].get(location_id, 0),
                "location_type": location_config["location_type"],
                "for_sale": location_config["for_sale"]
            }
            
            # Add lease information if available
            if location_id in lease_data and lease_data[location_id]["status"] == "success":
                lease_info = lease_data[location_id]
                location_data["lease"] = {
                    "current_monthly_rent": lease_info["summary"]["current_monthly_rent"],
                    "lease_end_date": lease_info["summary"]["lease_end_date"],
                    "total_lease_terms": lease_info["summary"]["total_lease_terms"]
                }
            
            integration["location_data"].append(location_data)
        
        # Set primary and secondary locations
        for location_data in integration["location_data"]:
            if location_data["location_type"] == "primary":
                integration["property_details"]["primary_location"] = location_data
            elif location_data["location_type"] == "satellite":
                integration["property_details"]["secondary_location"] = location_data
        
        return integration

    def run_pipeline(self) -> Dict[str, Any]:
        """Run the complete location pipeline."""
        print("Starting Simple Location Pipeline...")
        
        # Process lease data for each location
        lease_data = {}
        for location_id, location_config in CONFIG["locations"].items():
            print(f"Processing lease data for {location_config['name']}...")
            lease_info = self._process_lease_data(location_id, location_config["lease_file"])
            lease_data[location_id] = lease_info
            
            if lease_info["status"] == "success":
                print(f"  ✓ Processed {lease_info['summary']['total_lease_terms']} lease terms")
                print(f"  ✓ Current monthly rent: ${lease_info['summary']['current_monthly_rent']:,.2f}")
            else:
                print(f"  ✗ Error: {lease_info.get('error', 'Unknown error')}")
        
        # Create property analysis
        print("Creating property analysis...")
        property_analysis = self._create_property_analysis(lease_data)
        
        # Create integration data
        print("Creating integration data...")
        integration_data = self._create_integration_data(lease_data, property_analysis)
        
        # Update audit trail
        self.audit_trail["lease_data"] = lease_data
        self.audit_trail["location_summary"] = {
            "total_locations": len(CONFIG["locations"]),
            "locations_for_sale": len([loc for loc in CONFIG["locations"].values() if loc["for_sale"]]),
            "total_square_footage": property_analysis["total_square_footage"],
            "total_monthly_lease_cost": property_analysis["lease_summary"]["total_monthly_lease_cost"]
        }
        self.audit_trail["property_analysis"] = property_analysis
        self.audit_trail["integration_data"] = integration_data
        
        print(f"Pipeline completed successfully!")
        print(f"Total locations: {self.audit_trail['location_summary']['total_locations']}")
        print(f"Total square footage: {self.audit_trail['location_summary']['total_square_footage']:,} sq ft")
        print(f"Total monthly lease cost: ${self.audit_trail['location_summary']['total_monthly_lease_cost']:,.2f}")
        
        return self.audit_trail

    def save_audit_trail(self, output_path: str = None):
        """Save audit trail to multiple locations."""
        if output_path is None:
            output_path = "location_audit_trail.json"
        
        # Save to where the website actually reads from
        locations = [
            "website/public/data/location_audit_trail.json",  # Where website reads from
            "data/final/location_data.json"  # ETL pipeline output location
        ]
        
        for location in locations:
            try:
                # Create directory if it doesn't exist
                dir_path = os.path.dirname(location)
                if dir_path:
                    os.makedirs(dir_path, exist_ok=True)
                
                with open(location, 'w') as f:
                    json.dump(self.audit_trail, f, indent=2)
                print(f"Saved location data to: {location}")
            except Exception as e:
                print(f"Error saving to {location}: {e}")

    def print_summary(self):
        """Print a summary of the results."""
        print("\n" + "="*60)
        print("LOCATION PIPELINE SUMMARY")
        print("="*60)
        
        summary = self.audit_trail["location_summary"]
        print(f"Total Locations: {summary['total_locations']}")
        print(f"Locations for Sale: {summary['locations_for_sale']}")
        print(f"Total Square Footage: {summary['total_square_footage']:,} sq ft")
        print(f"Total Monthly Lease Cost: ${summary['total_monthly_lease_cost']:,.2f}")
        
        print(f"\nLocation Details:")
        for location_id, location_config in CONFIG["locations"].items():
            if location_id in self.audit_trail["lease_data"]:
                lease_info = self.audit_trail["lease_data"][location_id]
                print(f"  {location_config['name']}:")
                print(f"    Address: {location_config['address']}, {location_config['city']}, {location_config['state']}")
                print(f"    Phone: {location_config['phone']}")
                print(f"    Square Footage: {CONFIG['property_analysis']['square_footage'].get(location_id, 0):,} sq ft")
                if lease_info["status"] == "success":
                    print(f"    Current Monthly Rent: ${lease_info['summary']['current_monthly_rent']:,.2f}")
                    print(f"    Lease End Date: {lease_info['summary']['lease_end_date']}")
                else:
                    print(f"    Lease Status: Error - {lease_info.get('error', 'Unknown error')}")
        
        print(f"\nLease Analysis:")
        lease_summary = self.audit_trail["property_analysis"]["lease_summary"]
        print(f"  Total Annual Lease Cost: ${lease_summary['total_annual_lease_cost']:,.2f}")
        print(f"  Average Cost per Sq Ft: ${lease_summary['average_cost_per_sqft']:.2f}")
        
        print("\n" + "="*60)

def main():
    """Main execution function."""
    pipeline = SimpleLocationPipeline()
    audit_trail = pipeline.run_pipeline()
    pipeline.save_audit_trail()
    pipeline.print_summary()
    
    return audit_trail

if __name__ == "__main__":
    main()
