import { cookies } from 'next/headers';
import { prisma } from './prisma';

const SESSION_COOKIE = '__session';
const LEGACY_COOKIE = 'sustainance_company_id';

interface AuthResult {
  userId: string;
  companyId: string | null;
  memberRole: string | null;
}

export async function verifyAuth(): Promise<AuthResult | null> {
  const cookieStore = await cookies();

  // Check for company ID cookie (legacy + demo mode)
  const companyId = cookieStore.get(LEGACY_COOKIE)?.value;
  const sessionValue = cookieStore.get(SESSION_COOKIE)?.value;
  if (companyId) {
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (company) {
      // Prefer the session user, then the company owner, then 'demo' fallback
      const userId = sessionValue || company.userId || 'demo';
      // Look up membership role
      const membership = await prisma.companyMember.findFirst({
        where: { companyId: company.id, userId },
      });
      return {
        userId,
        companyId: company.id,
        memberRole: membership?.role || null,
      };
    }
  }

  // Check session cookie (stores user ID after Google sign-in)
  if (!sessionValue) return null;

  // Try as user ID — find their membership
  const user = await prisma.user.findUnique({
    where: { id: sessionValue },
    include: {
      memberships: {
        include: { company: true },
        orderBy: { joinedAt: 'desc' },
        take: 1,
      },
    },
  });
  if (user) {
    const membership = user.memberships[0];
    return {
      userId: user.id,
      companyId: membership?.companyId || null,
      memberRole: membership?.role || null,
    };
  }

  return null;
}
