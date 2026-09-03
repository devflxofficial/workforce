'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { PageHeader } from '../../../components/common/page-header';
import { LoadingSpinner } from '../../../components/feedback/loading-spinner';
import { Dialog } from '../../../components/ui/dialog';
import { ROUTES } from '../../../constants/routes.constants';
import { PermissionGate } from '../../../lib/permissions/permission-gate';
import { TENANT_ADMIN_PERMISSIONS } from '../../tenant/constants/tenant-admin.permissions';
import {
  useApiClients,
  useCreateApiClient,
  useDeleteApiClient,
  useDisableApiClient,
  useRotateApiClientSecret,
} from '../hooks/use-integrations';

export function ApiCredentialsPageClient() {
  const t = useTranslations('tenant.integrations.credentials');
  const tn = useTranslations('tenant.nav');
  const tc = useTranslations('common');
  const clients = useApiClients();
  const create = useCreateApiClient();
  const rotate = useRotateApiClientSecret();
  const disable = useDisableApiClient();
  const deleteClient = useDeleteApiClient();
  const [open, setOpen] = useState(false);
  const [secretModal, setSecretModal] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', scopes: 'read:employee:tenant' });

  const rows = clients.data?.data ?? [];

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    const res = await create.mutateAsync({
      name: form.name,
      scopes: form.scopes.split(',').map((s) => s.trim()).filter(Boolean),
    });
    setSecretModal(res.data.clientSecret);
    setOpen(false);
    setForm({ name: '', scopes: 'read:employee:tenant' });
  }

  async function onRotate(clientId: string) {
    const res = await rotate.mutateAsync(clientId);
    setSecretModal(res.data.clientSecret);
  }

  return (
    <PermissionGate permission={TENANT_ADMIN_PERMISSIONS.API_CLIENT_READ}>
      <div className="space-y-6">
        <PageHeader
          title={t('title')}
          description={t('description')}
          breadcrumbs={[
            { label: tn('home'), href: ROUTES.TENANT.DASHBOARD },
            { label: tn('integrations'), href: ROUTES.TENANT.INTEGRATIONS.ROOT },
            { label: t('title') },
          ]}
          actions={
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="rounded-md bg-brand-blue-600 px-4 py-2 text-body-sm font-semibold text-white"
            >
              {t('create')}
            </button>
          }
        />
        {clients.isLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border-default bg-surface-primary">
            <table className="w-full border-collapse text-body-sm">
              <thead>
                <tr className="border-b border-border-default bg-surface-canvas">
                  <th className="px-4 py-3 text-left">{t('columns.name')}</th>
                  <th className="px-4 py-3 text-left">{t('columns.scopes')}</th>
                  <th className="px-4 py-3 text-left">{t('columns.lastUsed')}</th>
                  <th className="px-4 py-3 text-left">{t('columns.status')}</th>
                  <th className="px-4 py-3 text-left">{tc('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3">{row.name}</td>
                    <td className="px-4 py-3 font-mono text-body-xs">{row.scopes.join(', ')}</td>
                    <td className="px-4 py-3">
                      {row.lastUsedAt ? new Date(row.lastUsedAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {row.revokedAt ? t('statusRevoked') : t('statusActive')}
                    </td>
                    <td className="px-4 py-3 space-x-2">
                      <button type="button" onClick={() => onRotate(row.id)} className="text-brand-blue-600 hover:underline">
                        {t('rotate')}
                      </button>
                      {!row.revokedAt ? (
                        <button type="button" onClick={() => disable.mutate(row.id)} className="text-body-sm hover:underline">
                          {t('disable')}
                        </button>
                      ) : null}
                      <button type="button" onClick={() => deleteClient.mutate(row.id)} className="text-semantic-danger hover:underline">
                        {tc('delete')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Dialog open={open} onOpenChange={setOpen} title={t('create')}>
          <form onSubmit={onCreate} className="space-y-4">
            <input required placeholder={t('fields.name')} value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-md border border-border-default px-3 py-2" />
            <input required placeholder={t('fields.scopes')} value={form.scopes}
              onChange={(e) => setForm((f) => ({ ...f, scopes: e.target.value }))}
              className="w-full rounded-md border border-border-default px-3 py-2" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="rounded-md border px-4 py-2 text-body-sm">{tc('cancel')}</button>
              <button type="submit" className="rounded-md bg-brand-blue-600 px-4 py-2 text-body-sm font-semibold text-white">{tc('save')}</button>
            </div>
          </form>
        </Dialog>
        <Dialog
          open={secretModal != null}
          onOpenChange={(open) => { if (!open) setSecretModal(null); }}
          title={t('secretTitle')}
        >
          <p className="text-body-sm text-text-secondary">{t('secretHint')}</p>
          <code className="mt-3 block rounded-md bg-surface-canvas p-3 font-mono text-body-xs break-all">{secretModal}</code>
        </Dialog>
      </div>
    </PermissionGate>
  );
}
