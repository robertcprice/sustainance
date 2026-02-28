'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';

interface Role {
  id: string;
  title: string;
  function: string;
  department: string;
  totalEmployees: number;
}

interface Gap {
  skillId: string;
  skillName: string;
  familyName: string;
  familyColor: string;
  requiredLevel: number;
  currentLevel: number;
  gap: number;
  weight: number;
  severity: 'critical' | 'moderate' | 'no_gap';
}

interface EmployeeSkill {
  skillName: string;
  currentLevel: number;
  requiredLevel: number;
  gap: number;
  severity: 'critical' | 'moderate' | 'no_gap';
}

interface Employee {
  id: string;
  name: string;
  xp: number;
  readiness: number;
  criticalGaps: number;
  moderateGaps: number;
  skills: EmployeeSkill[];
}

interface ReportData {
  role: Role;
  readiness: number;
  riskScore: number;
  gaps: Gap[];
  employees: Employee[];
  generatedAt: string;
}

export default function RoleReportPage() {
  const params = useParams();
  const roleId = params.roleId as string;

  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReport() {
      try {
        const response = await fetch(`/api/reports/role/${roleId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch role report');
        }
        const reportData = await response.json();
        setData(reportData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchReport();
  }, [roleId]);

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

  const getRiskBadge = (riskScore: number) => {
    if (riskScore >= 70) {
      return <span className="px-3 py-1 text-sm font-medium rounded-full border bg-red-100 text-red-800 border-red-200">High Risk</span>;
    } else if (riskScore >= 40) {
      return <span className="px-3 py-1 text-sm font-medium rounded-full border bg-amber-100 text-amber-800 border-amber-200">Moderate Risk</span>;
    }
    return <span className="px-3 py-1 text-sm font-medium rounded-full border bg-emerald-100 text-emerald-800 border-emerald-200">Low Risk</span>;
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{data.role.title}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <div><span className="font-semibold">Function:</span> {data.role.function}</div>
              <div><span className="font-semibold">Department:</span> {data.role.department}</div>
              <div><span className="font-semibold">Total Employees:</span> {data.role.totalEmployees}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="text-center">
              <div className="text-6xl font-bold text-emerald-600 mb-2">
                {Math.round(data.readiness)}%
              </div>
              <div className="text-lg text-gray-600">Role Readiness</div>
            </div>
            <div className="text-center">
              <div className="mb-4">
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {Math.round(data.riskScore)}
                </div>
                <div className="text-lg text-gray-600">Risk Score</div>
              </div>
              <div>{getRiskBadge(data.riskScore)}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Skill Gap Analysis</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Skill</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Family</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Current</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Required</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Gap</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Weight</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Severity</th>
                </tr>
              </thead>
              <tbody>
                {[...data.gaps]
                  .sort((a, b) => {
                    if (a.severity === 'critical' && b.severity !== 'critical') return -1;
                    if (a.severity !== 'critical' && b.severity === 'critical') return 1;
                    if (a.severity === 'moderate' && b.severity === 'no_gap') return -1;
                    if (a.severity === 'no_gap' && b.severity === 'moderate') return 1;
                    return b.gap - a.gap;
                  })
                  .map((gap) => (
                    <tr key={gap.skillId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{gap.skillName}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: gap.familyColor }}
                          />
                          <span className="text-gray-600">{gap.familyName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{gap.currentLevel}</td>
                      <td className="py-3 px-4 text-gray-600">{gap.requiredLevel}</td>
                      <td className="py-3 px-4 text-red-600 font-medium">
                        {gap.gap > 0 ? `${gap.gap} levels` : '—'}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{gap.weight}</td>
                      <td className="py-3 px-4">{getSeverityBadge(gap.severity)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Employee Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Employee</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">XP</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Readiness</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Critical Gaps</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Moderate Gaps</th>
                </tr>
              </thead>
              <tbody>
                {[...data.employees]
                  .sort((a, b) => b.readiness - a.readiness)
                  .map((employee) => (
                    <tr key={employee.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <Link
                          href={`/reports/employee/${employee.id}`}
                          className="font-medium text-emerald-600 hover:text-emerald-700"
                        >
                          {employee.name}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{employee.xp}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 max-w-xs bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-emerald-600 h-2 rounded-full"
                              style={{ width: `${employee.readiness}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {Math.round(employee.readiness)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {employee.criticalGaps > 0 ? (
                          <span className="text-red-600 font-medium">{employee.criticalGaps}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {employee.moderateGaps > 0 ? (
                          <span className="text-amber-600 font-medium">{employee.moderateGaps}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
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
