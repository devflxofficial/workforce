'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { PageHeader } from '../../../components/common/page-header';
import { LoadingSpinner } from '../../../components/feedback/loading-spinner';
import { ROUTES } from '../../../constants/routes.constants';
import { PermissionGate } from '../../../lib/permissions/permission-gate';
import { useExternalMappings, useIntegrations, useMapExternal } from '../hooks/use-integrations';

export function BiometricPageClient() {
  const t = useTranslations('tenant.integrations.biometric');
  const tn = useTranslations('tenant.nav');
  const integrations = useIntegrations();
  const biometric = (integrations.data?.data ?? []).find((i) => i.id === 'biometric');
  const mappingLink = ROUTES.TENANT.INTEGRATIONS.BIOMETRIC_MAPPING;

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
        <p className="text-body-sm text-text-secondary">
          {biometric?.configured
            ? t('configured')
            : t('notConfigured')}
        </p>
        <Link href={ROUTES.TENANT.INTEGRATIONS.SETUP('biometric')} className="text-brand-blue-600 hover:underline">
          {t('setupLink')}
        </Link>
        <Link href={mappingLink} className="ml-4 text-brand-blue-600 hover:underline">
          {t('mappingLink')}
        </Link>
      </div>
    </PermissionGate>
  );
}

export function BiometricMappingPageClient() {
  const t = useTranslations('tenant.integrations.biometric');
  const tn = useTranslations('tenant.nav');
  const tc = useTranslations('common');
  const integrations = useIntegrations();
  const biometric = (integrations.data?.data ?? []).find((i) => i.id === 'biometric');
  const integrationId = biometric?.tenantIntegrationId ?? undefined;
  const mappings = useExternalMappings(integrationId);
  const mapExternal = useMapExternal();
  const [internalIds, setInternalIds] = useState<Record<string, string>>({});
  const rows = mappings.data?.data ?? [];

  return (
    <PermissionGate permission="integration.read">
      <div className="space-y-6">
        <PageHeader
          title={t('mappingTitle')}
          description={t('mappingDescription')}
          breadcrumbs={[
            { label: tn('home'), href: ROUTES.TENANT.DASHBOARD },
            { label: tn('integrations'), href: ROUTES.TENANT.INTEGRATIONS.ROOT },
            { label: t('mappingTitle') },
          ]}
        />
        {mappings.isLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border-default bg-surface-primary">
            <table className="w-full border-collapse text-body-sm">
              <thead>
                <tr className="border-b border-border-default bg-surface-canvas">
                  <th className="px-4 py-3 text-left">{t('columns.externalId')}</th>
                  <th className="px-4 py-3 text-left">{t('columns.type')}</th>
                  <th className="px-4 py-3 text-left">{t('columns.status')}</th>
                  <th className="px-4 py-3 text-left">{t('columns.internalId')}</th>
                  <th className="px-4 py-3 text-left">{tc('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-text-secondary">{t('mappingEmpty')}</td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id}>
                      <td className="px-4 py-3 font-mono text-body-xs">{row.externalId}</td>
                      <td className="px-4 py-3">{row.mappingType}</td>
                      <td className="px-4 py-3">{row.status}</td>
                      <td className="px-4 py-3">
                        <input
                          value={internalIds[row.id] ?? row.internalId ?? ''}
                          onChange={(e) => setInternalIds((m) => ({ ...m, [row.id]: e.target.value }))}
                          className="w-full rounded-md border border-border-default px-2 py-1 text-body-xs"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => {
                            const val = internalIds[row.id] ?? row.internalId;
                            if (val) mapExternal.mutate({ mappingId: row.id, internalId: val });
                          }}
                          className="text-brand-blue-600 hover:underline"
                        >
                          {t('map')}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PermissionGate>
  );
}
