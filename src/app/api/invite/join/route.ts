import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

const LEGACY_COOKIE = 'sustainance_company_id';

// POST: Redeem an invite code
export async function POST(request: NextRequest) {
  const auth = await verifyAuth();
  if (!auth?.userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json();
  const { code } = body;

  if (!code || typeof code !== 'string') {
    return NextResponse.json({ error: 'Invite code is required' }, { status: 400 });
  }

  const normalizedCode = code.trim().toUpperCase();

  // Find the invite code
  const invite = await prisma.inviteCode.findUnique({
    where: { code: normalizedCode },
    include: { company: true },
  });

  if (!invite) {
    return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 });
  }

  if (invite.usedBy) {
    return NextResponse.json({ error: 'This invite code has already been used' }, { status: 410 });
  }

  if (invite.expiresAt < new Date()) {
    return NextResponse.json({ error: 'This invite code has expired' }, { status: 410 });
  }

  // Check if user is already a member
  const existingMembership = await prisma.companyMember.findUnique({
    where: { userId_companyId: { userId: auth.userId, companyId: invite.companyId } },
  });

  if (existingMembership) {
    return NextResponse.json({ error: 'You are already a member of this company' }, { status: 409 });
  }

  // Create membership and mark code as used in a transaction
  await prisma.$transaction([
    prisma.companyMember.create({
      data: {
        userId: auth.userId,
        companyId: invite.companyId,
        role: 'Member',
      },
    }),
    prisma.inviteCode.update({
      where: { id: invite.id },
      data: {
        usedBy: auth.userId,
        usedAt: new Date(),
      },
    }),
  ]);

  // Set the company cookie so routes pick it up
  const cookieStore = await cookies();
  cookieStore.set(LEGACY_COOKIE, invite.companyId, {
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });

  // Check if user already has a linked employee profile
  const linkedEmployee = await prisma.employee.findFirst({
    where: { companyId: invite.companyId, userId: auth.userId },
  });

  return NextResponse.json({
    companyId: invite.companyId,
    companyName: invite.company.name,
    role: 'Member',
    needsClaimProfile: !linkedEmployee,
  });
}
