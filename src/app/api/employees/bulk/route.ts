import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

interface EmployeeInput {
  name: string;
  departmentId: string;
  roleId: string;
}

// POST: Create multiple employees at once
export async function POST(request: NextRequest) {
  const auth = await verifyAuth();
  if (!auth?.userId || !auth.companyId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json();
  const { employees } = body;

  if (!Array.isArray(employees) || employees.length === 0) {
    return NextResponse.json({ error: 'employees array is required' }, { status: 400 });
  }

  const created = await prisma.employee.createMany({
    data: (employees as EmployeeInput[])
      .filter(e => e.name && e.departmentId && e.roleId)
      .map(e => ({
        companyId: auth.companyId!,
        name: e.name,
        departmentId: e.departmentId,
        roleId: e.roleId,
      })),
  });

  return NextResponse.json({ count: created.count }, { status: 201 });
}
