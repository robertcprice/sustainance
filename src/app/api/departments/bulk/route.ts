import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// POST: Create multiple departments at once
export async function POST(request: NextRequest) {
  const auth = await verifyAuth();
  if (!auth?.userId || !auth.companyId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json();
  const { departments } = body;

  if (!Array.isArray(departments) || departments.length === 0) {
    return NextResponse.json({ error: 'departments array is required' }, { status: 400 });
  }

  const created = await prisma.department.createMany({
    data: departments.map((d: { name: string }) => ({
      companyId: auth.companyId!,
      name: d.name,
    })),
  });

  // Return the created departments so the client has their IDs
  const allDepts = await prisma.department.findMany({
    where: { companyId: auth.companyId },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json({ count: created.count, departments: allDepts }, { status: 201 });
}
