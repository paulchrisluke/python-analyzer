#!/bin/bash
set -euo pipefail
FILE="website/public/data/equipment_analysis.json"

# Validate JSON
jq . "$FILE" >/dev/null || { echo "Invalid JSON"; exit 1; }

echo "Duplicate names:"
jq -r '.equipment_summary.items[].name' "$FILE" | sort | uniq -d

echo -e "\nNames containing newlines:"
jq -r '.equipment_summary.items[].name | select(test("\\n"))' "$FILE"

echo -e "\nItems count:"
jq '.equipment_summary.items | length' "$FILE"
