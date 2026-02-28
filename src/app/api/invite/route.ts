import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// Characters that avoid visual confusion (no I/1/O/0/l)
const CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function generateCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

// POST: Generate a new invite code (Manager only)
export async function POST() {
  const auth = await verifyAuth();
  if (!auth?.companyId || !auth.userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  if (auth.memberRole !== 'Manager') {
    return NextResponse.json({ error: 'Only Managers can generate invite codes' }, { status: 403 });
  }

  // Generate a unique code
  let code: string;
  let attempts = 0;
  do {
    code = generateCode();
    const existing = await prisma.inviteCode.findUnique({ where: { code } });
    if (!existing) break;
    attempts++;
  } while (attempts < 10);

  if (attempts >= 10) {
    return NextResponse.json({ error: 'Could not generate unique code' }, { status: 500 });
  }

  const invite = await prisma.inviteCode.create({
    data: {
      code,
      companyId: auth.companyId,
      createdBy: auth.userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  return NextResponse.json({ code: invite.code, expiresAt: invite.expiresAt }, { status: 201 });
}

// GET: List active invite codes for this company (Manager only)
export async function GET() {
  const auth = await verifyAuth();
  if (!auth?.companyId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  if (auth.memberRole !== 'Manager') {
    return NextResponse.json({ error: 'Only Managers can view invite codes' }, { status: 403 });
  }

  const codes = await prisma.inviteCode.findMany({
    where: {
      companyId: auth.companyId,
      expiresAt: { gt: new Date() },
      usedBy: null,
    },
    orderBy: { expiresAt: 'desc' },
    select: {
      code: true,
      expiresAt: true,
      createdBy: true,
    },
  });

  return NextResponse.json(codes);
}
