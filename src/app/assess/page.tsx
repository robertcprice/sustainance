'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';

interface Role {
  id: string;
  title: string;
  function: { name: string };
  skillRequirements: { id: string }[];
  assessments: { id: string; status: string }[];
}

export default function AssessPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  const loadRoles = useCallback(async () => {
    const res = await fetch('/api/roles');
    if (res.ok) setRoles(await res.json());
  }, []);

  useEffect(() => { loadRoles(); }, [loadRoles]);

  async function startAssessment(roleId: string) {
    setLoading(roleId);
    const res = await fetch('/api/assessments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roleId }),
    });
    if (res.ok) {
      const assessment = await res.json();
      router.push(`/assess/${assessment.id}`);
    }
    setLoading(null);
  }

  async function demoFill(roleId: string) {
    setLoading(roleId);
    const res = await fetch('/api/assessments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roleId }),
    });
    if (res.ok) {
      const assessment = await res.json();
      await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessmentId: assessment.id }),
      });
      loadRoles();
    }
    setLoading(null);
  }

  if (roles.length === 0) {
    return (
      <AppShell>
        <div className="max-w-3xl">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Assessments</h1>
          <div className="panel rounded-xl shadow-sm p-12 text-center mt-8">
            <p className="text-slate-400 text-lg mb-4">No roles created yet.</p>
            <a href="/roles" className="text-emerald-600 hover:text-emerald-500 font-medium">
              Create roles first &rarr;
            </a>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Assessments</h1>
        <p className="text-slate-500 mb-8">Assess green skills readiness for each role. Use Demo Fill for instant sample data.</p>

        <div className="space-y-4">
          {roles.map(role => {
            const completedAssessment = role.assessments.find(a => a.status === 'completed');
            const isLoading = loading === role.id;
            return (
              <div key={role.id} className="panel rounded-xl shadow-sm p-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{role.title}</h3>
                  <p className="text-sm text-slate-500">
                    {role.function.name} &middot; {role.skillRequirements.length} skills
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {completedAssessment ? (
                    <>
                      <span className="px-4 py-2 text-sm font-medium bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
                        Completed
                      </span>
                      <button
                        onClick={() => startAssessment(role.id)}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-medium text-emerald-700 border border-emerald-300 rounded-lg hover:bg-emerald-50 transition-colors disabled:opacity-50"
                      >
                        {isLoading ? 'Loading...' : 'Retake'}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => demoFill(role.id)}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-medium bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50"
                      >
                        {isLoading ? 'Loading...' : 'Demo Fill'}
                      </button>
                      <button
                        onClick={() => startAssessment(role.id)}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors disabled:opacity-50"
                      >
                        Start Assessment
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
