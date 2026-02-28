import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/questions?type=universal  — returns 5 universal questions
// GET /api/questions?type=function&functionId=tech_it — returns 10 function-specific questions
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const functionId = searchParams.get('functionId');

  let where = {};
  if (type === 'universal') {
    where = { functionId: null };
  } else if (type === 'function' && functionId) {
    where = { functionId };
  } else {
    return NextResponse.json({ error: 'Provide type=universal or type=function&functionId=...' }, { status: 400 });
  }

  const questions = await prisma.question.findMany({
    where,
    orderBy: { orderIndex: 'asc' },
    include: {
      skillMaps: { include: { skill: { include: { family: true } } } },
    },
  });

  return NextResponse.json(questions);
}
