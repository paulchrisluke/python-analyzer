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

echo "=== Equipment Analysis Validation ==="

echo -e "\nDuplicate names:"
jq -r '.equipment_summary.items[].name' "$FILE" | sort | uniq -d

echo -e "\nNames containing newlines:"
jq -r '.equipment_summary.items[].name | select(test("\\n"))' "$FILE"

echo -e "\nItems count:"
jq '.equipment_summary.items | length' "$FILE"

echo -e "\n=== Pricing Consistency Validation ==="
# Check for pricing inconsistencies: total_price should equal unit_price * quantity
echo "Checking pricing consistency (total_price vs unit_price * quantity):"
jq -r '.equipment_summary.items[] | 
  select((.unit_price.amount * .quantity) != .total_price.amount) | 
  "INCONSISTENT: \(.name) - unit_price: \(.unit_price.amount) × quantity: \(.quantity) = \(.unit_price.amount * .quantity), but total_price: \(.total_price.amount)"' "$FILE"

echo -e "\n=== Money Shape Validation ==="
# Check for consistent Money shape (should use 'amount' not 'value')
echo "Checking Money shape consistency:"
jq -r '.equipment_summary.items[] | 
  select(.unit_price.value or .total_price.value) | 
  "INCONSISTENT MONEY SHAPE: \(.name) - should use 'amount' not 'value'"' "$FILE"

echo -e "\n=== Equipment Name Validation ==="
# Check for common typos
echo "Checking for common typos:"
jq -r '.equipment_summary.items[].name | select(test("Audiometereter|Controled")) | "TYPO DETECTED: \(.)"' "$FILE"

echo -e "\n=== Summary ==="
echo "Total equipment value:"
jq -r '.equipment_summary.total_value.amount' "$FILE"

echo "Validation complete!"
