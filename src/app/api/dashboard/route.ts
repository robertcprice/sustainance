import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { buildRoleGapSummary } from '@/lib/scoring-engine';
import { estimateRoi } from '@/lib/roi-engine';
import { matchIncentives } from '@/lib/incentive-engine';
import { DashboardPayload, GapResult, HeatmapCell } from '@/lib/types';

export async function GET() {
  const auth = await verifyAuth();
  if (!auth?.companyId) {
    return NextResponse.json({ error: 'No company found' }, { status: 401 });
  }
  const companyId = auth.companyId;

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) {
    return NextResponse.json({ error: 'Company not found' }, { status: 404 });
  }

  // Fetch roles with requirements and completed assessments
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
              question: {
                include: { skillMaps: true },
              },
            },
          },
        },
      },
    },
  });

  // Build gap summaries for each assessed role
  const roleGaps = roles
    .filter((r) => r.assessments.length > 0)
    .map((role) => {
      // Use the most recent completed assessment
      const latestAssessment = role.assessments.sort(
        (a, b) => (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0)
      )[0];

      return buildRoleGapSummary(
        role.id,
        role.title,
        role.function.name,
        role.skillRequirements,
        latestAssessment.answers
      );
    });

  // Aggregate all gaps
  const allGaps: GapResult[] = roleGaps.flatMap((r) => r.gaps);
  const totalCriticalGaps = allGaps.filter((g) => g.severity === 'critical').length;
  const totalModerateGaps = allGaps.filter((g) => g.severity === 'moderate').length;
  const totalNoGap = allGaps.filter((g) => g.severity === 'no_gap').length;

  // Overall readiness
  const overallReadiness =
    allGaps.length > 0
      ? Math.round((allGaps.filter((g) => g.severity === 'no_gap').length / allGaps.length) * 100)
      : 0;

  // ROI calculation
  const multipliers = await prisma.roiMultiplier.findMany();
  const roi = estimateRoi(allGaps, multipliers, company.size, company.industry);

  // Incentive matching
  const programs = await prisma.incentiveProgram.findMany();
  const incentives = matchIncentives(programs, company.industry, company.state, allGaps);

  // Build heatmap (roles x families)
  const families = await prisma.skillFamily.findMany({ orderBy: { id: 'asc' } });
  const heatmap: HeatmapCell[] = [];
  for (const roleGap of roleGaps) {
    for (const family of families) {
      const familyGaps = roleGap.gaps.filter((g) => g.familyId === family.id);
      if (familyGaps.length > 0) {
        const avgGap = familyGaps.reduce((sum, g) => sum + g.gap, 0) / familyGaps.length;
        let severity: 'critical' | 'moderate' | 'no_gap';
        if (avgGap >= 2) severity = 'critical';
        else if (avgGap >= 1) severity = 'moderate';
        else severity = 'no_gap';

        heatmap.push({
          roleId: roleGap.roleId,
          roleTitle: roleGap.roleTitle,
          familyId: family.id,
          familyName: family.name,
          familyColor: family.color,
          avgGap,
          severity,
        });
      }
    }
  }

  // Gap distribution by family
  const gapDistribution = families.map((family) => {
    const familyGaps = allGaps.filter((g) => g.familyId === family.id);
    return {
      family: family.name,
      familyColor: family.color,
      critical: familyGaps.filter((g) => g.severity === 'critical').length,
      moderate: familyGaps.filter((g) => g.severity === 'moderate').length,
      no_gap: familyGaps.filter((g) => g.severity === 'no_gap').length,
    };
  });

  const payload: DashboardPayload = {
    company: {
      id: company.id,
      name: company.name,
      industry: company.industry,
      size: company.size,
      state: company.state,
    },
    overallReadiness,
    totalRolesAssessed: roleGaps.length,
    totalCriticalGaps,
    totalModerateGaps,
    totalNoGap,
    roleGaps,
    roi,
    incentives,
    heatmap,
    gapDistribution,
  };

  return NextResponse.json(payload);
}
