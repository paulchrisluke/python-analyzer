#!/usr/bin/env python3
"""
Debug EBITDA calculation to understand why it's so different from website.
"""

import json
import pandas as pd
from pathlib import Path
from collections import defaultdict
import re
import numpy as np
import math

def parse_currency_value(value):
    """
    Robust parsing of currency values from QuickBooks-style strings.
    Handles commas, currency symbols, parentheses (negative), and other formatting.
    Returns 0.0 on failure.
    """
    if pd.isna(value) or value == 0:
        return 0.0
    
    try:
        # Convert to string and strip whitespace
        str_value = str(value).strip()
        
        # Handle empty strings
        if not str_value:
            return 0.0
        
        # Check for parentheses (negative values)
        is_negative = str_value.startswith('(') and str_value.endswith(')')
        if is_negative:
            str_value = str_value[1:-1]  # Remove parentheses
        
        # Remove currency symbols and commas
        str_value = re.sub(r'[$,\s]', '', str_value)
        
        # Remove any remaining non-numeric characters except decimal point
        str_value = re.sub(r'[^\d.-]', '', str_value)
        
        # Handle empty string after cleaning
        if not str_value:
            return 0.0
        
        # Convert to float
        result = float(str_value)
        
        # Apply negative if parentheses were present
        if is_negative:
            result = -result
            
        return result
        
    except (ValueError, TypeError, AttributeError):
        return 0.0

def sanitize_for_json(obj):
    """
    Sanitize any object to be JSON-serializable.
    Prevents NaN/Inf/np types from breaking JSON serialization.
    """
    if isinstance(obj, (np.integer, np.floating)):
        # Convert numpy scalars to native Python types
        return obj.item()
    elif isinstance(obj, np.ndarray):
        # Convert numpy arrays to lists
        return obj.tolist()
    elif isinstance(obj, float):
        # Handle NaN and infinity values
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    elif pd.isna(obj):
        # Handle pandas NaN values
        return None
    elif isinstance(obj, (int, str, bool, type(None))):
        # Already JSON-serializable
        return obj
    elif isinstance(obj, list):
        # Handle lists recursively
        return [sanitize_for_json(item) for item in obj]
    elif isinstance(obj, dict):
        # Handle dictionaries recursively
        return {key: sanitize_for_json(value) for key, value in obj.items()}
    else:
        # Convert everything else to string
        return str(obj)

def debug_ebitda_calculation():
    """Debug the EBITDA calculation step by step."""
    
    print("🔍 EBITDA CALCULATION DEBUG")
    print("=" * 60)
    
    # Load financial data
    financial_file = Path("data/raw/financial_raw.json")
    if not financial_file.exists():
        print("❌ Financial data not found!")
        return
    
    with open(financial_file, 'r') as f:
        financial_data = json.load(f)
    
    print("📊 WEBSITE TARGETS:")
    print("-" * 30)
    print("Annual EBITDA: $266,517")
    print("EBITDA Margin: 25.6%")
    print("Annual Revenue: $1,041,667")
    print("Monthly Revenue: $86,806")
    
    print("\n📊 OUR PIPELINE RESULTS:")
    print("-" * 30)
    print("Annual EBITDA: $1,510,629")
    print("EBITDA Margin: 5.3%")
    print("Annual Revenue: $955,924")
    print("Monthly Revenue: $79,660")
    
    print("\n🔍 STEP-BY-STEP EBITDA ANALYSIS:")
    print("-" * 50)
    
    # Analyze P&L data
    pnl_data = financial_data.get('profit_loss', {})
    print(f"Found {len(pnl_data)} P&L statements")
    
    monthly_ebitdas = []
    monthly_revenues = []
    monthly_expenses = []
    
    for pnl_key, pnl_info in pnl_data.items():
        if isinstance(pnl_info, dict) and 'data' in pnl_info:
            df = pd.DataFrame(pnl_info['data'])
            
            # Calculate revenue - check for required columns first
            monthly_revenue = 0
            if 'Unnamed: 0' in df.columns and 'TOTAL' in df.columns:
                # Use word boundary regex to match "Sales" as whole word and exclude tax entries
                revenue_rows = df[df['Unnamed: 0'].str.contains(r'\bSales\b', case=False, na=False, regex=True) & 
                                 ~df['Unnamed: 0'].str.contains('tax', case=False, na=False)]
                for _, row in revenue_rows.iterrows():
                    total_value = row.get('TOTAL')
                    if pd.notna(total_value) and total_value != 0:
                        monthly_revenue += parse_currency_value(total_value)
            else:
                print(f"⚠️  Missing required columns in {pnl_key}: 'Unnamed: 0' or 'TOTAL' not found")
                continue
            
            # Calculate expenses - check for required columns first
            monthly_operational_expenses = 0
            monthly_total_expenses = 0
            
            if 'Unnamed: 0' in df.columns and 'TOTAL' in df.columns:
                # Precompile case-insensitive regex for expense keywords
                expense_pattern = re.compile(r'Salaries|Wages|Rent|Insurance|Utilities|Office|Marketing|Professional|Payroll|Employee|Equipment|Supplies|Telephone|Travel|Training|Legal|Accounting|Interest|Tax|Depreciation|Amortization|COGS|Cost|Expense', re.IGNORECASE)
                
                for _, row in df.iterrows():
                    expense_name = row.get('Unnamed: 0', '')
                    total_value = row.get('TOTAL')
                    
                    # Skip if no expense name or total value
                    if pd.isna(expense_name) or pd.isna(total_value) or total_value == 0:
                        continue
                    
                    # Check if this is an expense line using precompiled regex
                    if expense_pattern.search(expense_name):
                        # Skip summary/total rows
                        expense_name_lower = expense_name.lower()
                        if any(summary_term in expense_name_lower for summary_term in ['total', 'summary']):
                            continue
                        
                        expense_amount = parse_currency_value(total_value)
                        if expense_amount != 0:  # Only add non-zero amounts
                            monthly_total_expenses += expense_amount
                            
                            # For EBITDA: exclude Interest, Tax, Depreciation, Amortization (case-insensitive)
                            exclude_terms = ['interest', 'tax', 'depreciation', 'amortization']
                            if not any(exclude_term in expense_name_lower for exclude_term in exclude_terms):
                                monthly_operational_expenses += expense_amount
            
            # Calculate monthly EBITDA
            if monthly_revenue > 0:
                monthly_ebitda = monthly_revenue - monthly_operational_expenses
                monthly_ebitdas.append(monthly_ebitda)
                monthly_revenues.append(monthly_revenue)
                monthly_expenses.append(monthly_operational_expenses)
                
                print(f"\n{pnl_key}:")
                print(f"  Revenue: ${monthly_revenue:,.2f}")
                print(f"  Op Expenses: ${monthly_operational_expenses:,.2f}")
                print(f"  Total Expenses: ${monthly_total_expenses:,.2f}")
                print(f"  Monthly EBITDA: ${monthly_ebitda:,.2f}")
                print(f"  EBITDA Margin: {(monthly_ebitda/monthly_revenue)*100:.1f}%")
    
    if monthly_ebitdas:
        avg_monthly_ebitda = sum(monthly_ebitdas) / len(monthly_ebitdas)
        avg_monthly_revenue = sum(monthly_revenues) / len(monthly_revenues)
        avg_monthly_expenses = sum(monthly_expenses) / len(monthly_expenses)
        
        print(f"\n📈 AVERAGE MONTHLY CALCULATIONS:")
        print("-" * 40)
        print(f"Average Monthly Revenue: ${avg_monthly_revenue:,.2f}")
        print(f"Average Monthly Op Expenses: ${avg_monthly_expenses:,.2f}")
        print(f"Average Monthly EBITDA: ${avg_monthly_ebitda:,.2f}")
        print(f"Average EBITDA Margin: {(avg_monthly_ebitda/avg_monthly_revenue)*100:.1f}%")
        
        annual_ebitda = avg_monthly_ebitda * 12
        print(f"Annual EBITDA (Monthly × 12): ${annual_ebitda:,.2f}")
        
        print(f"\n🎯 COMPARISON WITH WEBSITE:")
        print("-" * 40)
        print(f"Website Annual EBITDA: $266,517")
        print(f"Our Annual EBITDA: ${annual_ebitda:,.2f}")
        print(f"Difference: ${annual_ebitda - 266517:,.2f} ({(annual_ebitda/266517 - 1)*100:+.1f}%)")
        
        # Let's see what the website might be doing differently
        print(f"\n🤔 POSSIBLE ISSUES:")
        print("-" * 40)
        
        # Check if we're including too much revenue
        if avg_monthly_revenue > 100000:  # If monthly revenue > $100k
            print("⚠️  Monthly revenue seems high - might be including non-revenue items")
        
        # Check if we're excluding too many expenses
        if avg_monthly_expenses < avg_monthly_revenue * 0.5:  # If expenses < 50% of revenue
            print("⚠️  Expenses seem low - might be missing expense categories")
        
        # Check EBITDA margin
        ebitda_margin = (avg_monthly_ebitda/avg_monthly_revenue)*100
        if ebitda_margin > 20:  # If EBITDA margin > 20%
            print("⚠️  EBITDA margin seems high - might be excluding too many expenses")
        elif ebitda_margin < 5:  # If EBITDA margin < 5%
            print("⚠️  EBITDA margin seems low - might be including too many expenses")
        
        # Let's try a different approach - what if we use the website's methodology?
        print(f"\n💡 ALTERNATIVE CALCULATIONS:")
        print("-" * 40)
        
        # What if we use the website's revenue and margin?
        website_monthly_revenue = 86806
        website_ebitda_margin = 25.6
        
        calculated_monthly_ebitda = website_monthly_revenue * (website_ebitda_margin / 100)
        calculated_annual_ebitda = calculated_monthly_ebitda * 12
        
        print(f"Using Website Revenue & Margin:")
        print(f"  Monthly Revenue: ${website_monthly_revenue:,.2f}")
        print(f"  EBITDA Margin: {website_ebitda_margin}%")
        print(f"  Monthly EBITDA: ${calculated_monthly_ebitda:,.2f}")
        print(f"  Annual EBITDA: ${calculated_annual_ebitda:,.2f}")
        
        # What if we use our revenue with website margin?
        our_revenue_website_margin = avg_monthly_revenue * (website_ebitda_margin / 100) * 12
        print(f"\nUsing Our Revenue with Website Margin:")
        print(f"  Our Monthly Revenue: ${avg_monthly_revenue:,.2f}")
        print(f"  Website EBITDA Margin: {website_ebitda_margin}%")
        print(f"  Annual EBITDA: ${our_revenue_website_margin:,.2f}")
        
        print(f"\n🔍 KEY INSIGHTS:")
        print("-" * 40)
        print("1. Our monthly EBITDA average is much higher than expected")
        print("2. We might be including revenue that shouldn't be counted")
        print("3. We might be excluding expenses that should be included")
        print("4. The website might be using a different calculation method")
        print("5. We might need to filter P&L data by location too!")
        print("6. P&L data includes ALL 4 locations, but we only want 2 for sale")
        
        # Save sanitized results to prevent JSON serialization issues
        results = {
            'monthly_ebitdas': monthly_ebitdas,
            'monthly_revenues': monthly_revenues,
            'monthly_expenses': monthly_expenses,
            'avg_monthly_ebitda': avg_monthly_ebitda,
            'avg_monthly_revenue': avg_monthly_revenue,
            'avg_monthly_expenses': avg_monthly_expenses,
            'annual_ebitda': annual_ebitda,
            'ebitda_margin': (avg_monthly_ebitda/avg_monthly_revenue)*100 if avg_monthly_revenue > 0 else 0
        }
        
        # Sanitize all results before saving
        sanitized_results = sanitize_for_json(results)
        
        # Save to file
        output_file = Path("data/final/ebitda_debug_results.json")
        output_file.parent.mkdir(exist_ok=True)
        with open(output_file, 'w') as f:
            json.dump(sanitized_results, f, indent=2)
        
        print(f"\n💾 Sanitized results saved to: {output_file}")

if __name__ == "__main__":
    debug_ebitda_calculation()
