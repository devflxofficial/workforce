import type { ReactNode } from 'react';
import { AuthGate } from '../../lib/auth/auth-gate';
import { TenantShell } from '../../components/layout/tenant-shell';

interface TenantLayoutProps {
  children: ReactNode;
}

export default function TenantLayout({ children }: TenantLayoutProps) {
  return (
    <AuthGate scope="tenant">
      <TenantShell>{children}</TenantShell>
    </AuthGate>
  );
}
