import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const functions = await prisma.businessFunction.findMany({
    orderBy: { id: 'asc' },
  });
  return NextResponse.json(functions);
}
