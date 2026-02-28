'use client';

import { IncentiveMatch } from '@/lib/types';
import { incentiveTypeBadge } from '@/lib/utils';

interface Props {
  incentives: IncentiveMatch[];
}

export default function IncentivePanel({ incentives }: Props) {
  if (incentives.length === 0) {
    return (
      <div className="panel rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Incentive Programs</h3>
        <p className="text-slate-400">No matching incentive programs found.</p>
      </div>
    );
  }

  return (
    <div className="panel rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-2">Matching Incentive Programs</h3>
      <p className="text-sm text-slate-500 mb-6">
        {incentives.length} programs you may qualify for based on your industry, location, and skill gaps.
      </p>

      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
        {incentives.map((inc) => {
          const badge = incentiveTypeBadge(inc.type);
          return (
            <div key={inc.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h4 className="text-sm font-semibold text-slate-900 leading-snug">{inc.name}</h4>
                <span className={`px-2 py-0.5 text-xs rounded-full whitespace-nowrap ${badge.color}`}>
                  {badge.label}
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-3">{inc.description}</p>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="text-emerald-600 font-semibold">{inc.estimatedValue}</span>
                  <span className="text-slate-400">{inc.agency}</span>
                </div>
                <a
                  href={inc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 hover:text-emerald-500 font-medium"
                >
                  Learn more &rarr;
                </a>
              </div>
              <div className="mt-2 text-xs text-slate-400">
                {inc.matchReason} &middot; {inc.deadlineInfo}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
