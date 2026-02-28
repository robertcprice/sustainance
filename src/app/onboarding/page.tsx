'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const INDUSTRIES = [
  'Manufacturing', 'Technology', 'Finance & Banking', 'Energy & Utilities',
  'Healthcare', 'Retail & Consumer', 'Construction', 'Transportation & Logistics',
  'Agriculture', 'Real Estate', 'Education', 'Hospitality',
  'Telecommunications', 'Mining & Resources', 'Professional Services',
  'Government & Public Sector', 'Sports & Entertainment',
];

const SIZES = [
  { value: 'small', label: 'Small (1-99 employees)' },
  { value: 'medium', label: 'Medium (100-999 employees)' },
  { value: 'large', label: 'Large (1,000+ employees)' },
];

const US_STATES: { code: string; name: string }[] = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' },
];

const BUSINESS_FUNCTIONS = [
  { id: 'ops_facilities', name: 'Operations & Facilities' },
  { id: 'proc_supply', name: 'Procurement & Supply Chain' },
  { id: 'fin_risk', name: 'Finance & Risk' },
  { id: 'tech_it', name: 'Technology & IT' },
  { id: 'people_hr', name: 'People & HR' },
  { id: 'legal_comp', name: 'Legal & Compliance' },
  { id: 'sales_mktg', name: 'Sales & Marketing' },
];

const DEFAULT_DEPARTMENTS: Record<string, string[]> = {
  small: ['Operations', 'Finance', 'Sales'],
  medium: ['Operations', 'Finance', 'Human Resources', 'Technology', 'Sales & Marketing'],
  large: ['Operations & Facilities', 'Finance & Risk', 'Human Resources', 'Technology & IT', 'Legal & Compliance', 'Procurement', 'Sales & Marketing'],
};

interface DeptDraft { name: string }
interface RoleDraft { title: string; functionId: string; departmentId: string }
interface EmpDraft { name: string; departmentId: string; roleId: string }

const STEPS = ['Company Info', 'Departments', 'Roles', 'Employees', 'Ready!'];

export default function OnboardingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [step, setStep] = useState(0);

  // Step 1 — Company Info
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [size, setSize] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [stateSearch, setStateSearch] = useState('');
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const stateRef = useRef<HTMLDivElement>(null);

  // Step 2 — Departments
  const [departments, setDepartments] = useState<DeptDraft[]>([]);
  const [createdDepts, setCreatedDepts] = useState<{ id: string; name: string }[]>([]);

  // Step 3 — Roles
  const [roles, setRoles] = useState<RoleDraft[]>([]);
  const [createdRoles, setCreatedRoles] = useState<{ id: string; title: string; departmentId: string }[]>([]);

  // Step 4 — Employees
  const [employees, setEmployees] = useState<EmpDraft[]>([]);

  // Shared
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Join tab state
  const [inviteCode, setInviteCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (stateRef.current && !stateRef.current.contains(e.target as Node)) {
        setShowStateDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredStates = US_STATES.filter(s =>
    s.name.toLowerCase().includes(stateSearch.toLowerCase()) ||
    s.code.toLowerCase().includes(stateSearch.toLowerCase())
  );

  function selectState(code: string, stateName: string) {
    setStateCode(code);
    setStateSearch(stateName);
    setShowStateDropdown(false);
  }

  // Step 1: Create company
  async function handleStep1() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, industry, size, state: stateCode }),
      });
      if (res.ok) {
        // Pre-fill default departments based on company size
        const defaults = DEFAULT_DEPARTMENTS[size] || DEFAULT_DEPARTMENTS['medium'];
        setDepartments(defaults.map(n => ({ name: n })));
        setStep(1);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create company');
      }
    } catch {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  }

  // Step 2: Create departments
  async function handleStep2() {
    const validDepts = departments.filter(d => d.name.trim());
    if (validDepts.length === 0) {
      setError('Add at least one department');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/departments/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ departments: validDepts }),
      });
      if (res.ok) {
        const data = await res.json();
        setCreatedDepts(data.departments);
        // Pre-fill one role per department
        setRoles(data.departments.map((d: { id: string }) => ({
          title: '',
          functionId: '',
          departmentId: d.id,
        })));
        setStep(2);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create departments');
      }
    } catch {
      setError('Network error');
    }
    setLoading(false);
  }

  // Step 3: Create roles
  async function handleStep3() {
    const validRoles = roles.filter(r => r.title.trim() && r.functionId && r.departmentId);
    if (validRoles.length === 0) {
      setError('Add at least one role');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/roles/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roles: validRoles }),
      });
      if (res.ok) {
        const data = await res.json();
        setCreatedRoles(data.roles);
        setEmployees([{ name: '', departmentId: createdDepts[0]?.id || '', roleId: data.roles[0]?.id || '' }]);
        setStep(3);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create roles');
      }
    } catch {
      setError('Network error');
    }
    setLoading(false);
  }

  // Step 4: Create employees
  async function handleStep4() {
    const validEmps = employees.filter(e => e.name.trim() && e.departmentId && e.roleId);
    if (validEmps.length === 0) {
      setStep(4); // skip employees, go to finish
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/employees/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employees: validEmps }),
      });
      if (res.ok) {
        setStep(4);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create employees');
      }
    } catch {
      setError('Network error');
    }
    setLoading(false);
  }

  // Join handler
  async function handleJoinSubmit(e: React.FormEvent) {
    e.preventDefault();
    setJoinLoading(true);
    setJoinError('');
    const res = await fetch('/api/invite/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: inviteCode }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.needsClaimProfile) {
        router.push('/claim-profile');
      } else {
        router.push('/dashboard/employee/profile');
      }
    } else {
      const data = await res.json();
      setJoinError(data.error || 'Failed to join company');
    }
    setJoinLoading(false);
  }

  const isStep1Valid = name && industry && size && stateCode;

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-emerald-50 via-white to-green-50">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <div className="mx-auto mb-4">
            <img src="/logo.svg" alt="Sustainance" className="w-16 h-16 mx-auto" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome to Sustainance</h1>
          <p className="text-slate-500">
            {activeTab === 'create' && step > 0
              ? `Step ${step + 1} of ${STEPS.length}`
              : 'Create a new company or join an existing one'}
          </p>
        </div>

        {/* Tabs — hide when in wizard steps 1+ */}
        {(activeTab === 'join' || step === 0) && (
          <div className="flex mb-6 bg-gray-100 rounded-xl p-1">
            <button
              type="button"
              onClick={() => { setActiveTab('create'); setStep(0); }}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'create'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Create Company
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('join')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'join'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Join with Code
            </button>
          </div>
        )}

        {/* Step indicator for wizard */}
        {activeTab === 'create' && step > 0 && (
          <div className="flex items-center justify-center gap-2 mb-6">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  i < step ? 'bg-emerald-600 text-white'
                    : i === step ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-600'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {i < step ? '✓' : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-8 h-0.5 ${i < step ? 'bg-emerald-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'create' ? (
          <>
            {/* STEP 0 — Company Info */}
            {step === 0 && (
              <div className="panel rounded-2xl shadow-sm p-8 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Company Name</label>
                  <input
                    type="text" value={name} onChange={e => setName(e.target.value)}
                    placeholder="Acme Corporation"
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Industry</label>
                  <select value={industry} onChange={e => setIndustry(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20">
                    <option value="">Select industry...</option>
                    {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Company Size</label>
                  <select value={size} onChange={e => setSize(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20">
                    <option value="">Select size...</option>
                    {SIZES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div ref={stateRef} className="relative">
                  <label className="block text-sm font-medium text-slate-700 mb-2">State</label>
                  <input
                    type="text" value={stateSearch}
                    onChange={e => { setStateSearch(e.target.value); setStateCode(''); setShowStateDropdown(true); }}
                    onFocus={() => setShowStateDropdown(true)}
                    placeholder="Search states..."
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                  {showStateDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {filteredStates.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-slate-400">No states found</div>
                      ) : filteredStates.map(s => (
                        <button type="button" key={s.code} onClick={() => selectState(s.code, s.name)}
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-emerald-50 hover:text-emerald-700 transition-colors first:rounded-t-xl last:rounded-b-xl">
                          {s.name} <span className="text-slate-400 ml-1">({s.code})</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}
                <button onClick={handleStep1} disabled={!isStep1Valid || loading}
                  className="w-full py-3 px-6 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold rounded-xl transition-colors">
                  {loading ? 'Creating...' : 'Next: Set Up Departments'}
                </button>
              </div>
            )}

            {/* STEP 1 — Departments */}
            {step === 1 && (
              <div className="panel rounded-2xl shadow-sm p-8 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-1">Departments</h2>
                  <p className="text-sm text-slate-500">We suggested defaults based on your company size. Add, remove, or rename as needed.</p>
                </div>
                <div className="space-y-3">
                  {departments.map((dept, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text" value={dept.name}
                        onChange={e => {
                          const next = [...departments];
                          next[i] = { name: e.target.value };
                          setDepartments(next);
                        }}
                        placeholder="Department name"
                        className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                      />
                      <button onClick={() => setDepartments(departments.filter((_, j) => j !== i))}
                        className="px-3 text-slate-400 hover:text-red-500 transition-colors" title="Remove">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                <button onClick={() => setDepartments([...departments, { name: '' }])}
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                  + Add Department
                </button>
                {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}
                <div className="flex gap-3">
                  <button onClick={() => setStep(0)} className="px-6 py-3 text-slate-600 hover:text-slate-900 font-medium">Back</button>
                  <button onClick={handleStep2} disabled={loading}
                    className="flex-1 py-3 px-6 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold rounded-xl transition-colors">
                    {loading ? 'Saving...' : 'Next: Add Roles'}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2 — Roles */}
            {step === 2 && (
              <div className="panel rounded-2xl shadow-sm p-8 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-1">Roles</h2>
                  <p className="text-sm text-slate-500">Add roles for each department. Pick a business function to auto-map sustainability skills.</p>
                </div>
                <div className="space-y-4">
                  {roles.map((role, i) => (
                    <div key={i} className="p-4 border border-gray-200 rounded-xl space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text" value={role.title}
                          onChange={e => {
                            const next = [...roles];
                            next[i] = { ...next[i], title: e.target.value };
                            setRoles(next);
                          }}
                          placeholder="Role title (e.g. Operations Manager)"
                          className="flex-1 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm"
                        />
                        <button onClick={() => setRoles(roles.filter((_, j) => j !== i))}
                          className="px-2 text-slate-400 hover:text-red-500 transition-colors" title="Remove">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <select value={role.departmentId}
                          onChange={e => {
                            const next = [...roles];
                            next[i] = { ...next[i], departmentId: e.target.value };
                            setRoles(next);
                          }}
                          className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-emerald-500">
                          <option value="">Department...</option>
                          {createdDepts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                        <select value={role.functionId}
                          onChange={e => {
                            const next = [...roles];
                            next[i] = { ...next[i], functionId: e.target.value };
                            setRoles(next);
                          }}
                          className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-emerald-500">
                          <option value="">Business Function...</option>
                          {BUSINESS_FUNCTIONS.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => setRoles([...roles, { title: '', functionId: '', departmentId: createdDepts[0]?.id || '' }])}
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                  + Add Role
                </button>
                {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}
                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="px-6 py-3 text-slate-600 hover:text-slate-900 font-medium">Back</button>
                  <button onClick={handleStep3} disabled={loading}
                    className="flex-1 py-3 px-6 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold rounded-xl transition-colors">
                    {loading ? 'Saving...' : 'Next: Add Employees'}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3 — Employees */}
            {step === 3 && (
              <div className="panel rounded-2xl shadow-sm p-8 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-1">Employees</h2>
                  <p className="text-sm text-slate-500">Add your team members. You can always add more later from the Employees page.</p>
                </div>
                <div className="space-y-3">
                  {employees.map((emp, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <input
                        type="text" value={emp.name}
                        onChange={e => {
                          const next = [...employees];
                          next[i] = { ...next[i], name: e.target.value };
                          setEmployees(next);
                        }}
                        placeholder="Full name"
                        className="flex-1 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm"
                      />
                      <select value={emp.departmentId}
                        onChange={e => {
                          const next = [...employees];
                          next[i] = { ...next[i], departmentId: e.target.value };
                          setEmployees(next);
                        }}
                        className="px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-emerald-500">
                        <option value="">Dept...</option>
                        {createdDepts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                      <select value={emp.roleId}
                        onChange={e => {
                          const next = [...employees];
                          next[i] = { ...next[i], roleId: e.target.value };
                          setEmployees(next);
                        }}
                        className="px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-emerald-500">
                        <option value="">Role...</option>
                        {createdRoles
                          .filter(r => !emp.departmentId || r.departmentId === emp.departmentId)
                          .map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                      </select>
                      <button onClick={() => setEmployees(employees.filter((_, j) => j !== i))}
                        className="px-2 pt-2.5 text-slate-400 hover:text-red-500 transition-colors" title="Remove">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                <button onClick={() => setEmployees([...employees, { name: '', departmentId: createdDepts[0]?.id || '', roleId: '' }])}
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                  + Add Employee
                </button>
                {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}
                <div className="flex gap-3">
                  <button onClick={() => setStep(2)} className="px-6 py-3 text-slate-600 hover:text-slate-900 font-medium">Back</button>
                  <button onClick={handleStep4} disabled={loading}
                    className="flex-1 py-3 px-6 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold rounded-xl transition-colors">
                    {loading ? 'Saving...' : 'Next: Finish Setup'}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4 — All Done */}
            {step === 4 && (
              <div className="panel rounded-2xl shadow-sm p-8 text-center space-y-6">
                <div className="w-20 h-20 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto">
                  <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">You&apos;re All Set!</h2>
                  <p className="text-slate-500 mb-2">
                    <span className="font-semibold text-slate-700">{name}</span> is ready to go.
                  </p>
                  <div className="flex justify-center gap-6 text-sm text-slate-500">
                    <span><span className="font-semibold text-slate-700">{createdDepts.length}</span> departments</span>
                    <span><span className="font-semibold text-slate-700">{createdRoles.length}</span> roles</span>
                    <span><span className="font-semibold text-slate-700">{employees.filter(e => e.name.trim()).length}</span> employees</span>
                  </div>
                </div>
                <div className="flex gap-4 justify-center pt-2">
                  <button onClick={() => router.push('/dashboard')}
                    className="px-6 py-3 bg-white border border-gray-300 text-slate-700 rounded-xl hover:bg-gray-50 transition-colors font-medium">
                    Go to Dashboard
                  </button>
                  <button onClick={() => router.push('/assess')}
                    className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition-colors font-medium">
                    Run Your First Assessment
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* JOIN TAB — unchanged */
          <form onSubmit={handleJoinSubmit} className="panel rounded-2xl shadow-sm p-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Invite Code</label>
              <input
                type="text" value={inviteCode}
                onChange={e => { setInviteCode(e.target.value.toUpperCase()); setJoinError(''); }}
                placeholder="Enter 6-character code"
                maxLength={6}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-center text-2xl tracking-[0.3em] font-mono uppercase"
              />
              <p className="mt-2 text-xs text-slate-400">Ask your company manager for an invite code</p>
            </div>
            {joinError && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{joinError}</div>}
            <button type="submit" disabled={inviteCode.length !== 6 || joinLoading}
              className="w-full py-3 px-6 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold rounded-xl transition-colors">
              {joinLoading ? 'Joining...' : 'Join Company'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
