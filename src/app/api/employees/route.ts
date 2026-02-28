import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const auth = await verifyAuth();
  if (!auth?.companyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name, departmentId, roleId } = await request.json();
  if (!name || !departmentId || !roleId) {
    return NextResponse.json({ error: 'name, departmentId, and roleId are required' }, { status: 400 });
  }

  // Verify department and role belong to company
  const department = await prisma.department.findFirst({
    where: { id: departmentId, companyId: auth.companyId },
  });
  if (!department) {
    return NextResponse.json({ error: 'Department not found' }, { status: 404 });
  }

  const role = await prisma.role.findFirst({
    where: { id: roleId, companyId: auth.companyId },
  });
  if (!role) {
    return NextResponse.json({ error: 'Role not found' }, { status: 404 });
  }

  const employee = await prisma.employee.create({
    data: {
      name,
      companyId: auth.companyId,
      departmentId,
      roleId,
    },
    include: {
      department: true,
      role: { include: { function: true } },
    },
  });

  // Initialize XP record
  await prisma.employeeXP.create({
    data: {
      companyId: auth.companyId,
      employeeId: employee.id,
      xpTotal: 0,
    },
  });

  return NextResponse.json(employee, { status: 201 });
}

export async function GET(request: NextRequest) {
  const auth = await verifyAuth();
  if (!auth?.companyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const departmentId = searchParams.get('departmentId');

  const where: Record<string, unknown> = {
    companyId: auth.companyId,
    isActive: true,
  };
  if (departmentId) {
    where.departmentId = departmentId;
  }

  const rawEmployees = await prisma.employee.findMany({
    where,
    include: {
      department: true,
      role: { include: { function: true } },
      xp: true,
      assessments: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  // Normalize response with flat field names for employee-facing pages
  const employees = rawEmployees.map((emp) => ({
    ...emp,
    departmentName: emp.department.name,
    roleTitle: emp.role.title,
    roleFunction: emp.role.function.name,
  }));

  return NextResponse.json({ employees });
}

export async function DELETE(request: NextRequest) {
  const auth = await verifyAuth();
  if (!auth?.companyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get('id');
  if (!employeeId) {
    return NextResponse.json({ error: 'Employee id required' }, { status: 400 });
  }

  // Soft delete
  await prisma.employee.update({
    where: { id: employeeId },
    data: { isActive: false, deactivatedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
