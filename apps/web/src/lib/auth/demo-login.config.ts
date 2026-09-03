/**
 * Development-only demo login configuration.
 *
 * Password is read from NEXT_PUBLIC_DEMO_LOGIN_PASSWORD only when demo mode is
 * enabled and NODE_ENV is not production. Prefer local .env.local (gitignored).
 * For stricter setups, leave password empty — demo buttons fill email only.
 */
export type DemoLoginRoleKey = 'tenantAdmin' | 'hrAdmin' | 'manager' | 'employee';

export interface DemoLoginIdentity {
  key: DemoLoginRoleKey;
  email: string;
}

export interface DemoLoginConfig {
  tenantSlug: string;
  password: string;
  identities: DemoLoginIdentity[];
}

const DEFAULT_TENANT_SLUG = 'wcos-demo';

const DEFAULT_EMAILS: Record<DemoLoginRoleKey, string> = {
  tenantAdmin: 'demo.tenant-admin@wcos.local',
  hrAdmin: 'demo.hr-admin@wcos.local',
  manager: 'demo.manager@wcos.local',
  employee: 'demo.employee@wcos.local',
};

/** True only in non-production builds with explicit opt-in. */
export function isDemoLoginEnabled(): boolean {
  if (process.env.NODE_ENV === 'production') return false;
  return process.env.NEXT_PUBLIC_DEMO_LOGIN_ENABLED === 'true';
}

export function getDemoLoginConfig(): DemoLoginConfig | null {
  if (!isDemoLoginEnabled()) return null;

  const tenantSlug =
    process.env.NEXT_PUBLIC_DEMO_TENANT_SLUG?.trim().toLowerCase() || DEFAULT_TENANT_SLUG;

  const emailFor = (key: DemoLoginRoleKey, envKey: string): string =>
    (process.env[envKey] ?? DEFAULT_EMAILS[key]).trim().toLowerCase();

  return {
    tenantSlug,
    password: process.env.NEXT_PUBLIC_DEMO_LOGIN_PASSWORD ?? '',
    identities: [
      {
        key: 'tenantAdmin',
        email: emailFor('tenantAdmin', 'NEXT_PUBLIC_DEMO_TENANT_ADMIN_EMAIL'),
      },
      {
        key: 'hrAdmin',
        email: emailFor('hrAdmin', 'NEXT_PUBLIC_DEMO_HR_ADMIN_EMAIL'),
      },
      {
        key: 'manager',
        email: emailFor('manager', 'NEXT_PUBLIC_DEMO_MANAGER_EMAIL'),
      },
      {
        key: 'employee',
        email: emailFor('employee', 'NEXT_PUBLIC_DEMO_EMPLOYEE_EMAIL'),
      },
    ],
  };
}
