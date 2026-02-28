import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const auth = await verifyAuth();
  if (!auth?.companyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name } = await request.json();
  if (!name) {
    return NextResponse.json({ error: 'Department name is required' }, { status: 400 });
  }

  const department = await prisma.department.create({
    data: { name, companyId: auth.companyId },
    include: {
      employees: true,
      roles: true,
      scores: true,
    },
  });

  return NextResponse.json(department, { status: 201 });
}

export async function GET() {
  const auth = await verifyAuth();
  if (!auth?.companyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const departments = await prisma.department.findMany({
    where: { companyId: auth.companyId },
    include: {
      employees: { where: { isActive: true } },
      roles: { include: { function: true } },
      scores: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(departments);
}
