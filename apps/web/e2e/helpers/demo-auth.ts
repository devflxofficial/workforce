import { expect, type Page } from '@playwright/test';

export const DEMO_TENANT_SLUG = process.env.DEMO_TENANT_SLUG ?? 'wcos-demo';
export const DEMO_PASSWORD = process.env.DEMO_LOGIN_PASSWORD ?? 'Demo@12345';
export const API_BASE = process.env.API_BASE ?? 'http://127.0.0.1:3001/api/v1';

export const DEMO_IDENTITIES = {
  tenantAdmin: {
    label: /sign in as tenant admin/i,
    email: process.env.DEMO_TENANT_ADMIN_EMAIL ?? 'demo.tenant-admin@wcos.local',
    expectedPath: /\/dashboard(?:\?.*)?$/,
    forbiddenPlatform: true,
  },
  hrAdmin: {
    label: /sign in as hr admin/i,
    email: process.env.DEMO_HR_ADMIN_EMAIL ?? 'demo.hr-admin@wcos.local',
    expectedPath: /\/hr(?:\?.*)?$/,
    forbiddenPlatform: true,
  },
  manager: {
    label: /sign in as manager/i,
    email: process.env.DEMO_MANAGER_EMAIL ?? 'demo.manager@wcos.local',
    expectedPath: /\/dashboard(?:\?.*)?$/,
    forbiddenPlatform: true,
  },
  employee: {
    label: /sign in as employee/i,
    email: process.env.DEMO_EMPLOYEE_EMAIL ?? 'demo.employee@wcos.local',
    expectedPath: /\/my(?:\?.*)?$/,
    forbiddenPlatform: true,
  },
} as const;

export type DemoIdentityKey = keyof typeof DEMO_IDENTITIES;

export async function expectDemoPanelVisible(page: Page) {
  await page.goto('/login');
  await expect(page.getByTestId('demo-login-access')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole('heading', { name: /development demo access/i })).toBeVisible();
}

export async function demoLoginViaButton(page: Page, key: DemoIdentityKey) {
  const identity = DEMO_IDENTITIES[key];
  await page.goto('/login');
  await expect(page.getByTestId('demo-login-access')).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: identity.label }).click();
  await expect(page).toHaveURL(identity.expectedPath, { timeout: 30_000 });
}

export async function demoLogout(page: Page) {
  await page.goto('/logout');
  await expect(page).toHaveURL(/\/login/, { timeout: 30_000 });
}

export async function demoApiLogin(email: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password: DEMO_PASSWORD,
      tenantSlug: DEMO_TENANT_SLUG,
    }),
  });
  expect(res.ok).toBeTruthy();
  const body = (await res.json()) as {
    data?: { accessToken?: string };
    accessToken?: string;
  };
  const token = body.data?.accessToken ?? body.accessToken;
  if (!token) {
    throw new Error(`Demo login did not return access token for ${email}`);
  }

  const meRes = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(meRes.ok).toBeTruthy();
  const meBody = (await meRes.json()) as {
    data?: {
      scope?: string;
      roles?: string[];
      tenantId?: string;
      permissions?: string[];
    };
  };
  return { token, me: meBody.data! };
}

export async function assertPlatformApiDenied(token: string) {
  const res = await fetch(`${API_BASE}/platform/tenants?limit=1`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(res.status).toBeGreaterThanOrEqual(400);
  expect(res.status).toBeLessThan(500);
}
