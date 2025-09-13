/**
 * Utility functions for formatting data
 */

/**
 * Formats a number as USD currency with no decimal places
 * @param amount - The number to format as currency (can be undefined or null)
 * @returns Formatted currency string (e.g., "$1,000")
 */
export const formatCurrency = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null) {
    return '$0'
  }
  
  // Stricter numeric validation - check for non-finite numbers
  if (typeof amount !== 'number' || !isFinite(amount)) {
    return '$0'
  }
  
  // Normalize -0 to 0
  const normalizedAmount = amount === 0 ? 0 : amount
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(normalizedAmount)
};
