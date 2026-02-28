import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildRoleGapSummary } from '@/lib/scoring-engine';

export async function GET() {
  // No auth required - public endpoint
  const companies = await prisma.company.findMany({
    where: { isPublic: true },
    include: {
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
                include: {
                  question: { include: { skillMaps: true } },
                },
              },
            },
          },
        },
      },
      employees: true,
      departments: true,
    },
  });

  const cards = companies.map((company) => {
    const roleGaps = company.roles
      .filter((r) => r.assessments.length > 0)
      .map((role) => {
        const latestAssessment = role.assessments.sort(
          (a, b) => (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0)
        )[0];
        return buildRoleGapSummary(
          role.id,
          role.title,
          role.function.name,
          role.skillRequirements,
          latestAssessment.answers
        );
      });

    const allGaps = roleGaps.flatMap((r) => r.gaps);
    const overallReadiness =
      allGaps.length > 0
        ? Math.round((allGaps.filter((g) => g.severity === 'no_gap').length / allGaps.length) * 100)
        : 0;

    return {
      id: company.id,
      name: company.name,
      industry: company.industry,
      size: company.size,
      description: company.description,
      overallReadiness,
      totalRolesAssessed: roleGaps.length,
      totalEmployees: company.employees.length,
      totalDepartments: company.departments.length,
      gapSummary: {
        critical: allGaps.filter((g) => g.severity === 'critical').length,
        moderate: allGaps.filter((g) => g.severity === 'moderate').length,
        no_gap: allGaps.filter((g) => g.severity === 'no_gap').length,
      },
    };
  });

  return NextResponse.json(cards);
}
