export interface GapResult {
  skillId: string;
  skillName: string;
  familyId: string;
  familyName: string;
  familyColor: string;
  requiredLevel: number;
  currentLevel: number;
  gap: number;
  weight: number;
  severity: 'critical' | 'moderate' | 'no_gap';
}

export interface RoleGapSummary {
  roleId: string;
  roleTitle: string;
  functionName: string;
  gaps: GapResult[];
  readinessScore: number;
  riskScore: number;
}

export interface RoiEstimate {
  costOfInactionLow: number;
  costOfInactionHigh: number;
  trainingInvestment: number;
  netRoiLow: number;
  netRoiHigh: number;
  riskBreakdown: {
    riskType: string;
    costLow: number;
    costHigh: number;
    description: string;
  }[];
}

export interface IncentiveMatch {
  id: string;
  name: string;
  type: string;
  description: string;
  estimatedValue: string;
  agency: string;
  url: string;
  deadlineInfo: string;
  matchReason: string;
}

export interface HeatmapCell {
  roleId: string;
  roleTitle: string;
  familyId: string;
  familyName: string;
  familyColor: string;
  avgGap: number;
  severity: 'critical' | 'moderate' | 'no_gap';
}

export interface PublicCompanyCard {
  id: string;
  name: string;
  industry: string;
  size: string;
  description: string | null;
  overallReadiness: number;
  totalRolesAssessed: number;
  totalEmployees: number;
  totalDepartments: number;
  gapSummary: { critical: number; moderate: number; no_gap: number };
}

export interface DashboardPayload {
  company: {
    id: string;
    name: string;
    industry: string;
    size: string;
    state: string;
  };
  overallReadiness: number;
  totalRolesAssessed: number;
  totalCriticalGaps: number;
  totalModerateGaps: number;
  totalNoGap: number;
  roleGaps: RoleGapSummary[];
  roi: RoiEstimate;
  incentives: IncentiveMatch[];
  heatmap: HeatmapCell[];
  gapDistribution: {
    family: string;
    familyColor: string;
    critical: number;
    moderate: number;
    no_gap: number;
  }[];
}
