import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import * as fs from 'fs';
import * as path from 'path';

interface SkillMapping {
  skillId: string;
  requiredLevel: number;
  weight: number;
}

function getRoleSkillMap(): Record<string, SkillMapping[]> {
  const filePath = path.join(process.cwd(), 'prisma', 'seed-data', 'role_skill_map.json');
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth();
  if (!auth?.companyId) {
    return NextResponse.json({ error: 'No company found' }, { status: 401 });
  }
  const companyId = auth.companyId;

  const body = await request.json();
  const { title, functionId } = body;

  if (!title || !functionId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Get the function to look up skill mappings
  const func = await prisma.businessFunction.findUnique({ where: { id: functionId } });
  if (!func) {
    return NextResponse.json({ error: 'Function not found' }, { status: 404 });
  }

  // Create role
  const role = await prisma.role.create({
    data: { title, companyId, functionId },
  });

  // Auto-assign skills from role_skill_map.json based on function ID
  const roleSkillMap = getRoleSkillMap();
  const functionSkills = roleSkillMap[func.id];

  if (functionSkills) {
    for (const mapping of functionSkills) {
      await prisma.roleSkillRequirement.create({
        data: {
          roleId: role.id,
          skillId: mapping.skillId,
          requiredLevel: mapping.requiredLevel,
          weight: mapping.weight,
        },
      });
    }
  }

  // Return role with skill requirements
  const fullRole = await prisma.role.findUnique({
    where: { id: role.id },
    include: {
      function: true,
      skillRequirements: {
        include: { skill: { include: { family: true } } },
      },
      assessments: true,
    },
  });

  return NextResponse.json(fullRole, { status: 201 });
}

export async function GET() {
  const auth = await verifyAuth();
  if (!auth?.companyId) {
    return NextResponse.json({ error: 'No company found' }, { status: 401 });
  }
  const companyId = auth.companyId;

  const roles = await prisma.role.findMany({
    where: { companyId },
    include: {
      function: true,
      skillRequirements: {
        include: { skill: { include: { family: true } } },
      },
      assessments: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(roles);
}
