'use client';

import { useState, useEffect, useCallback } from 'react';
import AppShell from '@/components/layout/AppShell';

interface Department {
  id: string;
  name: string;
}

interface Role {
  id: string;
  title: string;
  function: { name: string };
}

interface Employee {
  id: string;
  name: string;
  department: Department;
  role: Role;
  xp: { xpTotal: number }[];
  assessments: { id: string }[];
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [roleId, setRoleId] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [loading, setLoading] = useState(false);

  const loadEmployees = useCallback(async () => {
    const url = filterDept
      ? `/api/employees?departmentId=${filterDept}`
      : '/api/employees';
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      setEmployees(data.employees || []);
    }
  }, [filterDept]);

  useEffect(() => {
    loadEmployees();
    fetch('/api/departments').then(r => r.json()).then(setDepartments);
    fetch('/api/roles').then(r => r.json()).then(setRoles);
  }, [loadEmployees]);

  async function createEmployee(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !departmentId || !roleId) return;
    setLoading(true);
    const res = await fetch('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), departmentId, roleId }),
    });
    if (res.ok) {
      setName('');
      setDepartmentId('');
      setRoleId('');
      loadEmployees();
    }
    setLoading(false);
  }

  async function deactivateEmployee(id: string) {
    await fetch(`/api/employees?id=${id}`, { method: 'DELETE' });
    loadEmployees();
  }

  return (
    <AppShell>
      <div className="max-w-5xl">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Employees</h1>
        <p className="text-slate-500 mb-8">Add employees, assign them to departments and roles, and track their green skill progress.</p>

        {/* Create Employee Form */}
        <form onSubmit={createEmployee} className="panel rounded-xl shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Employee name"
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
              <select
                value={departmentId}
                onChange={e => setDepartmentId(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="">Select department...</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
              <select
                value={roleId}
                onChange={e => setRoleId(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="">Select role...</option>
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.title} ({r.function.name})</option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={!name.trim() || !departmentId || !roleId || loading}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-medium rounded-xl transition-colors"
          >
            {loading ? 'Adding...' : 'Add Employee'}
          </button>
        </form>

        {/* Filter */}
        <div className="mb-6 flex items-center gap-3">
          <span className="text-sm text-slate-500">Filter by department:</span>
          <select
            value={filterDept}
            onChange={e => setFilterDept(e.target.value)}
            className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <span className="text-sm text-slate-400">{employees.length} employee{employees.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Employees List */}
        {employees.length === 0 ? (
          <div className="panel rounded-xl shadow-sm p-12 text-center">
            <p className="text-slate-400 text-lg">
              {departments.length === 0
                ? 'Create departments first, then add employees.'
                : roles.length === 0
                  ? 'Create roles first, then add employees.'
                  : 'No employees yet. Add your first employee above.'}
            </p>
          </div>
        ) : (
          <div className="panel rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Department</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">XP</th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Assessed</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {employees.map(emp => (
                  <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{emp.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{emp.department.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{emp.role.title}</td>
                    <td className="px-6 py-4 text-sm text-center">
                      <span className="px-2.5 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                        {emp.xp[0]?.xpTotal || 0} XP
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      {emp.assessments.length > 0 ? (
                        <span className="text-emerald-600">Yes</span>
                      ) : (
                        <span className="text-slate-400">No</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      <button
                        onClick={() => deactivateEmployee(emp.id)}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
