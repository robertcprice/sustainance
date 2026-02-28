'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from './Sidebar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!data) {
          setReady(true);
          return;
        }

        const { memberRole, email } = data;
        const isDemo = email === 'demo@sustainance.app' || (!email && !memberRole);

        // Demo users get free navigation
        if (isDemo) {
          setReady(true);
          return;
        }

        const isEmployeeRoute = pathname?.startsWith('/dashboard/employee');
        const isAdminRoute = pathname === '/dashboard' || ['/departments', '/roles', '/employees', '/assess', '/reports', '/report', '/leaderboard'].some(r => pathname?.startsWith(r));

        // Members should only see employee views
        if (memberRole === 'Member' && isAdminRoute && !isEmployeeRoute) {
          router.replace('/dashboard/employee/profile');
          return;
        }

        // Managers should only see admin views
        if (memberRole === 'Manager' && isEmployeeRoute) {
          router.replace('/dashboard');
          return;
        }

        setReady(true);
      })
      .catch(() => setReady(true));
  }, [pathname, router]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <main className="ml-64 p-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-slate-400">Loading...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  );
}
