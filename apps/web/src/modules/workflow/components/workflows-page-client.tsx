'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { PageHeader } from '../../../components/common/page-header';
import { LoadingSpinner } from '../../../components/feedback/loading-spinner';
import { ROUTES } from '../../../constants/routes.constants';
import { TenantSettingsGate } from '../../tenant/components/tenant-settings-gate';
import { TENANT_ADMIN_PERMISSIONS } from '../../tenant/constants/tenant-admin.permissions';
import { usePublishWorkflowDefinition, useWorkflowDefinitions } from '../hooks/use-workflows';

export function WorkflowsPageClient() {
  const t = useTranslations('tenant.approvals.workflows');
  const tn = useTranslations('tenant.nav');
  const tc = useTranslations('common');
  const defs = useWorkflowDefinitions();
  const publish = usePublishWorkflowDefinition();
  const rows = defs.data?.data ?? [];

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
          actions={
            <Link
              href={ROUTES.TENANT.APPROVALS.WORKFLOW_NEW}
              className="rounded-md bg-brand-blue-600 px-4 py-2 text-body-sm font-semibold text-white"
            >
              {t('create')}
            </Link>
          }
        />
        {defs.isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border-default bg-surface-primary">
            <table className="w-full border-collapse text-body-sm">
              <thead>
                <tr className="border-b border-border-default bg-surface-canvas">
                  <th className="px-4 py-3 text-left">{t('columns.code')}</th>
                  <th className="px-4 py-3 text-left">{t('columns.name')}</th>
                  <th className="px-4 py-3 text-left">{t('columns.requestType')}</th>
                  <th className="px-4 py-3 text-left">{t('columns.stages')}</th>
                  <th className="px-4 py-3 text-left">{t('columns.status')}</th>
                  <th className="px-4 py-3 text-left">{tc('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-text-secondary">{t('empty')}</td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id}>
                      <td className="px-4 py-3 font-mono text-body-xs">{row.code}</td>
                      <td className="px-4 py-3">{row.name}</td>
                      <td className="px-4 py-3">{row.requestType}</td>
                      <td className="px-4 py-3">{row.stageCount}</td>
                      <td className="px-4 py-3">{row.status}</td>
                      <td className="px-4 py-3">
                        {row.status === 'DRAFT' ? (
                          <button
                            type="button"
                            onClick={() => publish.mutate(row.id)}
                            className="text-brand-blue-600 hover:underline"
                          >
                            {t('publish')}
                          </button>
                        ) : null}
                      </td>
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
