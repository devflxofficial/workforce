'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import {
  getDemoLoginConfig,
  isDemoLoginEnabled,
  type DemoLoginRoleKey,
} from '../../../lib/auth/demo-login.config';

export interface DemoLoginAccessProps {
  tenantSlug?: string;
  onSelect: (identity: { email: string; password: string; tenantSlug: string }) => void;
  isSubmitting?: boolean;
}

const ROLE_LABEL_KEYS: Record<DemoLoginRoleKey, string> = {
  tenantAdmin: 'auth.demoAccess.roles.tenantAdmin',
  hrAdmin: 'auth.demoAccess.roles.hrAdmin',
  manager: 'auth.demoAccess.roles.manager',
  employee: 'auth.demoAccess.roles.employee',
};

export function DemoLoginAccess({ tenantSlug, onSelect, isSubmitting }: DemoLoginAccessProps) {
  const t = useTranslations();
  const config = getDemoLoginConfig();

  if (!isDemoLoginEnabled() || !config) {
    return null;
  }

  const effectiveTenantSlug = tenantSlug ?? config.tenantSlug;

  return (
    <section
      aria-labelledby="demo-login-access-heading"
      className="mt-8 rounded-lg border border-dashed border-border-default bg-surface-canvas px-4 py-4"
      data-testid="demo-login-access"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h2
          id="demo-login-access-heading"
          className="text-label-md font-semibold text-text-primary"
        >
          {t('auth.demoAccess.title')}
        </h2>
        <Badge variant="warning" size="sm">
          {t('auth.demoAccess.badge')}
        </Badge>
      </div>
      <p className="mb-4 text-body-sm text-text-secondary">{t('auth.demoAccess.description')}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {config.identities.map((identity) => (
          <Button
            key={identity.key}
            type="button"
            variant="secondary"
            size="sm"
            fullWidth
            disabled={isSubmitting}
            aria-label={t('auth.demoAccess.signInAs', {
              role: t(ROLE_LABEL_KEYS[identity.key]),
            })}
            onClick={() =>
              onSelect({
                email: identity.email,
                password: config.password,
                tenantSlug: effectiveTenantSlug,
              })
            }
          >
            {t(ROLE_LABEL_KEYS[identity.key])}
          </Button>
        ))}
      </div>
    </section>
  );
}
