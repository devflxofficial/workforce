'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { PageHeader } from '../../../components/common/page-header';
import { LoadingSpinner } from '../../../components/feedback/loading-spinner';
import { ROUTES } from '../../../constants/routes.constants';
import { maybeToastSuccess, toastApiError } from '../../../lib/api/toast-api';
import { PermissionGate } from '../../../lib/permissions/permission-gate';
import { integrationsApi } from '../api/integrations-api';
import {
  INTEGRATIONS_KEYS,
  useActivateTenantIntegration,
  useCreateTenantIntegration,
  useDisableTenantIntegration,
  useIntegrations,
  useTenantIntegration,
  useTestTenantIntegration,
} from '../hooks/use-integrations';

interface IntegrationSetupPageClientProps {
  adapterId: string;
}

function IntegrationConnectionActions({ integrationId }: { integrationId: string }) {
  const t = useTranslations('tenant.integrations.setup');
  const test = useTestTenantIntegration(integrationId);
  const activate = useActivateTenantIntegration(integrationId);
  const disable = useDisableTenantIntegration(integrationId);

  return (
    <>
      <button type="button" onClick={() => test.mutate()} className="rounded-md border px-4 py-2 text-body-sm">
        {t('test')}
      </button>
      <button
        type="button"
        onClick={() => activate.mutate()}
        className="rounded-md bg-brand-blue-600 px-4 py-2 text-body-sm text-white"
      >
        {t('activate')}
      </button>
      <button type="button" onClick={() => disable.mutate()} className="rounded-md border px-4 py-2 text-body-sm">
        {t('disable')}
      </button>
    </>
  );
}

export function IntegrationSetupPageClient({ adapterId }: IntegrationSetupPageClientProps) {
  const t = useTranslations('tenant.integrations.setup');
  const tn = useTranslations('tenant.nav');
  const tc = useTranslations('common');
  const qc = useQueryClient();
  const catalogue = useIntegrations();
  const catalogueItem = useMemo(
    () => (catalogue.data?.data ?? []).find((i) => i.id === adapterId),
    [catalogue.data?.data, adapterId],
  );
  const tenantIntegrationId = catalogueItem?.tenantIntegrationId ?? null;
  const [localId, setLocalId] = useState<string | null>(tenantIntegrationId);
  const integration = useTenantIntegration(localId ?? undefined);
  const create = useCreateTenantIntegration();
  const [name, setName] = useState('');
  const [configJson, setConfigJson] = useState('{}');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (tenantIntegrationId) setLocalId(tenantIntegrationId);
  }, [tenantIntegrationId]);

  useEffect(() => {
    const row = integration.data?.data;
    if (row) {
      setName(row.name);
      setConfigJson(JSON.stringify(row.configuration ?? {}, null, 2));
    }
  }, [integration.data?.data]);

  async function ensureConnection() {
    if (localId) return localId;
    const res = await create.mutateAsync({
      connectionType: catalogueItem?.category ?? adapterId,
      name: name || `${adapterId} connection`,
      adapterCode: adapterId,
      configuration: {},
    });
    const created = res.data;
    if (created && 'id' in created && typeof created.id === 'string') {
      setLocalId(created.id);
      return created.id;
    }
    return null;
  }

  async function onSave() {
    setSaving(true);
    try {
      const id = await ensureConnection();
      if (!id) return;
      let configuration: Record<string, unknown> = {};
      try {
        configuration = JSON.parse(configJson) as Record<string, unknown>;
      } catch {
        toastApiError(new Error('Invalid JSON'), 'Invalid configuration JSON');
        return;
      }
      const res = await integrationsApi.tenant.update(id, { name, configuration });
      maybeToastSuccess(res);
      void qc.invalidateQueries({ queryKey: INTEGRATIONS_KEYS.all });
    } catch (err) {
      toastApiError(err, 'Request failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <PermissionGate permission="integration.read">
      <div className="space-y-6">
        <PageHeader
          title={t('title', { id: adapterId })}
          description={t('description')}
          breadcrumbs={[
            { label: tn('home'), href: ROUTES.TENANT.DASHBOARD },
            { label: tn('integrations'), href: ROUTES.TENANT.INTEGRATIONS.ROOT },
            { label: adapterId },
          ]}
        />
        {catalogue.isLoading || (localId && integration.isLoading) ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : (
          <div className="max-w-2xl space-y-4 rounded-xl border border-border-default bg-surface-primary p-6">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('fields.name')}
              className="w-full rounded-md border border-border-default px-3 py-2 text-body-sm"
            />
            <textarea
              value={configJson}
              onChange={(e) => setConfigJson(e.target.value)}
              rows={8}
              className="w-full rounded-md border border-border-default px-3 py-2 font-mono text-body-xs"
              placeholder={t('fields.configuration')}
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => void onSave()}
                className="rounded-md border px-4 py-2 text-body-sm"
              >
                {tc('save')}
              </button>
              {localId ? <IntegrationConnectionActions integrationId={localId} /> : null}
            </div>
            {integration.data?.data ? (
              <p className="text-body-sm text-text-secondary">
                {t('statusLabel')}: {integration.data.data.status}
              </p>
            ) : null}
          </div>
        )}
      </div>
    </PermissionGate>
  );
}
