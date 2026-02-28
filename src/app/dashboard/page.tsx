'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import KpiRow from '@/components/dashboard/KpiRow';
import GapDistributionChart from '@/components/dashboard/GapDistributionChart';
import HeatmapGrid from '@/components/dashboard/HeatmapGrid';
import HighRiskTable from '@/components/dashboard/HighRiskTable';
import RoiPanel from '@/components/dashboard/RoiPanel';
import IncentivePanel from '@/components/dashboard/IncentivePanel';
import { DashboardPayload } from '@/lib/types';

interface EmployeePick { id: string; name: string; department: string }
interface DeptPick { id: string; name: string }

function ExportDropdown() {
  const [open, setOpen] = useState(false);
  const [showEmployeePicker, setShowEmployeePicker] = useState<'xlsx' | 'csv' | null>(null);
  const [showDeptPicker, setShowDeptPicker] = useState<'xlsx' | 'csv' | null>(null);
  const [employees, setEmployees] = useState<EmployeePick[]>([]);
  const [departments, setDepartments] = useState<DeptPick[]>([]);
  const [loadingPicker, setLoadingPicker] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setShowEmployeePicker(null);
        setShowDeptPicker(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function openEmployeePicker(fmt: 'xlsx' | 'csv') {
    setShowDeptPicker(null);
    setShowEmployeePicker(fmt);
    setOpen(false);
    if (employees.length === 0) {
      setLoadingPicker(true);
      const res = await fetch('/api/employees');
      if (res.ok) {
        const data = await res.json();
        setEmployees((data.employees || data || []).map((e: { id: string; name: string; department?: { name: string } }) => ({
          id: e.id,
          name: e.name,
          department: e.department?.name || '',
        })));
      }
      setLoadingPicker(false);
    }
  }

  async function openDeptPicker(fmt: 'xlsx' | 'csv') {
    setShowEmployeePicker(null);
    setShowDeptPicker(fmt);
    setOpen(false);
    if (departments.length === 0) {
      setLoadingPicker(true);
      const res = await fetch('/api/departments');
      if (res.ok) {
        const data = await res.json();
        setDepartments((data.departments || data || []).map((d: { id: string; name: string }) => ({
          id: d.id,
          name: d.name,
        })));
      }
      setLoadingPicker(false);
    }
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => { setOpen(!open); setShowEmployeePicker(null); setShowDeptPicker(null); }}
        className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-300 text-slate-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
        Export
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-60 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1">
          <div className="px-4 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Employee Scorecard</div>
          <button onClick={() => openEmployeePicker('xlsx')}
            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors">
            Download .xlsx
          </button>
          <button onClick={() => openEmployeePicker('csv')}
            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors">
            Download .csv
          </button>
          <div className="border-t border-gray-100 my-1" />
          <div className="px-4 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Department Summary</div>
          <button onClick={() => openDeptPicker('xlsx')}
            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors">
            Download .xlsx
          </button>
          <button onClick={() => openDeptPicker('csv')}
            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors">
            Download .csv
          </button>
          <div className="border-t border-gray-100 my-1" />
          <div className="px-4 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Full Company Report</div>
          <a href="/api/export/company-report"
            className="block px-4 py-2 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors">
            Download .xlsx
          </a>
          <a href="/api/export/company-report?format=csv"
            className="block px-4 py-2 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors">
            Download .csv
          </a>
          <div className="border-t border-gray-100 my-1" />
          <a href="/api/export/csv"
            className="block px-4 py-2.5 text-sm text-slate-500 hover:bg-gray-50 hover:text-slate-700 transition-colors">
            Raw Gap Data (.csv)
          </a>
        </div>
      )}

      {showEmployeePicker && (
        <div className="absolute right-0 top-full mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-2 max-h-80 overflow-y-auto">
          <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Select Employee ({showEmployeePicker === 'csv' ? '.csv' : '.xlsx'})
          </div>
          {loadingPicker ? (
            <div className="px-4 py-3 text-sm text-slate-400">Loading...</div>
          ) : employees.length === 0 ? (
            <div className="px-4 py-3 text-sm text-slate-400">No employees found</div>
          ) : employees.map(emp => (
            <a key={emp.id} href={`/api/export/employee-scorecard?employeeId=${emp.id}&format=${showEmployeePicker}`}
              onClick={() => setShowEmployeePicker(null)}
              className="block px-4 py-2 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors">
              <span className="font-medium">{emp.name}</span>
              {emp.department && <span className="text-slate-400 ml-2">{emp.department}</span>}
            </a>
          ))}
        </div>
      )}

      {showDeptPicker && (
        <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-2">
          <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Select Department ({showDeptPicker === 'csv' ? '.csv' : '.xlsx'})
          </div>
          <a href={`/api/export/department-summary?format=${showDeptPicker}`} onClick={() => setShowDeptPicker(null)}
            className="block px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 transition-colors">
            All Departments
          </a>
          {loadingPicker ? (
            <div className="px-4 py-3 text-sm text-slate-400">Loading...</div>
          ) : departments.map(dept => (
            <a key={dept.id} href={`/api/export/department-summary?departmentId=${dept.id}&format=${showDeptPicker}`}
              onClick={() => setShowDeptPicker(null)}
              className="block px-4 py-2 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors">
              {dept.name}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(async (res) => {
        if (res.status === 401) {
          router.push('/auth');
          return;
        }
        if (!res.ok) throw new Error('Failed to load dashboard');
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
          <div className="text-slate-400">Loading dashboard...</div>
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

  if (!data || data.totalRolesAssessed === 0) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto text-center py-16">
          <div className="w-20 h-20 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">No Assessment Data Yet</h1>
          <p className="text-slate-500 mb-8">
            Complete at least one role assessment to see your green skills gap intelligence dashboard.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={async () => {
                setSeeding(true);
                try {
                  const res = await fetch('/api/dev/seed-demo', { method: 'POST' });
                  if (res.ok) window.location.reload();
                } finally {
                  setSeeding(false);
                }
              }}
              disabled={seeding}
              className="px-6 py-3 bg-amber-50 border border-amber-300 text-amber-700 rounded-xl hover:bg-amber-100 transition-colors font-medium disabled:opacity-50"
            >
              {seeding ? 'Seeding...' : 'Load Demo Data'}
            </button>
            <a href="/roles" className="px-6 py-3 bg-white border border-gray-300 text-slate-700 rounded-xl hover:bg-gray-50 transition-colors font-medium">
              Create Roles
            </a>
            <a href="/assess" className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition-colors font-medium">
              Start Assessment
            </a>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{data.company.name} — Green Skills Intelligence</h1>
            <p className="text-slate-500 text-sm mt-1">
              {data.company.industry} &middot; {data.company.size} &middot; {data.company.state}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={async () => {
                setSeeding(true);
                try {
                  const res = await fetch('/api/dev/seed-demo', { method: 'POST' });
                  if (res.ok) window.location.reload();
                } finally {
                  setSeeding(false);
                }
              }}
              disabled={seeding}
              className="px-4 py-2 text-sm bg-amber-50 border border-amber-300 text-amber-700 rounded-xl hover:bg-amber-100 transition-colors font-medium disabled:opacity-50"
            >
              {seeding ? 'Seeding...' : 'Demo Data'}
            </button>
            <ExportDropdown />
            <a
              href="/report"
              className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition-colors font-medium"
            >
              Executive Report
            </a>
          </div>
        </div>

        <KpiRow data={data} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <GapDistributionChart data={data.gapDistribution} />
          <HeatmapGrid heatmap={data.heatmap} roleGaps={data.roleGaps} />
        </div>

        <HighRiskTable roleGaps={data.roleGaps} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <RoiPanel roi={data.roi} />
          <IncentivePanel incentives={data.incentives} />
        </div>
      </div>
    </AppShell>
  );
}
