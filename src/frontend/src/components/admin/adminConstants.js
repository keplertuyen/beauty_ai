export const LOW_STOCK_THRESHOLD = 10;

export const DEPARTMENTS = [
  'Skincare',
  'Makeup',
  'Fragrance',
  'Hair',
  'Bath & Body',
  'Tools & Brushes',
  'Mini Size',
  'Gifts',
  'Men',
];

export const formatStatusLabel = (status) => {
  const map = {
    Pending: 'Pending',
    Delivering: 'Delivering',
    Completed: 'Completed',
    Cancelled: 'Cancelled',
    New: 'New',
    InProgress: 'In Progress',
    Resolved: 'Resolved',
  };
  return map[status] || status || 'Unknown';
};

export const formatCompactUsd = (amount) => {
  const n = Number(amount || 0);
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 10_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
