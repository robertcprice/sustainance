import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const [companies, regions, achievements, globalStats] = await Promise.all([
    prisma.communityCompany.findMany({ orderBy: { rank: 'asc' } }),
    prisma.communityRegion.findMany({ orderBy: { score: 'desc' } }),
    prisma.communityAchievement.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.communityGlobalStats.findFirst({ where: { id: 'global' } }),
  ]);

  return NextResponse.json({
    companies: companies.map((c) => ({
      ...c,
      highlights: JSON.parse(c.highlights),
    })),
    regions,
    achievements,
    global: globalStats || {
      globalScore: 62.4,
      scoreChange: 3.8,
      totalCompanies: 2847,
      totalAssessments: 18420,
      avgReadiness: 58.2,
      topIndustryScore: 71.3,
    },
  });
}
