import { RoiEstimate, GapResult } from './types';

interface RoiMultiplier {
  industry: string;
  riskType: string;
  severity: string;
  annualCostLow: number;
  annualCostHigh: number;
  description: string;
}

const SIZE_MULTIPLIERS: Record<string, number> = {
  small: 0.5,    // <100 employees
  medium: 1.0,   // 100-999 employees
  large: 2.0,    // 1000+ employees
};

const TRAINING_COST_PER_GAP: Record<string, number> = {
  small: 2500,
  medium: 5000,
  large: 8000,
};

export function estimateRoi(
  gaps: GapResult[],
  multipliers: RoiMultiplier[],
  companySize: string,
  industry: string
): RoiEstimate {
  const sizeFactor = SIZE_MULTIPLIERS[companySize] || 1.0;

  // Filter multipliers by industry
  const industryMultipliers = multipliers.filter(
    (m) => m.industry === industry
  );

  // Count gaps by severity
  const criticalCount = gaps.filter((g) => g.severity === 'critical').length;
  const moderateCount = gaps.filter((g) => g.severity === 'moderate').length;

  // Compute cost of inaction from relevant multipliers
  const riskBreakdown: RoiEstimate['riskBreakdown'] = [];
  let totalCostLow = 0;
  let totalCostHigh = 0;

  for (const mult of industryMultipliers) {
    let applicableGapCount = 0;
    if (mult.severity === 'critical') {
      applicableGapCount = criticalCount;
    } else if (mult.severity === 'moderate') {
      applicableGapCount = moderateCount;
    }

    if (applicableGapCount > 0) {
      // Scale by number of gaps and company size, but cap at reasonable multiple
      const scaleFactor = Math.min(applicableGapCount / 3, 2.0) * sizeFactor;
      const costLow = Math.round(mult.annualCostLow * scaleFactor);
      const costHigh = Math.round(mult.annualCostHigh * scaleFactor);

      riskBreakdown.push({
        riskType: mult.riskType,
        costLow,
        costHigh,
        description: mult.description,
      });

      totalCostLow += costLow;
      totalCostHigh += costHigh;
    }
  }

  // If no industry-specific multipliers, use generic estimates
  if (riskBreakdown.length === 0) {
    const genericCostLow = (criticalCount * 50000 + moderateCount * 15000) * sizeFactor;
    const genericCostHigh = (criticalCount * 500000 + moderateCount * 100000) * sizeFactor;
    totalCostLow = Math.round(genericCostLow);
    totalCostHigh = Math.round(genericCostHigh);
    riskBreakdown.push({
      riskType: 'general_risk',
      costLow: totalCostLow,
      costHigh: totalCostHigh,
      description: 'Estimated risk from unaddressed sustainability skill gaps',
    });
  }

  // Training investment
  const costPerGap = TRAINING_COST_PER_GAP[companySize] || 5000;
  const totalGapsNeedingTraining = criticalCount + moderateCount;
  const trainingInvestment = totalGapsNeedingTraining * costPerGap;

  return {
    costOfInactionLow: totalCostLow,
    costOfInactionHigh: totalCostHigh,
    trainingInvestment,
    netRoiLow: totalCostLow - trainingInvestment,
    netRoiHigh: totalCostHigh - trainingInvestment,
    riskBreakdown,
  };
}
