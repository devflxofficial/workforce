'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { PageHeader } from '../../../components/common/page-header';
import { LoadingSpinner } from '../../../components/feedback/loading-spinner';
import { StatCard } from '../../../components/common/stat-card';
import { ROUTES } from '../../../constants/routes.constants';
import { TenantSettingsGate } from './tenant-settings-gate';
import { TENANT_ADMIN_PERMISSIONS } from '../constants/tenant-admin.permissions';
import {
  useCreateUpgradeRequest,
  useTenantModules,
  useTenantSubscription,
  useTenantUsage,
  useUpgradeRequests,
} from '../hooks/use-tenant-admin';

export function SubscriptionPageClient() {
  const t = useTranslations();
  const sub = useTenantSubscription();
  const usage = useTenantUsage();
  const modules = useTenantModules();
  const upgradeRequests = useUpgradeRequests();
  const upgrade = useCreateUpgradeRequest();
  const [planKey, setPlanKey] = useState('');
  const [note, setNote] = useState('');
  const [billingEmail, setBillingEmail] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [additionalSeats, setAdditionalSeats] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');

  if (sub.isLoading || usage.isLoading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const s = sub.data?.data;
  const u = usage.data?.data;

  return (
    <TenantSettingsGate permission={TENANT_ADMIN_PERMISSIONS.SUBSCRIPTION_READ}>
      <div className="space-y-6">
        <PageHeader
          title={t('tenant.settings.subscription.title')}
          description={t('tenant.settings.subscription.description')}
          breadcrumbs={[
            { label: t('tenant.nav.home'), href: ROUTES.TENANT.DASHBOARD },
            { label: t('tenant.nav.subscription') },
          ]}
          actions={
            <Link
              href={ROUTES.TENANT.SETTINGS_SUBSCRIPTION_COMPARE}
              className="text-body-sm text-brand-blue-600"
            >
              {t('tenant.settings.subscription.compareLink')}
            </Link>
          }
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title={t('tenant.settings.subscription.planLabel')} value={s?.planName ?? s?.planCode ?? '—'} />
          <StatCard title={t('tenant.settings.subscription.activeEmployees')} value={u?.activeEmployees ?? 0} />
          <StatCard title={t('tenant.settings.subscription.invitedUsers')} value={u?.invitedUsers ?? 0} />
          <StatCard
            title={t('tenant.settings.subscription.seatLimit')}
            value={u?.seatLimit ?? s?.seatLimit ?? '—'}
          />
          <StatCard
            title={t('tenant.settings.subscription.storage')}
            value={u ? `${Math.round(u.storageUsedBytes / (1024 * 1024))} MB` : '—'}
          />
          <StatCard title={t('tenant.settings.subscription.apiUsage')} value={u?.apiCallsMonth ?? 0} />
          <StatCard
            title={t('tenant.settings.subscription.integrationVolume')}
            value={u?.integrationEventVolume ?? 0}
          />
          <StatCard title={t('tenant.settings.subscription.exportVolume')} value={u?.exportVolume ?? 0} />
        </div>
        {u?.warnings.approachingSeatLimit ? (
          <p className="text-body-sm text-status-warning">{t('tenant.settings.subscription.approaching')}</p>
        ) : null}
        {u?.warnings.seatLimitReached ? (
          <p className="text-body-sm text-status-danger">{t('tenant.settings.subscription.reached')}</p>
        ) : null}

        <form
          className="space-y-3 rounded-lg border border-border-default bg-surface-card p-4"
          onSubmit={(e) => {
            e.preventDefault();
            void upgrade.mutateAsync({
              requestedPlanKey: planKey || undefined,
              note: note || undefined,
              businessReason: note || undefined,
              billingContactEmail: billingEmail || undefined,
              contactPersonName: contactPerson || undefined,
              additionalSeats: additionalSeats ? Number(additionalSeats) : undefined,
              requestedEffectiveDate: effectiveDate || undefined,
            });
          }}
        >
          <h2 className="text-title-sm font-semibold">{t('tenant.settings.subscription.requestUpgrade')}</h2>
          <select
            className="w-full rounded-md border border-border-default px-3 py-2"
            value={planKey}
            onChange={(e) => setPlanKey(e.target.value)}
          >
            <option value="">{t('tenant.settings.subscription.selectPlan')}</option>
            {(modules.data?.data?.availablePlans ?? []).map((p) => (
              <option key={p.id} value={p.code}>{p.name}</option>
            ))}
          </select>
          <input
            className="w-full rounded-md border border-border-default px-3 py-2"
            placeholder={t('tenant.settings.subscription.billingEmail')}
            value={billingEmail}
            onChange={(e) => setBillingEmail(e.target.value)}
          />
          <input
            className="w-full rounded-md border border-border-default px-3 py-2"
            placeholder={t('tenant.settings.subscription.contactPerson')}
            value={contactPerson}
            onChange={(e) => setContactPerson(e.target.value)}
          />
          <input
            type="number"
            min={0}
            className="w-full rounded-md border border-border-default px-3 py-2"
            placeholder={t('tenant.settings.subscription.additionalSeats')}
            value={additionalSeats}
            onChange={(e) => setAdditionalSeats(e.target.value)}
          />
          <input
            type="date"
            className="w-full rounded-md border border-border-default px-3 py-2"
            value={effectiveDate}
            onChange={(e) => setEffectiveDate(e.target.value)}
            aria-label={t('tenant.settings.subscription.effectiveDate')}
          />
          <textarea
            className="w-full rounded-md border border-border-default px-3 py-2"
            placeholder={t('tenant.settings.subscription.businessReason')}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <button
            type="submit"
            disabled={upgrade.isPending || !planKey}
            className="rounded-md bg-brand-blue-600 px-4 py-2 text-white disabled:opacity-60"
          >
            {t('tenant.settings.subscription.requestUpgrade')}
          </button>
        </form>

        <section className="space-y-3 rounded-lg border border-border-default bg-surface-card p-4">
          <h2 className="text-title-sm font-semibold">{t('tenant.settings.subscription.history')}</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-body-sm">
              <thead className="bg-surface-muted">
                <tr>
                  <th className="px-3 py-2">{t('tenant.settings.subscription.status')}</th>
                  <th className="px-3 py-2">{t('tenant.settings.subscription.plan')}</th>
                  <th className="px-3 py-2">{t('tenant.settings.subscription.createdAt')}</th>
                  <th className="px-3 py-2">{t('tenant.settings.subscription.note')}</th>
                </tr>
              </thead>
              <tbody>
                {(upgradeRequests.data?.data ?? []).map((request) => (
                  <tr key={request.id} className="border-t border-border-default">
                    <td className="px-3 py-2">{request.status}</td>
                    <td className="px-3 py-2">
                      {request.requestedPlanName ??
                        request.planName ??
                        request.requestedPlanKey ??
                        request.planCode ??
                        '—'}
                    </td>
                    <td className="px-3 py-2">
                      {request.createdAt ? new Date(request.createdAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-3 py-2">{request.businessReason ?? request.note ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {(upgradeRequests.data?.data ?? []).length === 0 ? (
            <p className="text-body-sm text-text-secondary">{t('tenant.settings.subscription.noHistory')}</p>
          ) : null}
        </section>
      </div>
    </TenantSettingsGate>
  );
}
