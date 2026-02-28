import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { buildRoleGapSummary } from '@/lib/scoring-engine';
import { matchIncentives } from '@/lib/incentive-engine';
import { GapResult } from '@/lib/types';

export async function GET() {
  const auth = await verifyAuth();
  if (!auth?.companyId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const company = await prisma.company.findUnique({ where: { id: auth.companyId } });
  if (!company) {
    return NextResponse.json({ error: 'Company not found' }, { status: 404 });
  }

  const roles = await prisma.role.findMany({
    where: { companyId: auth.companyId },
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
      const latest = role.assessments.sort(
        (a, b) => (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0)
      )[0];
      return buildRoleGapSummary(role.id, role.title, role.function.name, role.skillRequirements, latest.answers);
    });

  const allGaps: GapResult[] = roleGaps.flatMap((r) => r.gaps);
  const criticalGaps = allGaps.filter((g) => g.severity === 'critical').length;
  const moderateGaps = allGaps.filter((g) => g.severity === 'moderate').length;
  const onTrack = allGaps.filter((g) => g.severity === 'no_gap').length;

  const programs = await prisma.incentiveProgram.findMany();
  const matched = matchIncentives(programs, company.industry, company.state, allGaps);

  const departments = await prisma.department.findMany({
    where: { companyId: auth.companyId },
    include: { employees: { where: { isActive: true } } },
  });
  const totalEmployees = departments.reduce((sum, d) => sum + d.employees.length, 0);

  return NextResponse.json({
    company: {
      name: company.name,
      industry: company.industry,
      state: company.state,
      size: company.size,
    },
    stats: {
      matchingPrograms: matched.length,
      criticalGaps,
      moderateGaps,
      onTrack,
      totalEmployees,
      rolesAssessed: roleGaps.length,
    },
    programs: matched,
  });
}
