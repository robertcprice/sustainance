import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { buildRoleGapSummary } from '@/lib/scoring-engine';

export async function GET() {
  const cookieStore = cookies();
  const companyId = (await cookieStore).get('sustainance_company_id')?.value;

  if (!companyId) {
    return NextResponse.json({ error: 'No company found' }, { status: 401 });
  }

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) {
    return NextResponse.json({ error: 'Company not found' }, { status: 404 });
  }

  const roles = await prisma.role.findMany({
    where: { companyId },
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

  const rows: Record<string, string | number>[] = [];

  for (const role of roles) {
    if (role.assessments.length === 0) continue;
    const latestAssessment = role.assessments.sort(
      (a, b) => (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0)
    )[0];

    const summary = buildRoleGapSummary(
      role.id,
      role.title,
      role.function.name,
      role.skillRequirements,
      latestAssessment.answers
    );

    for (const gap of summary.gaps) {
      rows.push({
        'Company': company.name,
        'Industry': company.industry,
        'Role': role.title,
        'Function': role.function.name,
        'Skill Family': gap.familyName,
        'Skill': gap.skillName,
        'Required Level': gap.requiredLevel,
        'Current Level': gap.currentLevel,
        'Gap': gap.gap,
        'Weight': gap.weight,
        'Severity': gap.severity,
        'Role Readiness %': summary.readinessScore,
        'Role Risk Score': summary.riskScore,
      });
    }
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: 'No assessment data to export' }, { status: 404 });
  }

  // Build CSV manually
  const headers = Object.keys(rows[0]);
  const csvLines = [
    headers.join(','),
    ...rows.map((row) =>
      headers.map((h) => {
        const val = String(row[h]);
        return val.includes(',') ? `"${val}"` : val;
      }).join(',')
    ),
  ];
  const csv = csvLines.join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="sustainance-gaps-${company.name.replace(/\s+/g, '-')}.csv"`,
    },
  });
}
