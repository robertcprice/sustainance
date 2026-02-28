import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildRoleGapSummary } from '@/lib/scoring-engine';

export async function GET(
  _request: Request,
  { params }: { params: { functionId: string } }
) {
  const auth = await verifyAuth();
  if (!auth?.companyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { functionId } = params;

  const func = await prisma.businessFunction.findUnique({
    where: { id: functionId },
  });

  if (!func) {
    return NextResponse.json({ error: 'Function not found' }, { status: 404 });
  }

  // Get all roles for this function in this company
  const roles = await prisma.role.findMany({
    where: { companyId: auth.companyId, functionId },
    include: {
      department: true,
      skillRequirements: {
        include: { skill: { include: { family: true } } },
      },
      assessments: {
        where: { status: 'completed' },
        include: {
          answers: {
            include: { question: { include: { skillMaps: true } } },
          },
        },
      },
      employees: { where: { isActive: true } },
    },
  });

  const roleReports = roles
    .filter((r) => r.assessments.length > 0)
    .map((role) => {
      const latestAssessment = role.assessments.sort(
        (a, b) => (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0)
      )[0];
      const summary = buildRoleGapSummary(
        role.id, role.title, func.name,
        role.skillRequirements, latestAssessment.answers
      );
      return {
        ...summary,
        department: role.department?.name ?? 'Unassigned',
        employeeCount: role.employees.length,
      };
    });

  const allGaps = roleReports.flatMap((r) => r.gaps);
  const criticalCount = allGaps.filter((g) => g.severity === 'critical').length;
  const moderateCount = allGaps.filter((g) => g.severity === 'moderate').length;
  const noGapCount = allGaps.filter((g) => g.severity === 'no_gap').length;
  const readiness = allGaps.length > 0 ? Math.round((noGapCount / allGaps.length) * 100) : 100;
  const totalEmployees = roles.reduce((sum, r) => sum + r.employees.length, 0);

  // Aggregate skill gaps across roles
  const skillAgg = new Map<string, { name: string; family: string; totalGap: number; count: number; avgRequired: number; avgCurrent: number }>();
  for (const g of allGaps) {
    if (!skillAgg.has(g.skillId)) {
      skillAgg.set(g.skillId, { name: g.skillName, family: g.familyName, totalGap: 0, count: 0, avgRequired: 0, avgCurrent: 0 });
    }
    const agg = skillAgg.get(g.skillId)!;
    agg.totalGap += g.gap;
    agg.count++;
    agg.avgRequired += g.requiredLevel;
    agg.avgCurrent += g.currentLevel;
  }

  const skillSummary = Array.from(skillAgg.entries())
    .map(([skillId, agg]) => ({
      skillId,
      skillName: agg.name,
      familyName: agg.family,
      avgGap: Math.round((agg.totalGap / agg.count) * 10) / 10,
      avgRequired: Math.round((agg.avgRequired / agg.count) * 10) / 10,
      avgCurrent: Math.round((agg.avgCurrent / agg.count) * 10) / 10,
      rolesAffected: agg.count,
    }))
    .sort((a, b) => b.avgGap - a.avgGap);

  return NextResponse.json({
    function: {
      id: func.id,
      name: func.name,
      totalRoles: roles.length,
      totalEmployees,
    },
    readiness,
    criticalGaps: criticalCount,
    moderateGaps: moderateCount,
    noGaps: noGapCount,
    roles: roleReports.map((r) => ({
      roleId: r.roleId,
      roleTitle: r.roleTitle,
      department: r.department,
      readinessScore: r.readinessScore,
      riskScore: r.riskScore,
      employeeCount: r.employeeCount,
    })),
    skillSummary: skillSummary.slice(0, 15),
    generatedAt: new Date().toISOString(),
  });
}
