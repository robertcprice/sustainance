import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// GET: List unclaimed employees in the current company
export async function GET() {
  const auth = await verifyAuth();
  if (!auth?.userId || !auth.companyId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const employees = await prisma.employee.findMany({
    where: {
      companyId: auth.companyId,
      userId: null,
      isActive: true,
    },
    include: {
      department: { select: { name: true } },
      role: { select: { title: true } },
    },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json({ employees });
}
