import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const auth = await verifyAuth();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!auth.companyId) {
    return NextResponse.json({ error: 'No company found' }, { status: 400 });
  }

  const body = await req.json();
  const { name, greenFilter, includeInternal, message, invitedCompanyIds } = body;

  const campaign = await prisma.campaign.create({
    data: {
      name: name || 'Untitled Campaign',
      creatorCompanyId: auth.companyId,
      greenFilter: greenFilter || 'all',
      includeInternal: includeInternal || false,
      message: message || null,
      status: 'launched',
      invitedCompanyIds: JSON.stringify(invitedCompanyIds || []),
      launchedAt: new Date(),
    },
  });

  return NextResponse.json({ campaign });
}

export async function GET() {
  const auth = await verifyAuth();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!auth.companyId) {
    return NextResponse.json({ campaigns: [] });
  }

  const campaigns = await prisma.campaign.findMany({
    where: { creatorCompanyId: auth.companyId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    campaigns: campaigns.map((c) => ({
      ...c,
      invitedCompanyIds: JSON.parse(c.invitedCompanyIds),
    })),
  });
}
