'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { PageHeader } from '../../../components/common/page-header';
import { ROUTES } from '../../../constants/routes.constants';

interface ModuleScaffoldClientProps {
  title: string;
  description: string;
  screenCode: string;
  backHref?: string;
  backLabelKey?: string;
  links?: Array<{ href: string; labelKey: string }>;
}

export function ModuleScaffoldClient({
  title,
  description,
  screenCode,
  backHref = ROUTES.TENANT.INTEGRATIONS.ROOT,
  backLabelKey = 'tenant.nav.integrations',
  links = [],
}: ModuleScaffoldClientProps) {
  const t = useTranslations();

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        breadcrumbs={[
          { label: t('tenant.nav.home'), href: ROUTES.TENANT.DASHBOARD },
          { label: t(backLabelKey as Parameters<typeof t>[0]), href: backHref },
          { label: title },
        ]}
      />
      <p className="text-body-sm text-text-tertiary">{screenCode}</p>
      {links.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="block rounded-lg border border-border-default bg-surface-card p-4 text-body-sm font-medium text-brand-blue-600 hover:bg-surface-canvas"
              >
                {t(link.labelKey as Parameters<typeof t>[0])}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
