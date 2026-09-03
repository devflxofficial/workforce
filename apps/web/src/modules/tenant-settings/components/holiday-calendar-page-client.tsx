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
  useCreateHoliday,
  useCreateHolidayCalendar,
  useDeleteHoliday,
  useHolidayCalendars,
  useHolidays,
} from '../hooks/use-tenant-settings';

export function HolidayCalendarPageClient() {
  const t = useTranslations('tenant.settings.holidayCalendar');
  const tn = useTranslations('tenant.nav');
  const tc = useTranslations('common');
  const calendars = useHolidayCalendars();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const holidays = useHolidays(selectedId ?? undefined);
  const createCalendar = useCreateHolidayCalendar();
  const createHoliday = useCreateHoliday(selectedId ?? '');
  const deleteHoliday = useDeleteHoliday();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarForm, setCalendarForm] = useState({ code: '', name: '', countryCode: '' });
  const [holidayForm, setHolidayForm] = useState({ holidayDate: '', name: '', paid: true });

  const calendarRows = calendars.data?.data ?? [];
  const holidayRows = holidays.data?.data ?? [];

  useEffect(() => {
    if (!selectedId && calendarRows.length > 0) {
      setSelectedId(calendarRows[0]?.id ?? null);
    }
  }, [selectedId, calendarRows]);

  async function onCreateCalendar(e: FormEvent) {
    e.preventDefault();
    const res = await createCalendar.mutateAsync({
      code: calendarForm.code,
      name: calendarForm.name,
      countryCode: calendarForm.countryCode || undefined,
    });
    const created = res.data;
    if (created && 'id' in created && typeof created.id === 'string') setSelectedId(created.id);
    setCalendarOpen(false);
    setCalendarForm({ code: '', name: '', countryCode: '' });
  }

  async function onAddHoliday(e: FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    await createHoliday.mutateAsync({
      holidayDate: holidayForm.holidayDate,
      name: holidayForm.name,
      paid: holidayForm.paid,
    });
    setHolidayForm({ holidayDate: '', name: '', paid: true });
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
            <button
              type="button"
              onClick={() => setCalendarOpen(true)}
              className="rounded-md bg-brand-blue-600 px-4 py-2 text-body-sm font-semibold text-white"
            >
              {t('createCalendar')}
            </button>
          }
        />
        {calendars.isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-border-default bg-surface-primary p-4">
              <h2 className="text-title-sm font-semibold">{t('calendarsTitle')}</h2>
              <ul className="mt-3 divide-y divide-border-default">
                {calendarRows.map((cal) => (
                  <li key={cal.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(cal.id)}
                      className={`w-full px-2 py-3 text-left text-body-sm ${
                        selectedId === cal.id ? 'bg-surface-canvas font-semibold' : ''
                      }`}
                    >
                      {cal.name}
                      <span className="ml-2 text-text-secondary">({cal.holidayCount})</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              {selectedId ? (
                <>
                  <form onSubmit={onAddHoliday} className="rounded-xl border border-border-default bg-surface-primary p-4 space-y-3">
                    <h2 className="text-title-sm font-semibold">{t('addHoliday')}</h2>
                    <input
                      type="date"
                      required
                      value={holidayForm.holidayDate}
                      onChange={(e) => setHolidayForm((f) => ({ ...f, holidayDate: e.target.value }))}
                      className="w-full rounded-md border border-border-default px-3 py-2 text-body-sm"
                    />
                    <input
                      required
                      placeholder={t('fields.holidayName')}
                      value={holidayForm.name}
                      onChange={(e) => setHolidayForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full rounded-md border border-border-default px-3 py-2 text-body-sm"
                    />
                    <label className="flex items-center gap-2 text-body-sm">
                      <input
                        type="checkbox"
                        checked={holidayForm.paid}
                        onChange={(e) => setHolidayForm((f) => ({ ...f, paid: e.target.checked }))}
                      />
                      {t('fields.paid')}
                    </label>
                    <button
                      type="submit"
                      disabled={createHoliday.isPending}
                      className="rounded-md bg-brand-blue-600 px-4 py-2 text-body-sm font-semibold text-white"
                    >
                      {t('addHoliday')}
                    </button>
                  </form>
                  <div className="overflow-x-auto rounded-xl border border-border-default bg-surface-primary">
                    <table className="w-full border-collapse text-body-sm">
                      <thead>
                        <tr className="border-b border-border-default bg-surface-canvas">
                          <th className="px-4 py-3 text-left">{t('columns.date')}</th>
                          <th className="px-4 py-3 text-left">{t('columns.name')}</th>
                          <th className="px-4 py-3 text-left">{t('columns.paid')}</th>
                          <th className="px-4 py-3 text-left">{tc('actions')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-default">
                        {holidayRows.map((h) => (
                          <tr key={h.id}>
                            <td className="px-4 py-3">{h.holidayDate}</td>
                            <td className="px-4 py-3">{h.name}</td>
                            <td className="px-4 py-3">{h.paid ? tc('yes') : tc('no')}</td>
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                onClick={() => deleteHoliday.mutate(h.id)}
                                className="text-semantic-danger hover:underline"
                              >
                                {tc('delete')}
                              </button>
                            </td>
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
        <Dialog open={calendarOpen} onOpenChange={setCalendarOpen} title={t('createCalendar')}>
          <form onSubmit={onCreateCalendar} className="space-y-4">
            <input
              required
              placeholder={t('fields.code')}
              value={calendarForm.code}
              onChange={(e) => setCalendarForm((f) => ({ ...f, code: e.target.value }))}
              className="w-full rounded-md border border-border-default px-3 py-2"
            />
            <input
              required
              placeholder={t('fields.name')}
              value={calendarForm.name}
              onChange={(e) => setCalendarForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-md border border-border-default px-3 py-2"
            />
            <input
              placeholder={t('fields.country')}
              value={calendarForm.countryCode}
              onChange={(e) => setCalendarForm((f) => ({ ...f, countryCode: e.target.value }))}
              className="w-full rounded-md border border-border-default px-3 py-2"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setCalendarOpen(false)} className="rounded-md border px-4 py-2 text-body-sm">
                {tc('cancel')}
              </button>
              <button type="submit" className="rounded-md bg-brand-blue-600 px-4 py-2 text-body-sm font-semibold text-white">
                {tc('save')}
              </button>
            </div>
          </form>
        </Dialog>
      </div>
    </TenantSettingsGate>
  );
}
