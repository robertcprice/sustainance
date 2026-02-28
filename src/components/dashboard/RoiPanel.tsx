'use client';

import { RoiEstimate } from '@/lib/types';
import { formatCurrencyFull } from '@/lib/utils';

interface Props {
  roi: RoiEstimate;
}

export default function RoiPanel({ roi }: Props) {
  return (
    <div className="panel rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-6">Financial Impact Analysis</h3>

      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-200">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Cost of Inaction (Annual)</p>
            <p className="text-sm text-slate-500 mt-0.5">Risk exposure from unaddressed gaps</p>
          </div>
          <p className="text-xl font-bold text-red-600 font-[family-name:var(--font-plex-mono)]">
            {formatCurrencyFull(roi.costOfInactionLow)} - {formatCurrencyFull(roi.costOfInactionHigh)}
          </p>
        </div>

        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Training Investment</p>
            <p className="text-sm text-slate-500 mt-0.5">Estimated cost to close all gaps</p>
          </div>
          <p className="text-xl font-bold text-blue-600 font-[family-name:var(--font-plex-mono)]">
            {formatCurrencyFull(roi.trainingInvestment)}
          </p>
        </div>

        <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl border border-emerald-200">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Net ROI Range</p>
            <p className="text-sm text-slate-500 mt-0.5">Value recovered after training</p>
          </div>
          <p className="text-xl font-bold text-emerald-600 font-[family-name:var(--font-plex-mono)]">
            {formatCurrencyFull(roi.netRoiLow)} - {formatCurrencyFull(roi.netRoiHigh)}
          </p>
        </div>
      </div>

      <h4 className="text-sm font-medium text-slate-500 mb-3">Risk Breakdown</h4>
      <div className="space-y-2">
        {roi.riskBreakdown.map((risk, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-xs rounded bg-gray-100 text-slate-600 capitalize">
                {risk.riskType.replace('_', ' ')}
              </span>
              <span className="text-slate-400 text-xs max-w-[200px] truncate">{risk.description}</span>
            </div>
            <span className="text-slate-700 font-[family-name:var(--font-plex-mono)] text-xs">
              {formatCurrencyFull(risk.costLow)}-{formatCurrencyFull(risk.costHigh)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
