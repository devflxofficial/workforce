'use client';

import { useTranslations } from 'next-intl';
import { PageHeader } from '../../../components/common/page-header';
import { LoadingSpinner } from '../../../components/feedback/loading-spinner';
import { ROUTES } from '../../../constants/routes.constants';
import { TenantSettingsGate } from '../../tenant/components/tenant-settings-gate';
import { TENANT_ADMIN_PERMISSIONS } from '../../tenant/constants/tenant-admin.permissions';
import { useApprovalHistory } from '../hooks/use-workflows';

export function ApprovalHistoryPageClient() {
  const t = useTranslations('tenant.approvals.history');
  const tn = useTranslations('tenant.nav');
  const history = useApprovalHistory();
  const rows = history.data?.data ?? [];

  return (
    <TenantSettingsGate permission={TENANT_ADMIN_PERMISSIONS.SETTINGS_READ}>
      <div className="space-y-6">
        <PageHeader
          title={t('title')}
          description={t('description')}
          breadcrumbs={[
            { label: tn('home'), href: ROUTES.TENANT.DASHBOARD },
            { label: tn('approvals'), href: ROUTES.TENANT.APPROVALS.ROOT },
            { label: t('title') },
          ]}
        />
        {history.isLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border-default bg-surface-primary">
            <table className="w-full border-collapse text-body-sm">
              <thead>
                <tr className="border-b border-border-default bg-surface-canvas">
                  <th className="px-4 py-3 text-left">{t('columns.occurredAt')}</th>
                  <th className="px-4 py-3 text-left">{t('columns.requestType')}</th>
                  <th className="px-4 py-3 text-left">{t('columns.action')}</th>
                  <th className="px-4 py-3 text-left">{t('columns.actor')}</th>
                  <th className="px-4 py-3 text-left">{t('columns.comment')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-text-secondary">{t('empty')}</td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id}>
                      <td className="px-4 py-3">{new Date(row.occurredAt).toLocaleString()}</td>
                      <td className="px-4 py-3">{row.requestType}</td>
                      <td className="px-4 py-3">{row.actionType}</td>
                      <td className="px-4 py-3 font-mono text-body-xs">{row.actorUserId ?? '—'}</td>
                      <td className="px-4 py-3">{row.comment ?? row.employeeName ?? '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </TenantSettingsGate>
  );
}
