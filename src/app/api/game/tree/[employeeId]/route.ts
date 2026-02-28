import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  const auth = await verifyAuth();
  if (!auth?.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { employeeId } = await params;
  const companyId = auth.companyId;

  const emp = await prisma.employee.findFirst({
    where: {
      id: employeeId,
      companyId,
      isActive: true,
    },
    include: {
      role: {
        include: {
          function: true,
          skillRequirements: {
            include: {
              skill: { include: { family: true } },
            },
          },
        },
      },
    },
  });

  if (!emp) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  const requiredSkills = emp.role.skillRequirements;

  const assessments = await prisma.employeeSkillAssessment.findMany({
    where: { employeeId, companyId },
    orderBy: { assessmentDate: "desc" },
  });

  const latestLevels = new Map<string, number>();
  for (const a of assessments) {
    if (!latestLevels.has(a.skillId)) {
      latestLevels.set(a.skillId, a.currentLevel);
    }
  }

  const xpRecord = await prisma.employeeXP.findUnique({
    where: { companyId_employeeId: { companyId, employeeId } },
  });
  const xpTotal = xpRecord?.xpTotal ?? 0;

  // Build skill tree grouped by family
  const familyMap = new Map<string, {
    familyId: string;
    familyName: string;
    skills: Array<{
      skillId: string;
      skillName: string;
      currentLevel: number | null;
      requiredLevel: number;
      gapValue: number;
      severity: string;
      unlocked: boolean;
    }>;
  }>();

  for (const rs of requiredSkills) {
    const skill = rs.skill;
    const family = skill.family;

    if (!familyMap.has(family.id)) {
      familyMap.set(family.id, {
        familyId: family.id,
        familyName: family.name,
        skills: [],
      });
    }

    const currentLevel = latestLevels.get(skill.id) ?? null;
    const gapValue = currentLevel === null ? rs.requiredLevel : Math.max(0, rs.requiredLevel - currentLevel);
    const severity = gapValue >= 2 ? "Critical" : gapValue === 1 ? "Moderate" : "No Gap";

    familyMap.get(family.id)!.skills.push({
      skillId: skill.id,
      skillName: skill.name,
      currentLevel,
      requiredLevel: rs.requiredLevel,
      gapValue,
      severity,
      unlocked: currentLevel !== null,
    });
  }

  // Calculate money saved: each level gained = $500
  let totalLevelsGained = 0;
  for (const rs of requiredSkills) {
    const currentLevel = latestLevels.get(rs.skill.id);
    if (currentLevel !== null && currentLevel !== undefined) {
      totalLevelsGained += currentLevel;
    }
  }
  const moneySaved = totalLevelsGained * 500;

  const families = Array.from(familyMap.values()).sort((a, b) =>
    a.familyName.localeCompare(b.familyName)
  );

  return NextResponse.json({
    employee: {
      id: emp.id,
      name: emp.name,
      roleFunction: emp.role.function.name,
      roleTitle: emp.role.title,
    },
    xpTotal,
    moneySaved,
    totalSkills: requiredSkills.length,
    unlockedSkills: requiredSkills.filter((rs) => latestLevels.has(rs.skill.id)).length,
    families,
  });
}
