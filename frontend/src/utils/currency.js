// Sri Lankan Rupee formatter
// Usage: formatLKR(1500) → "Rs. 1,500.00"

export const formatLKR = (value) =>
  `Rs. ${Number(value || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
