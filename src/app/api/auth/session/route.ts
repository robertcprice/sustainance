import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { seedDemoData } from '@/lib/seed-demo';
import { OAuth2Client } from 'google-auth-library';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const SESSION_COOKIE = '__session';
const LEGACY_COOKIE = 'sustainance_company_id';
const DEMO_COMPANY_ID = 'demo_test_inc';

const client = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

export async function POST(request: NextRequest) {
  const body = await request.json();

  // Demo mode — auto-create user, company, membership, and seed data
  if (body.demo) {
    let user = await prisma.user.findUnique({ where: { email: 'demo@sustainance.app' } });
    if (!user) {
      user = await prisma.user.create({
        data: { email: 'demo@sustainance.app', name: 'Demo User' },
      });
    }

    // Check for existing membership
    let membership = await prisma.companyMember.findFirst({
      where: { userId: user.id },
      include: { company: true },
      orderBy: { joinedAt: 'desc' },
    });

    // If no membership, create "TEST INCORPORATED" company + membership + seed
    if (!membership) {
      // Create or find the demo company
      let company = await prisma.company.findUnique({ where: { id: DEMO_COMPANY_ID } });
      if (!company) {
        company = await prisma.company.create({
          data: {
            id: DEMO_COMPANY_ID,
            name: 'TEST INCORPORATED',
            industry: 'Technology',
            size: 'medium',
            state: 'California',
            userId: user.id,
          },
        });
      }

      // Create membership
      membership = await prisma.companyMember.create({
        data: {
          userId: user.id,
          companyId: company.id,
          role: 'Manager',
        },
        include: { company: true },
      });

      // Auto-seed demo data
      try {
        await seedDemoData(company.id, user.id);
      } catch (e) {
        console.error('Auto-seed failed:', e);
        // Non-fatal — user can still use the app
      }
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
