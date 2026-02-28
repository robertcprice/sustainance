'use client';

import { useState, useEffect, useCallback } from 'react';
import AppShell from '@/components/layout/AppShell';

interface SkillFamily {
  id: string;
  name: string;
  color: string;
}

interface Skill {
  id: string;
  name: string;
  family: SkillFamily;
}

interface SkillRequirement {
  id: string;
  skillId: string;
  requiredLevel: number;
  weight: number;
  skill: Skill;
}

interface BusinessFunction {
  id: string;
  name: string;
}

interface Role {
  id: string;
  title: string;
  function: BusinessFunction;
  skillRequirements: SkillRequirement[];
  assessments: { id: string; status: string }[];
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [functions, setFunctions] = useState<BusinessFunction[]>([]);
  const [title, setTitle] = useState('');
  const [functionId, setFunctionId] = useState('');
  const [loading, setLoading] = useState(false);

  const loadRoles = useCallback(async () => {
    const res = await fetch('/api/roles');
    if (res.ok) setRoles(await res.json());
  }, []);

  useEffect(() => {
    loadRoles();
    fetch('/api/functions').then(r => r.json()).then(setFunctions);
  }, [loadRoles]);

  async function createRole(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !functionId) return;
    setLoading(true);
    const res = await fetch('/api/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, functionId }),
    });
    if (res.ok) {
      setTitle('');
      setFunctionId('');
      loadRoles();
    }
    setLoading(false);
  }

  function groupByFamily(reqs: SkillRequirement[]) {
    const grouped: Record<string, { family: SkillFamily; skills: SkillRequirement[] }> = {};
    for (const req of reqs) {
      const fid = req.skill.family.id;
      if (!grouped[fid]) {
        grouped[fid] = { family: req.skill.family, skills: [] };
      }
      grouped[fid].skills.push(req);
    }
    return Object.values(grouped);
  }

  const levelLabels = ['', 'Beginner', 'Developing', 'Proficient', 'Expert'];

  return (
    <AppShell>
      <div className="max-w-5xl">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Role Management</h1>
        <p className="text-slate-500 mb-8">Create roles and view their auto-assigned green skill requirements.</p>

        {/* Create Role Form */}
        <form onSubmit={createRole} className="panel rounded-xl shadow-sm p-6 mb-8 flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Role Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Operations Manager"
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <div className="w-56">
            <label className="block text-sm font-medium text-slate-700 mb-1">Function</label>
            <select
              value={functionId}
              onChange={e => setFunctionId(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="">Select...</option>
              {functions.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={!title || !functionId || loading}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-medium rounded-xl transition-colors whitespace-nowrap"
          >
            {loading ? 'Creating...' : 'Add Role'}
          </button>
        </form>

        {/* Roles List */}
        {roles.length === 0 ? (
          <div className="panel rounded-xl shadow-sm p-12 text-center">
            <p className="text-slate-400 text-lg">No roles yet. Create your first role above.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {roles.map(role => {
              const familyGroups = groupByFamily(role.skillRequirements);
              const hasAssessment = role.assessments.some(a => a.status === 'completed');
              return (
                <div key={role.id} className="panel rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{role.title}</h3>
                      <span className="text-sm text-slate-500">{role.function.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-400">
                        {role.skillRequirements.length} skills
                      </span>
                      {hasAssessment ? (
                        <span className="px-3 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                          Assessed
                        </span>
                      ) : (
                        <span className="px-3 py-1 text-xs font-medium bg-amber-50 text-amber-700 rounded-full border border-amber-200">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {familyGroups.map(group => (
                      <div key={group.family.id}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: group.family.color }} />
                          <span className="text-sm font-medium text-slate-700">{group.family.name}</span>
                          <span className="text-xs text-slate-400">({group.skills.length})</span>
                        </div>
                        <div className="flex flex-wrap gap-2 ml-5">
                          {group.skills.map(req => (
                            <span
                              key={req.id}
                              className="px-2.5 py-1 text-xs rounded-md border"
                              style={{
                                backgroundColor: group.family.color + '10',
                                borderColor: group.family.color + '30',
                                color: group.family.color,
                              }}
                              title={`Required: ${levelLabels[req.requiredLevel]} | Weight: ${req.weight}`}
                            >
                              {req.skill.name} (L{req.requiredLevel})
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
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
