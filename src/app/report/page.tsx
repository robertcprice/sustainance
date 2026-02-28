'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ReportData {
  company: {
    name: string;
    industry: string;
    size: string;
    state: string;
  };
  overallReadiness: number;
  totalRolesAssessed: number;
  totalCriticalGaps: number;
  totalModerateGaps: number;
  criticalGaps: {
    skillName: string;
    familyName: string;
    gap: number;
    requiredLevel: number;
    currentLevel: number;
  }[];
  roi: {
    costOfInactionLow: string;
    costOfInactionHigh: string;
    trainingInvestment: string;
    netRoiLow: string;
    netRoiHigh: string;
  };
  incentives: {
    name: string;
    type: string;
    estimatedValue: string;
    agency: string;
  }[];
  roleGaps: {
    roleTitle: string;
    functionName: string;
    readinessScore: number;
    riskScore: number;
  }[];
  generatedAt: string;
}

export default function ReportPage() {
  const router = useRouter();
  const [data, setData] = useState<ReportData | null>(null);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/export/executive-summary')
      .then(res => {
        if (res.status === 401) { router.push('/auth'); return null; }
        if (!res.ok) return res.json().then(d => { throw new Error(d.error || 'Failed to load report'); });
        return res.json();
      })
      .then(d => { if (d && d.company) setData(d); })
      .catch(e => setError(e.message));
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-8">
        <p className="text-red-600 font-medium mb-4">{error}</p>
        <a href="/dashboard" className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 font-medium">
          Back to Dashboard
        </a>
      </div>
    );
  }

  if (!data) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading report...</div>;
  }

  if (data.totalRolesAssessed === 0) {
    return (
      <div className="min-h-screen bg-white text-gray-900 p-8 flex flex-col items-center justify-center">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Assessment Data Yet</h2>
          <p className="text-gray-500 mb-6">
            Complete at least one role assessment to generate your Executive Summary report.
            You can also seed demo data from the dashboard.
          </p>
          <div className="flex gap-3 justify-center">
            <a href="/dashboard" className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 font-medium">
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 p-8 print:p-4">
      {/* Print Button */}
      <div className="no-print max-w-4xl mx-auto mb-6 flex gap-3">
        <button
          onClick={() => window.print()}
          className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 font-medium"
        >
          Print / Save PDF
        </button>
        <a
          href="/dashboard"
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
        >
          Back to Dashboard
        </a>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="border-b-2 border-emerald-600 pb-6 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <img src="/logo.svg" alt="Sustainance" className="w-8 h-8" />
            <span className="text-sm font-semibold text-emerald-700 uppercase tracking-wider">Sustainance</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Executive Summary: Green Skills Gap Analysis</h1>
          <p className="text-gray-500">
            {data.company.name} &middot; {data.company.industry} &middot; {data.company.size} &middot; {data.company.state}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Generated {new Date(data.generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Readiness Score */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Overall Readiness</h2>
          <div className="flex items-center gap-8">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={data.overallReadiness >= 60 ? '#10b981' : data.overallReadiness >= 30 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="3"
                  strokeDasharray={`${data.overallReadiness}, 100`}
                  strokeLinecap="round"
                />
                <text x="18" y="20.5" textAnchor="middle" className="text-[8px] font-bold fill-gray-900">
                  {data.overallReadiness}%
                </text>
              </svg>
            </div>
            <div>
              <p className="text-gray-600 mb-2">{data.totalRolesAssessed} roles assessed across the organization</p>
              <div className="flex gap-6 text-sm">
                <div><span className="font-bold text-red-600">{data.totalCriticalGaps}</span> critical gaps</div>
                <div><span className="font-bold text-amber-600">{data.totalModerateGaps}</span> moderate gaps</div>
              </div>
            </div>
          </div>
        </section>

        {/* Key Findings */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Key Findings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.roleGaps.map((rg, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900">{rg.roleTitle}</h3>
                <p className="text-sm text-gray-500">{rg.functionName}</p>
                <div className="flex justify-between mt-3 text-sm">
                  <span>Readiness: <strong className={rg.readinessScore >= 50 ? 'text-emerald-600' : 'text-red-600'}>{rg.readinessScore}%</strong></span>
                  <span>Risk Score: <strong className="text-gray-900">{rg.riskScore}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Top Critical Gaps */}
        {data.criticalGaps.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Top Critical Skill Gaps</h2>
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-gray-500 border-b border-gray-200">
                  <th className="text-left py-2">Skill</th>
                  <th className="text-left py-2">Family</th>
                  <th className="text-center py-2">Required</th>
                  <th className="text-center py-2">Current</th>
                  <th className="text-center py-2">Gap</th>
                </tr>
              </thead>
              <tbody>
                {data.criticalGaps.map((gap, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-2 font-medium">{gap.skillName}</td>
                    <td className="py-2 text-sm text-gray-500">{gap.familyName}</td>
                    <td className="py-2 text-center">{gap.requiredLevel}</td>
                    <td className="py-2 text-center">{gap.currentLevel}</td>
                    <td className="py-2 text-center font-bold text-red-600">{gap.gap}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* Financial Impact */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Financial Impact</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="border border-red-200 bg-red-50 rounded-lg p-4">
              <p className="text-xs uppercase text-red-600 font-semibold mb-1">Cost of Inaction</p>
              <p className="text-lg font-bold text-red-700">{data.roi.costOfInactionLow} - {data.roi.costOfInactionHigh}</p>
              <p className="text-xs text-red-500 mt-1">Annual risk exposure</p>
            </div>
            <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
              <p className="text-xs uppercase text-blue-600 font-semibold mb-1">Training Investment</p>
              <p className="text-lg font-bold text-blue-700">{data.roi.trainingInvestment}</p>
              <p className="text-xs text-blue-500 mt-1">Estimated total cost</p>
            </div>
            <div className="border border-emerald-200 bg-emerald-50 rounded-lg p-4">
              <p className="text-xs uppercase text-emerald-600 font-semibold mb-1">Net ROI</p>
              <p className="text-lg font-bold text-emerald-700">{data.roi.netRoiLow} - {data.roi.netRoiHigh}</p>
              <p className="text-xs text-emerald-500 mt-1">After training investment</p>
            </div>
          </div>
        </section>

        {/* Incentive Programs */}
        {data.incentives.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Matching Incentive Programs</h2>
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-gray-500 border-b border-gray-200">
                  <th className="text-left py-2">Program</th>
                  <th className="text-left py-2">Type</th>
                  <th className="text-left py-2">Est. Value</th>
                  <th className="text-left py-2">Agency</th>
                </tr>
              </thead>
              <tbody>
                {data.incentives.map((inc, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-2 font-medium text-sm">{inc.name}</td>
                    <td className="py-2 text-sm text-gray-500 capitalize">{inc.type.replace(/_/g, ' ')}</td>
                    <td className="py-2 text-sm text-emerald-700 font-semibold">{inc.estimatedValue}</td>
                    <td className="py-2 text-sm text-gray-500">{inc.agency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* Next Steps */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recommended Next Steps</h2>
          <div className="space-y-4">
            <div className="border-l-4 border-red-500 pl-4">
              <h3 className="font-semibold text-gray-900">30 Days: Address Critical Gaps</h3>
              <p className="text-sm text-gray-600">
                Prioritize training for the {data.totalCriticalGaps} critical skill gaps identified.
                Focus on skills with the highest risk impact scores across assessed roles.
              </p>
            </div>
            <div className="border-l-4 border-amber-500 pl-4">
              <h3 className="font-semibold text-gray-900">60 Days: Apply for Incentive Programs</h3>
              <p className="text-sm text-gray-600">
                Submit applications for {data.incentives.length} matching incentive programs.
                These can offset training costs and accelerate your green transition.
              </p>
            </div>
            <div className="border-l-4 border-emerald-500 pl-4">
              <h3 className="font-semibold text-gray-900">90 Days: Reassess and Expand</h3>
              <p className="text-sm text-gray-600">
                Re-run assessments to measure progress. Expand assessment coverage to additional roles
                and business functions. Track readiness score improvement.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-4 text-xs text-gray-400 text-center">
          Sustainance - Green Skills Gap Intelligence Platform &middot; Confidential
        </div>
      </div>
    </div>
  );
}
