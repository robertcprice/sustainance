import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildRoleGapSummary } from '@/lib/scoring-engine';

export async function GET(
  _request: Request,
  { params }: { params: { roleId: string } }
) {
  const auth = await verifyAuth();
  if (!auth?.companyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { roleId } = params;

  const role = await prisma.role.findFirst({
    where: { id: roleId, companyId: auth.companyId },
    include: {
      function: true,
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
      employees: {
        where: { isActive: true },
        include: {
          assessments: { orderBy: { assessmentDate: 'desc' } },
          xp: true,
        },
      },
    },
  });

  if (!role) {
    return NextResponse.json({ error: 'Role not found' }, { status: 404 });
  }

  // Build role gap summary from assessment
  let roleSummary = null;
  if (role.assessments.length > 0) {
    const latestAssessment = role.assessments.sort(
      (a, b) => (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0)
    )[0];
    roleSummary = buildRoleGapSummary(
      role.id, role.title, role.function.name,
      role.skillRequirements, latestAssessment.answers
    );
  }

  // Build individual employee skill levels
  const employees = role.employees.map((emp) => {
    const latestBySkill = new Map<string, number>();
    for (const a of emp.assessments) {
      if (!latestBySkill.has(a.skillId)) {
        latestBySkill.set(a.skillId, a.currentLevel);
      }
    }

    const skills = role.skillRequirements.map((rsr) => {
      const currentLevel = latestBySkill.get(rsr.skillId) ?? 0;
      const gap = Math.max(0, rsr.requiredLevel - currentLevel);
      return {
        skillId: rsr.skillId,
        skillName: rsr.skill.name,
        currentLevel,
        requiredLevel: rsr.requiredLevel,
        gap,
        severity: gap >= 2 ? 'critical' : gap >= 1 ? 'moderate' : 'no_gap' as const,
      };
    });

    const noGapCount = skills.filter((s) => s.severity === 'no_gap').length;
    return {
      id: emp.id,
      name: emp.name,
      xp: emp.xp[0]?.xpTotal ?? 0,
      readiness: skills.length > 0 ? Math.round((noGapCount / skills.length) * 100) : 100,
      criticalGaps: skills.filter((s) => s.severity === 'critical').length,
      moderateGaps: skills.filter((s) => s.severity === 'moderate').length,
      skills,
    };
  });

  return NextResponse.json({
    role: {
      id: role.id,
      title: role.title,
      function: role.function.name,
      department: role.department?.name ?? 'Unassigned',
      totalEmployees: role.employees.length,
    },
    readiness: roleSummary?.readinessScore ?? 0,
    riskScore: roleSummary?.riskScore ?? 0,
    gaps: roleSummary?.gaps ?? [],
    employees,
    generatedAt: new Date().toISOString(),
  });
}
