'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { PageHeader } from '../../../../components/common/page-header';
import { LoadingSpinner } from '../../../../components/feedback/loading-spinner';
import { ROUTES } from '../../../../constants/routes.constants';
import { TenantSettingsGate } from '../../../../modules/tenant/components/tenant-settings-gate';
import { TENANT_ADMIN_PERMISSIONS } from '../../../../modules/tenant/constants/tenant-admin.permissions';
import {
  useTenantProfile,
  useUpdateTenantProfile,
} from '../../../../modules/tenant/hooks/use-tenant-admin';

const schema = z.object({
  displayName: z.string().min(2).max(160),
  legalName: z.string().min(2).max(200),
  registrationNumber: z.string().max(120).optional().or(z.literal('')),
  industry: z.string().max(120).optional().or(z.literal('')),
  employeeSizeBand: z.string().max(40).optional().or(z.literal('')),
  addressLine1: z.string().max(200).optional().or(z.literal('')),
  addressLine2: z.string().max(200).optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  stateProvince: z.string().max(100).optional().or(z.literal('')),
  postalCode: z.string().max(30).optional().or(z.literal('')),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z
    .string()
    .max(40)
    .regex(/^\+?[0-9]*$/, 'Invalid phone')
    .optional()
    .or(z.literal('')),
  countryCode: z.string().length(2),
  baseCurrency: z.string().length(3),
  defaultTimezone: z.string().min(1),
  financialYearStart: z.string().max(10).optional().or(z.literal('')),
  payrollMonthConfig: z.string().max(40).optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

const FIELD_KEYS = [
  'displayName',
  'legalName',
  'registrationNumber',
  'industry',
  'employeeSizeBand',
  'addressLine1',
  'addressLine2',
  'city',
  'stateProvince',
  'postalCode',
  'contactEmail',
  'contactPhone',
  'countryCode',
  'baseCurrency',
  'defaultTimezone',
  'financialYearStart',
  'payrollMonthConfig',
] as const;

export default function CompanySettingsPage() {
  const t = useTranslations();
  const { data, isLoading } = useTenantProfile();
  const mutation = useUpdateTenantProfile();
  const form = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    const profile = data?.data;
    if (!profile) return;
    form.reset({
      displayName: profile.displayName,
      legalName: profile.legalName,
      registrationNumber: profile.registrationNumber ?? '',
      industry: profile.industry ?? '',
      employeeSizeBand: profile.employeeSizeBand ?? '',
      addressLine1: profile.addressLine1 ?? '',
      addressLine2: profile.addressLine2 ?? '',
      city: profile.city ?? '',
      stateProvince: profile.stateProvince ?? '',
      postalCode: profile.postalCode ?? '',
      contactEmail: profile.contactEmail ?? '',
      contactPhone: profile.contactPhone ?? '',
      countryCode: profile.countryCode,
      baseCurrency: profile.baseCurrency,
      defaultTimezone: profile.defaultTimezone,
      financialYearStart: profile.financialYearStart ?? '',
      payrollMonthConfig: profile.payrollMonthConfig ?? '',
    });
  }, [data, form]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <TenantSettingsGate permission={TENANT_ADMIN_PERMISSIONS.PROFILE_READ}>
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader
          title={t('tenant.settings.company.title')}
          description={t('tenant.settings.company.description')}
          actions={
            <Link href={ROUTES.TENANT.SETTINGS_BRANDING} className="text-body-sm text-brand-blue-600">
              {t('tenant.settings.branding.title')}
            </Link>
          }
        />
        <form
          className="space-y-4 rounded-lg border border-border-default bg-surface-card p-4 sm:p-6"
          onSubmit={form.handleSubmit(async (values) => {
            await mutation.mutateAsync(values);
          })}
        >
          {FIELD_KEYS.map((name) => (
            <label key={name} className="block space-y-1">
              <span className="text-body-sm font-medium text-text-primary">
                {t(`tenant.settings.companyFields.${name}` as Parameters<typeof t>[0])}
              </span>
              <input
                className="w-full rounded-md border border-border-default px-3 py-2 text-body-md"
                {...form.register(name)}
              />
              {form.formState.errors[name] ? (
                <span className="text-caption text-status-danger">
                  {form.formState.errors[name]?.message}
                </span>
              ) : null}
            </label>
          ))}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-md border border-border-default px-4 py-2 text-body-sm"
              onClick={() => form.reset()}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="rounded-md bg-brand-blue-600 px-4 py-2 text-body-sm font-medium text-white disabled:opacity-60"
            >
              {t('tenant.settings.company.save')}
            </button>
          </div>
        </form>
      </div>
    </TenantSettingsGate>
  );
}
