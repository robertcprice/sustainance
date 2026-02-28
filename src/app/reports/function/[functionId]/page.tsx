'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';

interface Function {
  id: string;
  name: string;
  totalRoles: number;
  totalEmployees: number;
}

interface Role {
  roleId: string;
  roleTitle: string;
  department: string;
  readinessScore: number;
  riskScore: number;
  employeeCount: number;
}

interface SkillSummary {
  skillId: string;
  skillName: string;
  familyName: string;
  avgGap: number;
  avgRequired: number;
  avgCurrent: number;
  rolesAffected: number;
}

interface ReportData {
  function: Function;
  readiness: number;
  criticalGaps: number;
  moderateGaps: number;
  noGaps: number;
  roles: Role[];
  skillSummary: SkillSummary[];
  generatedAt: string;
}

export default function FunctionReportPage() {
  const params = useParams();
  const functionId = params.functionId as string;

  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReport() {
      try {
        const response = await fetch(`/api/reports/function/${functionId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch function report');
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
  }, [functionId]);

  const getRiskBadge = (riskScore: number) => {
    if (riskScore >= 70) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full border bg-red-100 text-red-800 border-red-200">High Risk</span>;
    } else if (riskScore >= 40) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full border bg-amber-100 text-amber-800 border-amber-200">Moderate Risk</span>;
    }
    return <span className="px-2 py-1 text-xs font-medium rounded-full border bg-emerald-100 text-emerald-800 border-emerald-200">Low Risk</span>;
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{data.function.name}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <div><span className="font-semibold">Total Roles:</span> {data.function.totalRoles}</div>
              <div><span className="font-semibold">Total Employees:</span> {data.function.totalEmployees}</div>
            </div>
          </div>

          <div className="flex items-center justify-center mb-8">
            <div className="text-center">
              <div className="text-6xl font-bold text-emerald-600 mb-2">
                {Math.round(data.readiness)}%
              </div>
              <div className="text-lg text-gray-600">Function Readiness</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">{data.function.totalEmployees}</div>
              <div className="text-sm text-gray-600">Total Employees</div>
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
              <div className="text-2xl font-bold text-emerald-600">{data.noGaps}</div>
              <div className="text-sm text-gray-600">On Track</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Role Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Role</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Department</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Employees</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Readiness</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Risk Level</th>
                </tr>
              </thead>
              <tbody>
                {[...data.roles]
                  .sort((a, b) => a.readinessScore - b.readinessScore)
                  .map((role) => (
                    <tr key={role.roleId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <Link
                          href={`/reports/role/${role.roleId}`}
                          className="font-medium text-emerald-600 hover:text-emerald-700"
                        >
                          {role.roleTitle}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{role.department}</td>
                      <td className="py-3 px-4 text-gray-600">{role.employeeCount}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 max-w-xs bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-emerald-600 h-2 rounded-full"
                              style={{ width: `${role.readinessScore}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {Math.round(role.readinessScore)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">{getRiskBadge(role.riskScore)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Cross-Role Skill Summary</h2>
          <div className="mb-4 text-sm text-gray-600">
            Average skill levels and gaps across all roles in this function
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Skill</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Family</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Avg Current</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Avg Required</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Avg Gap</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Roles Affected</th>
                </tr>
              </thead>
              <tbody>
                {[...data.skillSummary]
                  .sort((a, b) => b.avgGap - a.avgGap)
                  .map((skill) => (
                    <tr key={skill.skillId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{skill.skillName}</td>
                      <td className="py-3 px-4 text-gray-600">{skill.familyName}</td>
                      <td className="py-3 px-4 text-gray-600">{skill.avgCurrent.toFixed(1)}</td>
                      <td className="py-3 px-4 text-gray-600">{skill.avgRequired.toFixed(1)}</td>
                      <td className="py-3 px-4">
                        {skill.avgGap > 0 ? (
                          <span className="text-red-600 font-medium">{skill.avgGap.toFixed(1)} levels</span>
                        ) : (
                          <span className="text-emerald-600 font-medium">On track</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {skill.rolesAffected} / {data.function.totalRoles}
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
