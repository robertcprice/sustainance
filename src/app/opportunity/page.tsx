'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { incentiveTypeBadge } from '@/lib/utils';
import { IncentiveMatch } from '@/lib/types';

interface OpportunityData {
  company: { name: string; industry: string; state: string; size: string };
  stats: {
    matchingPrograms: number;
    criticalGaps: number;
    moderateGaps: number;
    onTrack: number;
    totalEmployees: number;
    rolesAssessed: number;
  };
  programs: IncentiveMatch[];
}

const typeFilters = [
  { key: 'all', label: 'All' },
  { key: 'federal_tax_credit', label: 'Federal Tax Credit' },
  { key: 'federal_grant', label: 'Federal Grant' },
  { key: 'state_grant', label: 'State Grant' },
  { key: 'state_tax_credit', label: 'State Tax Credit' },
];

export default function OpportunityPage() {
  const router = useRouter();
  const [data, setData] = useState<OpportunityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    fetch('/api/opportunity')
      .then(async (res) => {
        if (res.status === 401) {
          router.push('/auth');
          return;
        }
        if (!res.ok) throw new Error('Failed to load opportunities');
        return res.json();
      })
      .then((d) => {
        if (d) setData(d);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [router]);

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-400">Loading opportunities...</div>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <div className="panel rounded-xl shadow-sm p-12 text-center">
          <p className="text-red-500">{error}</p>
        </div>
      </AppShell>
    );
  }

  if (!data || data.stats.rolesAssessed === 0) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto text-center py-16">
          <div className="w-20 h-20 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">No Assessment Data Yet</h1>
          <p className="text-slate-500 mb-8">
            Complete at least one role assessment to discover matching grants, tax credits, and incentive programs.
          </p>
          <a href="/assess" className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition-colors font-medium">
            Start Assessment
          </a>
        </div>
      </AppShell>
    );
  }

  const filtered = data.programs.filter((p) => {
    const matchesType = typeFilter === 'all' || p.type === typeFilter;
    const matchesSearch =
      search === '' ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.agency.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <AppShell>
      <div className="max-w-5xl">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Opportunity Finder</h1>
            <p className="text-slate-500 text-sm mt-1">
              Grants, tax credits, and incentive programs matched to your green skills gaps.
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
              <span>{data.company.industry}</span>
              <span>&middot;</span>
              <span>{data.company.state}</span>
              <span>&middot;</span>
              <span>{data.stats.totalEmployees} employees</span>
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="panel rounded-xl shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600">{data.stats.matchingPrograms}</div>
            <div className="text-xs text-slate-500 mt-1">Matching Programs</div>
          </div>
          <div className="panel rounded-xl shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{data.stats.criticalGaps}</div>
            <div className="text-xs text-slate-500 mt-1">Critical Gaps</div>
          </div>
          <div className="panel rounded-xl shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">{data.stats.moderateGaps}</div>
            <div className="text-xs text-slate-500 mt-1">Moderate Gaps</div>
          </div>
          <div className="panel rounded-xl shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600">{data.stats.onTrack}</div>
            <div className="text-xs text-slate-500 mt-1">Skills On Track</div>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="text"
              placeholder="Search programs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {typeFilters.map((f) => (
              <button
                key={f.key}
                onClick={() => setTypeFilter(f.key)}
                className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                  typeFilter === f.key
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Program Cards */}
        {filtered.length === 0 ? (
          <div className="panel rounded-xl shadow-sm p-12 text-center">
            <p className="text-slate-400 text-lg">
              {search || typeFilter !== 'all'
                ? 'No programs match your filters.'
                : 'No matching incentive programs found for your profile.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((program) => {
              const badge = incentiveTypeBadge(program.type);
              return (
                <div key={program.id} className="panel rounded-xl shadow-sm p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900 truncate">{program.name}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 mb-3">{program.agency}</p>
                      <p className="text-sm text-slate-700 mb-4">{program.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div>
                          <span className="text-slate-400">Est. Value: </span>
                          <span className="font-semibold text-emerald-600">{program.estimatedValue}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Deadline: </span>
                          <span className="text-slate-700">{program.deadlineInfo}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Match: </span>
                          <span className="text-slate-700">{program.matchReason}</span>
                        </div>
                      </div>
                    </div>
                    {program.url && (
                      <a
                        href={program.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                      >
                        Learn More
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
