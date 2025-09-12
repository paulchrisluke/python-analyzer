#!/bin/bash
set -euo pipefail

# Use ADMIN_DATA_DIR environment variable or default to .data
ADMIN_DATA_DIR="${ADMIN_DATA_DIR:-.data}"

# Function to validate file paths and prevent directory traversal
validate_file_path() {
    local file_path="$1"
    
    # Check for directory traversal patterns
    if [[ "$file_path" == *".."* ]] || [[ "$file_path" == *"~"* ]] || [[ "$file_path" == /* ]]; then
        echo "❌ Invalid file path: $file_path. Directory traversal not allowed."
        return 1
    fi
    
    # Note: Null byte checking is handled at the application level
    
    # Ensure file has .json extension
    if [[ "$file_path" != *.json ]]; then
        echo "❌ Invalid file path: $file_path. Only .json files are allowed."
        return 1
    fi
    
    # Check for suspicious patterns
    local lower_path=$(echo "$file_path" | tr '[:upper:]' '[:lower:]')
    local suspicious_patterns=("/etc/" "/proc/" "/sys/" "/dev/" "config" "secret" "password")
    
    for pattern in "${suspicious_patterns[@]}"; do
        if [[ "$lower_path" == *"$pattern"* ]]; then
            echo "❌ Invalid file path: $file_path. Suspicious pattern detected."
            return 1
        fi
    done
    
    return 0
}

# Validate the file path before using it
FILENAME="equipment_analysis.json"
if ! validate_file_path "$FILENAME"; then
    echo "❌ Invalid filename: $FILENAME"
    exit 1
fi

FILE="website/$ADMIN_DATA_DIR/$FILENAME"

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
  select(
    # Ensure all required fields exist and coerce to numbers with safe defaults
    (.unit_price."amount" // 0 | tonumber) as $unit_price |
    (.quantity // 0 | tonumber) as $quantity |
    (.total_price."amount" // 0 | tonumber) as $total_price |
    # Calculate expected total
    ($unit_price * $quantity) as $expected_total |
    # Use epsilon-based comparison (0.01) instead of strict !=
    (($expected_total - $total_price) | fabs) > 0.01
  ) | 
  "INCONSISTENT: \(.name) - unit_price: \((.unit_price."amount" // 0 | tonumber)) × quantity: \((.quantity // 0 | tonumber)) = \((.unit_price."amount" // 0 | tonumber) * (.quantity // 0 | tonumber)), but total_price: \((.total_price."amount" // 0 | tonumber))"' "$FILE"

echo -e "\n=== Money Shape Validation ==="
# Check for consistent Money shape (should use 'amount' not 'value')
echo "Checking Money shape consistency:"
jq -r '.equipment_summary.items[] | 
  select(.unit_price | has("value") or .total_price | has("value")) | 
  "INCONSISTENT MONEY SHAPE: \(.name) - should use \"amount\" not \"value\""' "$FILE"

echo -e "\n=== Equipment Name Validation ==="
# Check for common typos
echo "Checking for common typos:"
jq -r '.equipment_summary.items[].name | select(test("Audiometereter|Controled")) | "TYPO DETECTED: \(.)"' "$FILE"

echo -e "\n=== Summary ==="
echo "Total equipment value:"
jq -r '.equipment_summary.total_value.amount' "$FILE"

echo "Validation complete!"
