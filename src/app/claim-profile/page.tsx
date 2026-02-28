'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface UnclaimedEmployee {
  id: string;
  name: string;
  department: { name: string };
  role: { title: string };
}

export default function ClaimProfilePage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<UnclaimedEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/employee/unclaimed')
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        setEmployees(data.employees || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load employees');
        setLoading(false);
      });
  }, []);

  async function handleClaim(employeeId: string) {
    setClaiming(employeeId);
    setError('');

    const res = await fetch('/api/employee/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId }),
    });

    if (res.ok) {
      router.push('/dashboard/employee/profile');
    } else {
      const data = await res.json();
      setError(data.error || 'Failed to claim profile');
      setClaiming(null);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-emerald-50 via-white to-green-50">
      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
          <div className="mx-auto mb-4">
            <img src="/logo.svg" alt="Sustainance" className="w-16 h-16 mx-auto" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Claim Your Profile</h1>
          <p className="text-slate-500">
            Select your name from the employee list to link your account
          </p>
        </div>

        <div className="panel rounded-2xl shadow-sm p-8">
          {loading ? (
            <div className="text-center py-8 text-slate-400">Loading employees...</div>
          ) : employees.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 mb-4">
                No unclaimed employee profiles found. Your manager may need to add you to the roster first.
              </p>
              <button
                onClick={() => router.push('/dashboard/employee/profile')}
                className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition-colors font-medium"
              >
                Continue to Dashboard
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {employees.map(emp => (
                <button
                  key={emp.id}
                  onClick={() => handleClaim(emp.id)}
                  disabled={claiming !== null}
                  className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all disabled:opacity-50 group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900 group-hover:text-emerald-700">
                        {emp.name}
                      </p>
                      <p className="text-sm text-slate-500">
                        {emp.role.title} &middot; {emp.department.name}
                      </p>
                    </div>
                    {claiming === emp.id ? (
                      <span className="text-sm text-emerald-600">Claiming...</span>
                    ) : (
                      <svg className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
