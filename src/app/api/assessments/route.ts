import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const cookieStore = cookies();
  const companyId = (await cookieStore).get('sustainance_company_id')?.value;

  if (!companyId) {
    return NextResponse.json({ error: 'No company found' }, { status: 401 });
  }

  const body = await request.json();
  const { roleId } = body;

  if (!roleId) {
    return NextResponse.json({ error: 'Missing roleId' }, { status: 400 });
  }

  // Verify role belongs to company
  const role = await prisma.role.findFirst({
    where: { id: roleId, companyId },
  });

  if (!role) {
    return NextResponse.json({ error: 'Role not found' }, { status: 404 });
  }

  const assessment = await prisma.assessment.create({
    data: { roleId },
    include: {
      role: { include: { function: true } },
    },
  });

  return NextResponse.json(assessment, { status: 201 });
}

export async function GET() {
  const cookieStore = cookies();
  const companyId = (await cookieStore).get('sustainance_company_id')?.value;

  if (!companyId) {
    return NextResponse.json({ error: 'No company found' }, { status: 401 });
  }

  const assessments = await prisma.assessment.findMany({
    where: { role: { companyId } },
    include: {
      role: { include: { function: true } },
      answers: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(assessments);
}
