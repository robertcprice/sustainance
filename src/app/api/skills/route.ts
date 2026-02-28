import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const families = await prisma.skillFamily.findMany({
    include: {
      skills: {
        orderBy: { id: 'asc' },
      },
    },
    orderBy: { id: 'asc' },
  });

  return NextResponse.json(families);
}
