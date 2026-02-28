import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as fs from 'fs';
import * as path from 'path';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { assessmentId } = body;

  if (!assessmentId) {
    return NextResponse.json({ error: 'Missing assessmentId' }, { status: 400 });
  }

  // Load demo answers
  const filePath = path.join(process.cwd(), 'prisma', 'seed-data', 'demo_answers.json');
  const demoData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  // Get assessment with role to determine function
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: { role: true },
  });

  if (!assessment) {
    return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
  }

  // Get applicable questions (universal + function-specific)
  const applicableQuestions = await prisma.question.findMany({
    where: { OR: [{ functionId: null }, { functionId: assessment.role.functionId }] },
    select: { id: true },
  });
  const applicableIds = new Set(applicableQuestions.map((q) => q.id));

  // Filter demo answers to only applicable questions
  const filtered = demoData.answers.filter((a: { questionId: string }) => applicableIds.has(a.questionId));

  // Upsert demo answers
  for (const answer of filtered) {
    await prisma.assessmentAnswer.upsert({
      where: {
        assessmentId_questionId: {
          assessmentId,
          questionId: answer.questionId,
        },
      },
      update: { score: answer.score },
      create: {
        assessmentId,
        questionId: answer.questionId,
        score: answer.score,
      },
    });
  }

  // Mark completed
  const updated = await prisma.assessment.update({
    where: { id: assessmentId },
    data: {
      status: 'completed',
      completedAt: new Date(),
    },
    include: {
      role: true,
      answers: true,
    },
  });

  return NextResponse.json(updated);
}
