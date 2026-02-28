import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import roleSkillMap from '../../../../../prisma/seed-data/role_skill_map.json';

interface AnswerInput {
  questionId: string;
  score: number;
}

// POST: Create department + role + assessment + submit all answers in one call
// Used during onboarding to capture the user's first assessment inline
export async function POST(request: NextRequest) {
  const auth = await verifyAuth();
  if (!auth?.userId || !auth.companyId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json();
  const { departmentName, roleTitle, functionId, answers } = body as {
    departmentName: string;
    roleTitle: string;
    functionId: string;
    answers: AnswerInput[];
  };

  if (!departmentName || !roleTitle || !functionId || !answers?.length) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // 1. Create (or find) the department
  let department = await prisma.department.findFirst({
    where: { companyId: auth.companyId, name: departmentName },
  });
  if (!department) {
    department = await prisma.department.create({
      data: { name: departmentName, companyId: auth.companyId },
    });
  }

  // 2. Create the role with auto-mapped skill requirements
  const role = await prisma.role.create({
    data: {
      title: roleTitle,
      companyId: auth.companyId,
      functionId,
      departmentId: department.id,
    },
  });

  const skillMap = (roleSkillMap as Record<string, { skillId: string; requiredLevel: number; weight: number }[]>)[functionId];
  if (skillMap) {
    await prisma.roleSkillRequirement.createMany({
      data: skillMap.map(s => ({
        roleId: role.id,
        skillId: s.skillId,
        requiredLevel: s.requiredLevel,
        weight: s.weight,
      })),
    });
  }

  // 3. Create the assessment
  const assessment = await prisma.assessment.create({
    data: { roleId: role.id },
  });

  // 4. Submit all answers
  for (const answer of answers) {
    await prisma.assessmentAnswer.upsert({
      where: {
        assessmentId_questionId: {
          assessmentId: assessment.id,
          questionId: answer.questionId,
        },
      },
      update: { score: answer.score },
      create: {
        assessmentId: assessment.id,
        questionId: answer.questionId,
        score: answer.score,
      },
    });
  }

  // 5. Mark assessment as completed
  await prisma.assessment.update({
    where: { id: assessment.id },
    data: { status: 'completed', completedAt: new Date() },
  });

  return NextResponse.json({
    departmentId: department.id,
    departmentName: department.name,
    roleId: role.id,
    roleTitle: role.title,
    assessmentId: assessment.id,
    answersCount: answers.length,
  }, { status: 201 });
}
