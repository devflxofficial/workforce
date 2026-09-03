'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ROUTES } from '../../../constants/routes.constants';
import type { AuditEventDetail } from '../api/tenant-admin-api';

export function AuditEventDetailView({ event }: { event: AuditEventDetail }) {
  const t = useTranslations();

  return (
    <div className="space-y-6">
      <dl className="grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-caption text-text-secondary">{t('tenant.settings.audit.when')}</dt>
          <dd className="font-medium">{new Date(event.occurredAt).toLocaleString()}</dd>
        </div>
        <div>
          <dt className="text-caption text-text-secondary">{t('tenant.settings.audit.actor')}</dt>
          <dd className="font-medium">{event.actorEmail ?? event.actorId}</dd>
        </div>
        <div>
          <dt className="text-caption text-text-secondary">{t('tenant.settings.audit.module')}</dt>
          <dd className="font-medium">{event.module}</dd>
        </div>
        <div>
          <dt className="text-caption text-text-secondary">{t('tenant.settings.audit.action')}</dt>
          <dd className="font-medium">{event.action}</dd>
        </div>
        <div>
          <dt className="text-caption text-text-secondary">{t('tenant.settings.audit.resource')}</dt>
          <dd className="font-medium">
            {event.resourceType}
            {event.resourceId ? ` · ${event.resourceId}` : ''}
          </dd>
        </div>
        <div>
          <dt className="text-caption text-text-secondary">{t('tenant.settings.audit.severity')}</dt>
          <dd className="font-medium">{event.severity}</dd>
        </div>
        {event.ipAddress ? (
          <div>
            <dt className="text-caption text-text-secondary">{t('tenant.settings.audit.ip')}</dt>
            <dd className="font-medium">{event.ipAddress}</dd>
          </div>
        ) : null}
      </dl>

      {event.before ? (
        <section>
          <h3 className="mb-2 text-title-sm font-semibold">{t('tenant.settings.audit.before')}</h3>
          <pre className="overflow-x-auto rounded-lg border border-border-default bg-surface-muted p-3 text-caption">
            {JSON.stringify(event.before, null, 2)}
          </pre>
        </section>
      ) : null}

      {event.after ? (
        <section>
          <h3 className="mb-2 text-title-sm font-semibold">{t('tenant.settings.audit.after')}</h3>
          <pre className="overflow-x-auto rounded-lg border border-border-default bg-surface-muted p-3 text-caption">
            {JSON.stringify(event.after, null, 2)}
          </pre>
        </section>
      ) : null}

      {event.relatedEvents.length > 0 ? (
        <section>
          <h3 className="mb-2 text-title-sm font-semibold">{t('tenant.settings.audit.related')}</h3>
          <ul className="space-y-2">
            {event.relatedEvents.map((rel) => (
              <li key={rel.id}>
                <Link href={ROUTES.TENANT.AUDIT_DETAIL(rel.id)} className="text-brand-blue-600">
                  {rel.action} · {new Date(rel.occurredAt).toLocaleString()}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
