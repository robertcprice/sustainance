"use client";

import { useState, useEffect } from "react";

interface SkillNode {
  skillId: string;
  skillName: string;
  currentLevel: number | null;
  requiredLevel: number;
  gapValue: number;
  severity: string;
  unlocked: boolean;
}

interface SkillFamily {
  familyId: string;
  familyName: string;
  skills: SkillNode[];
}

interface EmployeeInfo {
  id: string;
  name: string;
  roleFunction: string;
  roleTitle: string;
}

interface TreeData {
  employee: EmployeeInfo;
  xpTotal: number;
  moneySaved: number;
  totalSkills: number;
  unlockedSkills: number;
  families: SkillFamily[];
}

interface Employee {
  id: string;
  name: string;
  departmentName: string;
  roleTitle: string;
  roleFunction: string;
}

const FAMILY_ICONS: Record<string, string> = {
  "Climate Action": "🔥",
  "Circular Economy": "♻️",
  "Sustainable Operations": "⚙️",
  "Green Innovation": "💡",
};

const FAMILY_COLORS: Record<string, { bg: string; border: string; accent: string; badge: string }> = {
  "Climate Action": { bg: "bg-orange-50", border: "border-orange-200", accent: "text-orange-700", badge: "bg-orange-100 text-orange-700" },
  "Circular Economy": { bg: "bg-emerald-50", border: "border-emerald-200", accent: "text-emerald-700", badge: "bg-emerald-100 text-emerald-700" },
  "Sustainable Operations": { bg: "bg-blue-50", border: "border-blue-200", accent: "text-blue-700", badge: "bg-blue-100 text-blue-700" },
  "Green Innovation": { bg: "bg-purple-50", border: "border-purple-200", accent: "text-purple-700", badge: "bg-purple-100 text-purple-700" },
};

const SEVERITY_STYLES: Record<string, string> = {
  Critical: "bg-red-100 text-red-700 border-red-200",
  Moderate: "bg-yellow-100 text-yellow-700 border-yellow-200",
  "No Gap": "bg-green-100 text-green-700 border-green-200",
};

function getGreenScoreLabel(score: number): { label: string; color: string } {
  if (score >= 90) return { label: "Sustainability Champion", color: "text-green-600" };
  if (score >= 70) return { label: "Green Leader", color: "text-emerald-600" };
  if (score >= 50) return { label: "Eco Practitioner", color: "text-teal-600" };
  if (score >= 30) return { label: "Growing Green", color: "text-yellow-600" };
  return { label: "Getting Started", color: "text-gray-500" };
}

function GreenScoreRing({ score }: { score: number }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const scoreColor =
    score >= 90 ? "#16a34a" :
    score >= 70 ? "#059669" :
    score >= 50 ? "#0d9488" :
    score >= 30 ? "#ca8a04" :
    "#9ca3af";

  const { label, color } = getGreenScoreLabel(score);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-44 h-44">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="10" />
          <circle
            cx="80" cy="80" r={radius}
            fill="none"
            stroke={scoreColor}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-extrabold" style={{ color: scoreColor }}>{score}</span>
          <span className="text-xs text-gray-400 font-medium">/ 100</span>
        </div>
      </div>
      <p className={`text-sm font-semibold mt-2 ${color}`}>{label}</p>
    </div>
  );
}

function calculateGreenScore(families: SkillFamily[]): number {
  let totalPoints = 0;
  let maxPoints = 0;

  for (const family of families) {
    for (const skill of family.skills) {
      const current = skill.currentLevel ?? 0;
      const required = skill.requiredLevel;
      // Each skill contributes up to requiredLevel points
      totalPoints += Math.min(current, required);
      maxPoints += required;
    }
  }

  if (maxPoints === 0) return 0;
  return Math.round((totalPoints / maxPoints) * 100);
}

function calculateFamilyScore(skills: SkillNode[]): number {
  let totalPoints = 0;
  let maxPoints = 0;
  for (const skill of skills) {
    totalPoints += Math.min(skill.currentLevel ?? 0, skill.requiredLevel);
    maxPoints += skill.requiredLevel;
  }
  if (maxPoints === 0) return 0;
  return Math.round((totalPoints / maxPoints) * 100);
}

function LevelDots({ current, required }: { current: number | null; required: number }) {
  return (
    <div className="flex gap-1.5 items-center">
      {[1, 2, 3, 4].map((level) => {
        const isFilled = current !== null && level <= current;
        const isRequired = level <= required;
        return (
          <div
            key={level}
            className={`w-5 h-5 rounded-full border-2 transition-all ${
              isFilled
                ? "bg-green-500 border-green-500 shadow-sm shadow-green-200"
                : isRequired
                ? "border-gray-300 bg-white"
                : "border-gray-200 bg-gray-50"
            }`}
            title={`Level ${level}${isFilled ? " (achieved)" : isRequired ? " (required)" : ""}`}
          />
        );
      })}
    </div>
  );
}

function SkillCard({ skill }: { skill: SkillNode }) {
  const isLocked = !skill.unlocked;

  return (
    <div
      className={`relative rounded-xl border-2 p-4 transition-all ${
        isLocked
          ? "border-gray-200 bg-gray-50 opacity-70"
          : skill.severity === "No Gap"
          ? "border-green-300 bg-white shadow-sm"
          : skill.severity === "Critical"
          ? "border-red-200 bg-white shadow-sm"
          : "border-yellow-200 bg-white shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{isLocked ? "🔒" : skill.severity === "No Gap" ? "⭐" : "🔓"}</span>
          <h4 className="text-sm font-semibold text-gray-800 leading-tight">{skill.skillName}</h4>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full border ${SEVERITY_STYLES[skill.severity]}`}>
          {skill.severity}
        </span>
      </div>

      <div className="mb-3">
        <LevelDots current={skill.currentLevel} required={skill.requiredLevel} />
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${
            skill.severity === "No Gap"
              ? "bg-green-500"
              : skill.severity === "Critical"
              ? "bg-red-400"
              : "bg-yellow-400"
          }`}
          style={{ width: `${((skill.currentLevel ?? 0) / skill.requiredLevel) * 100}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs text-gray-400">
          {skill.currentLevel ?? 0}/{skill.requiredLevel}
        </span>
        {skill.gapValue > 0 && (
          <span className="text-xs text-red-500 font-medium">-{skill.gapValue} gap</span>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const [, setEmployees] = useState<Employee[]>([]);
  const [, setSelectedEmployeeId] = useState("");
  const [treeData, setTreeData] = useState<TreeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [treeLoading, setTreeLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/employees")
      .then((r) => r.json())
      .then((d) => {
        const emps = d.employees || [];
        setEmployees(emps);
        if (emps.length > 0) {
          loadProfile(emps[0].id);
        }
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProfile = async (empId: string) => {
    setSelectedEmployeeId(empId);
    setTreeLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/game/tree/${empId}`);
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Failed to load profile");
        setTreeData(null);
        return;
      }
      setTreeData(await res.json());
    } catch {
      setError("Network error");
    } finally {
      setTreeLoading(false);
    }
  };

  if (loading || treeLoading || (!treeData && !error)) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-pulse">🌿</div>
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!treeData) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p className="text-gray-400">{error || "No profile data available. Please contact your administrator."}</p>
      </div>
    );
  }

  const greenScore = calculateGreenScore(treeData.families);
  const completionPct = treeData.totalSkills > 0
    ? Math.round((treeData.unlockedSkills / treeData.totalSkills) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          My Green Profile
        </h1>
        <p className="text-sm text-gray-500">
          {treeData.employee.roleTitle} &middot; {treeData.employee.roleFunction}
        </p>
      </div>

      {/* Green Score hero card */}
      <div className="panel rounded-2xl shadow-sm p-8 mb-8">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <GreenScoreRing score={greenScore} />
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-lg font-bold text-gray-800 mb-1">Green Score</h2>
            <p className="text-sm text-gray-500 mb-4">
              Based on {treeData.totalSkills} assessed sustainability skills across {treeData.families.length} areas.
              Your score reflects how close your skill levels are to the requirements for your role.
            </p>

            {/* Family breakdown mini bars */}
            <div className="space-y-2">
              {treeData.families.map((family) => {
                const icon = FAMILY_ICONS[family.familyName] || "🌿";
                const famScore = calculateFamilyScore(family.skills);
                return (
                  <div key={family.familyId} className="flex items-center gap-3">
                    <span className="text-sm w-5">{icon}</span>
                    <span className="text-xs text-gray-600 w-40 truncate">{family.familyName}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-700"
                        style={{ width: `${famScore}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-500 w-8 text-right">{famScore}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="panel rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{treeData.xpTotal}</div>
          <div className="text-xs text-gray-500 mt-1">Total XP</div>
        </div>
        <div className="panel rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600">
            {treeData.unlockedSkills}/{treeData.totalSkills}
          </div>
          <div className="text-xs text-gray-500 mt-1">Skills Unlocked</div>
        </div>
        <div className="panel rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{completionPct}%</div>
          <div className="text-xs text-gray-500 mt-1">Completion</div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-4 text-center text-white shadow-md">
          <div className="text-2xl font-bold">
            ${treeData.moneySaved.toLocaleString()}
          </div>
          <div className="text-xs mt-1 opacity-90">Training Value</div>
        </div>
      </div>

      {/* Skill families grid */}
      <h2 className="text-lg font-bold text-gray-800 mb-4">Skill Breakdown</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {treeData.families.map((family) => {
          const colors = FAMILY_COLORS[family.familyName] || FAMILY_COLORS["Climate Action"];
          const icon = FAMILY_ICONS[family.familyName] || "🌿";
          const familyUnlocked = family.skills.filter((s) => s.unlocked).length;
          const familyNoGap = family.skills.filter((s) => s.severity === "No Gap").length;

          return (
            <div key={family.familyId} className={`rounded-2xl border-2 ${colors.border} ${colors.bg} p-5`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{icon}</span>
                  <h3 className={`text-lg font-bold ${colors.accent}`}>{family.familyName}</h3>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${colors.badge}`}>
                  {familyUnlocked}/{family.skills.length} unlocked
                </span>
              </div>

              {/* Family progress */}
              <div className="mb-4">
                <div className="w-full bg-white/60 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${family.skills.length > 0 ? (familyNoGap / family.skills.length) * 100 : 0}%`,
                    }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {familyNoGap} of {family.skills.length} skills mastered
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {family.skills.map((skill) => (
                  <SkillCard key={skill.skillId} skill={skill} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
