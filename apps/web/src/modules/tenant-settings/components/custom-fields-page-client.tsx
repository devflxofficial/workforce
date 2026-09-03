'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { PageHeader } from '../../../components/common/page-header';
import { LoadingSpinner } from '../../../components/feedback/loading-spinner';
import { Dialog } from '../../../components/ui/dialog';
import { ROUTES } from '../../../constants/routes.constants';
import { TenantSettingsGate } from '../../tenant/components/tenant-settings-gate';
import { TENANT_ADMIN_PERMISSIONS } from '../../tenant/constants/tenant-admin.permissions';
import {
  useCreateCustomField,
  useCustomFields,
  useUpdateCustomField,
} from '../hooks/use-tenant-settings';
import type { CustomFieldDefinition } from '../types/tenant-settings.types';

const ENTITY_TYPES = ['EMPLOYEE', 'ORG_UNIT', 'LOCATION'] as const;
const DATA_TYPES = ['TEXT', 'NUMBER', 'DATE', 'BOOLEAN', 'SELECT'] as const;

type FormState = {
  entityType: string;
  fieldKey: string;
  label: string;
  dataType: string;
  required: boolean;
};

const EMPTY: FormState = {
  entityType: 'EMPLOYEE',
  fieldKey: '',
  label: '',
  dataType: 'TEXT',
  required: false,
};

export function CustomFieldsPageClient() {
  const t = useTranslations('tenant.settings.customFields');
  const tn = useTranslations('tenant.nav');
  const tc = useTranslations('common');
  const [entityFilter, setEntityFilter] = useState<string>('ALL');
  const fields = useCustomFields();
  const create = useCreateCustomField();
  const update = useUpdateCustomField();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CustomFieldDefinition | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);

  const rows = useMemo(() => {
    const all = fields.data?.data ?? [];
    if (entityFilter === 'ALL') return all;
    return all.filter((r) => r.entityType === entityFilter);
  }, [fields.data?.data, entityFilter]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
  }

  function openEdit(row: CustomFieldDefinition) {
    setEditing(row);
    setForm({
      entityType: row.entityType,
      fieldKey: row.fieldKey,
      label: row.label,
      dataType: row.dataType,
      required: row.required,
    });
    setOpen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (editing) {
      await update.mutateAsync({
        id: editing.id,
        payload: { label: form.label, required: form.required },
      });
    } else {
      await create.mutateAsync({
        entityType: form.entityType,
        fieldKey: form.fieldKey,
        label: form.label,
        dataType: form.dataType,
        required: form.required,
      });
    }
    setOpen(false);
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
              onClick={openCreate}
              className="rounded-md bg-brand-blue-600 px-4 py-2 text-body-sm font-semibold text-white"
            >
              {t('create')}
            </button>
          }
        />
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-body-sm text-text-secondary" htmlFor="entity-filter">
            {t('filterEntity')}
          </label>
          <select
            id="entity-filter"
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="rounded-md border border-border-default px-3 py-2 text-body-sm"
          >
            <option value="ALL">{t('allEntities')}</option>
            {ENTITY_TYPES.map((et) => (
              <option key={et} value={et}>{et}</option>
            ))}
          </select>
        </div>
        {fields.isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border-default bg-surface-primary">
            <table className="w-full border-collapse text-body-sm">
              <thead>
                <tr className="border-b border-border-default bg-surface-canvas">
                  <th className="px-4 py-3 text-left">{t('columns.entity')}</th>
                  <th className="px-4 py-3 text-left">{t('columns.key')}</th>
                  <th className="px-4 py-3 text-left">{t('columns.label')}</th>
                  <th className="px-4 py-3 text-left">{t('columns.type')}</th>
                  <th className="px-4 py-3 text-left">{t('columns.required')}</th>
                  <th className="px-4 py-3 text-left">{t('columns.status')}</th>
                  <th className="px-4 py-3 text-left">{tc('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-text-secondary">
                      {t('empty')}
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id}>
                      <td className="px-4 py-3">{row.entityType}</td>
                      <td className="px-4 py-3 font-mono text-body-xs">{row.fieldKey}</td>
                      <td className="px-4 py-3">{row.label}</td>
                      <td className="px-4 py-3">{row.dataType}</td>
                      <td className="px-4 py-3">{row.required ? tc('yes') : tc('no')}</td>
                      <td className="px-4 py-3">{row.status}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => openEdit(row)}
                          className="text-brand-blue-600 hover:underline"
                        >
                          {tc('edit')}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        <Dialog open={open} onOpenChange={setOpen} title={editing ? t('edit') : t('create')}>
          <form onSubmit={onSubmit} className="space-y-4">
            {!editing ? (
              <>
                <label className="block text-body-sm">
                  {t('fields.entityType')}
                  <select
                    value={form.entityType}
                    onChange={(e) => setForm((f) => ({ ...f, entityType: e.target.value }))}
                    className="mt-1 w-full rounded-md border border-border-default px-3 py-2"
                  >
                    {ENTITY_TYPES.map((et) => (
                      <option key={et} value={et}>{et}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-body-sm">
                  {t('fields.key')}
                  <input
                    required
                    value={form.fieldKey}
                    onChange={(e) => setForm((f) => ({ ...f, fieldKey: e.target.value }))}
                    className="mt-1 w-full rounded-md border border-border-default px-3 py-2"
                  />
                </label>
                <label className="block text-body-sm">
                  {t('fields.dataType')}
                  <select
                    value={form.dataType}
                    onChange={(e) => setForm((f) => ({ ...f, dataType: e.target.value }))}
                    className="mt-1 w-full rounded-md border border-border-default px-3 py-2"
                  >
                    {DATA_TYPES.map((dt) => (
                      <option key={dt} value={dt}>{dt}</option>
                    ))}
                  </select>
                </label>
              </>
            ) : null}
            <label className="block text-body-sm">
              {t('fields.label')}
              <input
                required
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                className="mt-1 w-full rounded-md border border-border-default px-3 py-2"
              />
            </label>
            <label className="flex items-center gap-2 text-body-sm">
              <input
                type="checkbox"
                checked={form.required}
                onChange={(e) => setForm((f) => ({ ...f, required: e.target.checked }))}
              />
              {t('fields.required')}
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="rounded-md border px-4 py-2 text-body-sm">
                {tc('cancel')}
              </button>
              <button
                type="submit"
                disabled={create.isPending || update.isPending}
                className="rounded-md bg-brand-blue-600 px-4 py-2 text-body-sm font-semibold text-white"
              >
                {tc('save')}
              </button>
            </div>
          </form>
        </Dialog>
      </div>
    </TenantSettingsGate>
  );
}
