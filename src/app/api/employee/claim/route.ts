import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// POST: Link an unclaimed employee profile to the current user
export async function POST(request: NextRequest) {
  const auth = await verifyAuth();
  if (!auth?.userId || !auth.companyId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Only Members can claim employee profiles
  if (auth.memberRole !== 'Member') {
    return NextResponse.json({ error: 'Only team members can claim profiles' }, { status: 403 });
  }

  const body = await request.json();
  const { employeeId } = body;

  if (!employeeId) {
    return NextResponse.json({ error: 'employeeId is required' }, { status: 400 });
  }

  // Find the employee — must be in same company and unclaimed
  const employee = await prisma.employee.findFirst({
    where: {
      id: employeeId,
      companyId: auth.companyId,
      userId: null,
      isActive: true,
    },
  });

  if (!employee) {
    return NextResponse.json({ error: 'Employee not found or already claimed' }, { status: 404 });
  }

  // Check user doesn't already have a linked employee in this company
  const existing = await prisma.employee.findFirst({
    where: { companyId: auth.companyId, userId: auth.userId },
  });

  if (existing) {
    return NextResponse.json({ error: 'You already have a linked employee profile' }, { status: 409 });
  }

  // Link the employee to the user
  const updated = await prisma.employee.update({
    where: { id: employeeId },
    data: { userId: auth.userId },
    include: { department: true, role: true },
  });

  return NextResponse.json({
    employeeId: updated.id,
    name: updated.name,
    department: updated.department.name,
    role: updated.role.title,
  });
}
