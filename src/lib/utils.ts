export function formatCurrency(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}K`;
  }
  return `$${amount.toLocaleString()}`;
}

export function formatCurrencyFull(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function severityColor(severity: 'critical' | 'moderate' | 'no_gap'): string {
  switch (severity) {
    case 'critical':
      return 'text-red-600';
    case 'moderate':
      return 'text-amber-600';
    case 'no_gap':
      return 'text-emerald-600';
  }
}

export function severityBg(severity: 'critical' | 'moderate' | 'no_gap'): string {
  switch (severity) {
    case 'critical':
      return 'bg-red-50 border-red-200';
    case 'moderate':
      return 'bg-amber-50 border-amber-200';
    case 'no_gap':
      return 'bg-emerald-50 border-emerald-200';
  }
}

export function severityLabel(severity: 'critical' | 'moderate' | 'no_gap'): string {
  switch (severity) {
    case 'critical':
      return 'Critical Gap';
    case 'moderate':
      return 'Moderate Gap';
    case 'no_gap':
      return 'On Track';
  }
}

export function incentiveTypeBadge(type: string): { label: string; color: string } {
  switch (type) {
    case 'federal_tax_credit':
      return { label: 'Federal Tax Credit', color: 'bg-blue-100 text-blue-700' };
    case 'federal_grant':
      return { label: 'Federal Grant', color: 'bg-purple-100 text-purple-700' };
    case 'state_grant':
      return { label: 'State Grant', color: 'bg-emerald-100 text-emerald-700' };
    case 'state_tax_credit':
      return { label: 'State Tax Credit', color: 'bg-cyan-100 text-cyan-700' };
    default:
      return { label: type, color: 'bg-gray-100 text-gray-600' };
  }
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
