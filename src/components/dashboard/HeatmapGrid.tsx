'use client';

import { HeatmapCell, RoleGapSummary } from '@/lib/types';

interface Props {
  heatmap: HeatmapCell[];
  roleGaps: RoleGapSummary[];
}

function gapColor(severity: 'critical' | 'moderate' | 'no_gap') {
  switch (severity) {
    case 'critical': return 'bg-red-100 border-red-200 text-red-700';
    case 'moderate': return 'bg-amber-100 border-amber-200 text-amber-700';
    case 'no_gap': return 'bg-emerald-100 border-emerald-200 text-emerald-700';
  }
}

export default function HeatmapGrid({ heatmap }: Props) {
  const roles = Array.from(new Set(heatmap.map(c => c.roleTitle)));
  const familyMap = new Map(heatmap.map(c => [c.familyId, { id: c.familyId, name: c.familyName, color: c.familyColor }]));
  const families = Array.from(familyMap.values());

  if (roles.length === 0) return null;

  function getCell(roleTitle: string, familyId: string): HeatmapCell | undefined {
    return heatmap.find(c => c.roleTitle === roleTitle && c.familyId === familyId);
  }

  return (
    <div className="panel rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-1">Skills Heatmap</h3>
      <p className="text-xs text-slate-400 mb-4">Average skill gap per role across each Skill Family (lower is better)</p>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider pb-3 pr-4">Role</th>
              {families.map(f => (
                <th key={f.id} className="text-center pb-3 px-2" style={{ minWidth: 100 }}>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: f.color }} />
                    <span className="text-xs font-semibold text-slate-600 leading-tight text-center">{f.name}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roles.map(roleTitle => (
              <tr key={roleTitle}>
                <td className="text-sm text-slate-700 py-2 pr-4 whitespace-nowrap">{roleTitle}</td>
                {families.map(f => {
                  const cell = getCell(roleTitle, f.id);
                  if (!cell) return <td key={f.id} className="p-1"><div className="w-full h-12 bg-gray-50 rounded border border-gray-200" /></td>;
                  return (
                    <td key={f.id} className="p-1">
                      <div
                        className={`w-full h-12 rounded border flex items-center justify-center text-xs font-bold ${gapColor(cell.severity)}`}
                        title={`${roleTitle} - ${cell.familyName}: Gap ${cell.avgGap.toFixed(1)}`}
                      >
                        {cell.avgGap.toFixed(1)}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-red-100 border border-red-200" /> Critical (&ge;2.0)</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-amber-100 border border-amber-200" /> Moderate (1.0-1.9)</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200" /> On Track (&lt;1.0)</div>
      </div>
    </div>
  );
}
