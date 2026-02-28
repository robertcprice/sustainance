'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';

interface Department { id: string; name: string }
interface Role { id: string; title: string; function: { name: string } }
interface Employee { id: string; name: string; role: { title: string } }

export default function ReportsHub() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/departments').then(r => r.ok ? r.json() : []),
      fetch('/api/roles').then(r => r.ok ? r.json() : []),
      fetch('/api/employees').then(r => r.ok ? r.json() : { employees: [] }),
    ]).then(([depts, rls, emps]) => {
      setDepartments(depts);
      setRoles(rls);
      setEmployees(emps.employees || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64 text-slate-400">Loading...</div>
      </AppShell>
    );
  }

  // Get unique functions from roles
  const functionsMap = new Map<string, string>();
  for (const r of roles) {
    if (r.function?.name) {
      // We need the function ID — derive from the roles API data
      // The roles API includes functionId indirectly
      const funcId = (r as unknown as { functionId: string }).functionId;
      if (funcId) functionsMap.set(funcId, r.function.name);
    }
  }
  const functions = Array.from(functionsMap.entries()).map(([id, name]) => ({ id, name }));

  return (
    <AppShell>
      <div className="max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Report Generator</h1>
            <p className="text-slate-500 text-sm mt-1">
              Generate detailed reports by employee, department, role, or business function
            </p>
          </div>
          <a
            href="/report"
            className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition-colors font-medium"
          >
            Executive Summary
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Employee Reports */}
          <ReportCard
            title="Employee Report"
            description="Individual skill gaps, readiness, and training recommendations"
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            }
            items={employees.map(e => ({ id: e.id, label: e.name, sublabel: e.role?.title }))}
            onSelect={(id) => router.push(`/reports/employee/${id}`)}
            emptyText="No employees found"
          />

          {/* Department Reports */}
          <ReportCard
            title="Department Report"
            description="Aggregate gaps, role breakdown, and family distribution"
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
              </svg>
            }
            items={departments.map(d => ({ id: d.id, label: d.name }))}
            onSelect={(id) => router.push(`/reports/department/${id}`)}
            emptyText="No departments found"
          />

          {/* Role Reports */}
          <ReportCard
            title="Role Report"
            description="Detailed skill analysis with employee-level comparison"
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
              </svg>
            }
            items={roles.map(r => ({ id: r.id, label: r.title, sublabel: r.function?.name }))}
            onSelect={(id) => router.push(`/reports/role/${id}`)}
            emptyText="No roles found"
          />

          {/* Function Reports */}
          <ReportCard
            title="Function Report"
            description="Cross-role analysis for a business function area"
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
              </svg>
            }
            items={functions.map(f => ({ id: f.id, label: f.name }))}
            onSelect={(id) => router.push(`/reports/function/${id}`)}
            emptyText="No functions found"
          />
        </div>
      </div>
    </AppShell>
  );
}

function ReportCard({
  title, description, icon, items, onSelect, emptyText,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  items: { id: string; label: string; sublabel?: string }[];
  onSelect: (id: string) => void;
  emptyText: string;
}) {
  const [selected, setSelected] = useState('');

  return (
    <div className="panel rounded-xl shadow-sm p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
          {icon}
        </div>
        <div>
          <h2 className="font-semibold text-slate-900">{title}</h2>
          <p className="text-xs text-slate-400">{description}</p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-slate-400 py-4">{emptyText}</p>
      ) : (
        <>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full mt-3 px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="">Select...</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}{item.sublabel ? ` — ${item.sublabel}` : ''}
              </option>
            ))}
          </select>

          <button
            disabled={!selected}
            onClick={() => onSelect(selected)}
            className="w-full mt-3 px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-500 transition-colors disabled:bg-gray-200 disabled:text-gray-400"
          >
            Generate Report
          </button>
        </>
      )}
    </div>
  );
}
