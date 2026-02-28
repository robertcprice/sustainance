import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await verifyAuth();
  if (!auth?.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const companyId = auth.companyId;

  const depts = await prisma.department.findMany({
    where: { companyId },
    select: { id: true, name: true },
  });

  const scores = await prisma.departmentScore.findMany({
    where: { companyId },
  });
  const scoreMap = new Map(scores.map((s) => [s.departmentId, s]));

  // Get employee counts per department
  const empCountsRaw = await prisma.employee.groupBy({
    by: ["departmentId"],
    where: { companyId, isActive: true },
    _count: { id: true },
  });
  const countMap = new Map(empCountsRaw.map((e) => [e.departmentId, e._count.id]));

  // Get total XP per department
  const allXP = await prisma.employeeXP.findMany({
    where: { companyId },
    include: {
      employee: {
        select: { departmentId: true, isActive: true },
      },
    },
  });

  const xpByDept = new Map<string, number>();
  for (const xp of allXP) {
    if (!xp.employee.isActive) continue;
    const deptId = xp.employee.departmentId;
    xpByDept.set(deptId, (xpByDept.get(deptId) ?? 0) + xp.xpTotal);
  }

  const leaderboard = depts.map((dept) => ({
    departmentId: dept.id,
    departmentName: dept.name,
    score: scoreMap.get(dept.id)?.score ?? xpByDept.get(dept.id) ?? 0,
    totalXP: xpByDept.get(dept.id) ?? 0,
    employeeCount: countMap.get(dept.id) ?? 0,
    averageXP: countMap.get(dept.id)
      ? Math.round((xpByDept.get(dept.id) ?? 0) / countMap.get(dept.id)!)
      : 0,
  }));

  leaderboard.sort((a, b) => b.score - a.score);

  const ranked = leaderboard.map((entry, i) => ({
    rank: i + 1,
    ...entry,
  }));

  return NextResponse.json({ leaderboard: ranked });
}
