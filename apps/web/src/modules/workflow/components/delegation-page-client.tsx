'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { PageHeader } from '../../../components/common/page-header';
import { LoadingSpinner } from '../../../components/feedback/loading-spinner';
import { ROUTES } from '../../../constants/routes.constants';
import { TenantSettingsGate } from '../../tenant/components/tenant-settings-gate';
import { TENANT_ADMIN_PERMISSIONS } from '../../tenant/constants/tenant-admin.permissions';
import { useCreateDelegation, useDelegations, useRevokeDelegation } from '../hooks/use-workflows';

export function DelegationPageClient() {
  const t = useTranslations('tenant.approvals.delegation');
  const tn = useTranslations('tenant.nav');
  const tc = useTranslations('common');
  const list = useDelegations();
  const create = useCreateDelegation();
  const revoke = useRevokeDelegation();
  const [form, setForm] = useState({
    delegatorUserId: '',
    delegateUserId: '',
    requestTypes: 'LEAVE',
    startsAt: '',
    endsAt: '',
    reason: '',
  });

  const rows = list.data?.data ?? [];

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await create.mutateAsync({
      delegatorUserId: form.delegatorUserId,
      delegateUserId: form.delegateUserId,
      requestTypes: form.requestTypes.split(',').map((s) => s.trim()).filter(Boolean),
      startsAt: new Date(form.startsAt).toISOString(),
      endsAt: new Date(form.endsAt).toISOString(),
      reason: form.reason,
    });
    setForm({
      delegatorUserId: '',
      delegateUserId: '',
      requestTypes: 'LEAVE',
      startsAt: '',
      endsAt: '',
      reason: '',
    });
  }

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
        <form onSubmit={onSubmit} className="max-w-xl space-y-3 rounded-xl border border-border-default bg-surface-primary p-4">
          <h2 className="text-title-sm font-semibold">{t('create')}</h2>
          <input required placeholder={t('fields.delegator')} value={form.delegatorUserId}
            onChange={(e) => setForm((f) => ({ ...f, delegatorUserId: e.target.value }))}
            className="w-full rounded-md border border-border-default px-3 py-2 text-body-sm" />
          <input required placeholder={t('fields.delegate')} value={form.delegateUserId}
            onChange={(e) => setForm((f) => ({ ...f, delegateUserId: e.target.value }))}
            className="w-full rounded-md border border-border-default px-3 py-2 text-body-sm" />
          <input placeholder={t('fields.requestTypes')} value={form.requestTypes}
            onChange={(e) => setForm((f) => ({ ...f, requestTypes: e.target.value }))}
            className="w-full rounded-md border border-border-default px-3 py-2 text-body-sm" />
          <input type="datetime-local" required value={form.startsAt}
            onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
            className="w-full rounded-md border border-border-default px-3 py-2 text-body-sm" />
          <input type="datetime-local" required value={form.endsAt}
            onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))}
            className="w-full rounded-md border border-border-default px-3 py-2 text-body-sm" />
          <textarea required placeholder={t('fields.reason')} value={form.reason}
            onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
            className="w-full rounded-md border border-border-default px-3 py-2 text-body-sm" rows={3} />
          <button type="submit" className="rounded-md bg-brand-blue-600 px-4 py-2 text-body-sm font-semibold text-white">
            {t('create')}
          </button>
        </form>
        {list.isLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border-default bg-surface-primary">
            <table className="w-full border-collapse text-body-sm">
              <thead>
                <tr className="border-b border-border-default bg-surface-canvas">
                  <th className="px-4 py-3 text-left">{t('columns.delegator')}</th>
                  <th className="px-4 py-3 text-left">{t('columns.delegate')}</th>
                  <th className="px-4 py-3 text-left">{t('columns.types')}</th>
                  <th className="px-4 py-3 text-left">{t('columns.period')}</th>
                  <th className="px-4 py-3 text-left">{t('columns.status')}</th>
                  <th className="px-4 py-3 text-left">{tc('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3 font-mono text-body-xs">{row.delegatorUserId}</td>
                    <td className="px-4 py-3 font-mono text-body-xs">{row.delegateUserId}</td>
                    <td className="px-4 py-3">{row.requestTypes.join(', ')}</td>
                    <td className="px-4 py-3 text-body-xs">
                      {new Date(row.startsAt).toLocaleDateString()} – {new Date(row.endsAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">{row.status}</td>
                    <td className="px-4 py-3">
                      {row.status === 'ACTIVE' ? (
                        <button type="button" onClick={() => revoke.mutate(row.id)} className="text-semantic-danger hover:underline">
                          {t('revoke')}
                        </button>
                      ) : null}
                    </td>
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
