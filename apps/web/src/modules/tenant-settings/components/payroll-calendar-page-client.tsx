'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { PageHeader } from '../../../components/common/page-header';
import { LoadingSpinner } from '../../../components/feedback/loading-spinner';
import { Dialog } from '../../../components/ui/dialog';
import { ROUTES } from '../../../constants/routes.constants';
import { TenantSettingsGate } from '../../tenant/components/tenant-settings-gate';
import { TENANT_ADMIN_PERMISSIONS } from '../../tenant/constants/tenant-admin.permissions';
import {
  useCreatePayrollCalendar,
  useCreatePayrollGroup,
  useCreatePayrollPeriod,
  usePayrollCalendars,
  usePayrollGroups,
  usePayrollPeriods,
  usePublishPayrollCalendar,
} from '../hooks/use-tenant-settings';

export function PayrollCalendarPageClient() {
  const t = useTranslations('tenant.settings.payrollCalendar');
  const tn = useTranslations('tenant.nav');
  const tc = useTranslations('common');
  const year = new Date().getFullYear();
  const groups = usePayrollGroups();
  const calendars = usePayrollCalendars(year);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string | null>(null);
  const periods = usePayrollPeriods(selectedCalendarId ?? undefined);
  const createGroup = useCreatePayrollGroup();
  const createCalendar = useCreatePayrollCalendar();
  const createPeriod = useCreatePayrollPeriod(selectedCalendarId ?? '');
  const publish = usePublishPayrollCalendar();
  const [groupOpen, setGroupOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [groupForm, setGroupForm] = useState({ code: '', name: '' });
  const [calendarForm, setCalendarForm] = useState({ payrollGroupId: '', calendarYear: year });
  const [periodForm, setPeriodForm] = useState({
    periodCode: '',
    periodStart: '',
    periodEnd: '',
    paymentDate: '',
    attendanceCutoffAt: '',
    adjustmentCutoffAt: '',
  });

  const groupRows = groups.data?.data ?? [];
  const calendarRows = calendars.data?.data ?? [];
  const periodRows = periods.data?.data ?? [];

  useEffect(() => {
    if (!selectedCalendarId && calendarRows.length > 0) {
      setSelectedCalendarId(calendarRows[0]?.id ?? null);
    }
  }, [selectedCalendarId, calendarRows]);

  useEffect(() => {
    if (!calendarForm.payrollGroupId && groupRows.length > 0) {
      setCalendarForm((f) => ({ ...f, payrollGroupId: groupRows[0]?.id ?? '' }));
    }
  }, [calendarForm.payrollGroupId, groupRows]);

  async function onCreateGroup(e: FormEvent) {
    e.preventDefault();
    await createGroup.mutateAsync(groupForm);
    setGroupOpen(false);
    setGroupForm({ code: '', name: '' });
  }

  async function onCreateCalendar(e: FormEvent) {
    e.preventDefault();
    const res = await createCalendar.mutateAsync(calendarForm);
    const created = res.data;
    if (created && 'id' in created && typeof created.id === 'string') {
      setSelectedCalendarId(created.id);
    }
    setCalendarOpen(false);
  }

  async function onCreatePeriod(e: FormEvent) {
    e.preventDefault();
    if (!selectedCalendarId) return;
    await createPeriod.mutateAsync(periodForm);
    setPeriodForm({
      periodCode: '',
      periodStart: '',
      periodEnd: '',
      paymentDate: '',
      attendanceCutoffAt: '',
      adjustmentCutoffAt: '',
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
            { label: tn('settings'), href: ROUTES.TENANT.SETTINGS },
            { label: t('title') },
          ]}
          actions={
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setGroupOpen(true)}
                className="rounded-md border border-border-default px-4 py-2 text-body-sm"
              >
                {t('createGroup')}
              </button>
              <button
                type="button"
                onClick={() => setCalendarOpen(true)}
                className="rounded-md bg-brand-blue-600 px-4 py-2 text-body-sm font-semibold text-white"
              >
                {t('createCalendar')}
              </button>
            </div>
          }
        />
        {(groups.isLoading || calendars.isLoading) ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-border-default bg-surface-primary p-4">
              <h2 className="text-title-sm font-semibold">{t('calendarsTitle')} ({year})</h2>
              <ul className="mt-3 divide-y divide-border-default">
                {calendarRows.map((cal) => (
                  <li key={cal.id} className="flex items-center justify-between gap-2 py-2">
                    <button
                      type="button"
                      onClick={() => setSelectedCalendarId(cal.id)}
                      className={`text-left text-body-sm ${selectedCalendarId === cal.id ? 'font-semibold' : ''}`}
                    >
                      {cal.payrollGroupName} — {cal.calendarYear}
                      <span className="ml-2 text-text-secondary">({cal.periodCount} periods, {cal.status})</span>
                    </button>
                    {cal.status !== 'PUBLISHED' ? (
                      <button
                        type="button"
                        onClick={() => publish.mutate(cal.id)}
                        className="text-body-xs text-brand-blue-600 hover:underline"
                      >
                        {t('publish')}
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              {selectedCalendarId ? (
                <>
                  <form onSubmit={onCreatePeriod} className="rounded-xl border border-border-default bg-surface-primary p-4 space-y-2">
                    <h2 className="text-title-sm font-semibold">{t('addPeriod')}</h2>
                    <input
                      required
                      placeholder={t('fields.periodCode')}
                      value={periodForm.periodCode}
                      onChange={(e) => setPeriodForm((f) => ({ ...f, periodCode: e.target.value }))}
                      className="w-full rounded-md border border-border-default px-3 py-2 text-body-sm"
                    />
                    <input type="date" required value={periodForm.periodStart}
                      onChange={(e) => setPeriodForm((f) => ({ ...f, periodStart: e.target.value }))}
                      className="w-full rounded-md border border-border-default px-3 py-2 text-body-sm" />
                    <input type="date" required value={periodForm.periodEnd}
                      onChange={(e) => setPeriodForm((f) => ({ ...f, periodEnd: e.target.value }))}
                      className="w-full rounded-md border border-border-default px-3 py-2 text-body-sm" />
                    <input type="date" required value={periodForm.paymentDate}
                      onChange={(e) => setPeriodForm((f) => ({ ...f, paymentDate: e.target.value }))}
                      className="w-full rounded-md border border-border-default px-3 py-2 text-body-sm" />
                    <input
                      required
                      placeholder={t('fields.attendanceCutoff')}
                      value={periodForm.attendanceCutoffAt}
                      onChange={(e) => setPeriodForm((f) => ({ ...f, attendanceCutoffAt: e.target.value }))}
                      className="w-full rounded-md border border-border-default px-3 py-2 text-body-sm"
                    />
                    <input
                      required
                      placeholder={t('fields.adjustmentCutoff')}
                      value={periodForm.adjustmentCutoffAt}
                      onChange={(e) => setPeriodForm((f) => ({ ...f, adjustmentCutoffAt: e.target.value }))}
                      className="w-full rounded-md border border-border-default px-3 py-2 text-body-sm"
                    />
                    <button type="submit" className="rounded-md bg-brand-blue-600 px-4 py-2 text-body-sm font-semibold text-white">
                      {t('addPeriod')}
                    </button>
                  </form>
                  <div className="overflow-x-auto rounded-xl border border-border-default bg-surface-primary">
                    <table className="w-full border-collapse text-body-sm">
                      <thead>
                        <tr className="border-b border-border-default bg-surface-canvas">
                          <th className="px-4 py-3 text-left">{t('columns.code')}</th>
                          <th className="px-4 py-3 text-left">{t('columns.start')}</th>
                          <th className="px-4 py-3 text-left">{t('columns.end')}</th>
                          <th className="px-4 py-3 text-left">{t('columns.payDate')}</th>
                          <th className="px-4 py-3 text-left">{t('columns.status')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-default">
                        {periodRows.map((p) => (
                          <tr key={p.id}>
                            <td className="px-4 py-3">{p.periodCode}</td>
                            <td className="px-4 py-3">{p.periodStart}</td>
                            <td className="px-4 py-3">{p.periodEnd}</td>
                            <td className="px-4 py-3">{p.paymentDate}</td>
                            <td className="px-4 py-3">{p.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <p className="text-body-sm text-text-secondary">{t('selectCalendar')}</p>
              )}
            </div>
          </div>
        )}
        <Dialog open={groupOpen} onOpenChange={setGroupOpen} title={t('createGroup')}>
          <form onSubmit={onCreateGroup} className="space-y-4">
            <input required placeholder={t('fields.code')} value={groupForm.code}
              onChange={(e) => setGroupForm((f) => ({ ...f, code: e.target.value }))}
              className="w-full rounded-md border border-border-default px-3 py-2" />
            <input required placeholder={t('fields.name')} value={groupForm.name}
              onChange={(e) => setGroupForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-md border border-border-default px-3 py-2" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setGroupOpen(false)} className="rounded-md border px-4 py-2 text-body-sm">{tc('cancel')}</button>
              <button type="submit" className="rounded-md bg-brand-blue-600 px-4 py-2 text-body-sm font-semibold text-white">{tc('save')}</button>
            </div>
          </form>
        </Dialog>
        <Dialog open={calendarOpen} onOpenChange={setCalendarOpen} title={t('createCalendar')}>
          <form onSubmit={onCreateCalendar} className="space-y-4">
            <select
              required
              value={calendarForm.payrollGroupId}
              onChange={(e) => setCalendarForm((f) => ({ ...f, payrollGroupId: e.target.value }))}
              className="w-full rounded-md border border-border-default px-3 py-2"
            >
              {groupRows.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
            <input
              type="number"
              required
              value={calendarForm.calendarYear}
              onChange={(e) => setCalendarForm((f) => ({ ...f, calendarYear: Number(e.target.value) }))}
              className="w-full rounded-md border border-border-default px-3 py-2"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setCalendarOpen(false)} className="rounded-md border px-4 py-2 text-body-sm">{tc('cancel')}</button>
              <button type="submit" className="rounded-md bg-brand-blue-600 px-4 py-2 text-body-sm font-semibold text-white">{tc('save')}</button>
            </div>
          </form>
        </Dialog>
      </div>
    </TenantSettingsGate>
  );
}
