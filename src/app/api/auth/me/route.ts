import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// GET: Return current user info including membership role
export async function GET() {
  const auth = await verifyAuth();
  if (!auth?.userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { id: true, name: true, email: true, photoUrl: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  let companyName: string | null = null;
  if (auth.companyId) {
    const company = await prisma.company.findUnique({
      where: { id: auth.companyId },
      select: { name: true },
    });
    companyName = company?.name || null;
  }

  return NextResponse.json({
    userId: user.id,
    name: user.name,
    email: user.email,
    photoUrl: user.photoUrl,
    companyId: auth.companyId,
    companyName,
    memberRole: auth.memberRole,
  });
}
