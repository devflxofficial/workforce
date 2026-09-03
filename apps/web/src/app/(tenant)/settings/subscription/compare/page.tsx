'use client';

import { useTranslations } from 'next-intl';
import { PageHeader } from '../../../../../components/common/page-header';
import { LoadingSpinner } from '../../../../../components/feedback/loading-spinner';
import { TenantSettingsGate } from '../../../../../modules/tenant/components/tenant-settings-gate';
import { TENANT_ADMIN_PERMISSIONS } from '../../../../../modules/tenant/constants/tenant-admin.permissions';
import { usePlanComparison } from '../../../../../modules/tenant/hooks/use-tenant-admin';

export default function PlanComparisonPage() {
  const t = useTranslations();
  const { data, isLoading } = usePlanComparison();
  const comparison = data?.data;

  return (
    <TenantSettingsGate permission={TENANT_ADMIN_PERMISSIONS.SUBSCRIPTION_READ}>
      <div className="space-y-6">
        <PageHeader
          title={t('tenant.settings.subscription.compareTitle')}
          description={t('tenant.settings.subscription.compareDescription')}
        />
        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border-default">
            <table className="min-w-full text-left text-body-sm">
              <thead className="bg-surface-muted">
                <tr>
                  <th className="px-3 py-2">{t('tenant.settings.subscription.feature')}</th>
                  {(comparison?.plans ?? []).map((plan: { id: string; name: string; isCurrent: boolean; featureStates: Record<string, string> }) => (
                    <th key={plan.id} className="px-3 py-2">
                      {plan.name}
                      {plan.isCurrent ? ` (${t('tenant.settings.subscription.current')})` : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(comparison?.features ?? []).map((featureKey: string) => (
                  <tr key={featureKey} className="border-t border-border-default">
                    <td className="px-3 py-2 font-medium">
                      {t(
                        `tenant.settings.subscription.features.${featureKey}` as Parameters<
                          typeof t
                        >[0],
                      )}
                    </td>
                    {(comparison?.plans ?? []).map((plan: { id: string; name: string; isCurrent: boolean; featureStates: Record<string, string> }) => (
                      <td key={plan.id} className="px-3 py-2">
                        {t(
                          `tenant.settings.subscription.featureState.${plan.featureStates[featureKey] ?? 'unavailable'}` as Parameters<
                            typeof t
                          >[0],
                        )}
                      </td>
                    ))}
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
