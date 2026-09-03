'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { PageHeader } from '../../../../components/common/page-header';
import { LoadingSpinner } from '../../../../components/feedback/loading-spinner';
import { ROUTES } from '../../../../constants/routes.constants';
import { AuditEventDetailView } from '../../../../modules/tenant/components/audit-event-detail';
import { TenantSettingsGate } from '../../../../modules/tenant/components/tenant-settings-gate';
import { TENANT_ADMIN_PERMISSIONS } from '../../../../modules/tenant/constants/tenant-admin.permissions';
import { useAuditEventDetail } from '../../../../modules/tenant/hooks/use-tenant-admin';

export default function AuditDetailPage() {
  const t = useTranslations();
  const params = useParams<{ id: string }>();
  const { data, isLoading } = useAuditEventDetail(params.id);
  const event = data?.data;

  return (
    <TenantSettingsGate permission={TENANT_ADMIN_PERMISSIONS.AUDIT_READ}>
      <div className="mx-auto max-w-3xl space-y-4">
        <PageHeader
          title={t('tenant.settings.audit.detailTitle')}
          description={event?.action ?? ''}
          actions={
            <Link href={ROUTES.TENANT.AUDIT} className="text-body-sm text-brand-blue-600">
              {t('tenant.settings.audit.backToLog')}
            </Link>
          }
        />
        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : event ? (
          <AuditEventDetailView event={event} />
        ) : null}
      </div>
    </TenantSettingsGate>
  );
}
