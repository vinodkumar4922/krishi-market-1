/**
 * Utility functions for formatting currency, dates, and units
 */

export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
};

export const formatUnit = (unit) => {
  switch (unit) {
    case 'kg':
      return 'per kg';
    case 'g':
      return 'per 100g';
    case 'dozen':
      return 'per dozen';
    case 'bunch':
      return 'per bunch';
    case 'litre':
      return 'per litre';
    case 'packet':
      return 'per packet';
    default:
      return `/${unit}`;
  }
};
