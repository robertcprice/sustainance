import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: Request,
  { params }: { params: { employeeId: string } }
) {
  const auth = await verifyAuth();
  if (!auth?.companyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { employeeId } = params;

  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, companyId: auth.companyId, isActive: true },
    include: {
      department: true,
      role: {
        include: {
          function: true,
          skillRequirements: {
            include: { skill: { include: { family: true } } },
          },
        },
      },
    },
  });

  if (!employee) {
    return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
  }

  // Get latest skill assessments
  const assessments = await prisma.employeeSkillAssessment.findMany({
    where: { employeeId, companyId: auth.companyId },
    orderBy: { assessmentDate: 'desc' },
  });

  const latestBySkill = new Map<string, number>();
  for (const a of assessments) {
    if (!latestBySkill.has(a.skillId)) {
      latestBySkill.set(a.skillId, a.currentLevel);
    }
  }

  // Get XP
  const xp = await prisma.employeeXP.findFirst({
    where: { employeeId, companyId: auth.companyId },
  });

  // Build skill gaps
  const skills = employee.role.skillRequirements.map((rsr) => {
    const currentLevel = latestBySkill.get(rsr.skillId) ?? 0;
    const gap = Math.max(0, rsr.requiredLevel - currentLevel);
    return {
      skillId: rsr.skillId,
      skillName: rsr.skill.name,
      familyId: rsr.skill.familyId,
      familyName: rsr.skill.family.name,
      familyColor: rsr.skill.family.color,
      requiredLevel: rsr.requiredLevel,
      currentLevel,
      gap,
      weight: rsr.weight,
      severity: gap >= 2 ? 'critical' : gap >= 1 ? 'moderate' : 'no_gap' as const,
    };
  });

  const criticalCount = skills.filter((s) => s.severity === 'critical').length;
  const moderateCount = skills.filter((s) => s.severity === 'moderate').length;
  const noGapCount = skills.filter((s) => s.severity === 'no_gap').length;
  const readiness = skills.length > 0 ? Math.round((noGapCount / skills.length) * 100) : 100;

  // Group by family
  const familyMap = new Map<string, { familyName: string; familyColor: string; skills: typeof skills }>();
  for (const s of skills) {
    if (!familyMap.has(s.familyId)) {
      familyMap.set(s.familyId, { familyName: s.familyName, familyColor: s.familyColor, skills: [] });
    }
    familyMap.get(s.familyId)!.skills.push(s);
  }

  // Recommended trainings: top 5 critical gaps sorted by weight
  const recommendations = [...skills]
    .filter((s) => s.gap > 0)
    .sort((a, b) => b.gap * b.weight - a.gap * a.weight)
    .slice(0, 5)
    .map((s) => ({
      skillName: s.skillName,
      familyName: s.familyName,
      gap: s.gap,
      priority: s.severity === 'critical' ? 'High' : 'Medium',
    }));

  return NextResponse.json({
    employee: {
      id: employee.id,
      name: employee.name,
      department: employee.department.name,
      role: employee.role.title,
      function: employee.role.function.name,
    },
    xpTotal: xp?.xpTotal ?? 0,
    readiness,
    totalSkills: skills.length,
    criticalGaps: criticalCount,
    moderateGaps: moderateCount,
    noGaps: noGapCount,
    skillFamilies: Array.from(familyMap.values()),
    recommendations,
    generatedAt: new Date().toISOString(),
  });
}
