import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { buildRoleGapSummary } from '@/lib/scoring-engine';
import { estimateRoi } from '@/lib/roi-engine';
import { matchIncentives } from '@/lib/incentive-engine';
import { GapResult } from '@/lib/types';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export async function GET() {
  const cookieStore = cookies();
  const companyId = (await cookieStore).get('sustainance_company_id')?.value;

  if (!companyId) {
    return NextResponse.json({ error: 'No company found' }, { status: 401 });
  }

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) {
    return NextResponse.json({ error: 'Company not found' }, { status: 404 });
  }

  const roles = await prisma.role.findMany({
    where: { companyId },
    include: {
      function: true,
      skillRequirements: {
        include: { skill: { include: { family: true } } },
      },
      assessments: {
        where: { status: 'completed' },
        include: {
          answers: {
            include: {
              question: { include: { skillMaps: true } },
            },
          },
        },
      },
    },
  });

  const roleGaps = roles
    .filter((r) => r.assessments.length > 0)
    .map((role) => {
      const latestAssessment = role.assessments.sort(
        (a, b) => (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0)
      )[0];
      return buildRoleGapSummary(
        role.id, role.title, role.function.name,
        role.skillRequirements, latestAssessment.answers
      );
    });

  const allGaps: GapResult[] = roleGaps.flatMap((r) => r.gaps);
  const criticalGaps = allGaps.filter((g) => g.severity === 'critical');
  const overallReadiness = allGaps.length > 0
    ? Math.round((allGaps.filter((g) => g.severity === 'no_gap').length / allGaps.length) * 100)
    : 0;

  const multipliers = await prisma.roiMultiplier.findMany();
  const roi = estimateRoi(allGaps, multipliers, company.size, company.industry);

  const programs = await prisma.incentiveProgram.findMany();
  const incentives = matchIncentives(programs, company.industry, company.state, allGaps);

  // Return JSON data for the report page
  return NextResponse.json({
    company,
    overallReadiness,
    totalRolesAssessed: roleGaps.length,
    criticalGaps: criticalGaps.slice(0, 5).map(g => ({
      skillName: g.skillName,
      familyName: g.familyName,
      gap: g.gap,
      requiredLevel: g.requiredLevel,
      currentLevel: g.currentLevel,
    })),
    totalCriticalGaps: criticalGaps.length,
    totalModerateGaps: allGaps.filter((g) => g.severity === 'moderate').length,
    roi: {
      costOfInactionLow: formatCurrency(roi.costOfInactionLow),
      costOfInactionHigh: formatCurrency(roi.costOfInactionHigh),
      trainingInvestment: formatCurrency(roi.trainingInvestment),
      netRoiLow: formatCurrency(roi.netRoiLow),
      netRoiHigh: formatCurrency(roi.netRoiHigh),
    },
    incentives: incentives.slice(0, 5).map(i => ({
      name: i.name,
      type: i.type,
      estimatedValue: i.estimatedValue,
      agency: i.agency,
    })),
    roleGaps: roleGaps.map(r => ({
      roleTitle: r.roleTitle,
      functionName: r.functionName,
      readinessScore: r.readinessScore,
      riskScore: r.riskScore,
    })),
    generatedAt: new Date().toISOString(),
  });
}
