'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { PageHeader } from '../../../components/common/page-header';
import { LoadingSpinner } from '../../../components/feedback/loading-spinner';
import { EmptyState } from '../../../components/feedback/empty-state';
import { ROUTES } from '../../../constants/routes.constants';
import { AuditDashboardWidgets } from '../../../modules/tenant/components/audit-dashboard-widgets';
import { TenantSettingsGate } from '../../../modules/tenant/components/tenant-settings-gate';
import { TENANT_ADMIN_PERMISSIONS } from '../../../modules/tenant/constants/tenant-admin.permissions';
import { useTenantAudit } from '../../../modules/tenant/hooks/use-tenant-admin';
import Link from 'next/link';

export default function AuditPage() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const [moduleFilter, setModuleFilter] = useState(searchParams.get('module') ?? '');
  const [actionFilter, setActionFilter] = useState(searchParams.get('action') ?? '');
  const [severityFilter, setSeverityFilter] = useState(searchParams.get('severity') ?? '');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const { data, isLoading, isError, refetch } = useTenantAudit({
    module: moduleFilter || undefined,
    action: actionFilter || undefined,
    severity: severityFilter || undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    pageSize: 50,
  });

  return (
    <TenantSettingsGate permission={TENANT_ADMIN_PERMISSIONS.AUDIT_READ}>
      <div className="space-y-6">
        <PageHeader
          title={t('tenant.settings.audit.title')}
          description={t('tenant.settings.audit.description')}
        />
        <AuditDashboardWidgets />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input
            className="rounded-md border border-border-default px-3 py-2 text-body-sm"
            placeholder={t('tenant.settings.audit.filterModule')}
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
          />
          <input
            className="rounded-md border border-border-default px-3 py-2 text-body-sm"
            placeholder={t('tenant.settings.audit.filterAction')}
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          />
          <input
            className="rounded-md border border-border-default px-3 py-2 text-body-sm"
            placeholder={t('tenant.settings.audit.filterSeverity')}
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
          />
          <input
            type="date"
            className="rounded-md border border-border-default px-3 py-2 text-body-sm"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            aria-label={t('tenant.settings.audit.fromDate')}
          />
          <input
            type="date"
            className="rounded-md border border-border-default px-3 py-2 text-body-sm"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            aria-label={t('tenant.settings.audit.toDate')}
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : isError ? (
          <EmptyState
            title={t('common.error')}
            action={
              <button type="button" onClick={() => void refetch()}>
                {t('common.retry')}
              </button>
            }
          />
        ) : (data?.data ?? []).length === 0 ? (
          <EmptyState title={t('tenant.settings.audit.empty')} />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border-default">
            <table className="min-w-full text-left text-body-sm">
              <thead className="bg-surface-muted">
                <tr>
                  <th className="px-3 py-2">{t('tenant.settings.audit.when')}</th>
                  <th className="px-3 py-2">{t('tenant.settings.audit.actor')}</th>
                  <th className="px-3 py-2">{t('tenant.settings.audit.module')}</th>
                  <th className="px-3 py-2">{t('tenant.settings.audit.action')}</th>
                  <th className="px-3 py-2">{t('tenant.settings.audit.resource')}</th>
                  <th className="px-3 py-2">{t('tenant.settings.audit.severity')}</th>
                </tr>
              </thead>
              <tbody>
                {(data?.data ?? []).map((e) => (
                  <tr key={e.id} className="border-t border-border-default">
                    <td className="px-3 py-2">{new Date(e.occurredAt).toLocaleString()}</td>
                    <td className="px-3 py-2">{e.actorEmail ?? e.actorId}</td>
                    <td className="px-3 py-2">{e.module}</td>
                    <td className="px-3 py-2">
                      <Link href={ROUTES.TENANT.AUDIT_DETAIL(e.id)} className="text-brand-blue-600">
                        {e.action}
                      </Link>
                    </td>
                    <td className="px-3 py-2">
                      {e.resourceType}
                      {e.resourceId ? ` · ${e.resourceId}` : ''}
                    </td>
                    <td className="px-3 py-2">{e.severity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </TenantSettingsGate>
  );
}
