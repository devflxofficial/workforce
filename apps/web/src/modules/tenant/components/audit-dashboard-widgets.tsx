'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { StatCard } from '../../../components/common/stat-card';
import { LoadingSpinner } from '../../../components/feedback/loading-spinner';
import { ROUTES } from '../../../constants/routes.constants';
import { useAuditSummary } from '../hooks/use-tenant-admin';

export function AuditDashboardWidgets() {
  const t = useTranslations();
  const { data, isLoading } = useAuditSummary();
  const widgets = data?.data?.widgets;

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (!widgets) return null;

  const items = [
    { key: 'sensitiveChanges', value: widgets.sensitiveChanges, filter: { severity: 'WARNING' } },
    { key: 'roleChanges', value: widgets.roleChanges, filter: { action: 'role' } },
    { key: 'payrollActions', value: widgets.payrollActions, filter: { module: 'payroll' } },
    { key: 'attendanceChanges', value: widgets.attendanceChanges, filter: { module: 'attendance' } },
    { key: 'failedLogins', value: widgets.failedLogins, filter: { action: 'login.failed' } },
    { key: 'supportAccess', value: widgets.supportAccess, filter: { action: 'support' } },
    { key: 'dataExports', value: widgets.dataExports, filter: { action: 'export' } },
  ] as const;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Link
          key={item.key}
          href={`${ROUTES.TENANT.AUDIT}?module=${'module' in item.filter ? item.filter.module ?? '' : ''}&action=${'action' in item.filter ? item.filter.action ?? '' : ''}&severity=${'severity' in item.filter ? item.filter.severity ?? '' : ''}`}
          className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-600"
        >
          <StatCard
            title={t(`tenant.settings.audit.widgets.${item.key}` as Parameters<typeof t>[0])}
            value={item.value}
            className="h-full transition-shadow hover:shadow-elevation-2"
          />
        </Link>
      ))}
    </div>
  );
}
