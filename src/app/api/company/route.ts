import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, industry, size, state } = body;

  if (!name || !industry || !size || !state) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Try to link to authenticated user
  const auth = await verifyAuth();
  const userId = auth?.userId || null;

  // If we have a userId that's actually a user ID (not company ID), use it
  let validUserId: string | null = null;
  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) validUserId = user.id;
  }

  const company = await prisma.company.create({
    data: { name, industry, size, state, userId: validUserId },
  });

  // Create CompanyMember with Manager role
  if (validUserId) {
    await prisma.companyMember.create({
      data: {
        userId: validUserId,
        companyId: company.id,
        role: 'Manager',
      },
    });
  }

  const cookieStore = await cookies();
  cookieStore.set('sustainance_company_id', company.id, {
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });

  return NextResponse.json(company, { status: 201 });
}

export async function GET() {
  const auth = await verifyAuth();
  if (!auth?.companyId) {
    return NextResponse.json({ error: 'No company found' }, { status: 404 });
  }

  const company = await prisma.company.findUnique({
    where: { id: auth.companyId },
  });

  if (!company) {
    return NextResponse.json({ error: 'Company not found' }, { status: 404 });
  }

  return NextResponse.json(company);
}
