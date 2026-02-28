import { GapResult, RoleGapSummary } from './types';

interface AnswerWithSkillMaps {
  questionId: string;
  score: number;
  question: {
    skillMaps: { skillId: string }[];
  };
}

interface SkillRequirement {
  skillId: string;
  requiredLevel: number;
  weight: number;
  skill: {
    id: string;
    name: string;
    familyId: string;
    family: {
      id: string;
      name: string;
      color: string;
    };
  };
}

export function computeCurrentLevel(
  skillId: string,
  answers: AnswerWithSkillMaps[]
): number {
  const relevantAnswers = answers.filter((a) =>
    a.question.skillMaps.some((sm) => sm.skillId === skillId)
  );
  if (relevantAnswers.length === 0) return 1; // default for unmapped skills
  const sum = relevantAnswers.reduce((acc, a) => acc + a.score, 0);
  return Math.round((sum / relevantAnswers.length) * 10) / 10;
}

export function calculateGap(
  required: number,
  current: number
): { gap: number; severity: 'critical' | 'moderate' | 'no_gap' } {
  const gap = Math.max(0, required - current);
  let severity: 'critical' | 'moderate' | 'no_gap';
  if (gap >= 2) {
    severity = 'critical';
  } else if (gap >= 1) {
    severity = 'moderate';
  } else {
    severity = 'no_gap';
  }
  return { gap, severity };
}

export function computeAllGaps(
  requirements: SkillRequirement[],
  answers: AnswerWithSkillMaps[]
): GapResult[] {
  return requirements.map((req) => {
    const currentLevel = computeCurrentLevel(req.skillId, answers);
    const { gap, severity } = calculateGap(req.requiredLevel, currentLevel);
    return {
      skillId: req.skillId,
      skillName: req.skill.name,
      familyId: req.skill.familyId,
      familyName: req.skill.family.name,
      familyColor: req.skill.family.color,
      requiredLevel: req.requiredLevel,
      currentLevel,
      gap,
      weight: req.weight,
      severity,
    };
  });
}

export function computeReadinessScore(gaps: GapResult[]): number {
  if (gaps.length === 0) return 100;
  const atOrAbove = gaps.filter((g) => g.severity === 'no_gap').length;
  return Math.round((atOrAbove / gaps.length) * 100);
}

export function computeRiskScore(gaps: GapResult[]): number {
  return gaps.reduce((acc, g) => acc + g.gap * g.weight, 0);
}

export function buildRoleGapSummary(
  roleId: string,
  roleTitle: string,
  functionName: string,
  requirements: SkillRequirement[],
  answers: AnswerWithSkillMaps[]
): RoleGapSummary {
  const gaps = computeAllGaps(requirements, answers);
  return {
    roleId,
    roleTitle,
    functionName,
    gaps,
    readinessScore: computeReadinessScore(gaps),
    riskScore: computeRiskScore(gaps),
  };
}
