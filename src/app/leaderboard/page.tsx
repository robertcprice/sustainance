'use client';

import { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';

interface DepartmentRanking {
  id: string;
  name: string;
  employeeCount: number;
  assessedCount: number;
  totalXP: number;
  avgXP: number;
  score: number;
}

interface TopEmployee {
  id: string;
  name: string;
  department: string;
  role: string;
  xp: number;
}

export default function LeaderboardPage() {
  const [departments, setDepartments] = useState<DepartmentRanking[]>([]);
  const [topEmployees, setTopEmployees] = useState<TopEmployee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(r => r.json())
      .then(data => {
        setDepartments(data.departments || []);
        setTopEmployees(data.topEmployees || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const medalColors = ['text-yellow-500', 'text-gray-400', 'text-amber-600'];
  const medalIcons = ['🥇', '🥈', '🥉'];

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-20">
          <div className="text-slate-400">Loading leaderboard...</div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-5xl">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Leaderboard</h1>
        <p className="text-slate-500 mb-8">Track green skills progress across departments and celebrate top performers.</p>

        {departments.length === 0 ? (
          <div className="panel rounded-xl shadow-sm p-12 text-center">
            <p className="text-slate-400 text-lg">No departments yet. Create departments and add employees to see the leaderboard.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Department Rankings */}
            <div className="lg:col-span-2">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Department Rankings</h2>
              <div className="space-y-3">
                {departments.map((dept, i) => {
                  const maxXP = departments[0]?.totalXP || 1;
                  const barWidth = maxXP > 0 ? (dept.totalXP / maxXP) * 100 : 0;
                  return (
                    <div key={dept.id} className="panel rounded-xl shadow-sm p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xl w-8 text-center">
                            {i < 3 ? medalIcons[i] : <span className="text-sm text-slate-400 font-medium">#{i + 1}</span>}
                          </span>
                          <div>
                            <h3 className="font-semibold text-slate-900">{dept.name}</h3>
                            <p className="text-xs text-slate-400">
                              {dept.employeeCount} employee{dept.employeeCount !== 1 ? 's' : ''} &middot; {dept.assessedCount} assessed
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-emerald-600">{dept.totalXP.toLocaleString()}</div>
                          <div className="text-xs text-slate-400">Total XP</div>
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full transition-all ${
                            i === 0 ? 'bg-yellow-400' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-slate-400">
                        <span>Avg: {dept.avgXP} XP/person</span>
                        <span>Score: {dept.score}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Performers */}
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Top Performers</h2>
              {topEmployees.length === 0 ? (
                <div className="panel rounded-xl shadow-sm p-8 text-center">
                  <p className="text-sm text-slate-400">Complete assessments to earn XP and appear here.</p>
                </div>
              ) : (
                <div className="panel rounded-xl shadow-sm divide-y divide-gray-100">
                  {topEmployees.map((emp, i) => (
                    <div key={emp.id} className="px-5 py-4 flex items-center gap-3">
                      <span className={`text-sm font-bold w-6 text-center ${i < 3 ? medalColors[i] : 'text-slate-400'}`}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{emp.name}</p>
                        <p className="text-xs text-slate-400 truncate">{emp.role} &middot; {emp.department}</p>
                      </div>
                      <span className="text-sm font-semibold text-emerald-600">{emp.xp} XP</span>
                    </div>
                  ))}
                </div>
              )}

              {/* XP Info */}
              <div className="mt-6 bg-emerald-50 rounded-xl border border-emerald-200 p-5">
                <h3 className="text-sm font-semibold text-emerald-800 mb-2">How XP Works</h3>
                <ul className="text-xs text-emerald-700 space-y-1.5">
                  <li>+10 XP per skill assessed</li>
                  <li>+25 XP bonus for completing all skills</li>
                  <li>+50 XP for reaching Proficient level</li>
                  <li>+100 XP for reaching Expert level</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
