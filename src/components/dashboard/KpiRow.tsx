'use client';

import { DashboardPayload } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

interface Props {
  data: DashboardPayload;
}

export default function KpiRow({ data }: Props) {
  const kpis = [
    {
      label: 'Overall Readiness',
      value: `${data.overallReadiness}%`,
      color: data.overallReadiness >= 60 ? 'text-emerald-600' : data.overallReadiness >= 30 ? 'text-amber-600' : 'text-red-600',
      bg: data.overallReadiness >= 60 ? 'bg-emerald-50 border-emerald-200' : data.overallReadiness >= 30 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200',
      sub: `${data.totalRolesAssessed} roles assessed`,
    },
    {
      label: 'Critical Gaps',
      value: data.totalCriticalGaps.toString(),
      color: 'text-red-600',
      bg: 'bg-red-50 border-red-200',
      sub: 'Require immediate attention',
    },
    {
      label: 'Moderate Gaps',
      value: data.totalModerateGaps.toString(),
      color: 'text-amber-600',
      bg: 'bg-amber-50 border-amber-200',
      sub: 'Development needed',
    },
    {
      label: 'On Track',
      value: data.totalNoGap.toString(),
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 border-emerald-200',
      sub: 'Meeting requirements',
    },
    {
      label: 'Cost of Inaction',
      value: `${formatCurrency(data.roi.costOfInactionLow)}-${formatCurrency(data.roi.costOfInactionHigh)}`,
      color: 'text-red-600',
      bg: 'border-gray-200',
      sub: 'Annual risk exposure',
    },
    {
      label: 'Incentives Matched',
      value: data.incentives.length.toString(),
      color: 'text-purple-600',
      bg: 'bg-purple-50 border-purple-200',
      sub: 'Programs you qualify for',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      {kpis.map((kpi) => (
        <div key={kpi.label} className={`rounded-xl p-4 border shadow-sm ${kpi.bg}`}>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">{kpi.label}</p>
          <p className={`text-2xl font-bold ${kpi.color} font-[family-name:var(--font-plex-mono)]`}>
            {kpi.value}
          </p>
          <p className="text-xs text-slate-400 mt-1">{kpi.sub}</p>
        </div>
      ))}
    </div>
  );
}
