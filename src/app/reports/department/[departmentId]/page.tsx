'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';

interface Department {
  id: string;
  name: string;
  totalEmployees: number;
  totalRoles: number;
  score: number;
}

interface Role {
  roleId: string;
  roleTitle: string;
  functionName: string;
  readinessScore: number;
  riskScore: number;
  employeeCount: number;
  criticalGaps: number;
}

interface CriticalGap {
  skillName: string;
  familyName: string;
  gap: number;
  requiredLevel: number;
  currentLevel: number;
}

interface FamilyDistribution {
  name: string;
  color: string;
  critical: number;
  moderate: number;
  no_gap: number;
}

interface ReportData {
  department: Department;
  readiness: number;
  criticalGaps: number;
  moderateGaps: number;
  noGaps: number;
  topCriticalGaps: CriticalGap[];
  roles: Role[];
  familyDistribution: FamilyDistribution[];
  generatedAt: string;
}

export default function DepartmentReportPage() {
  const params = useParams();
  const departmentId = params.departmentId as string;

  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReport() {
      try {
        const response = await fetch(`/api/reports/department/${departmentId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch department report');
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
  }, [departmentId]);

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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{data.department.name}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <div><span className="font-semibold">Total Employees:</span> {data.department.totalEmployees}</div>
              <div><span className="font-semibold">Total Roles:</span> {data.department.totalRoles}</div>
              <div><span className="font-semibold">Department Score:</span> {data.department.score}</div>
            </div>
          </div>

          <div className="flex items-center justify-center mb-8">
            <div className="text-center">
              <div className="text-6xl font-bold text-emerald-600 mb-2">
                {Math.round(data.readiness)}%
              </div>
              <div className="text-lg text-gray-600">Department Readiness</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Roles by Risk Level</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Role</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Function</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Employees</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Readiness</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Risk</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Critical Gaps</th>
                </tr>
              </thead>
              <tbody>
                {[...data.roles]
                  .sort((a, b) => b.riskScore - a.riskScore)
                  .map((role) => (
                    <tr key={role.roleId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{role.roleTitle}</td>
                      <td className="py-3 px-4 text-gray-600">{role.functionName}</td>
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
                      <td className="py-3 px-4 text-red-600 font-medium">{role.criticalGaps}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Top Critical Skill Gaps</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Skill</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Family</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Current</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Required</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Gap</th>
                </tr>
              </thead>
              <tbody>
                {data.topCriticalGaps.map((gap, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{gap.skillName}</td>
                    <td className="py-3 px-4 text-gray-600">{gap.familyName}</td>
                    <td className="py-3 px-4 text-gray-600">{gap.currentLevel}</td>
                    <td className="py-3 px-4 text-gray-600">{gap.requiredLevel}</td>
                    <td className="py-3 px-4 text-red-600 font-medium">{gap.gap} levels</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Skill Family Distribution</h2>
          <div className="space-y-4">
            {data.familyDistribution.map((family) => {
              const total = family.critical + family.moderate + family.no_gap;
              const criticalPct = (family.critical / total) * 100;
              const moderatePct = (family.moderate / total) * 100;
              const noGapPct = (family.no_gap / total) * 100;

              return (
                <div key={family.name} className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: family.color }}
                    />
                    <span className="font-medium text-gray-900">{family.name}</span>
                    <span className="text-sm text-gray-600">({total} skills)</span>
                  </div>
                  <div className="flex h-8 rounded-lg overflow-hidden border border-gray-200">
                    <div
                      className="bg-red-500 flex items-center justify-center text-white text-xs font-medium"
                      style={{ width: `${criticalPct}%` }}
                    >
                      {family.critical > 0 && `${family.critical}`}
                    </div>
                    <div
                      className="bg-amber-500 flex items-center justify-center text-white text-xs font-medium"
                      style={{ width: `${moderatePct}%` }}
                    >
                      {family.moderate > 0 && `${family.moderate}`}
                    </div>
                    <div
                      className="bg-emerald-500 flex items-center justify-center text-white text-xs font-medium"
                      style={{ width: `${noGapPct}%` }}
                    >
                      {family.no_gap > 0 && `${family.no_gap}`}
                    </div>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-600">
                    <span>Critical: {family.critical}</span>
                    <span>Moderate: {family.moderate}</span>
                    <span>On Track: {family.no_gap}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-sm text-gray-500 text-center">
          Report generated: {new Date(data.generatedAt).toLocaleString()}
        </div>
      </div>
    </AppShell>
  );
}
