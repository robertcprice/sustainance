import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface ResponseItem {
  questionId: string;
  skillId: string;
  level: number;
}

export async function POST(request: Request) {
  const auth = await verifyAuth();
  if (!auth?.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { employeeId, responses } = body as {
    employeeId: string;
    responses: ResponseItem[];
  };

  if (!employeeId) {
    return NextResponse.json({ error: "employeeId is required" }, { status: 400 });
  }
  if (!responses || !Array.isArray(responses) || responses.length === 0) {
    return NextResponse.json({ error: "responses are required" }, { status: 400 });
  }

  const emp = await prisma.employee.findFirst({
    where: {
      id: employeeId,
      companyId: auth.companyId,
      isActive: true,
    },
  });

  if (!emp) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  const companyId = auth.companyId;
  const conductedBy = auth.userId;
  const now = new Date();

  // Get previous assessments for XP calculation
  const previousAssessments = await prisma.employeeSkillAssessment.findMany({
    where: { employeeId, companyId },
    orderBy: { assessmentDate: "desc" },
  });

  const latestLevels = new Map<string, number>();
  for (const a of previousAssessments) {
    if (!latestLevels.has(a.skillId)) {
      latestLevels.set(a.skillId, a.currentLevel);
    }
  }

  // Upsert assessment records (@@unique([employeeId, skillId]))
  for (const r of responses) {
    const clampedLevel = Math.min(4, Math.max(1, r.level));
    await prisma.employeeSkillAssessment.upsert({
      where: {
        employeeId_skillId: {
          employeeId,
          skillId: r.skillId,
        },
      },
      update: {
        currentLevel: clampedLevel,
        assessmentDate: now,
        conductedBy,
      },
      create: {
        companyId,
        employeeId,
        skillId: r.skillId,
        currentLevel: clampedLevel,
        assessmentDate: now,
        conductedBy,
      },
    });
  }

  // Calculate XP: 100 points per level improvement
  let xpEarned = 0;
  for (const r of responses) {
    const prevLevel = latestLevels.get(r.skillId);
    if (prevLevel !== undefined) {
      const improvement = r.level - prevLevel;
      if (improvement > 0) {
        xpEarned += improvement * 100;
      }
    }
  }

  // Upsert EmployeeXP (@@unique([companyId, employeeId]))
  const existingXP = await prisma.employeeXP.findUnique({
    where: { companyId_employeeId: { companyId, employeeId } },
  });

  if (existingXP) {
    await prisma.employeeXP.update({
      where: { id: existingXP.id },
      data: {
        xpTotal: existingXP.xpTotal + xpEarned,
        lastUpdated: now,
      },
    });
  } else {
    await prisma.employeeXP.create({
      data: {
        companyId,
        employeeId,
        xpTotal: xpEarned,
        lastUpdated: now,
      },
    });
  }

  // Update DepartmentScore
  const departmentId = emp.departmentId;

  const deptXPAgg = await prisma.employeeXP.aggregate({
    where: {
      companyId,
      employee: {
        departmentId,
        isActive: true,
      },
    },
    _sum: { xpTotal: true },
  });

  const deptScore = deptXPAgg._sum.xpTotal ?? 0;

  await prisma.departmentScore.upsert({
    where: {
      companyId_departmentId: { companyId, departmentId },
    },
    update: { score: deptScore, lastUpdated: now },
    create: {
      companyId,
      departmentId,
      score: deptScore,
      lastUpdated: now,
    },
  });

  return NextResponse.json({
    success: true,
    assessmentCount: responses.length,
    xpEarned,
  });
}
