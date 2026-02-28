import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export async function GET() {
  const auth = await verifyAuth();
  if (!auth?.companyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get departments with their employees and XP
  const departments = await prisma.department.findMany({
    where: { companyId: auth.companyId },
    include: {
      employees: {
        where: { isActive: true },
        include: {
          xp: true,
          role: { include: { function: true } },
          assessments: true,
        },
      },
      scores: true,
    },
  });

  // Calculate leaderboard data
  const leaderboard = departments.map((dept) => {
    const totalXP = dept.employees.reduce((sum, emp) => {
      const empXP = emp.xp[0]?.xpTotal || 0;
      return sum + empXP;
    }, 0);

    const assessedCount = dept.employees.filter(
      (emp) => emp.assessments.length > 0
    ).length;

    const avgXP = dept.employees.length > 0
      ? Math.round(totalXP / dept.employees.length)
      : 0;

    return {
      id: dept.id,
      name: dept.name,
      employeeCount: dept.employees.length,
      assessedCount,
      totalXP,
      avgXP,
      score: dept.scores[0]?.score || 0,
    };
  });

  // Sort by total XP descending
  leaderboard.sort((a, b) => b.totalXP - a.totalXP);

  // Top employees
  const topEmployees = await prisma.employeeXP.findMany({
    where: { companyId: auth.companyId, xpTotal: { gt: 0 } },
    include: {
      employee: {
        include: {
          department: true,
          role: true,
        },
      },
    },
    orderBy: { xpTotal: 'desc' },
    take: 10,
  });

  return NextResponse.json({
    departments: leaderboard,
    topEmployees: topEmployees.map((xp) => ({
      id: xp.employee.id,
      name: xp.employee.name,
      department: xp.employee.department.name,
      role: xp.employee.role.title,
      xp: xp.xpTotal,
    })),
  });
}
