'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { PageHeader } from '../../../components/common/page-header';
import { StatCard } from '../../../components/common/stat-card';
import { ROUTES } from '../../../constants/routes.constants';
import { useOrganisationOverview } from '../../../modules/organisation/hooks/use-org-overview';

export function OrganisationOverviewClient() {
  const t = useTranslations();
  const overview = useOrganisationOverview();

  const counts = overview.data?.data.counts;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('organisation.overview.title')}
        description={t('organisation.overview.description')}
        breadcrumbs={[
          { label: t('tenant.nav.dashboard'), href: ROUTES.TENANT.DASHBOARD },
          { label: t('tenant.nav.organisation') },
        ]}
      />

      {counts && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title={t('organisation.overview.legalEntities')} value={counts.legalEntities} />
          <StatCard title={t('organisation.overview.branches')} value={counts.branches} />
          <StatCard title={t('organisation.overview.departments')} value={counts.departments} />
          <StatCard title={t('organisation.overview.grades')} value={counts.grades} />
          <StatCard title={t('organisation.overview.positions')} value={counts.positions} />
          <StatCard title={t('organisation.overview.activeEmployees')} value={counts.activeEmployees} />
          <StatCard
            title={t('organisation.overview.unassigned')}
            value={counts.unassignedEmployees}
            variant="warning"
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          {
            key: 'departments',
            title: t('organisation.nav.departments'),
            href: ROUTES.TENANT.ORGANISATION.DEPARTMENTS,
          },
          {
            key: 'grades',
            title: t('organisation.nav.grades'),
            href: ROUTES.TENANT.ORGANISATION.GRADES,
          },
          {
            key: 'history',
            title: t('organisation.nav.history'),
            href: ROUTES.TENANT.ORGANISATION.HISTORY,
          },
          {
            key: 'legalEntities',
            title: t('organisation.nav.legalEntities'),
            href: ROUTES.TENANT.ORGANISATION.LEGAL_ENTITIES,
          },
          {
            key: 'branches',
            title: t('organisation.nav.branches'),
            href: ROUTES.TENANT.ORGANISATION.BRANCHES,
          },
          {
            key: 'positions',
            title: t('organisation.nav.positions'),
            href: ROUTES.TENANT.ORGANISATION.POSITIONS,
          },
        ].map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className="group rounded-xl border border-border-default bg-surface-primary p-6 transition-shadow hover:shadow-md"
          >
            <h2 className="text-heading-h3 font-semibold text-text-primary transition-colors group-hover:text-brand-blue-600">
              {item.title}
            </h2>
          </Link>
        ))}
      </div>
    </div>
  );
}
