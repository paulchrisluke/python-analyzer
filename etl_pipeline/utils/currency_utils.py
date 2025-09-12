"""
Currency utility functions for consistent handling of monetary values.
"""

from decimal import Decimal, ROUND_HALF_UP
from typing import Union


def round_currency(value: Union[float, int, str, Decimal]) -> float:
    """
    Round a currency value to 2 decimal places to eliminate binary-float artifacts.
    
    This function uses Decimal arithmetic to ensure precise rounding and avoid
    floating-point precision issues that can occur with standard float operations.
    
    Args:
        value: The currency value to round. Can be float, int, string, or Decimal.
        
    Returns:
        float: The value rounded to 2 decimal places using banker's rounding.
        
    Examples:
        >>> round_currency(2331332.5749999993)
        2331332.57
        >>> round_currency(932533.0299999996)
        932533.03
        >>> round_currency(77711.0858333333)
        77711.09
    """
    if value is None:
        return 0.0
    
    # Convert to Decimal for precise arithmetic
    if isinstance(value, Decimal):
        decimal_value = value
    else:
        decimal_value = Decimal(str(value))
    
    # Round to 2 decimal places using ROUND_HALF_UP (standard rounding)
    rounded_value = decimal_value.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    return float(rounded_value)


def safe_currency_division(numerator: Union[float, int, str, Decimal], 
                          denominator: Union[float, int, str, Decimal]) -> float:
    """
    Perform safe division for currency calculations with proper rounding.
    
    Args:
        numerator: The numerator value
        denominator: The denominator value
        
    Returns:
        float: The result rounded to 2 decimal places, or 0.0 if denominator is 0
        
    Examples:
        >>> safe_currency_division(2331332.57, 30)
        77711.09
        >>> safe_currency_division(100, 0)
        0.0
    """
    if denominator == 0 or denominator is None:
        return 0.0
    
    # Convert to Decimal for precise arithmetic
    num_decimal = Decimal(str(numerator))
    den_decimal = Decimal(str(denominator))
    
    # Perform division and round to 2 decimal places
    result = num_decimal / den_decimal
    return round_currency(result)


def safe_currency_multiplication(value: Union[float, int, str, Decimal], 
                                multiplier: Union[float, int, str, Decimal]) -> float:
    """
    Perform safe multiplication for currency calculations with proper rounding.
    
    Args:
        value: The base value
        multiplier: The multiplier
        
    Returns:
        float: The result rounded to 2 decimal places
        
    Examples:
        >>> safe_currency_multiplication(77711.09, 12)
        932533.08
        >>> safe_currency_multiplication(77711.09, 30)
        2331332.70
    """
    if value is None or multiplier is None:
        return 0.0
    
    # Convert to Decimal for precise arithmetic
    value_decimal = Decimal(str(value))
    multiplier_decimal = Decimal(str(multiplier))
    
    # Perform multiplication and round to 2 decimal places
    result = value_decimal * multiplier_decimal
    return round_currency(result)


def format_currency(value: Union[float, int, str, Decimal], currency: str = "USD") -> str:
    """
    Format a currency value for display.
    
    Args:
        value: The currency value
        currency: The currency code (default: "USD")
        
    Returns:
        str: Formatted currency string
        
    Examples:
        >>> format_currency(2331332.57)
        "$2,331,332.57"
        >>> format_currency(77711.09)
        "$77,711.09"
    """
    rounded_value = round_currency(value)
    
    if currency == "USD":
        return f"${rounded_value:,.2f}"
    else:
        return f"{rounded_value:,.2f} {currency}"
