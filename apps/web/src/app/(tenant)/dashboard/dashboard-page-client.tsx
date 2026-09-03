'use client';

import { TenantAdminHomeScreen } from '../../../modules/tenant/components/setup-checklist';

interface DashboardPageClientProps {
  title: string;
  description: string;
}

export function DashboardPageClient({
  title: _title,
  description: _description,
}: DashboardPageClientProps) {
  return <TenantAdminHomeScreen />;
}
