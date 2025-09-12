#!/bin/bash
set -euo pipefail
FILE="website/public/data/equipment_analysis.json"

# Check if file exists before attempting to process it
if [[ ! -f "$FILE" ]]; then
    echo "Error: File '$FILE' does not exist"
    exit 1
fi

# Validate JSON
jq . "$FILE" >/dev/null || { echo "Invalid JSON"; exit 1; }

echo "Duplicate names:"
jq -r '.equipment_summary.items[].name' "$FILE" | sort | uniq -d

echo -e "\nNames containing newlines:"
jq -r '.equipment_summary.items[].name | select(test("\\n"))' "$FILE"

echo -e "\nItems count:"
jq '.equipment_summary.items | length' "$FILE"
