import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildRoleGapSummary } from '@/lib/scoring-engine';

export async function GET(
  _request: Request,
  { params }: { params: { departmentId: string } }
) {
  const auth = await verifyAuth();
  if (!auth?.companyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { departmentId } = params;

  const department = await prisma.department.findFirst({
    where: { id: departmentId, companyId: auth.companyId },
    include: {
      employees: { where: { isActive: true } },
      roles: {
        include: {
          function: true,
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
      },
      scores: { orderBy: { lastUpdated: 'desc' }, take: 1 },
    },
  });

  if (!department) {
    return NextResponse.json({ error: 'Department not found' }, { status: 404 });
  }

  // Build role gap summaries
  const roleReports = department.roles
    .filter((r) => r.assessments.length > 0)
    .map((role) => {
      const latestAssessment = role.assessments.sort(
        (a, b) => (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0)
      )[0];
      const summary = buildRoleGapSummary(
        role.id, role.title, role.function.name,
        role.skillRequirements, latestAssessment.answers
      );
      return {
        ...summary,
        employeeCount: role.employees.length,
      };
    });

  // Aggregate gaps across all roles
  const allGaps = roleReports.flatMap((r) => r.gaps);
  const criticalCount = allGaps.filter((g) => g.severity === 'critical').length;
  const moderateCount = allGaps.filter((g) => g.severity === 'moderate').length;
  const noGapCount = allGaps.filter((g) => g.severity === 'no_gap').length;
  const readiness = allGaps.length > 0 ? Math.round((noGapCount / allGaps.length) * 100) : 100;

  // Top critical gaps
  const topCritical = [...allGaps]
    .filter((g) => g.severity === 'critical')
    .sort((a, b) => b.gap * b.weight - a.gap * a.weight)
    .slice(0, 10);

  // Gap distribution by family
  const familyStats = new Map<string, { name: string; color: string; critical: number; moderate: number; no_gap: number }>();
  for (const g of allGaps) {
    if (!familyStats.has(g.familyId)) {
      familyStats.set(g.familyId, { name: g.familyName, color: g.familyColor, critical: 0, moderate: 0, no_gap: 0 });
    }
    familyStats.get(g.familyId)![g.severity]++;
  }

  return NextResponse.json({
    department: {
      id: department.id,
      name: department.name,
      totalEmployees: department.employees.length,
      totalRoles: department.roles.length,
      score: department.scores[0]?.score ?? 0,
    },
    readiness,
    totalGaps: allGaps.length,
    criticalGaps: criticalCount,
    moderateGaps: moderateCount,
    noGaps: noGapCount,
    topCriticalGaps: topCritical.map((g) => ({
      skillName: g.skillName,
      familyName: g.familyName,
      gap: g.gap,
      requiredLevel: g.requiredLevel,
      currentLevel: g.currentLevel,
    })),
    roles: roleReports.map((r) => ({
      roleId: r.roleId,
      roleTitle: r.roleTitle,
      functionName: r.functionName,
      readinessScore: r.readinessScore,
      riskScore: r.riskScore,
      employeeCount: r.employeeCount,
      criticalGaps: r.gaps.filter((g) => g.severity === 'critical').length,
    })),
    familyDistribution: Array.from(familyStats.values()),
    generatedAt: new Date().toISOString(),
  });
}
