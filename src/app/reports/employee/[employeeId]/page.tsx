'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';

interface Employee {
  id: string;
  name: string;
  department: string;
  role: string;
  function: string;
}

interface Skill {
  skillName: string;
  currentLevel: number;
  requiredLevel: number;
  gap: number;
  severity: 'critical' | 'moderate' | 'no_gap';
}

interface SkillFamily {
  familyName: string;
  familyColor: string;
  skills: Skill[];
}

interface Recommendation {
  skillName: string;
  familyName: string;
  gap: number;
  priority: number;
}

interface ReportData {
  employee: Employee;
  xpTotal: number;
  readiness: number;
  totalSkills: number;
  criticalGaps: number;
  moderateGaps: number;
  noGaps: number;
  skillFamilies: SkillFamily[];
  recommendations: Recommendation[];
  generatedAt: string;
}

export default function EmployeeReportPage() {
  const params = useParams();
  const employeeId = params.employeeId as string;

  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedFamilies, setExpandedFamilies] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchReport() {
      try {
        const response = await fetch(`/api/reports/employee/${employeeId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch employee report');
        }
        const reportData = await response.json();
        setData(reportData);
        setExpandedFamilies(new Set(reportData.skillFamilies.map((f: SkillFamily) => f.familyName)));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchReport();
  }, [employeeId]);

  const toggleFamily = (familyName: string) => {
    setExpandedFamilies(prev => {
      const next = new Set(prev);
      if (next.has(familyName)) {
        next.delete(familyName);
      } else {
        next.add(familyName);
      }
      return next;
    });
  };

  const getSeverityBadge = (severity: string) => {
    const classes = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      moderate: 'bg-amber-100 text-amber-800 border-amber-200',
      no_gap: 'bg-emerald-100 text-emerald-800 border-emerald-200'
    };
    const labels = {
      critical: 'Critical',
      moderate: 'Moderate',
      no_gap: 'On Track'
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${classes[severity as keyof typeof classes]}`}>
        {labels[severity as keyof typeof labels]}
      </span>
    );
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg text-gray-600">Loading report...</div>
        </div>
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg text-red-600">Error: {error || 'Report not found'}</div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 py-8 print:px-0">
        <div className="mb-6 flex items-center justify-between print:hidden">
          <Link href="/reports" className="text-emerald-600 hover:text-emerald-700 font-medium">
            ← Back to Reports
          </Link>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Print Report
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="border-b border-gray-200 pb-6 mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{data.employee.name}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <div><span className="font-semibold">Role:</span> {data.employee.role}</div>
              <div><span className="font-semibold">Department:</span> {data.employee.department}</div>
              <div><span className="font-semibold">Function:</span> {data.employee.function}</div>
            </div>
          </div>

          <div className="flex items-center justify-center mb-8">
            <div className="text-center">
              <div className="text-6xl font-bold text-emerald-600 mb-2">
                {Math.round(data.readiness)}%
              </div>
              <div className="text-lg text-gray-600">Green Skills Readiness</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">{data.xpTotal}</div>
              <div className="text-sm text-gray-600">Total XP</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-600">{data.criticalGaps}</div>
              <div className="text-sm text-gray-600">Critical Gaps</div>
            </div>
            <div className="bg-amber-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-amber-600">{data.moderateGaps}</div>
              <div className="text-sm text-gray-600">Moderate Gaps</div>
            </div>
            <div className="bg-emerald-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-emerald-600">{data.totalSkills}</div>
              <div className="text-sm text-gray-600">Total Skills</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Skills by Family</h2>
          <div className="space-y-4">
            {data.skillFamilies.map((family) => (
              <div key={family.familyName} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleFamily(family.familyName)}
                  className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: family.familyColor }}
                    />
                    <span className="font-semibold text-gray-900">{family.familyName}</span>
                    <span className="text-sm text-gray-600">({family.skills.length} skills)</span>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform ${
                      expandedFamilies.has(family.familyName) ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedFamilies.has(family.familyName) && (
                  <div className="px-6 py-4 space-y-4">
                    {family.skills.map((skill) => (
                      <div key={skill.skillName} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">{skill.skillName}</span>
                          {getSeverityBadge(skill.severity)}
                        </div>
                        <div className="relative">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-gray-600 w-20">Current:</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                              <div
                                className="bg-blue-500 h-full flex items-center justify-end px-2"
                                style={{ width: `${(skill.currentLevel / 5) * 100}%` }}
                              >
                                <span className="text-xs font-medium text-white">
                                  {skill.currentLevel}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600 w-20">Required:</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                              <div
                                className="bg-emerald-600 h-full flex items-center justify-end px-2"
                                style={{ width: `${(skill.requiredLevel / 5) * 100}%` }}
                              >
                                <span className="text-xs font-medium text-white">
                                  {skill.requiredLevel}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        {skill.gap > 0 && (
                          <div className="text-sm text-red-600">Gap: {skill.gap} levels</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Priority Recommendations</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Priority</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Skill</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Family</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Gap</th>
                </tr>
              </thead>
              <tbody>
                {data.recommendations.map((rec, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-sm">
                        {rec.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">{rec.skillName}</td>
                    <td className="py-3 px-4 text-gray-600">{rec.familyName}</td>
                    <td className="py-3 px-4 text-red-600 font-medium">{rec.gap} levels</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-sm text-gray-500 text-center">
          Report generated: {new Date(data.generatedAt).toLocaleString()}
        </div>
      </div>
    </AppShell>
  );
}
