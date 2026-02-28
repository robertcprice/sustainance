'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import GapDistributionChart from '@/components/dashboard/GapDistributionChart';
import HeatmapGrid from '@/components/dashboard/HeatmapGrid';
import HighRiskTable from '@/components/dashboard/HighRiskTable';
import { DashboardPayload } from '@/lib/types';

type ExplorePayload = Omit<DashboardPayload, 'roi' | 'incentives'> & {
  company: DashboardPayload['company'] & { description: string | null };
};

export default function ExploreCompanyPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const [data, setData] = useState<ExplorePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/explore/${companyId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Company not found');
        return res.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [companyId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">Loading company profile...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500 mb-4">{error || 'Company not found'}</p>
        <Link href="/explore" className="text-emerald-600 hover:text-emerald-500 font-medium">
          Back to Explore
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl">
      <Link
        href="/explore"
        className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Back to Explore
      </Link>

      {/* Company Header */}
      <div className="panel rounded-xl p-8 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">{data.company.name}</h1>
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span className="px-3 py-1 text-sm font-medium bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                {data.company.industry}
              </span>
              <span className="px-3 py-1 text-sm font-medium bg-gray-50 text-gray-600 rounded-full border border-gray-200">
                {data.company.size}
              </span>
              <span className="text-sm text-slate-400">{data.company.state}</span>
            </div>
            {data.company.description && (
              <p className="text-slate-500 max-w-2xl">{data.company.description}</p>
            )}
          </div>
          {/* Readiness KPI */}
          <div className="text-center flex-shrink-0 ml-8">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={data.overallReadiness >= 50 ? '#059669' : data.overallReadiness >= 25 ? '#d97706' : '#dc2626'}
                  strokeWidth="3"
                  strokeDasharray={`${data.overallReadiness}, 100`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-slate-900">{data.overallReadiness}%</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2">Green Readiness</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
          <div>
            <p className="text-2xl font-bold text-slate-900">{data.totalRolesAssessed}</p>
            <p className="text-xs text-slate-400">Roles Assessed</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600">{data.totalCriticalGaps}</p>
            <p className="text-xs text-slate-400">Critical Gaps</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-600">{data.totalModerateGaps}</p>
            <p className="text-xs text-slate-400">Moderate Gaps</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-600">{data.totalNoGap}</p>
            <p className="text-xs text-slate-400">On Track</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <GapDistributionChart data={data.gapDistribution} />
        <HeatmapGrid heatmap={data.heatmap} roleGaps={data.roleGaps} />
      </div>

      <HighRiskTable roleGaps={data.roleGaps} />
    </div>
  );
}
