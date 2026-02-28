import { prisma } from "@/lib/prisma";
import { getRoleDefaults, getSkills } from "@/lib/seed-data";

export type Severity = "Critical" | "Moderate" | "No Gap";

export interface SkillGap {
  employeeId: string;
  employeeName: string;
  departmentId: string;
  roleId: string;
  roleTitle: string;
  roleFunction: string;
  skillId: string;
  skillName: string;
  familyId: string;
  familyName: string;
  requiredLevel: number;
  currentLevel: number | null;
  gapValue: number;
  severity: Severity;
}

export function classifySeverity(gapValue: number): Severity {
  if (gapValue >= 2) return "Critical";
  if (gapValue === 1) return "Moderate";
  return "No Gap";
}

export async function calculateEmployeeGaps(
  employeeId: string,
  companyId: string
): Promise<SkillGap[]> {
  const emp = await prisma.employee.findFirst({
    where: {
      id: employeeId,
      companyId,
      isActive: true,
    },
    include: {
      role: { include: { function: true } },
    },
  });

  if (!emp) return [];

  const roleFunction = emp.role.function.name;
  const roleDefaults = getRoleDefaults();
  const allSkills = getSkills();
  const skillMap = new Map(allSkills.map((s) => [s.id, s]));

  const requiredSkills = roleDefaults.filter(
    (rd) => rd.function === roleFunction
  );
  if (requiredSkills.length === 0) return [];

  const assessments = await prisma.employeeSkillAssessment.findMany({
    where: {
      employeeId,
      companyId,
    },
    orderBy: { assessmentDate: "desc" },
  });

  const latestLevels = new Map<string, number>();
  for (const a of assessments) {
    if (!latestLevels.has(a.skillId)) {
      latestLevels.set(a.skillId, a.currentLevel);
    }
  }

  return requiredSkills.map((rs) => {
    const currentLevel = latestLevels.get(rs.skillId) ?? null;
    const gapValue =
      currentLevel === null
        ? rs.requiredLevel
        : rs.requiredLevel - currentLevel;
    const skill = skillMap.get(rs.skillId);

    return {
      employeeId: emp.id,
      employeeName: emp.name,
      departmentId: emp.departmentId,
      roleId: emp.roleId,
      roleTitle: emp.role.title,
      roleFunction,
      skillId: rs.skillId,
      skillName: rs.skillName,
      familyId: skill?.familyId ?? "",
      familyName: skill?.familyName ?? "",
      requiredLevel: rs.requiredLevel,
      currentLevel,
      gapValue,
      severity: classifySeverity(gapValue),
    };
  });
}

export async function calculateCompanyGaps(
  companyId: string
): Promise<SkillGap[]> {
  const activeEmployees = await prisma.employee.findMany({
    where: { companyId, isActive: true },
    select: { id: true },
  });

  const allGaps: SkillGap[] = [];
  for (const emp of activeEmployees) {
    const gaps = await calculateEmployeeGaps(emp.id, companyId);
    allGaps.push(...gaps);
  }

  return allGaps;
}
