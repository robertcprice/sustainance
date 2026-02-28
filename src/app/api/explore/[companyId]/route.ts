import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildRoleGapSummary } from '@/lib/scoring-engine';
import { GapResult, HeatmapCell } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  const { companyId } = params;

  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  if (!company || !company.isPublic) {
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
        role.id,
        role.title,
        role.function.name,
        role.skillRequirements,
        latestAssessment.answers
      );
    });

  const allGaps: GapResult[] = roleGaps.flatMap((r) => r.gaps);
  const overallReadiness =
    allGaps.length > 0
      ? Math.round((allGaps.filter((g) => g.severity === 'no_gap').length / allGaps.length) * 100)
      : 0;

  const families = await prisma.skillFamily.findMany({ orderBy: { id: 'asc' } });

  // Build heatmap
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

  // Gap distribution
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

  return NextResponse.json({
    company: {
      id: company.id,
      name: company.name,
      industry: company.industry,
      size: company.size,
      state: company.state,
      description: company.description,
    },
    overallReadiness,
    totalRolesAssessed: roleGaps.length,
    totalCriticalGaps: allGaps.filter((g) => g.severity === 'critical').length,
    totalModerateGaps: allGaps.filter((g) => g.severity === 'moderate').length,
    totalNoGap: allGaps.filter((g) => g.severity === 'no_gap').length,
    roleGaps,
    heatmap,
    gapDistribution,
  });
}
