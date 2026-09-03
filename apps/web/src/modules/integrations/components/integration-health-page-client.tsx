'use client';

import { useTranslations } from 'next-intl';
import { PageHeader } from '../../../components/common/page-header';
import { LoadingSpinner } from '../../../components/feedback/loading-spinner';
import { ROUTES } from '../../../constants/routes.constants';
import { PermissionGate } from '../../../lib/permissions/permission-gate';
import { useIntegrationHealth } from '../hooks/use-integrations';

export function IntegrationHealthPageClient() {
  const t = useTranslations('tenant.integrations.health');
  const tn = useTranslations('tenant.nav');
  const health = useIntegrationHealth();
  const data = health.data?.data;

  return (
    <PermissionGate permission="integration.read">
      <div className="space-y-6">
        <PageHeader
          title={t('title')}
          description={t('description')}
          breadcrumbs={[
            { label: tn('home'), href: ROUTES.TENANT.DASHBOARD },
            { label: tn('integrations'), href: ROUTES.TENANT.INTEGRATIONS.ROOT },
            { label: t('title') },
          ]}
        />
        {health.isLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : data ? (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-border-default bg-surface-primary p-4">
                <p className="text-body-sm text-text-secondary">{t('activeConnections')}</p>
                <p className="text-title-lg font-semibold">{data.activeConnections}</p>
              </div>
              <div className="rounded-xl border border-border-default bg-surface-primary p-4">
                <p className="text-body-sm text-text-secondary">{t('failedConnections')}</p>
                <p className="text-title-lg font-semibold">{data.failedConnections}</p>
              </div>
              <div className="rounded-xl border border-border-default bg-surface-primary p-4">
                <p className="text-body-sm text-text-secondary">{t('unmappedEvents')}</p>
                <p className="text-title-lg font-semibold">{data.unmappedEvents}</p>
              </div>
            </div>
            <div className="overflow-x-auto rounded-xl border border-border-default bg-surface-primary">
              <table className="w-full border-collapse text-body-sm">
                <thead>
                  <tr className="border-b border-border-default bg-surface-canvas">
                    <th className="px-4 py-3 text-left">{t('columns.integration')}</th>
                    <th className="px-4 py-3 text-left">{t('columns.status')}</th>
                    <th className="px-4 py-3 text-left">{t('columns.items')}</th>
                    <th className="px-4 py-3 text-left">{t('columns.started')}</th>
                    <th className="px-4 py-3 text-left">{t('columns.message')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {data.recentSyncRuns.map((run) => (
                    <tr key={run.id}>
                      <td className="px-4 py-3">{run.integrationName}</td>
                      <td className="px-4 py-3">{run.status}</td>
                      <td className="px-4 py-3">{run.itemsProcessed}</td>
                      <td className="px-4 py-3">{new Date(run.startedAt).toLocaleString()}</td>
                      <td className="px-4 py-3">{run.message ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </div>
    </PermissionGate>
  );
}
