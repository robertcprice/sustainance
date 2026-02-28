'use client';

import { useState, useEffect, useCallback } from 'react';
import AppShell from '@/components/layout/AppShell';

interface Department {
  id: string;
  name: string;
  employees: { id: string }[];
  roles: { id: string; title: string; function: { name: string } }[];
  scores: { score: number }[];
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const loadDepartments = useCallback(async () => {
    const res = await fetch('/api/departments');
    if (res.ok) setDepartments(await res.json());
  }, []);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  async function createDepartment(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    const res = await fetch('/api/departments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    });
    if (res.ok) {
      setName('');
      loadDepartments();
    }
    setLoading(false);
  }

  return (
    <AppShell>
      <div className="max-w-5xl">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Departments</h1>
        <p className="text-slate-500 mb-8">Organize your company into departments to track green skills by team.</p>

        {/* Create Department Form */}
        <form onSubmit={createDepartment} className="panel rounded-xl shadow-sm p-6 mb-8 flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Department Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Operations, Engineering, Marketing"
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <button
            type="submit"
            disabled={!name.trim() || loading}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-medium rounded-xl transition-colors whitespace-nowrap"
          >
            {loading ? 'Creating...' : 'Add Department'}
          </button>
        </form>

        {/* Departments List */}
        {departments.length === 0 ? (
          <div className="panel rounded-xl shadow-sm p-12 text-center">
            <p className="text-slate-400 text-lg">No departments yet. Create your first department above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {departments.map(dept => (
              <div key={dept.id} className="panel rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">{dept.name}</h3>
                  <span className="px-3 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                    {dept.scores[0]?.score || 0} XP
                  </span>
                </div>

                <div className="flex items-center gap-6 text-sm text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                    {dept.employees.length} employee{dept.employees.length !== 1 ? 's' : ''}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                    {dept.roles.length} role{dept.roles.length !== 1 ? 's' : ''}
                  </div>
                </div>

                {dept.roles.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {dept.roles.map(role => (
                      <span key={role.id} className="px-2.5 py-1 text-xs rounded-md bg-gray-50 text-slate-600 border border-gray-200">
                        {role.title}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
