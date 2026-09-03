'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { EmptyState } from '../../../components/feedback/empty-state';
import { PermissionGate } from '../../../lib/permissions/permission-gate';

interface TenantSettingsGateProps {
  permission: string;
  children: ReactNode;
}

export function TenantSettingsGate({ permission, children }: TenantSettingsGateProps) {
  const t = useTranslations();

  return (
    <PermissionGate
      permission={permission}
      fallback={
        <EmptyState
          title={t('errors.unauthorized')}
          description={t('tenant.settings.accessDenied')}
        />
      }
    >
      {children}
    </PermissionGate>
  );
}
