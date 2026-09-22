/**
 * Clean Fintech Formatting Helpers
 * Strictly formats numbers with standard commas and two decimal places.
 * Default currency symbol is ₹ as requested in the final visual and UX direction.
 */

export const formatCurrency = (amount: number = 0, currencySymbol: string = '₹'): string => {
  const num = Number(amount) || 0;
  return `${currencySymbol}${num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatCompactCurrency = (amount: number = 0, currencySymbol: string = '₹'): string => {
  const num = Number(amount) || 0;
  return `${currencySymbol}${num.toLocaleString('en-IN', {
    maximumFractionDigits: 0,
  })}`;
};

export const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch (e) {
    return dateString;
  }
};
