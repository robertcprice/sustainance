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

const COUNTRIES: { code: string; name: string }[] = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'UK', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'IE', name: 'Ireland' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'JP', name: 'Japan' },
  { code: 'SG', name: 'Singapore' },
  { code: 'IN', name: 'India' },
];

const BUSINESS_FUNCTIONS = [
  { id: 'ops_facilities', name: 'Operations & Facilities', description: 'Managing physical operations, energy, facilities, and logistics' },
  { id: 'proc_supply', name: 'Procurement & Supply Chain', description: 'Sourcing, supplier management, and supply chain operations' },
  { id: 'fin_risk', name: 'Finance & Risk', description: 'Financial planning, investment, risk management, and ESG reporting' },
  { id: 'tech_it', name: 'Technology & IT', description: 'Software, data, AI/ML, cloud infrastructure, and digital innovation' },
  { id: 'people_hr', name: 'People & HR', description: 'Human resources, talent management, and organizational change' },
  { id: 'legal_comp', name: 'Legal & Compliance', description: 'Legal, regulatory, compliance, and corporate governance' },
  { id: 'sales_mktg', name: 'Sales & Marketing', description: 'Sales, marketing, communications, and stakeholder engagement' },
];

const DEFAULT_DEPARTMENTS: Record<string, string[]> = {
  small: ['Operations', 'Finance', 'Sales'],
  medium: ['Operations', 'Finance', 'Human Resources', 'Technology', 'Sales & Marketing'],
  large: ['Operations & Facilities', 'Finance & Risk', 'Human Resources', 'Technology & IT', 'Legal & Compliance', 'Procurement', 'Sales & Marketing'],
};

const SCORE_OPTIONS = [
  { value: 1, label: 'Curious Explorer', description: 'I have little awareness in this area', emoji: '🌱' },
  { value: 2, label: 'Informed Practitioner', description: 'I understand the basics but need guidance', emoji: '📚' },
  { value: 3, label: 'Applied Advocate', description: 'I can independently apply this in my work', emoji: '🛠️' },
  { value: 4, label: 'Conscious Changemaker', description: 'I lead initiatives and teach others', emoji: '🌟' },
];

interface Question {
  id: string;
  text: string;
  scenarioText: string;
  orderIndex: number;
  skillMaps: {
    skill: {
      name: string;
      family: { name: string; color: string };
    };
  }[];
}

interface DeptDraft { name: string }
interface RoleDraft { title: string; functionId: string; departmentId: string }
interface EmpDraft { name: string; departmentId: string; roleId: string }

const STEPS = ['Company Info', 'Green Baseline', 'Your Role', 'Role Assessment', 'Build Team', 'Ready!'];

export default function OnboardingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [step, setStep] = useState(0);

  // Step 0 — Company Info
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [size, setSize] = useState('');
  const [employeeCount, setEmployeeCount] = useState('');
  const [country, setCountry] = useState('US');
  const [stateCode, setStateCode] = useState('');
  const [stateSearch, setStateSearch] = useState('');
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const stateRef = useRef<HTMLDivElement>(null);

  // Step 1 — Green Baseline (5 universal questions)
  const [universalQuestions, setUniversalQuestions] = useState<Question[]>([]);
  const [generalAnswers, setGeneralAnswers] = useState<Record<string, number>>({});
  const [generalQIndex, setGeneralQIndex] = useState(0);

  // Step 2 — Your Role
  const [myDepartment, setMyDepartment] = useState('');
  const [myRoleTitle, setMyRoleTitle] = useState('');
  const [myFunctionId, setMyFunctionId] = useState('');

  // Step 3 — Role-Specific Assessment (10 function questions)
  const [roleQuestions, setRoleQuestions] = useState<Question[]>([]);
  const [roleAnswers, setRoleAnswers] = useState<Record<string, number>>({});
  const [roleQIndex, setRoleQIndex] = useState(0);

  // Step 4 — Build Team (departments + roles + employees)
  const [departments, setDepartments] = useState<DeptDraft[]>([]);
  const [createdDepts, setCreatedDepts] = useState<{ id: string; name: string }[]>([]);
  const [roles, setRoles] = useState<RoleDraft[]>([]);
  const [createdRoles, setCreatedRoles] = useState<{ id: string; title: string; departmentId: string }[]>([]);
  const [employees, setEmployees] = useState<EmpDraft[]>([]);
  const [teamSubStep, setTeamSubStep] = useState<'depts' | 'roles' | 'employees'>('depts');

  // Onboarding assessment result
  const [onboardingResult, setOnboardingResult] = useState<{
    departmentId: string; departmentName: string; roleId: string; roleTitle: string;
  } | null>(null);

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

  // ---- STEP HANDLERS ----

  // Step 0: Create company → go to Green Baseline
  async function handleStep0() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, industry, size, employeeCount: parseInt(employeeCount) || 0, state: stateCode || 'N/A', country }),
      });
      if (res.ok) {
        // Fetch universal questions for step 1
        const qRes = await fetch('/api/questions?type=universal');
        if (qRes.ok) {
          const qs = await qRes.json();
          setUniversalQuestions(qs);
        }
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

  // Step 1 → Step 2 (all general questions answered)
  function handleStep1Done() {
    setError('');
    setStep(2);
  }

  // Step 2 → Step 3: Fetch role-specific questions
  async function handleStep2Done() {
    if (!myDepartment.trim() || !myRoleTitle.trim() || !myFunctionId) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const qRes = await fetch(`/api/questions?type=function&functionId=${myFunctionId}`);
      if (qRes.ok) {
        const qs = await qRes.json();
        setRoleQuestions(qs);
        setRoleQIndex(0);
        setStep(3);
      } else {
        setError('Failed to load role questions');
      }
    } catch {
      setError('Network error');
    }
    setLoading(false);
  }

  // Step 3 Done → Create everything via API, then go to Build Team
  async function handleStep3Done() {
    setLoading(true);
    setError('');
    try {
      // Combine all answers
      const allAnswers = [
        ...Object.entries(generalAnswers).map(([questionId, score]) => ({ questionId, score })),
        ...Object.entries(roleAnswers).map(([questionId, score]) => ({ questionId, score })),
      ];

      const res = await fetch('/api/onboarding/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          departmentName: myDepartment,
          roleTitle: myRoleTitle,
          functionId: myFunctionId,
          answers: allAnswers,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setOnboardingResult(data);

        // Pre-fill team setup with defaults (excluding the just-created dept)
        const defaults = DEFAULT_DEPARTMENTS[size] || DEFAULT_DEPARTMENTS['medium'];
        const remaining = defaults.filter(d => d.toLowerCase() !== myDepartment.toLowerCase());
        setDepartments(remaining.map(n => ({ name: n })));
        setTeamSubStep('depts');
        setStep(4);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save assessment');
      }
    } catch {
      setError('Network error');
    }
    setLoading(false);
  }

  // Step 4: Build Team (departments → roles → employees)
  async function handleCreateDepts() {
    const validDepts = departments.filter(d => d.name.trim());
    setLoading(true);
    setError('');
    try {
      if (validDepts.length > 0) {
        const res = await fetch('/api/departments/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ departments: validDepts }),
        });
        if (res.ok) {
          const data = await res.json();
          // Include the already-created department from onboarding
          const allDepts = onboardingResult
            ? [{ id: onboardingResult.departmentId, name: onboardingResult.departmentName }, ...data.departments]
            : data.departments;
          setCreatedDepts(allDepts);
          setRoles(allDepts.map((d: { id: string }) => ({
            title: '',
            functionId: '',
            departmentId: d.id,
          })));
        } else {
          const data = await res.json();
          setError(data.error || 'Failed to create departments');
          setLoading(false);
          return;
        }
      } else if (onboardingResult) {
        // No extra depts, just use the one from onboarding
        setCreatedDepts([{ id: onboardingResult.departmentId, name: onboardingResult.departmentName }]);
        setRoles([]);
      }
      setTeamSubStep('roles');
    } catch {
      setError('Network error');
    }
    setLoading(false);
  }

  async function handleCreateRoles() {
    const validRoles = roles.filter(r => r.title.trim() && r.functionId && r.departmentId);
    setLoading(true);
    setError('');
    try {
      if (validRoles.length > 0) {
        const res = await fetch('/api/roles/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roles: validRoles }),
        });
        if (res.ok) {
          const data = await res.json();
          const allRoles = onboardingResult
            ? [{ id: onboardingResult.roleId, title: onboardingResult.roleTitle, departmentId: onboardingResult.departmentId }, ...data.roles]
            : data.roles;
          setCreatedRoles(allRoles);
          setEmployees([{ name: '', departmentId: createdDepts[0]?.id || '', roleId: allRoles[0]?.id || '' }]);
        } else {
          const data = await res.json();
          setError(data.error || 'Failed to create roles');
          setLoading(false);
          return;
        }
      } else if (onboardingResult) {
        setCreatedRoles([{ id: onboardingResult.roleId, title: onboardingResult.roleTitle, departmentId: onboardingResult.departmentId }]);
        setEmployees([{ name: '', departmentId: onboardingResult.departmentId, roleId: onboardingResult.roleId }]);
      }
      setTeamSubStep('employees');
    } catch {
      setError('Network error');
    }
    setLoading(false);
  }

  async function handleCreateEmployees() {
    const validEmps = employees.filter(e => e.name.trim() && e.departmentId && e.roleId);
    setLoading(true);
    setError('');
    try {
      if (validEmps.length > 0) {
        const res = await fetch('/api/employees/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ employees: validEmps }),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || 'Failed to create employees');
          setLoading(false);
          return;
        }
      }
      setStep(5);
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

  const isStep0Valid = name && industry && size && employeeCount && country && (country !== 'US' || stateCode);
  const allGeneralAnswered = universalQuestions.length > 0 && Object.keys(generalAnswers).length === universalQuestions.length;
  const allRoleAnswered = roleQuestions.length > 0 && Object.keys(roleAnswers).length === roleQuestions.length;

  // ---- ASSESSMENT UI COMPONENT ----
  function renderQuestionCard(
    questions: Question[],
    answers: Record<string, number>,
    setAnswer: (qId: string, score: number) => void,
    currentIndex: number,
    setCurrentIndex: (i: number) => void,
    allAnswered: boolean,
    onComplete: () => void,
    completeLabel: string,
    phaseLabel: string,
  ) {
    if (questions.length === 0) return <div className="text-center py-8 text-slate-400">Loading questions...</div>;
    const q = questions[currentIndex];
    const answeredCount = Object.keys(answers).length;

    return (
      <div className="space-y-6">
        {/* Progress */}
        <div className="flex items-center justify-between text-sm text-slate-500 mb-1">
          <span className="font-medium text-slate-700">{phaseLabel}</span>
          <span>{answeredCount}/{questions.length} answered</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(answeredCount / questions.length) * 100}%` }}
          />
        </div>

        {/* Question Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wide">Scenario</span>
            <p className="text-sm text-slate-500 mt-1 italic">{q.scenarioText}</p>
          </div>
          <p className="text-base text-slate-900 font-medium">{q.text}</p>
          <div className="flex flex-wrap gap-1.5">
            {q.skillMaps.map((sm, i) => (
              <span
                key={i}
                className="px-2 py-0.5 text-xs rounded-md"
                style={{
                  backgroundColor: sm.skill.family.color + '15',
                  color: sm.skill.family.color,
                  border: `1px solid ${sm.skill.family.color}30`,
                }}
              >
                {sm.skill.name}
              </span>
            ))}
          </div>

          {/* Score options */}
          <div className="space-y-2">
            {SCORE_OPTIONS.map(opt => {
              const isSelected = answers[q.id] === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setAnswer(q.id, opt.value)}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                      : 'bg-white border-gray-200 text-slate-700 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{opt.emoji}</span>
                    <div>
                      <div className="font-medium text-sm">{opt.label}</div>
                      <div className="text-xs text-slate-400">{opt.description}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="px-4 py-2 text-sm text-slate-500 hover:text-slate-900 disabled:opacity-30 transition-colors"
          >
            Previous
          </button>

          <div className="flex gap-1.5">
            {questions.map((q2, i) => (
              <button
                key={q2.id}
                onClick={() => setCurrentIndex(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  i === currentIndex ? 'bg-emerald-500 scale-125'
                    : answers[q2.id] ? 'bg-emerald-300' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {currentIndex < questions.length - 1 ? (
            <button
              onClick={() => setCurrentIndex(currentIndex + 1)}
              className="px-4 py-2 text-sm text-emerald-600 hover:text-emerald-500 font-medium transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              onClick={onComplete}
              disabled={!allAnswered || loading}
              className="px-5 py-2 text-sm bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-500 disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
            >
              {loading ? 'Saving...' : completeLabel}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-emerald-50 via-white to-green-50">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4">
            <img src="/logo.svg" alt="Sustainance" className="w-16 h-16 mx-auto" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome to Sustainance</h1>
          <p className="text-slate-500">
            {activeTab === 'create' && step > 0
              ? `Step ${step} of ${STEPS.length - 1} — ${STEPS[step]}`
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

        {/* Step indicator */}
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
                  <div className={`w-6 h-0.5 ${i < step ? 'bg-emerald-600' : 'bg-gray-200'}`} />
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
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Number of Employees</label>
                  <input
                    type="number" value={employeeCount} onChange={e => setEmployeeCount(e.target.value)}
                    placeholder="e.g. 50"
                    min="1"
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Country</label>
                  <select value={country} onChange={e => { setCountry(e.target.value); if (e.target.value !== 'US') { setStateCode(''); setStateSearch(''); } }}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20">
                    {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                  </select>
                </div>
                {country === 'US' && (
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
                )}
                {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}
                <button onClick={handleStep0} disabled={!isStep0Valid || loading}
                  className="w-full py-3 px-6 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold rounded-xl transition-colors">
                  {loading ? 'Creating...' : 'Next: Sustainability Baseline'}
                </button>
              </div>
            )}

            {/* STEP 1 — Green Baseline Assessment (5 universal questions) */}
            {step === 1 && (
              <div className="panel rounded-2xl shadow-sm p-8">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-slate-900 mb-1">Sustainability Baseline</h2>
                  <p className="text-sm text-slate-500">
                    Let&apos;s start with 5 general questions to understand your current sustainability awareness.
                    Everyone in your organization should eventually take this baseline.
                  </p>
                </div>
                {renderQuestionCard(
                  universalQuestions,
                  generalAnswers,
                  (qId, score) => setGeneralAnswers(prev => ({ ...prev, [qId]: score })),
                  generalQIndex,
                  setGeneralQIndex,
                  allGeneralAnswered,
                  handleStep1Done,
                  'Next: Tell Us Your Role',
                  'Sustainability Fundamentals',
                )}
                {error && <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}
              </div>
            )}

            {/* STEP 2 — Your Role */}
            {step === 2 && (
              <div className="panel rounded-2xl shadow-sm p-8 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-1">Tell Us About Your Role</h2>
                  <p className="text-sm text-slate-500">
                    We&apos;ll create a customized skills assessment based on your specific business function.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Your Department</label>
                  <input
                    type="text" value={myDepartment} onChange={e => setMyDepartment(e.target.value)}
                    placeholder="e.g. Engineering, Marketing, Operations"
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Your Role / Title</label>
                  <input
                    type="text" value={myRoleTitle} onChange={e => setMyRoleTitle(e.target.value)}
                    placeholder="e.g. AI/ML Engineer, VP of Sales, Operations Manager"
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Which best describes your function?</label>
                  <div className="space-y-2">
                    {BUSINESS_FUNCTIONS.map(f => {
                      const isSelected = myFunctionId === f.id;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setMyFunctionId(f.id)}
                          className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                            isSelected
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                              : 'bg-white border-gray-200 text-slate-700 hover:bg-gray-50 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-medium text-sm">{f.name}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{f.description}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}
                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="px-6 py-3 text-slate-600 hover:text-slate-900 font-medium">Back</button>
                  <button
                    onClick={handleStep2Done}
                    disabled={!myDepartment.trim() || !myRoleTitle.trim() || !myFunctionId || loading}
                    className="flex-1 py-3 px-6 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold rounded-xl transition-colors"
                  >
                    {loading ? 'Loading...' : `Next: ${BUSINESS_FUNCTIONS.find(f => f.id === myFunctionId)?.name || 'Role'} Assessment`}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3 — Role-Specific Assessment (10 function questions) */}
            {step === 3 && (
              <div className="panel rounded-2xl shadow-sm p-8">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-slate-900 mb-1">
                    {BUSINESS_FUNCTIONS.find(f => f.id === myFunctionId)?.name} Assessment
                  </h2>
                  <p className="text-sm text-slate-500">
                    Now let&apos;s assess sustainability skills specific to your role as <span className="font-semibold text-slate-700">{myRoleTitle}</span>.
                    These questions are tailored to your business function.
                  </p>
                </div>
                {renderQuestionCard(
                  roleQuestions,
                  roleAnswers,
                  (qId, score) => setRoleAnswers(prev => ({ ...prev, [qId]: score })),
                  roleQIndex,
                  setRoleQIndex,
                  allRoleAnswered,
                  handleStep3Done,
                  'Complete Assessment & Continue',
                  `${BUSINESS_FUNCTIONS.find(f => f.id === myFunctionId)?.name || 'Role'} Skills`,
                )}
                {error && <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}
              </div>
            )}

            {/* STEP 4 — Build Your Team */}
            {step === 4 && (
              <div className="panel rounded-2xl shadow-sm p-8 space-y-6">
                {/* Success banner */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-emerald-700 font-medium text-sm mb-1">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    Assessment Complete!
                  </div>
                  <p className="text-xs text-emerald-600">
                    Your baseline and {BUSINESS_FUNCTIONS.find(f => f.id === myFunctionId)?.name} assessments have been saved.
                    Now let&apos;s set up the rest of your team.
                  </p>
                </div>

                {teamSubStep === 'depts' && (
                  <>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 mb-1">Departments</h2>
                      <p className="text-sm text-slate-500">
                        We&apos;ve already created <span className="font-semibold text-slate-700">{myDepartment}</span>. Add more departments below, or skip to finish.
                      </p>
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
                      <button onClick={() => setStep(5)} className="px-6 py-3 text-slate-600 hover:text-slate-900 font-medium">
                        Skip to Finish
                      </button>
                      <button onClick={handleCreateDepts} disabled={loading}
                        className="flex-1 py-3 px-6 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold rounded-xl transition-colors">
                        {loading ? 'Saving...' : 'Next: Add Roles'}
                      </button>
                    </div>
                  </>
                )}

                {teamSubStep === 'roles' && (
                  <>
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
                      <button onClick={() => setTeamSubStep('depts')} className="px-6 py-3 text-slate-600 hover:text-slate-900 font-medium">Back</button>
                      <button onClick={handleCreateRoles} disabled={loading}
                        className="flex-1 py-3 px-6 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold rounded-xl transition-colors">
                        {loading ? 'Saving...' : 'Next: Add Employees'}
                      </button>
                    </div>
                  </>
                )}

                {teamSubStep === 'employees' && (
                  <>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 mb-1">Employees</h2>
                      <p className="text-sm text-slate-500">Add your team members. You can always add more later.</p>
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
                      <button onClick={() => setTeamSubStep('roles')} className="px-6 py-3 text-slate-600 hover:text-slate-900 font-medium">Back</button>
                      <button onClick={handleCreateEmployees} disabled={loading}
                        className="flex-1 py-3 px-6 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold rounded-xl transition-colors">
                        {loading ? 'Saving...' : 'Finish Setup'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* STEP 5 — All Done */}
            {step === 5 && (
              <div className="panel rounded-2xl shadow-sm p-8 text-center space-y-6">
                <div className="w-20 h-20 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto">
                  <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">You&apos;re All Set!</h2>
                  <p className="text-slate-500 mb-4">
                    <span className="font-semibold text-slate-700">{name}</span> is ready to go.
                  </p>
                  <div className="inline-flex flex-col gap-2 text-sm text-left bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                    <div className="flex items-center gap-2 text-emerald-700">
                      <span>✓</span>
                      <span>Sustainability baseline completed (5 questions)</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-700">
                      <span>✓</span>
                      <span>{BUSINESS_FUNCTIONS.find(f => f.id === myFunctionId)?.name} assessment completed (10 questions)</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-700">
                      <span>✓</span>
                      <span>Role created: {myRoleTitle} in {myDepartment}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 justify-center pt-2">
                  <button onClick={() => router.push('/assess')}
                    className="px-6 py-3 bg-white border border-gray-300 text-slate-700 rounded-xl hover:bg-gray-50 transition-colors font-medium">
                    Run More Assessments
                  </button>
                  <button onClick={() => router.push('/dashboard')}
                    className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition-colors font-medium">
                    Go to Dashboard
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* JOIN TAB */
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
