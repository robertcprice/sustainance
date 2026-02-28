import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { OAuth2Client } from 'google-auth-library';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const SESSION_COOKIE = '__session';
const LEGACY_COOKIE = 'sustainance_company_id';

const client = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

export async function POST(request: NextRequest) {
  const body = await request.json();

  // Demo mode — look up pre-seeded demo user and company (read-only for serverless)
  if (body.demo) {
    const user = await prisma.user.findUnique({ where: { email: 'demo@sustainance.app' } });
    if (!user) {
      return NextResponse.json({ error: 'Demo user not found. Database may need re-seeding.' }, { status: 500 });
    }

    const membership = await prisma.companyMember.findFirst({
      where: { userId: user.id },
      include: { company: true },
      orderBy: { joinedAt: 'desc' },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Demo company not found. Database may need re-seeding.' }, { status: 500 });
    }

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, user.id, { path: '/', maxAge: 60 * 60 * 24 * 30 });
    cookieStore.set(LEGACY_COOKIE, membership.companyId, { path: '/', maxAge: 60 * 60 * 24 * 30 });

    return NextResponse.json({ hasCompany: true, userId: user.id });
  }

  // Google OAuth mode
  if (!client || !body.credential) {
    return NextResponse.json({ error: 'Google OAuth not configured' }, { status: 400 });
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: body.credential,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Upsert user
    let user = await prisma.user.findUnique({ where: { email: payload.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          firebaseUid: payload.sub,
          email: payload.email,
          name: payload.name || payload.email,
          photoUrl: payload.picture || null,
        },
      });
    } else if (!user.firebaseUid) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          firebaseUid: payload.sub,
          name: payload.name || user.name,
          photoUrl: payload.picture || user.photoUrl,
        },
      });
    }

    const membership = await prisma.companyMember.findFirst({
      where: { userId: user.id },
      include: { company: true },
      orderBy: { joinedAt: 'desc' },
    });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, user.id, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30,
    });
    if (membership) {
      cookieStore.set(LEGACY_COOKIE, membership.companyId, { path: '/', maxAge: 60 * 60 * 24 * 30 });
    }

    return NextResponse.json({
      hasCompany: !!membership,
      userId: user.id,
      name: user.name,
      photoUrl: user.photoUrl,
    });
  } catch (err) {
    console.error('Google auth error:', err);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete(LEGACY_COOKIE);
  return NextResponse.json({ success: true });
}
