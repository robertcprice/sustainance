import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const assessment = await prisma.assessment.findUnique({
    where: { id },
    include: {
      role: {
        include: {
          function: true,
          skillRequirements: {
            include: { skill: { include: { family: true } } },
          },
        },
      },
      answers: true,
    },
  });

  if (!assessment) {
    return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
  }

  // Get questions: universal (functionId=null) + function-specific
  const functionId = assessment.role.functionId;
  const questions = await prisma.question.findMany({
    where: { OR: [{ functionId: null }, { functionId }] },
    orderBy: { orderIndex: 'asc' },
    include: {
      skillMaps: { include: { skill: { include: { family: true } } } },
    },
  });

  return NextResponse.json({ assessment, questions });
}
