import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const body = await request.json();
  const { answers } = body as { answers: { questionId: string; score: number }[] };

  if (!answers || !Array.isArray(answers) || answers.length === 0) {
    return NextResponse.json({ error: 'Missing answers' }, { status: 400 });
  }

  // Verify assessment exists
  const assessment = await prisma.assessment.findUnique({
    where: { id },
    include: { role: true },
  });
  if (!assessment) {
    return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
  }

  // Upsert all answers
  for (const answer of answers) {
    await prisma.assessmentAnswer.upsert({
      where: {
        assessmentId_questionId: {
          assessmentId: id,
          questionId: answer.questionId,
        },
      },
      update: { score: answer.score },
      create: {
        assessmentId: id,
        questionId: answer.questionId,
        score: answer.score,
      },
    });
  }

  // Mark assessment as completed
  const updated = await prisma.assessment.update({
    where: { id },
    data: {
      status: 'completed',
      completedAt: new Date(),
    },
    include: {
      role: true,
      answers: true,
    },
  });

  // Award XP to employees linked to this role
  const employees = await prisma.employee.findMany({
    where: { roleId: assessment.roleId, isActive: true },
  });

  for (const emp of employees) {
    // Calculate XP: 10 per skill assessed + bonuses for high scores
    let xpEarned = answers.length * 10; // base: 10 XP per question
    const highScores = answers.filter(a => a.score >= 3).length;
    const expertScores = answers.filter(a => a.score >= 4).length;
    xpEarned += highScores * 50;   // +50 for Proficient
    xpEarned += expertScores * 100; // +100 for Expert (stacks with Proficient bonus)
    if (answers.length >= 15) xpEarned += 25; // completion bonus

    await prisma.employeeXP.upsert({
      where: { companyId_employeeId: { companyId: emp.companyId, employeeId: emp.id } },
      update: { xpTotal: { increment: xpEarned }, lastUpdated: new Date() },
      create: { companyId: emp.companyId, employeeId: emp.id, xpTotal: xpEarned },
    });

    // Update department score
    await prisma.departmentScore.upsert({
      where: { companyId_departmentId: { companyId: emp.companyId, departmentId: emp.departmentId } },
      update: { score: { increment: xpEarned }, lastUpdated: new Date() },
      create: { companyId: emp.companyId, departmentId: emp.departmentId, score: xpEarned },
    });
  }

  return NextResponse.json(updated);
}
