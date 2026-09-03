'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { PageHeader } from '../../../../components/common/page-header';
import { LoadingSpinner } from '../../../../components/feedback/loading-spinner';
import { TenantSettingsGate } from '../../../../modules/tenant/components/tenant-settings-gate';
import { TENANT_ADMIN_PERMISSIONS } from '../../../../modules/tenant/constants/tenant-admin.permissions';
import {
  useSecurityPolicy,
  useUpdateSecurityPolicy,
} from '../../../../modules/tenant/hooks/use-tenant-admin';

export default function SecuritySettingsPage() {
  const t = useTranslations();
  const { data, isLoading } = useSecurityPolicy();
  const mutation = useUpdateSecurityPolicy();
  const form = useForm({
    defaultValues: {
      passwordMinLength: 10,
      passwordRequireUpper: true,
      passwordRequireLower: true,
      passwordRequireDigit: true,
      passwordRequireSymbol: false,
      mfaRequiredForAdmins: false,
      sessionTtlHours: 8,
      maxLoginAttempts: 5,
      trustedEmailDomains: '',
    },
  });

  useEffect(() => {
    const p = data?.data;
    if (!p) return;
    form.reset({
      passwordMinLength: p.passwordMinLength,
      passwordRequireUpper: p.passwordRequireUpper,
      passwordRequireLower: p.passwordRequireLower,
      passwordRequireDigit: p.passwordRequireDigit,
      passwordRequireSymbol: p.passwordRequireSymbol,
      mfaRequiredForAdmins: p.mfaRequiredForAdmins,
      sessionTtlHours: p.sessionTtlHours,
      maxLoginAttempts: p.maxLoginAttempts,
      trustedEmailDomains: p.trustedEmailDomains.join(', '),
    });
  }, [data, form]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const fields = [
    { name: 'passwordMinLength', type: 'number', label: t('tenant.settings.security.passwordMinLength') },
    { name: 'sessionTtlHours', type: 'number', label: t('tenant.settings.security.sessionTtlHours') },
    { name: 'maxLoginAttempts', type: 'number', label: t('tenant.settings.security.maxLoginAttempts') },
  ] as const;

  const checkboxes = [
    'passwordRequireUpper',
    'passwordRequireLower',
    'passwordRequireDigit',
    'passwordRequireSymbol',
    'mfaRequiredForAdmins',
  ] as const;

  return (
    <TenantSettingsGate permission={TENANT_ADMIN_PERMISSIONS.SECURITY_POLICY_READ}>
      <div className="mx-auto max-w-2xl space-y-6">
        <PageHeader
          title={t('tenant.settings.security.title')}
          description={t('tenant.settings.security.description')}
        />
        <form
          className="space-y-3 rounded-lg border border-border-default bg-surface-card p-4"
          onSubmit={form.handleSubmit(async (values) => {
            await mutation.mutateAsync({
              passwordMinLength: Number(values.passwordMinLength),
              passwordRequireUpper: Boolean(values.passwordRequireUpper),
              passwordRequireLower: Boolean(values.passwordRequireLower),
              passwordRequireDigit: Boolean(values.passwordRequireDigit),
              passwordRequireSymbol: Boolean(values.passwordRequireSymbol),
              mfaRequiredForAdmins: Boolean(values.mfaRequiredForAdmins),
              sessionTtlHours: Number(values.sessionTtlHours),
              maxLoginAttempts: Number(values.maxLoginAttempts),
              trustedEmailDomains: values.trustedEmailDomains
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
            });
          })}
        >
          {fields.map((field) => (
            <label key={field.name} className="block space-y-1">
              <span className="text-body-sm font-medium">{field.label}</span>
              <input
                type={field.type}
                className="w-full rounded-md border border-border-default px-3 py-2"
                {...form.register(field.name)}
              />
            </label>
          ))}
          {checkboxes.map((name) => (
            <label key={name} className="flex items-center gap-2 text-body-sm">
              <input type="checkbox" {...form.register(name)} />
              {t(`tenant.settings.security.${name}` as Parameters<typeof t>[0])}
            </label>
          ))}
          <label className="block space-y-1">
            <span className="text-body-sm font-medium">
              {t('tenant.settings.security.trustedEmailDomains')}
            </span>
            <input
              className="w-full rounded-md border border-border-default px-3 py-2"
              {...form.register('trustedEmailDomains')}
            />
          </label>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="rounded-md bg-brand-blue-600 px-4 py-2 text-white disabled:opacity-60"
          >
            {t('tenant.settings.security.save')}
          </button>
        </form>
      </div>
    </TenantSettingsGate>
  );
}
