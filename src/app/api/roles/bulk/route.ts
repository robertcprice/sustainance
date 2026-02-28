import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import roleSkillMap from '../../../../../prisma/seed-data/role_skill_map.json';

interface RoleInput {
  title: string;
  functionId: string;
  departmentId: string;
}

// POST: Create multiple roles with auto-mapped skill requirements
export async function POST(request: NextRequest) {
  const auth = await verifyAuth();
  if (!auth?.userId || !auth.companyId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json();
  const { roles } = body;

  if (!Array.isArray(roles) || roles.length === 0) {
    return NextResponse.json({ error: 'roles array is required' }, { status: 400 });
  }

  const createdRoles = [];

  for (const r of roles as RoleInput[]) {
    if (!r.title || !r.functionId || !r.departmentId) continue;

    const role = await prisma.role.create({
      data: {
        title: r.title,
        companyId: auth.companyId,
        functionId: r.functionId,
        departmentId: r.departmentId,
      },
    });

    // Auto-create RoleSkillRequirements from role_skill_map
    const skillMap = (roleSkillMap as Record<string, { skillId: string; requiredLevel: number; weight: number }[]>)[r.functionId];
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

    createdRoles.push(role);
  }

  return NextResponse.json({ count: createdRoles.length, roles: createdRoles }, { status: 201 });
}
