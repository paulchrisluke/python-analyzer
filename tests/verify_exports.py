#!/usr/bin/env python3
"""
Verify that the final exported files are schema-compliant and correct.
"""

import json
import jsonschema
from pathlib import Path
import sys

# Add the parent directory to the Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Import the schema from the test file
from test_due_diligence_verification import MASTER_SCHEMA

def verify_final_exports():
    """Verify the final exported files."""
    print("="*60)
    print("VERIFYING FINAL EXPORTED FILES")
    print("="*60)
    
    stages_dir = Path(__file__).parent.parent / "examples" / "data" / "final" / "due_diligence_stages"
    
    if not stages_dir.exists():
        print("❌ Stages directory does not exist!")
        return False
    
    expected_files = ["public.json", "nda.json", "buyer.json", "closing.json", "internal.json"]
    all_valid = True
    
    for filename in expected_files:
        file_path = stages_dir / filename
        
        if not file_path.exists():
            print(f"❌ Missing file: {filename}")
            all_valid = False
            continue
        
        print(f"\n📄 Verifying {filename}...")
        
        try:
            with open(file_path, 'r') as f:
                data = json.load(f)
            
            # Validate against schema
            jsonschema.validate(instance=data, schema=MASTER_SCHEMA)
            print(f"✅ {filename} is schema-compliant")
            
            # Check specific requirements
            if filename == "public.json":
                # Public should not have file paths
                has_file_paths = False
                for category, cat_data in data.items():
                    if isinstance(cat_data, dict) and "documents" in cat_data:
                        for doc in cat_data["documents"]:
                            if doc.get("file_path") is not None:
                                has_file_paths = True
                                break
                
                if has_file_paths:
                    print(f"❌ {filename} contains file paths (should be hidden)")
                    all_valid = False
                else:
                    print(f"✅ {filename} correctly hides file paths")
            
            elif filename == "internal.json":
                # Internal should have file paths
                has_file_paths = False
                for category, cat_data in data.items():
                    if isinstance(cat_data, dict) and "documents" in cat_data:
                        for doc in cat_data["documents"]:
                            if doc.get("file_path") is not None:
                                has_file_paths = True
                                break
                
                if has_file_paths:
                    print(f"✅ {filename} correctly exposes file paths")
                else:
                    print(f"❌ {filename} missing file paths (should expose them)")
                    all_valid = False
            
            # Check document counts
            total_docs = 0
            for category, cat_data in data.items():
                if isinstance(cat_data, dict) and "documents" in cat_data:
                    total_docs += len(cat_data["documents"])
            
            print(f"✅ {filename} contains {total_docs} documents")
            
        except json.JSONDecodeError as e:
            print(f"❌ {filename} is not valid JSON: {e}")
            all_valid = False
        except jsonschema.ValidationError as e:
            print(f"❌ {filename} schema validation failed: {e.message}")
            all_valid = False
        except Exception as e:
            print(f"❌ {filename} verification failed: {e}")
            all_valid = False
    
    print("\n" + "="*60)
    if all_valid:
        print("✅ ALL FINAL EXPORTS ARE VALID AND SCHEMA-COMPLIANT")
    else:
        print("❌ SOME EXPORTS HAVE ISSUES")
    print("="*60)
    
    return all_valid

if __name__ == "__main__":
    import sys
    try:
        result = verify_final_exports()
        if not result:
            sys.exit(1)
        sys.exit(0)
    except Exception as e:
        print(f"Error during verification: {e}")
        sys.exit(1)
