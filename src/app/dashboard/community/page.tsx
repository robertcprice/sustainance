'use client';

import CommunityDashboard from '@/components/community/CommunityDashboard';
import AppShell from '@/components/layout/AppShell';

export default function CommunityPage() {
  return (
    <AppShell>
      <CommunityDashboard embedded />
    </AppShell>
  );
}
