'use client';

import { RoleGapSummary } from '@/lib/types';
import { severityColor, severityLabel } from '@/lib/utils';

interface Props {
  roleGaps: RoleGapSummary[];
}

export default function HighRiskTable({ roleGaps }: Props) {
  const allGaps = roleGaps.flatMap(rg =>
    rg.gaps
      .filter(g => g.severity !== 'no_gap')
      .map(g => ({
        ...g,
        roleTitle: rg.roleTitle,
        functionName: rg.functionName,
        riskImpact: g.gap * g.weight,
      }))
  ).sort((a, b) => b.riskImpact - a.riskImpact);

  if (allGaps.length === 0) return null;

  return (
    <div className="panel rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">
        Highest Risk Skill Gaps
        <span className="text-sm font-normal text-slate-400 ml-2">
          (sorted by risk impact = gap x weight)
        </span>
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-slate-500 uppercase tracking-wider">
              <th className="text-left pb-3">Skill</th>
              <th className="text-left pb-3">Family</th>
              <th className="text-left pb-3">Role</th>
              <th className="text-center pb-3">Required</th>
              <th className="text-center pb-3">Current</th>
              <th className="text-center pb-3">Gap</th>
              <th className="text-center pb-3">Weight</th>
              <th className="text-center pb-3">Risk</th>
              <th className="text-left pb-3">Severity</th>
            </tr>
          </thead>
          <tbody>
            {allGaps.slice(0, 15).map((gap, i) => (
              <tr key={i} className="border-t border-gray-100">
                <td className="py-3 text-sm text-slate-900 font-medium">{gap.skillName}</td>
                <td className="py-3">
                  <span
                    className="text-xs px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: gap.familyColor + '15',
                      color: gap.familyColor,
                    }}
                  >
                    {gap.familyName.split(' ')[0]}
                  </span>
                </td>
                <td className="py-3 text-sm text-slate-500">{gap.roleTitle}</td>
                <td className="py-3 text-sm text-center text-slate-700 font-[family-name:var(--font-plex-mono)]">{gap.requiredLevel}</td>
                <td className="py-3 text-sm text-center text-slate-700 font-[family-name:var(--font-plex-mono)]">{gap.currentLevel}</td>
                <td className="py-3 text-sm text-center font-bold font-[family-name:var(--font-plex-mono)]">
                  <span className={severityColor(gap.severity)}>{gap.gap}</span>
                </td>
                <td className="py-3 text-sm text-center text-slate-700 font-[family-name:var(--font-plex-mono)]">{gap.weight}</td>
                <td className="py-3 text-sm text-center font-bold font-[family-name:var(--font-plex-mono)]">
                  <span className={severityColor(gap.severity)}>{gap.riskImpact}</span>
                </td>
                <td className="py-3">
                  <span className={`text-xs font-medium ${severityColor(gap.severity)}`}>
                    {severityLabel(gap.severity)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
